import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";

import { db } from "@/db";
import { portfolioProfiles } from "@/db/schema";

import { eq, and } from "drizzle-orm";

import { revalidateTag } from "next/cache";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    // =====================================================
    // AUTHENTICATION
    // =====================================================

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.redirect(
        new URL("/login", request.url),
      );
    }

    // =====================================================
    // FORM DATA
    // =====================================================

    const formData = await request.formData();

    const portfolioId = String(
      formData.get("portfolioId") || "",
    ).trim();

    const theme = String(
      formData.get("theme") || "",
    ).trim();

    const accentColor = String(
      formData.get("accentColor") || "",
    ).trim();

    // =====================================================
    // ALLOWED VALUES
    // =====================================================

    const allowedThemes = [
      "minimal",
      "developer",
      "modern",
    ];

    const allowedAccentColors = [
      "default",
      "blue",
      "purple",
      "green",
      "orange",
    ];

    // =====================================================
    // VALIDATION
    // =====================================================

    if (!portfolioId) {
      return NextResponse.json(
        {
          error:
            "Portfolio ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!allowedThemes.includes(theme)) {
      return NextResponse.json(
        {
          error: "Invalid theme.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !allowedAccentColors.includes(
        accentColor,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid accent color.",
        },
        {
          status: 400,
        },
      );
    }

    // =====================================================
    // VERIFY OWNERSHIP
    // =====================================================

    const [portfolio] = await db
      .select({
        id: portfolioProfiles.id,
        username:
          portfolioProfiles.username,
      })
      .from(portfolioProfiles)
      .where(
        and(
          eq(
            portfolioProfiles.id,
            portfolioId,
          ),
          eq(
            portfolioProfiles.userId,
            session.user.id,
          ),
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
    // UPDATE THEME
    // =====================================================

    await db
      .update(portfolioProfiles)
      .set({
        theme,
        accentColor,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(
            portfolioProfiles.id,
            portfolioId,
          ),
          eq(
            portfolioProfiles.userId,
            session.user.id,
          ),
        ),
      );

    // =====================================================
    // INVALIDATE PUBLIC PORTFOLIO CACHE
    // =====================================================

    revalidateTag(
      `portfolio:${portfolio.username}`,
      "max",
    );

    // =====================================================
    // REDIRECT
    // =====================================================

    return NextResponse.redirect(
      new URL(
        "/dashboard/portfolio/edit/theme?saved=1",
        request.url,
      ),
    );
  } catch (error) {
    console.error(
      "Portfolio theme update error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to update portfolio theme.",
      },
      {
        status: 500,
      },
    );
  }
}