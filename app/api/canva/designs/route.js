import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decodeToken } from "@/utils/jwt";
import { connectMongodb } from "@/lib/db";
import User from "@/lib/models/User";

export async function GET(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const decoded = decodeToken(token);
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get("accountId");

    if (!accountId) {
      return NextResponse.json({ message: "accountId is required" }, { status: 400 });
    }

    await connectMongodb();

    // Fetch user with token fields (select:false)
    const user = await User.findById(decoded.id).select("+canvaAccounts.accessToken +canvaAccounts.refreshToken");
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    const account = user.canvaAccounts.find((a) => a.canvaUserId === accountId);
    if (!account) {
      return NextResponse.json({ message: "Canva account not found" }, { status: 404 });
    }

    // Fetch designs from Canva API
    const canvaRes = await fetch(
      "https://api.canva.com/rest/v1/designs?ownership=owned&limit=50",
      {
        headers: {
          Authorization: `Bearer ${account.accessToken}`,
        },
      }
    );

    const canvaData = await canvaRes.json();

    if (!canvaRes.ok) {
      console.error("[canva designs]", canvaData);
      return NextResponse.json({ message: "Failed to fetch designs from Canva" }, { status: 502 });
    }

    // Map to a clean format for the frontend
    const designs = (canvaData.items || []).map((d) => ({
      id: d.id,
      title: d.title || "Untitled",
      thumbnailUrl: d.thumbnail?.url || null,
      editUrl: d.urls?.edit_url || null,
      viewUrl: d.urls?.view_url || null,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    }));

    return NextResponse.json({ designs });
  } catch (error) {
    console.error("[GET /api/canva/designs]", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
