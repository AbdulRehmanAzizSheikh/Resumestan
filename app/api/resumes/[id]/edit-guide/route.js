import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decodeToken } from "@/utils/jwt";
import { connectMongodb } from "@/lib/db";
import Resume from "@/lib/models/Resume";
import { editGuidePrompt } from "@/utils/prompts/editGuidePrompt";
import { generateGeminiContent } from "@/lib/ai/gemini";

// POST /api/resumes/[id]/edit-guide — Gemini se "Canva mein edit karein" step-by-step guide
export async function POST(req, { params }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const decoded = decodeToken(token);
    const { id } = await params;

    await connectMongodb();

    const resume = await Resume.findOne({ _id: id, userId: decoded.id });
    if (!resume) return NextResponse.json({ message: "Resume not found" }, { status: 404 });

    const prompt = editGuidePrompt(resume.title);

    let result;
    try {
      result = await generateGeminiContent({ prompt });
    } catch (err) {
      console.error("[edit-guide] Gemini error:", err);
      const status = err.message === "Gemini API key not configured" ? 500 : 502;
      return NextResponse.json({ message: status === 500 ? err.message : "AI request failed" }, { status });
    }

    return NextResponse.json({ guide: result.guide || null });
  } catch (error) {
    console.error("[POST /api/resumes/[id]/edit-guide]", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
