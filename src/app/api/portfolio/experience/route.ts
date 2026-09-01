import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { revalidateTag } from "next/cache";
import { and, eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/db";

import {
  portfolioProfiles,
  experiences,
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

function isValidDateValue(value: string): boolean {
  if (!value) return true;

  // Allows common values such as:
  // 2024
  // 2024-01
  // Jan 2024
  // Present
  // Current
  return value.length <= 50;
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
    // DELETE
    // =====================================================

    if (action === "delete") {
      const experienceId = String(
        formData.get("experienceId") || "",
      ).trim();

      if (!experienceId) {
        return NextResponse.json(
          {
            error:
              "Experience ID is required.",
          },
          {
            status: 400,
          },
        );
      }

      const [deletedExperience] =
        await db
          .delete(experiences)
          .where(
            and(
              eq(
                experiences.id,
                experienceId,
              ),
              eq(
                experiences.portfolioId,
                portfolio.id,
              ),
            ),
          )
          .returning({
            id: experiences.id,
          });

      if (!deletedExperience) {
        return NextResponse.json(
          {
            error:
              "Experience not found.",
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
          "/dashboard/portfolio/edit/experience",
          request.url,
        ),
      );
    }

    // =====================================================
    // UPDATE
    // =====================================================

    if (action === "update") {
      const experienceId = String(
        formData.get("experienceId") || "",
      ).trim();

      const company = String(
        formData.get("company") || "",
      ).trim();

      const role = String(
        formData.get("role") || "",
      ).trim();

      const description = String(
        formData.get("description") || "",
      ).trim();

      const startDate = String(
        formData.get("startDate") || "",
      ).trim();

      const endDate = String(
        formData.get("endDate") || "",
      ).trim();

      // ===================================================
      // REQUIRED FIELDS
      // ===================================================

      if (
        !experienceId ||
        !company ||
        !role
      ) {
        return NextResponse.json(
          {
            error:
              "Experience ID, company and role are required.",
          },
          {
            status: 400,
          },
        );
      }

      // ===================================================
      // LENGTH VALIDATION
      // ===================================================

      if (company.length > 255) {
        return NextResponse.json(
          {
            error:
              "Company name is too long.",
          },
          {
            status: 400,
          },
        );
      }

      if (role.length > 255) {
        return NextResponse.json(
          {
            error:
              "Role is too long.",
          },
          {
            status: 400,
          },
        );
      }

      if (description.length > 10000) {
        return NextResponse.json(
          {
            error:
              "Experience description is too long.",
          },
          {
            status: 400,
          },
        );
      }

      if (
        !isValidDateValue(startDate) ||
        !isValidDateValue(endDate)
      ) {
        return NextResponse.json(
          {
            error:
              "Invalid experience date.",
          },
          {
            status: 400,
          },
        );
      }

      // ===================================================
      // UPDATE EXPERIENCE
      // ===================================================

      const [updatedExperience] =
        await db
          .update(experiences)
          .set({
            company,
            role,
            description:
              description || null,
            startDate:
              startDate || null,
            endDate:
              endDate || null,
          })
          .where(
            and(
              eq(
                experiences.id,
                experienceId,
              ),
              eq(
                experiences.portfolioId,
                portfolio.id,
              ),
            ),
          )
          .returning({
            id: experiences.id,
          });

      if (!updatedExperience) {
        return NextResponse.json(
          {
            error:
              "Experience not found.",
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
          "/dashboard/portfolio/edit/experience",
          request.url,
        ),
      );
    }

    // =====================================================
    // ADD
    // =====================================================

    const portfolioId = String(
      formData.get("portfolioId") || "",
    ).trim();

    const company = String(
      formData.get("company") || "",
    ).trim();

    const role = String(
      formData.get("role") || "",
    ).trim();

    const description = String(
      formData.get("description") || "",
    ).trim();

    const startDate = String(
      formData.get("startDate") || "",
    ).trim();

    const endDate = String(
      formData.get("endDate") || "",
    ).trim();

    // =====================================================
    // REQUIRED FIELDS
    // =====================================================

    if (
      !portfolioId ||
      !company ||
      !role
    ) {
      return NextResponse.json(
        {
          error:
            "Portfolio ID, company and role are required.",
        },
        {
          status: 400,
        },
      );
    }

    // =====================================================
    // LENGTH VALIDATION
    // =====================================================

    if (company.length > 255) {
      return NextResponse.json(
        {
          error:
            "Company name is too long.",
        },
        {
          status: 400,
        },
      );
    }

    if (role.length > 255) {
      return NextResponse.json(
        {
          error: "Role is too long.",
        },
        {
          status: 400,
        },
      );
    }

    if (description.length > 10000) {
      return NextResponse.json(
        {
          error:
            "Experience description is too long.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !isValidDateValue(startDate) ||
      !isValidDateValue(endDate)
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid experience date.",
        },
        {
          status: 400,
        },
      );
    }

    // =====================================================
    // VERIFY OWNERSHIP
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
    // INSERT EXPERIENCE
    // =====================================================

    await db.insert(experiences).values({
      portfolioId: portfolio.id,
      company,
      role,
      description:
        description || null,
      startDate:
        startDate || null,
      endDate:
        endDate || null,
    });

    // =====================================================
    // INVALIDATE CACHE
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
        "/dashboard/portfolio/edit/experience",
        request.url,
      ),
    );
  } catch (error) {
    console.error(
      "Experience update error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to update experience.",
      },
      {
        status: 500,
      },
    );
  }
}