import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";

import { db } from "@/db";
import { resumes } from "@/db/schema";

import { eq, desc } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET(
  request: Request,
) {
  try {
    // =====================================================
    // AUTHENTICATION
    // =====================================================

    const session =
      await auth.api.getSession({
        headers: await headers(),
      });

    if (!session) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    // =====================================================
    // GET NEWEST RESUME BELONGING TO CURRENT USER
    // =====================================================

    const [resume] =
      await db
        .select({
          fileName:
            resumes.fileName,

          fileType:
            resumes.fileType,

          fileData:
            resumes.fileData,
        })
        .from(resumes)
        .where(
          eq(
            resumes.userId,
            session.user.id,
          ),
        )
        .orderBy(
          desc(
            resumes.createdAt,
          ),
        )
        .limit(1);

    // =====================================================
    // RESUME NOT FOUND
    // =====================================================

    if (!resume) {
      return NextResponse.json(
        {
          error:
            "Resume not found.",
        },
        {
          status: 404,
        },
      );
    }

    // =====================================================
    // FILE DATA NOT AVAILABLE
    // =====================================================

    if (!resume.fileData) {
      return NextResponse.json(
        {
          error:
            "Original resume file is not available. Please upload your resume again.",
        },
        {
          status: 404,
        },
      );
    }

    // =====================================================
    // DECODE BASE64
    // =====================================================

    let fileBuffer: Buffer;

    try {
      fileBuffer =
        Buffer.from(
          resume.fileData,
          "base64",
        );
    } catch (error) {
      console.error(
        "Resume Base64 decode error:",
        error,
      );

      return NextResponse.json(
        {
          error:
            "Resume file could not be read.",
        },
        {
          status: 500,
        },
      );
    }

    // =====================================================
    // VALIDATE DECODED FILE
    // =====================================================

    if (
      fileBuffer.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "Resume file is empty.",
        },
        {
          status: 404,
        },
      );
    }

    // =====================================================
    // SAFE FILE NAME
    // =====================================================

    const safeFileName =
      (
        resume.fileName ||
        "resume"
      )
        .replace(
          /[/\\]/g,
          "_",
        )
        .replace(
          /["\r\n]/g,
          "_",
        )
        .trim()
        .slice(
          0,
          255,
        ) || "resume";

    // =====================================================
    // CONTENT TYPE
    // =====================================================

    const contentType =
      resume.fileType ===
        "application/pdf"
        ? "application/pdf"
        : resume.fileType ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          : "application/octet-stream";

    // =====================================================
    // RETURN ORIGINAL FILE
    // =====================================================

    return new Response(
      new Uint8Array(fileBuffer),
      {
        status: 200,

        headers: {
          "Content-Type":
            contentType,

          "Content-Disposition":
            `attachment; filename="${safeFileName}"`,

          "Content-Length":
            fileBuffer.length.toString(),

          "Cache-Control":
            "private, no-cache, no-store",

          "X-Content-Type-Options":
            "nosniff",
        },
      },
    );
  } catch (error) {
    console.error(
      "Resume download error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to download resume.",
      },
      {
        status: 500,
      },
    );
  }
}