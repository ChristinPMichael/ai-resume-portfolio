import { NextResponse } from "next/server";

import { db } from "@/db";

import {
  portfolioProfiles,
  contactMessages,
} from "@/db/schema";

import { eq } from "drizzle-orm";

import { contactRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    // =====================================================
    // GET CLIENT IP
    // =====================================================

    const forwardedFor =
      request.headers.get("x-forwarded-for");

    const realIp =
      request.headers.get("x-real-ip");

    const ip =
      forwardedFor
        ?.split(",")[0]
        ?.trim() ||
      realIp ||
      "unknown";

    // =====================================================
    // READ FORM DATA
    // =====================================================

    const formData =
      await request.formData();

    const portfolioUsername =
      String(
        formData.get("username") ?? "",
      ).trim();

    const name =
      String(
        formData.get("name") ?? "",
      ).trim();

    const email =
      String(
        formData.get("email") ?? "",
      )
        .trim()
        .toLowerCase();

    const message =
      String(
        formData.get("message") ?? "",
      ).trim();

    // =====================================================
    // HONEYPOT SPAM PROTECTION
    // =====================================================

    const website =
      String(
        formData.get("website") ?? "",
      ).trim();

    if (website) {
      // Silently ignore obvious bots.
      return NextResponse.json({
        success: true,
        message:
          "Message sent successfully.",
      });
    }

    // =====================================================
    // BASIC VALIDATION
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
    // LENGTH VALIDATION
    // =====================================================

    if (
      portfolioUsername.length > 100
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

    if (name.length > 100) {
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

    if (email.length > 255) {
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

    if (message.length > 5000) {
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
    // EMAIL VALIDATION
    // =====================================================

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
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
    // RATE LIMIT
    // 5 requests / 10 minutes / IP
    // =====================================================

    const {
      success: allowed,
      limit,
      remaining,
      reset,
    } =
      await contactRateLimit.limit(ip);

    const rateLimitHeaders = {
      "X-RateLimit-Limit":
        String(limit),

      "X-RateLimit-Remaining":
        String(remaining),

      "X-RateLimit-Reset":
        String(reset),
    };

    if (!allowed) {
      const retryAfter =
        Math.max(
          1,
          Math.ceil(
            (reset - Date.now()) /
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
            ...rateLimitHeaders,
            "Retry-After":
              String(retryAfter),
          },
        },
      );
    }

    // =====================================================
    // FIND PORTFOLIO
    // =====================================================

    const [portfolio] =
      await db
        .select({
          id: portfolioProfiles.id,
        })
        .from(portfolioProfiles)
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
    // SAVE MESSAGE
    // =====================================================

    await db
      .insert(contactMessages)
      .values({
        portfolioId:
          portfolio.id,

        name,

        email,

        message,
      });

    // =====================================================
    // SUCCESS
    // =====================================================

    return NextResponse.json(
      {
        success: true,

        message:
          "Message sent successfully.",

        remaining,
      },
      {
        status: 200,

        headers:
          rateLimitHeaders,
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