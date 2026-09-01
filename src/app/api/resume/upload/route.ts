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
  fileBuffer: Buffer,
): Promise<string> {
  /*
   * IMPORTANT:
   *
   * Never give the original upload Buffer directly
   * to the PDF processor.
   *
   * PDF.js/unpdf can detach the underlying ArrayBuffer.
   * We therefore create a completely independent copy.
   */

  const pdfBuffer = Buffer.from(
    fileBuffer,
  );

  /*
   * Create an independent Uint8Array.
   *
   * Uint8Array.from() creates a new backing buffer,
   * preventing PDF.js from detaching our original file.
   */

  const pdfBytes =
    Uint8Array.from(pdfBuffer);

  const pdf =
    await getDocumentProxy(
      pdfBytes,
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
  fileBuffer: Buffer,
): Promise<string> {
  /*
   * Give Mammoth its own Buffer copy as well.
   */

  const docxBuffer = Buffer.from(
    fileBuffer,
  );

  const result =
    await mammoth.extractRawText({
      buffer: docxBuffer,
    });

  return result.value.trim();
}

/* =========================================================
   FILE SIGNATURE VALIDATION
========================================================= */

function isPdf(
  fileBuffer: Buffer,
): boolean {
  if (fileBuffer.length < 4) {
    return false;
  }

  return (
    fileBuffer[0] === 0x25 &&
    fileBuffer[1] === 0x50 &&
    fileBuffer[2] === 0x44 &&
    fileBuffer[3] === 0x46
  );
}

function isZip(
  fileBuffer: Buffer,
): boolean {
  if (fileBuffer.length < 4) {
    return false;
  }

  return (
    fileBuffer[0] === 0x50 &&
    fileBuffer[1] === 0x4b &&
    fileBuffer[2] === 0x03 &&
    fileBuffer[3] === 0x04
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
    /* =====================================================
       1. AUTHENTICATION
    ===================================================== */

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

    /* =====================================================
       2. RATE LIMIT
       5 uploads / 10 minutes / USER
    ===================================================== */

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

    /* =====================================================
       3. READ FORM DATA
    ===================================================== */

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

    /* =====================================================
       4. BASIC FILE VALIDATION
    ===================================================== */

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

    /* =====================================================
       5. MIME TYPE VALIDATION
    ===================================================== */

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

    /* =====================================================
       6. READ FILE INTO NODE BUFFER
    ===================================================== */

    /*
     * This is now our MASTER COPY.
     *
     * We never pass this Buffer directly into PDF.js.
     */

    const arrayBuffer =
      await file.arrayBuffer();

    if (
      arrayBuffer.byteLength === 0
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

    const fileBuffer =
      Buffer.from(
        new Uint8Array(
          arrayBuffer,
        ),
      );

    if (
      fileBuffer.length === 0
    ) {
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

    /* =====================================================
       7. FILE SIGNATURE VALIDATION
    ===================================================== */

    if (
      file.type === PDF_TYPE &&
      !isPdf(fileBuffer)
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
      !isZip(fileBuffer)
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

    /* =====================================================
       8. EXTRACT TEXT
    ===================================================== */

    let rawText = "";

    try {
      if (
        file.type === PDF_TYPE
      ) {
        /*
         * extractPdfText() creates its own
         * independent copy.
         */

        rawText =
          await extractPdfText(
            fileBuffer,
          );
      } else {
        /*
         * Mammoth also receives a copy.
         */

        rawText =
          await extractDocxText(
            fileBuffer,
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

    /* =====================================================
       9. EXTRACTED TEXT VALIDATION
    ===================================================== */

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

    /* =====================================================
       10. CONVERT ORIGINAL FILE TO BASE64
    ===================================================== */

    /*
     * IMPORTANT:
     *
     * We use fileBuffer here.
     *
     * PDF.js only received a separate copy,
     * so our original upload remains intact.
     */

    const fileData =
      fileBuffer.toString(
        "base64",
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

    /* =====================================================
       11. SANITIZE FILE NAME
    ===================================================== */

    const safeFileName =
      sanitizeFileName(
        file.name,
      );

    /* =====================================================
       12. SAVE TO DATABASE
    ===================================================== */

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

    /* =====================================================
       13. RETURN SUCCESS
    ===================================================== */

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