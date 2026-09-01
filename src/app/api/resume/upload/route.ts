import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";

import { db } from "@/db";
import { resumes } from "@/db/schema";

import {
  extractText,
  getDocumentProxy,
} from "unpdf";

import mammoth from "mammoth";

import {
  resumeUploadRateLimit,
} from "@/lib/rate-limit";

export const runtime = "nodejs";

/* =========================================================
   CONSTANTS
========================================================= */

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_TEXT_LENGTH = 100_000;

const PDF_TYPE =
  "application/pdf";

const DOCX_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/* =========================================================
   PDF TEXT EXTRACTION
========================================================= */

async function extractPdfText(
  buffer: ArrayBuffer,
): Promise<string> {
  /*
   * IMPORTANT:
   * PDF.js/unpdf may detach the ArrayBuffer that it receives.
   *
   * Use a copy so the original upload buffer remains usable
   * later when converting the file to Base64.
   */

  const pdfBuffer = buffer.slice(0);

  const pdf =
    await getDocumentProxy(
      new Uint8Array(pdfBuffer),
    );

  const { text } =
    await extractText(pdf, {
      mergePages: true,
    });

  return text.trim();
}

/* =========================================================
   DOCX TEXT EXTRACTION
========================================================= */

async function extractDocxText(
  buffer: ArrayBuffer,
): Promise<string> {
  const result =
    await mammoth.extractRawText({
      buffer: Buffer.from(buffer),
    });

  return result.value.trim();
}

/* =========================================================
   ARRAYBUFFER → BASE64
========================================================= */

function arrayBufferToBase64(
  buffer: ArrayBuffer,
): string {
  return Buffer.from(buffer).toString(
    "base64",
  );
}

/* =========================================================
   FILE SIGNATURE VALIDATION
========================================================= */

function isPdf(
  buffer: ArrayBuffer,
): boolean {
  const bytes =
    new Uint8Array(buffer);

  // PDF files begin with %PDF
  return (
    bytes.length >= 4 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46
  );
}

function isZip(
  buffer: ArrayBuffer,
): boolean {
  const bytes =
    new Uint8Array(buffer);

  // DOCX files use the ZIP container format
  return (
    bytes.length >= 4 &&
    bytes[0] === 0x50 &&
    bytes[1] === 0x4b &&
    bytes[2] === 0x03 &&
    bytes[3] === 0x04
  );
}

/* =========================================================
   SAFE FILE NAME
========================================================= */

function sanitizeFileName(
  fileName: string,
): string {
  const cleaned =
    fileName
      .replace(
        /[/\\]/g,
        "_",
      )
      .replace(
        /[^\w.\- ()]/g,
        "_",
      )
      .trim();

  if (!cleaned) {
    return "resume";
  }

  return cleaned.slice(
    0,
    255,
  );
}

/* =========================================================
   POST /api/resume/upload
========================================================= */

