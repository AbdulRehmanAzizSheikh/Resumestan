import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decodeToken } from "@/utils/jwt";
import { connectMongodb } from "@/lib/db";
import Resume from "@/lib/models/Resume";

// DELETE /api/resumes/[id]/recommendations/[recId]
export async function DELETE(req, { params }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const decoded = decodeToken(token);
    const { id, recId } = await params;

    await connectMongodb();

    const resume = await Resume.findOne({ _id: id, userId: decoded.id });
    if (!resume) return NextResponse.json({ message: "Resume not found" }, { status: 404 });

    const before = resume.savedRecommendations.length;
    resume.savedRecommendations = resume.savedRecommendations.filter(
      (r) => r._id.toString() !== recId
    );

    if (resume.savedRecommendations.length === before) {
      return NextResponse.json({ message: "Recommendation not found" }, { status: 404 });
    }

    await resume.save();
    return NextResponse.json({ message: "Recommendation deleted" });
  } catch (error) {
    console.error("[DELETE /api/resumes/[id]/recommendations/[recId]]", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
