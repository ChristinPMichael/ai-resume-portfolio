import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { revalidateTag } from "next/cache";
import { and, eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/db";

import {
  portfolioProfiles,
  skills,
} from "@/db/schema";

export const runtime = "nodejs";

async function getUserPortfolio(userId: string) {
  const [portfolio] = await db
    .select({
      id: portfolioProfiles.id,
      username: portfolioProfiles.username,
    })
    .from(portfolioProfiles)
    .where(
      eq(
        portfolioProfiles.userId,
        userId,
      ),
    )
    .limit(1);

  return portfolio;
}

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

    const action = String(
      formData.get("action") || "add",
    ).trim();

    // =====================================================
    // FIND USER PORTFOLIO
    // =====================================================

    const portfolio = await getUserPortfolio(
      session.user.id,
    );

    if (!portfolio) {
      return NextResponse.json(
        {
          error: "Portfolio not found.",
        },
        {
          status: 404,
        },
      );
    }

    // =====================================================
    // DELETE SKILL
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

      const [deletedSkill] = await db
        .delete(skills)
        .where(
          and(
            eq(skills.id, skillId),
            eq(
              skills.portfolioId,
              portfolio.id,
            ),
          ),
        )
        .returning({
          id: skills.id,
        });

      if (!deletedSkill) {
        return NextResponse.json(
          {
            error: "Skill not found.",
          },
          {
            status: 404,
          },
        );
      }

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
    // ADD SKILL
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
    // VALIDATION
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
    // VERIFY PORTFOLIO OWNERSHIP
    // =====================================================

    if (portfolio.id !== portfolioId) {
      return NextResponse.json(
        {
          error:
            "You do not have permission to modify this portfolio.",
        },
        {
          status: 403,
        },
      );
    }

    // =====================================================
    // INSERT SKILL
    // =====================================================

    await db.insert(skills).values({
      portfolioId: portfolio.id,
      name,
      category: category || null,
    });

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
        error: "Failed to update skills.",
      },
      {
        status: 500,
      },
    );
  }
}