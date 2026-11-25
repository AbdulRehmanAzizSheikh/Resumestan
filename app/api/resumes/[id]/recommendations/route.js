import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decodeToken } from "@/utils/jwt";
import { connectMongodb } from "@/lib/db";
import Resume from "@/lib/models/Resume";
import { issueRecommendationPrompt } from "@/utils/prompts/issueRecommendationPrompt";
import { generateGeminiContent } from "@/lib/ai/gemini";

// POST /api/resumes/[id]/recommendations — selected issues bhejo, AI recommendations lo
export async function POST(req, { params }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const decoded = decodeToken(token);
    const { id } = await params;
    const body = await req.json();
    const { issues } = body;

    if (!issues || !Array.isArray(issues) || issues.length === 0) {
      return NextResponse.json({ message: "At least one issue is required" }, { status: 400 });
    }

    await connectMongodb();

    const resume = await Resume.findOne({ _id: id, userId: decoded.id });
    if (!resume) return NextResponse.json({ message: "Resume not found" }, { status: 404 });

    const resumeContext = `Title: ${resume.title}`;
    const prompt = issueRecommendationPrompt(issues, resumeContext);

    let result;
    try {
      result = await generateGeminiContent({ prompt });
    } catch (err) {
      console.error("[recommendations] Gemini error:", err);
      const status = err.message === "Gemini API key not configured" ? 500 : 502;
      return NextResponse.json({ message: status === 500 ? err.message : "AI request failed" }, { status });
    }

    return NextResponse.json({ recommendations: result.recommendations || [] });
  } catch (error) {
    console.error("[POST /api/resumes/[id]/recommendations]", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
