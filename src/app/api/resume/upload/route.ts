import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";

import { db } from "@/db";
import { resumes } from "@/db/schema";

import { extractText, getDocumentProxy } from "unpdf";
import mammoth from "mammoth";

export const runtime = "nodejs";

/* =========================================================
   PDF TEXT EXTRACTION
   ========================================================= */

async function extractPdfText(buffer: ArrayBuffer) {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));

  const { text } = await extractText(pdf, {
    mergePages: true,
  });

  return text.trim();
}

/* =========================================================
   DOCX TEXT EXTRACTION
   ========================================================= */

async function extractDocxText(buffer: ArrayBuffer) {
  const result = await mammoth.extractRawText({
    buffer: Buffer.from(buffer),
  });

  return result.value.trim();
}

/* =========================================================
   ARRAYBUFFER → BASE64
   ========================================================= */

function arrayBufferToBase64(buffer: ArrayBuffer) {
  return Buffer.from(buffer).toString("base64");
}

/* =========================================================
   POST /api/resume/upload
   ========================================================= */

export async function POST(request: Request) {
  try {
    /* -------------------------------------------------------
       1. Authentication
       ------------------------------------------------------- */

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    /* -------------------------------------------------------
       2. Get uploaded file
       ------------------------------------------------------- */

    const formData = await request.formData();

    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error: "No file uploaded",
        },
        {
          status: 400,
        }
      );
    }

    /* -------------------------------------------------------
       3. Validate file type
       ------------------------------------------------------- */

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: "Only PDF and DOCX files are supported",
        },
        {
          status: 400,
        }
      );
    }

    /* -------------------------------------------------------
       4. Validate file size
       ------------------------------------------------------- */

    const maxFileSize = 5 * 1024 * 1024;

    if (file.size > maxFileSize) {
      return NextResponse.json(
        {
          error: "File must be smaller than 5MB",
        },
        {
          status: 400,
        }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        {
          error: "Uploaded file is empty",
        },
        {
          status: 400,
        }
      );
    }

    /* -------------------------------------------------------
       5. Read file
       ------------------------------------------------------- */

    const buffer = await file.arrayBuffer();

    /* -------------------------------------------------------
       6. Save original file as Base64
       ------------------------------------------------------- */

    const fileData = arrayBufferToBase64(buffer);

    if (!fileData) {
      return NextResponse.json(
        {
          error: "Could not read uploaded file",
        },
        {
          status: 400,
        }
      );
    }

    /* -------------------------------------------------------
       7. Extract resume text
       ------------------------------------------------------- */

    let rawText = "";

    if (file.type === "application/pdf") {
      rawText = await extractPdfText(buffer);
    } else if (
      file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      rawText = await extractDocxText(buffer);
    }

    /* -------------------------------------------------------
       8. Make sure text was extracted
       ------------------------------------------------------- */

    if (!rawText) {
      return NextResponse.json(
        {
          error:
            "Could not extract text from this resume. Please upload a text-based PDF or DOCX.",
        },
        {
          status: 400,
        }
      );
    }

    /* -------------------------------------------------------
       9. Save resume to Neon
       ------------------------------------------------------- */

    const [resume] = await db
      .insert(resumes)
      .values({
        userId: session.user.id,

        fileName: file.name,

        fileType: file.type,

        fileData,

        rawText,
      })
      .returning({
        id: resumes.id,
      });

    /* -------------------------------------------------------
       10. Return success
       ------------------------------------------------------- */

    return NextResponse.json({
      success: true,

      resumeId: resume.id,

      fileName: file.name,

      fileType: file.type,

      fileSize: file.size,

      textLength: rawText.length,

      message:
        "Resume uploaded and processed successfully!",
    });
  } catch (error) {
    console.error(
      "Resume processing error:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to process resume.",
      },
      {
        status: 500,
      }
    );
  }
}