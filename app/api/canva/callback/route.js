import { NextResponse } from "next/server";
import { connectMongodb } from "@/lib/db";
import User from "@/lib/models/User";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const errorParam = searchParams.get("error");

  // FIX: Vercel's internal routing sets req.url host to "localhost" even in production.
  // The real public domain is in x-forwarded-host header — always check that first.
  // Fallback chain: x-forwarded-host → NEXT_PUBLIC_APP_URL env var → req.url (local dev)
  const forwardedHost = req.headers.get("x-forwarded-host");
  const forwardedProto = req.headers.get("x-forwarded-proto") || "https";
  const appBase = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : process.env.NEXT_PUBLIC_APP_URL ||
      (() => { const u = new URL(req.url); return `${u.protocol}//${u.host}`; })();

  if (errorParam) {
    return NextResponse.redirect(`${appBase}/dashboard?canva=failed`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${appBase}/dashboard?canva=failed`);
  }

  try {
    await connectMongodb();

    // Find user by matching state (with expiry check)
    const user = await User.findOne({
      "pendingCanvaState.state": state,
      "pendingCanvaState.expiresAt": { $gt: new Date() },
    }).select("+canvaAccounts.accessToken +canvaAccounts.refreshToken pendingCanvaState");

    if (!user) {
      console.error("[canva callback] No user found for state:", state);
      return NextResponse.redirect(`${appBase}/dashboard?canva=failed`);
    }

    const verifier = user.pendingCanvaState.verifier;
    const clientId = process.env.CANVA_CLIENT_ID;
    const clientSecret = process.env.CANVA_CLIENT_SECRET;
    const redirectUri = process.env.CANVA_REDIRECT_URI;
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    // Exchange code for tokens
    const tokenRes = await fetch("https://api.canva.com/rest/v1/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        code_verifier: verifier,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok) {
      console.error("[canva callback] Token exchange failed:", tokenData);
      return NextResponse.redirect(`${appBase}/dashboard?canva=failed`);
    }

    const { access_token, refresh_token, expires_in } = tokenData;

    // Fetch Canva user profile to get accountName
    const profileRes = await fetch("https://api.canva.com/rest/v1/users/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const profileData = await profileRes.json();
    const canvaUserId = profileData?.profile?.sub || profileData?.sub || `canva_${Date.now()}`;
    const accountName =
      profileData?.profile?.display_name ||
      profileData?.display_name ||
      "Canva Account";

    const expiresAt = expires_in
      ? new Date(Date.now() + expires_in * 1000)
      : null;

    // Upsert account in canvaAccounts array
    const existingIdx = user.canvaAccounts.findIndex(
      (a) => a.canvaUserId === canvaUserId
    );

    if (existingIdx >= 0) {
      user.canvaAccounts[existingIdx].accessToken = access_token;
      user.canvaAccounts[existingIdx].refreshToken = refresh_token || "";
      user.canvaAccounts[existingIdx].expiresAt = expiresAt;
      user.canvaAccounts[existingIdx].accountName = accountName;
    } else {
      user.canvaAccounts.push({
        canvaUserId,
        accountName,
        accessToken: access_token,
        refreshToken: refresh_token || "",
        expiresAt,
        connectedAt: new Date(),
      });
    }

    // Clear pending state
    user.pendingCanvaState = { state: null, verifier: null, expiresAt: null };
    await user.save();

    return NextResponse.redirect(`${appBase}/dashboard?canva=connected`);
  } catch (error) {
    console.error("[canva callback]", error);
    return NextResponse.redirect(`${appBase}/dashboard?canva=failed`);
  }
}
