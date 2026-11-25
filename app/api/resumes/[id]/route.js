import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decodeToken } from "@/utils/jwt";
import { connectMongodb } from "@/lib/db";
import Resume from "@/lib/models/Resume";

// GET /api/resumes/[id] — single resume fetch
export async function GET(req, { params }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const decoded = decodeToken(token);
    const { id } = await params;

    await connectMongodb();

    const resume = await Resume.findOne({ _id: id, userId: decoded.id }).lean();
    if (!resume) return NextResponse.json({ message: "Resume not found" }, { status: 404 });

    return NextResponse.json({ resume });
  } catch (error) {
    console.error("[GET /api/resumes/[id]]", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/resumes/[id] — resume delete karo (poora data samet)
export async function DELETE(req, { params }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const decoded = decodeToken(token);
    const { id } = await params;

    await connectMongodb();

    const resume = await Resume.findOneAndDelete({ _id: id, userId: decoded.id });
    if (!resume) return NextResponse.json({ message: "Resume not found" }, { status: 404 });

    return NextResponse.json({ message: "Resume deleted successfully" });
  } catch (error) {
    console.error("[DELETE /api/resumes/[id]]", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
