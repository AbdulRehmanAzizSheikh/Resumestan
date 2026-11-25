import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decodeToken } from "@/utils/jwt";
import { connectMongodb } from "@/lib/db";
import Resume from "@/lib/models/Resume";

// POST /api/resumes/[id]/recommendations/save — recommendations DB me save karo
export async function POST(req, { params }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const decoded = decodeToken(token);
    const { id } = await params;
    const body = await req.json();
    const { recommendations } = body;

    if (!recommendations || !Array.isArray(recommendations) || recommendations.length === 0) {
      return NextResponse.json({ message: "recommendations array is required" }, { status: 400 });
    }

    await connectMongodb();

    const resume = await Resume.findOne({ _id: id, userId: decoded.id });
    if (!resume) return NextResponse.json({ message: "Resume not found" }, { status: 404 });

    // Add new recommendations (avoid exact duplicates by issueTitle)
    const existingTitles = new Set(
      resume.savedRecommendations.map((r) => r.issueTitle)
    );

    const toAdd = recommendations
      .filter((r) => !existingTitles.has(r.issueTitle))
      .map((r) => ({
        issueTitle: r.issueTitle,
        before: r.before || "",
        after: r.after || "",
        canvaSteps: r.canvaSteps || [],
        whyItWorks: r.whyItWorks || "",
        savedAt: new Date(),
      }));

    resume.savedRecommendations.push(...toAdd);
    await resume.save();

    return NextResponse.json({
      message: `${toAdd.length} recommendation(s) saved`,
      savedRecommendations: resume.savedRecommendations,
    });
  } catch (error) {
    console.error("[POST /api/resumes/[id]/recommendations/save]", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
