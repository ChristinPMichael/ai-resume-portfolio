import { NextResponse } from "next/server";

import { db } from "@/db";

import {
  portfolioProfiles,
  contactMessages,
} from "@/db/schema";

import { eq } from "drizzle-orm";

import {
  contactRateLimit,
  contactEmailRateLimit,
} from "@/lib/rate-limit";

export const runtime = "nodejs";

const MAX_USERNAME_LENGTH = 100;
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 255;
const MAX_MESSAGE_LENGTH = 5000;

/* =========================================================
   GET CLIENT IP
========================================================= */

function getClientIp(
  request: Request,
): string {
  const forwardedFor =
    request.headers.get(
      "x-forwarded-for",
    );

  const realIp =
    request.headers.get(
      "x-real-ip",
    );

  if (forwardedFor) {
    const firstIp =
      forwardedFor
        .split(",")[0]
        ?.trim();

    if (firstIp) {
      return firstIp;
    }
  }

  if (realIp?.trim()) {
    return realIp.trim();
  }

  return "unknown";
}

/* =========================================================
   POST
========================================================= */

export async function POST(
  request: Request,
) {
  try {
    // =====================================================
    // 1. CLIENT IP
    // =====================================================

    const ip =
      getClientIp(request);

    // =====================================================
    // 2. READ FORM DATA
    // =====================================================

    const formData =
      await request.formData();

    const portfolioUsername =
      String(
        formData.get(
          "username",
        ) ?? "",
      ).trim();

    const name =
      String(
        formData.get("name") ??
          "",
      ).trim();

    const email =
      String(
        formData.get(
          "email",
        ) ?? "",
      )
        .trim()
        .toLowerCase();

    const message =
      String(
        formData.get(
          "message",
        ) ?? "",
      ).trim();

    // =====================================================
    // 3. HONEYPOT
    // =====================================================

    const website =
      String(
        formData.get(
          "website",
        ) ?? "",
      ).trim();

    if (website) {
      // Silently accept obvious bots.
      return NextResponse.json(
        {
          success: true,
          message:
            "Message sent successfully.",
        },
      );
    }

    // =====================================================
    // 4. REQUIRED FIELDS
    // =====================================================

    if (
      !portfolioUsername ||
      !name ||
      !email ||
      !message
    ) {
      return NextResponse.json(
        {
          error:
            "All fields are required.",
        },
        {
          status: 400,
        },
      );
    }

    // =====================================================
    // 5. LENGTH VALIDATION
    // =====================================================

    if (
      portfolioUsername.length >
      MAX_USERNAME_LENGTH
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid portfolio.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      name.length >
      MAX_NAME_LENGTH
    ) {
      return NextResponse.json(
        {
          error:
            "Name is too long.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      email.length >
      MAX_EMAIL_LENGTH
    ) {
      return NextResponse.json(
        {
          error:
            "Email is too long.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      message.length >
      MAX_MESSAGE_LENGTH
    ) {
      return NextResponse.json(
        {
          error:
            "Message is too long.",
        },
        {
          status: 400,
        },
      );
    }

    // =====================================================
    // 6. EMAIL VALIDATION
    // =====================================================

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      !emailPattern.test(email)
    ) {
      return NextResponse.json(
        {
          error:
            "Please enter a valid email address.",
        },
        {
          status: 400,
        },
      );
    }

    // =====================================================
    // 7. IP RATE LIMIT
    // 5 requests / 10 minutes / IP
    // =====================================================

    const {
      success: ipAllowed,
      limit: ipLimit,
      remaining: ipRemaining,
      reset: ipReset,
    } =
      await contactRateLimit.limit(
        ip,
      );

    const ipRateLimitHeaders =
      {
        "X-RateLimit-Limit":
          String(ipLimit),

        "X-RateLimit-Remaining":
          String(ipRemaining),

        "X-RateLimit-Reset":
          String(ipReset),
      };

    if (!ipAllowed) {
      const retryAfter =
        Math.max(
          1,
          Math.ceil(
            (ipReset -
              Date.now()) /
              1000,
          ),
        );

      return NextResponse.json(
        {
          error:
            "Too many messages. Please try again later.",
        },
        {
          status: 429,

          headers: {
            ...ipRateLimitHeaders,

            "Retry-After":
              String(
                retryAfter,
              ),
          },
        },
      );
    }

    // =====================================================
    // 8. EMAIL RATE LIMIT
    // 5 requests / 10 minutes / EMAIL
    // =====================================================

    const {
      success: emailAllowed,
      limit: emailLimit,
      remaining: emailRemaining,
      reset: emailReset,
    } =
      await contactEmailRateLimit.limit(
        email,
      );

    if (!emailAllowed) {
      const retryAfter =
        Math.max(
          1,
          Math.ceil(
            (emailReset -
              Date.now()) /
              1000,
          ),
        );

      return NextResponse.json(
        {
          error:
            "Too many messages from this email address. Please try again later.",
        },
        {
          status: 429,

          headers: {
            "X-RateLimit-Limit":
              String(
                emailLimit,
              ),

            "X-RateLimit-Remaining":
              String(
                emailRemaining,
              ),

            "X-RateLimit-Reset":
              String(
                emailReset,
              ),

            "Retry-After":
              String(
                retryAfter,
              ),
          },
        },
      );
    }

    // =====================================================
    // 9. FIND PORTFOLIO
    // =====================================================

    const [portfolio] =
      await db
        .select({
          id:
            portfolioProfiles.id,
        })
        .from(
          portfolioProfiles,
        )
        .where(
          eq(
            portfolioProfiles.username,
            portfolioUsername,
          ),
        )
        .limit(1);

    if (!portfolio) {
      return NextResponse.json(
        {
          error:
            "Portfolio not found.",
        },
        {
          status: 404,
        },
      );
    }

    // =====================================================
    // 10. SAVE MESSAGE
    // =====================================================

    await db
      .insert(
        contactMessages,
      )
      .values({
        portfolioId:
          portfolio.id,

        name,

        email,

        message,
      });

    // =====================================================
    // 11. SUCCESS
    // =====================================================

    return NextResponse.json(
      {
        success: true,

        message:
          "Message sent successfully.",

        remaining:
          Math.min(
            ipRemaining,
            emailRemaining,
          ),
      },
      {
        status: 200,

        headers: {
          ...ipRateLimitHeaders,
        },
      },
    );
  } catch (error) {
    console.error(
      "Portfolio contact error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to send message.",
      },
      {
        status: 500,
      },
    );
  }
}