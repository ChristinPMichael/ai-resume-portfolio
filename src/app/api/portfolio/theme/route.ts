import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { revalidateTag } from "next/cache";
import { and, eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { portfolioProfiles } from "@/db/schema";

export const runtime = "nodejs";

const allowedThemes = [
  "minimal",
  "developer",
  "modern",
] as const;

const allowedAccentColors = [
  "default",
  "blue",
  "purple",
  "green",
  "orange",
] as const;

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
    // REQUIRED PORTFOLIO ID
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

    // =====================================================
    // THEME VALIDATION
    // =====================================================

    if (
      !allowedThemes.includes(
        theme as (typeof allowedThemes)[number],
      )
    ) {
      return NextResponse.json(
        {
          error: "Invalid theme.",
        },
        {
          status: 400,
        },
      );
    }

    // =====================================================
    // ACCENT COLOR VALIDATION
    // =====================================================

    if (
      !allowedAccentColors.includes(
        accentColor as (
          typeof allowedAccentColors
        )[number],
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
    // FIND AUTHENTICATED USER'S PORTFOLIO
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

    const [updatedPortfolio] =
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
              portfolio.id,
            ),
            eq(
              portfolioProfiles.userId,
              session.user.id,
            ),
          ),
        )
        .returning({
          id: portfolioProfiles.id,
        });

    if (!updatedPortfolio) {
      return NextResponse.json(
        {
          error:
            "Portfolio could not be updated.",
        },
        {
          status: 500,
        },
      );
    }

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