export async function POST(
  request: Request,
) {
  try {
    // =====================================================
    // 1. AUTHENTICATION
    // =====================================================

    const session =
      await auth.api.getSession({
        headers: await headers(),
      });

    if (!session) {
      return NextResponse.json(
        {
          error:
            "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    // =====================================================
    // 2. RESUME UPLOAD RATE LIMIT
    // 5 uploads / 10 minutes / USER
    // =====================================================

    const {
      success: uploadAllowed,
      limit,
      remaining,
      reset,
    } =
      await resumeUploadRateLimit.limit(
        session.user.id,
      );

    const rateLimitHeaders = {
      "X-RateLimit-Limit":
        String(limit),

      "X-RateLimit-Remaining":
        String(remaining),

      "X-RateLimit-Reset":
        String(reset),
    };

    if (!uploadAllowed) {
      const retryAfter =
        Math.max(
          1,
          Math.ceil(
            (reset -
              Date.now()) /
              1000,
          ),
        );

      return NextResponse.json(
        {
          error:
            "Too many resume uploads. Please try again later.",
        },
        {
          status: 429,
          headers: {
            ...rateLimitHeaders,

            "Retry-After":
              String(
                retryAfter,
              ),
          },
        },
      );
    }

    // =====================================================
    // 3. GET UPLOADED FILE
    // =====================================================

    const formData =
      await request.formData();

    const file =
      formData.get("file");

    if (
      !(file instanceof File)
    ) {
      return NextResponse.json(
        {
          error:
            "No file uploaded.",
        },
        {
          status: 400,
        },
      );
    }

    // =====================================================
    // 4. FILE SIZE VALIDATION
    // =====================================================

    if (file.size === 0) {
      return NextResponse.json(
        {
          error:
            "Uploaded file is empty.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      file.size >
      MAX_FILE_SIZE
    ) {
      return NextResponse.json(
        {
          error:
            "File must be smaller than 5MB.",
        },
        {
          status: 400,
        },
      );
    }

    // =====================================================
    // 5. MIME TYPE VALIDATION
    // =====================================================

    if (
      file.type !== PDF_TYPE &&
      file.type !== DOCX_TYPE
    ) {
      return NextResponse.json(
        {
          error:
            "Only PDF and DOCX files are supported.",
        },
        {
          status: 400,
        },
      );
    }

    // =====================================================
    // 6. READ FILE
    // =====================================================

    const buffer =
      await file.arrayBuffer();

    if (
      buffer.byteLength === 0
    ) {
      return NextResponse.json(
        {
          error:
            "Uploaded file is empty.",
        },
        {
          status: 400,
        },
      );
    }

    // =====================================================
    // 7. FILE SIGNATURE VALIDATION
    // =====================================================

    if (
      file.type === PDF_TYPE &&
      !isPdf(buffer)
    ) {
      return NextResponse.json(
        {
          error:
            "The uploaded file is not a valid PDF.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      file.type === DOCX_TYPE &&
      !isZip(buffer)
    ) {
      return NextResponse.json(
        {
          error:
            "The uploaded file is not a valid DOCX.",
        },
        {
          status: 400,
        },
      );
    }

    // =====================================================
    // 8. EXTRACT TEXT
    // =====================================================

    let rawText = "";

    try {
      if (
        file.type ===
        PDF_TYPE
      ) {
        /*
         * extractPdfText() internally uses a COPY
         * of the original ArrayBuffer.
         *
         * Therefore `buffer` remains intact.
         */

        rawText =
          await extractPdfText(
            buffer,
          );
      } else {
        rawText =
          await extractDocxText(
            buffer,
          );
      }
    } catch (error) {
      console.error(
        "Resume text extraction error:",
        error,
      );

      return NextResponse.json(
        {
          error:
            "Could not process this file. Please upload a valid text-based PDF or DOCX.",
        },
        {
          status: 400,
        },
      );
    }

    // =====================================================
    // 9. EXTRACTED TEXT VALIDATION
    // =====================================================

    if (!rawText) {
      return NextResponse.json(
        {
          error:
            "Could not extract text from this resume. Please upload a text-based PDF or DOCX.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      rawText.length >
      MAX_TEXT_LENGTH
    ) {
      return NextResponse.json(
        {
          error:
            "The extracted resume text is too large.",
        },
        {
          status: 400,
        },
      );
    }

    // =====================================================
    // 10. CONVERT ORIGINAL FILE TO BASE64
    // =====================================================

    /*
     * This uses the ORIGINAL buffer.
     *
     * Because PDF extraction operated on a copy,
     * this ArrayBuffer should still be attached.
     */

    const fileData =
      arrayBufferToBase64(
        buffer,
      );

    if (!fileData) {
      return NextResponse.json(
        {
          error:
            "Could not read uploaded file.",
        },
        {
          status: 400,
        },
      );
    }

    // =====================================================
    // 11. SANITIZE FILE NAME
    // =====================================================

    const safeFileName =
      sanitizeFileName(
        file.name,
      );

    // =====================================================
    // 12. SAVE RESUME TO DATABASE
    // =====================================================

    const [resume] =
      await db
        .insert(resumes)
        .values({
          userId:
            session.user.id,

          fileName:
            safeFileName,

          fileType:
            file.type,

          fileData,

          rawText,
        })
        .returning({
          id: resumes.id,
        });

    // =====================================================
    // 13. RETURN SUCCESS
    // =====================================================

    return NextResponse.json(
      {
        success: true,

        resumeId:
          resume.id,

        fileName:
          safeFileName,

        fileType:
          file.type,

        fileSize:
          file.size,

        textLength:
          rawText.length,

        message:
          "Resume uploaded and processed successfully!",
      },
      {
        status: 200,

        headers:
          rateLimitHeaders,
      },
    );
  } catch (error) {
    console.error(
      "Resume processing error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to process resume.",
      },
      {
        status: 500,
      },
    );
  }
}