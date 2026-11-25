import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decodeToken } from "@/utils/jwt";
import { connectMongodb } from "@/lib/db";
import User from "@/lib/models/User";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const decoded = decodeToken(token);
    await connectMongodb();

    const user = await User.findById(decoded.id).select("canvaAccounts");
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    // Strip sensitive fields before returning
    const accounts = user.canvaAccounts.map((a) => ({
      canvaUserId: a.canvaUserId,
      accountName: a.accountName,
      connectedAt: a.connectedAt,
      expiresAt: a.expiresAt,
    }));

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error("[GET /api/canva/accounts]", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
