import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";

import { db } from "@/db";

import {
  portfolioProfiles,
  skills,
} from "@/db/schema";

import { eq, and } from "drizzle-orm";

import { revalidateTag } from "next/cache";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    // =====================================================
    // 1. AUTHENTICATION
    // =====================================================

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.redirect(
        new URL("/login", request.url),
      );
    }

    const formData = await request.formData();

    const action = String(
      formData.get("action") || "add",
    ).trim();

    // =====================================================
    // 2. DELETE SKILL
    // =====================================================

    if (action === "delete") {
      const skillId = String(
        formData.get("skillId") || "",
      ).trim();

      if (!skillId) {
        return NextResponse.json(
          {
            error: "Skill ID is required.",
          },
          {
            status: 400,
          },
        );
      }

      // Find the user's portfolio
      const [portfolio] = await db
        .select({
          id: portfolioProfiles.id,
          username:
            portfolioProfiles.username,
        })
        .from(portfolioProfiles)
        .where(
          eq(
            portfolioProfiles.userId,
            session.user.id,
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

      // Delete only the user's skill
      await db
        .delete(skills)
        .where(
          and(
            eq(skills.id, skillId),
            eq(
              skills.portfolioId,
              portfolio.id,
            ),
          ),
        );

      // Invalidate public portfolio cache
      revalidateTag(
        `portfolio:${portfolio.username}`,
        "max",
      );

      return NextResponse.redirect(
        new URL(
          "/dashboard/portfolio/edit/skills",
          request.url,
        ),
      );
    }

    // =====================================================
    // 3. ADD SKILL
    // =====================================================

    const portfolioId = String(
      formData.get("portfolioId") || "",
    ).trim();

    const name = String(
      formData.get("name") || "",
    ).trim();

    const category = String(
      formData.get("category") || "",
    ).trim();

    // =====================================================
    // 4. VALIDATION
    // =====================================================

    if (!portfolioId || !name) {
      return NextResponse.json(
        {
          error:
            "Portfolio ID and skill name are required.",
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
            "Skill name is too long.",
        },
        {
          status: 400,
        },
      );
    }

    if (category.length > 100) {
      return NextResponse.json(
        {
          error:
            "Skill category is too long.",
        },
        {
          status: 400,
        },
      );
    }

    // =====================================================
    // 5. VERIFY PORTFOLIO OWNERSHIP
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
    // 6. INSERT SKILL
    // =====================================================

    await db.insert(skills).values({
      portfolioId:
        portfolio.id,

      name,

      category:
        category || null,
    });

    // =====================================================
    // 7. INVALIDATE PUBLIC PORTFOLIO CACHE
    // =====================================================

    revalidateTag(
      `portfolio:${portfolio.username}`,
      "max",
    );

    // =====================================================
    // 8. REDIRECT
    // =====================================================

    return NextResponse.redirect(
      new URL(
        "/dashboard/portfolio/edit/skills",
        request.url,
      ),
    );
  } catch (error) {
    console.error(
      "Skills update error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to update skills.",
      },
      {
        status: 500,
      },
    );
  }
}