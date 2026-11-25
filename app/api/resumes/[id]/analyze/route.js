import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decodeToken } from "@/utils/jwt";
import { connectMongodb } from "@/lib/db";
import Resume from "@/lib/models/Resume";
import User from "@/lib/models/User";
import { analyzeResumePrompt } from "@/utils/prompts/analyzeResumePrompt";
import { generateGeminiContent } from "@/lib/ai/gemini";

// POST /api/resumes/[id]/analyze
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

    // Get access token for the linked Canva account
    const user = await User.findById(decoded.id).select(
      "+canvaAccounts.accessToken +canvaAccounts.refreshToken"
    );
    const account = user?.canvaAccounts.find(
      (a) => a.canvaUserId === resume.canvaAccountId
    );

    if (!account?.accessToken) {
      return NextResponse.json(
        { message: "Canva account not connected or token missing" },
        { status: 400 }
      );
    }

    // Step 1: Get export link from Canva API
    let fileUrl = null;
    let base64Content = null;

    try {
      // Try to create a PDF export of the design
      const exportRes = await fetch(
        `https://api.canva.com/rest/v1/designs/${resume.canvaDesignId}/exports`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${account.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ format: { type: "pdf" } }),
        }
      );

      const exportData = await exportRes.json();

      if (exportRes.ok && exportData.job?.status === "success") {
        fileUrl = exportData.job?.urls?.[0];
      } else if (exportRes.ok && exportData.job?.id) {
        // Poll for export completion
        const jobId = exportData.job.id;
        let attempts = 0;
        while (attempts < 10) {
          await new Promise((r) => setTimeout(r, 2000));
          const pollRes = await fetch(
            `https://api.canva.com/rest/v1/exports/${jobId}`,
            { headers: { Authorization: `Bearer ${account.accessToken}` } }
          );
          const pollData = await pollRes.json();
          if (pollData.job?.status === "success") {
            fileUrl = pollData.job?.urls?.[0];
            break;
          } else if (pollData.job?.status === "failed") {
            break;
          }
          attempts++;
        }
      }
    } catch (exportErr) {
      console.warn("[analyze] Export attempt failed, falling back to view URL:", exportErr.message);
    }

    // Step 2: Download file and convert to base64
    if (fileUrl) {
      try {
        const fileRes = await fetch(fileUrl);
        const buffer = await fileRes.arrayBuffer();
        base64Content = Buffer.from(buffer).toString("base64");
      } catch (dlErr) {
        console.warn("[analyze] File download failed:", dlErr.message);
      }
    }

    // Step 3: Build prompt content
    // If base64 not available, use the canva link text as fallback
    const promptContent = base64Content
      ? `[Resume attached as base64 PDF]\n\nDesign Title: ${resume.title}\nCanva Link: ${resume.canvaLink}`
      : `Design Title: ${resume.title}\nCanva Link: ${resume.canvaLink}\n\n[Note: Could not download file directly. Please analyze based on the design title and any context available.]`;

    // Step 4: Call Gemini API via shared client
    const prompt = analyzeResumePrompt(promptContent);
    const parts = base64Content
      ? [
          { text: prompt },
          {
            inline_data: {
              mime_type: "application/pdf",
              data: base64Content,
            },
          },
        ]
      : [{ text: prompt }];

    let analysisResult;
    try {
      analysisResult = await generateGeminiContent({ parts });
    } catch (err) {
      console.error("[analyze] Gemini error:", err);
      const message =
        err.message === "Gemini API key not configured"
          ? "Gemini API key not configured"
          : "AI analysis failed";
      return NextResponse.json({ message }, { status: err.message === "Gemini API key not configured" ? 500 : 502 });
    }

    // Step 5: Save analysis to resume
    resume.analysis = {
      score: analysisResult.score ?? 0,
      summary: analysisResult.summary ?? "",
      goodAspects: analysisResult.goodAspects ?? [],
      issues: analysisResult.issues ?? [],
      recommendations: analysisResult.recommendations ?? [],
      analyzedAt: new Date(),
    };
    await resume.save();

    return NextResponse.json({ resume });
  } catch (error) {
    console.error("[POST /api/resumes/[id]/analyze]", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
