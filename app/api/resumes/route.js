import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decodeToken } from "@/utils/jwt";
import { connectMongodb } from "@/lib/db";
import Resume from "@/lib/models/Resume";

// GET /api/resumes — user ke saare resumes
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const decoded = decodeToken(token);
    await connectMongodb();

    const resumes = await Resume.find({ userId: decoded.id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ resumes });
  } catch (error) {
    console.error("[GET /api/resumes]", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/resumes — naya resume add karo
export async function POST(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const decoded = decodeToken(token);
    const body = await req.json();
    const { canvaAccountId, canvaDesignId, title, canvaLink, thumbnailUrl } = body;

    if (!canvaAccountId || !canvaDesignId || !title) {
      return NextResponse.json(
        { message: "canvaAccountId, canvaDesignId, and title are required" },
        { status: 400 }
      );
    }

    await connectMongodb();

    // Prevent duplicate (same design already added)
    const existing = await Resume.findOne({
      userId: decoded.id,
      canvaDesignId,
    });
    if (existing) {
      return NextResponse.json(
        { message: "This design is already added as a resume" },
        { status: 409 }
      );
    }

    const resume = await Resume.create({
      userId: decoded.id,
      canvaAccountId,
      canvaDesignId,
      title: title.trim(),
      canvaLink: canvaLink || `https://www.canva.com/design/${canvaDesignId}/view`,
      thumbnailUrl: thumbnailUrl || "",
    });

    return NextResponse.json({ resume }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/resumes]", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
