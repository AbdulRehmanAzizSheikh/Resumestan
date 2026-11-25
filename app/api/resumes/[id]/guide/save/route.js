import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decodeToken } from "@/utils/jwt";
import { connectMongodb } from "@/lib/db";
import Resume from "@/lib/models/Resume";

// POST /api/resumes/[id]/guide/save — guide DB me save karo
export async function POST(req, { params }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const decoded = decodeToken(token);
    const { id } = await params;
    const body = await req.json();
    const { guide } = body;

    if (!guide || !guide.title) {
      return NextResponse.json({ message: "Valid guide object is required" }, { status: 400 });
    }

    await connectMongodb();

    const resume = await Resume.findOne({ _id: id, userId: decoded.id });
    if (!resume) return NextResponse.json({ message: "Resume not found" }, { status: 404 });

    resume.savedGuides.push({
      title: guide.title,
      overview: guide.overview || "",
      steps: guide.steps || [],
      savedAt: new Date(),
    });
    await resume.save();

    const saved = resume.savedGuides[resume.savedGuides.length - 1];
    return NextResponse.json({ guide: saved }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/resumes/[id]/guide/save]", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
