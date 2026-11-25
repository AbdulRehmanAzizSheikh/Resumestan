import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decodeToken } from "@/utils/jwt";
import { connectMongodb } from "@/lib/db";
import User from "@/lib/models/User";
import { generateCodeVerifier, generateCodeChallenge } from "@/lib/canva-pkce";
import crypto from "crypto";

export async function GET(req) {
  try {
    // Derive base URL from the request — works on localhost AND production
    const reqUrl = new URL(req.url);
    const appBase = `${reqUrl.protocol}//${reqUrl.host}`;

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.redirect(new URL("/login", appBase));
    }

    let decoded;
    try {
      decoded = decodeToken(token);
    } catch {
      return NextResponse.redirect(new URL("/login", appBase));
    }

    await connectMongodb();

    const verifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);
    const state = crypto.randomBytes(16).toString("hex");

    await User.findByIdAndUpdate(decoded.id, {
      pendingCanvaState: {
        state,
        verifier,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    const client_id = process.env.CANVA_CLIENT_ID;
    // redirect_uri must exactly match what's registered in Canva developer portal
    const redirect_uri = process.env.CANVA_REDIRECT_URI;
    const scope = "design:meta:read design:content:read asset:read";

    const authUrl = new URL("https://www.canva.com/api/oauth/authorize");
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("client_id", client_id);
    authUrl.searchParams.set("redirect_uri", redirect_uri);
    authUrl.searchParams.set("scope", scope);
    authUrl.searchParams.set("code_challenge", challenge);
    authUrl.searchParams.set("code_challenge_method", "S256");
    authUrl.searchParams.set("state", state);

    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error("[canva oauth start]", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
