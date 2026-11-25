import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decodeToken } from "@/utils/jwt";
import { connectMongodb } from "@/lib/db";
import Resume from "@/lib/models/Resume";

// DELETE /api/resumes/[id]/guide/[guideId]
export async function DELETE(req, { params }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const decoded = decodeToken(token);
    const { id, guideId } = await params;

    await connectMongodb();

    const resume = await Resume.findOne({ _id: id, userId: decoded.id });
    if (!resume) return NextResponse.json({ message: "Resume not found" }, { status: 404 });

    const before = resume.savedGuides.length;
    resume.savedGuides = resume.savedGuides.filter(
      (g) => g._id.toString() !== guideId
    );

    if (resume.savedGuides.length === before) {
      return NextResponse.json({ message: "Guide not found" }, { status: 404 });
    }

    await resume.save();
    return NextResponse.json({ message: "Guide deleted" });
  } catch (error) {
    console.error("[DELETE /api/resumes/[id]/guide/[guideId]]", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
