import { NextResponse } from "next/server";

import { db } from "@/db";
import { resumes } from "@/db/schema";

import { eq, desc } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        {
          error: "userId is required",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Get the newest resume that actually contains
     * the original uploaded file.
     */
    const [resume] = await db
      .select({
        fileName: resumes.fileName,
        fileType: resumes.fileType,
        fileData: resumes.fileData,
      })
      .from(resumes)
      .where(eq(resumes.userId, userId))
      .orderBy(desc(resumes.createdAt))
      .limit(1);

    if (!resume) {
      return NextResponse.json(
        {
          error: "Resume not found",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Existing resumes created before fileData was added
     * will have fileData = null.
     */
    if (!resume.fileData) {
      return NextResponse.json(
        {
          error:
            "Original resume file is not available. Please upload your resume again.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Convert Base64 back into the original binary file.
     */
    const fileBuffer = Buffer.from(
      resume.fileData,
      "base64"
    );

    /*
     * Return the original PDF/DOCX.
     */
    return new Response(fileBuffer, {
      status: 200,

      headers: {
        "Content-Type":
          resume.fileType ||
          "application/octet-stream",

        "Content-Disposition":
          `attachment; filename="${resume.fileName}"`,

        "Content-Length":
          fileBuffer.length.toString(),

        "Cache-Control":
          "private, no-cache, no-store",
      },
    });
  } catch (error) {
    console.error(
      "Resume download error:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to download resume",
      },
      {
        status: 500,
      }
    );
  }
}