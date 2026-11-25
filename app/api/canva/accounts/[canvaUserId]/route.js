import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decodeToken } from "@/utils/jwt";
import { connectMongodb } from "@/lib/db";
import User from "@/lib/models/User";
import Resume from "@/lib/models/Resume";

export async function DELETE(req, { params }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const decoded = decodeToken(token);
    const { canvaUserId } = await params;

    await connectMongodb();

    const user = await User.findById(decoded.id);
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    // Remove the account from canvaAccounts array
    const accountExists = user.canvaAccounts.some(
      (a) => a.canvaUserId === canvaUserId
    );
    if (!accountExists) {
      return NextResponse.json({ message: "Account not found" }, { status: 404 });
    }

    user.canvaAccounts = user.canvaAccounts.filter(
      (a) => a.canvaUserId !== canvaUserId
    );
    await user.save();

    // Delete all resumes linked to this Canva account
    await Resume.deleteMany({ userId: decoded.id, canvaAccountId: canvaUserId });

    return NextResponse.json({ message: "Account disconnected and linked resumes deleted" });
  } catch (error) {
    console.error("[DELETE /api/canva/accounts/[canvaUserId]]", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
