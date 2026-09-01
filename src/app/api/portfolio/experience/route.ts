import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";

import { db } from "@/db";

import {
  portfolioProfiles,
  experiences,
} from "@/db/schema";

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

    const formData = await request.formData();

    const action = String(
      formData.get("action") || "add",
    ).trim();

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

      // Find user's portfolio
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

      // Delete only user's experience
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
        );

      // Invalidate public portfolio cache
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
      // VALIDATION
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

      if (startDate.length > 50) {
        return NextResponse.json(
          {
            error:
              "Start date is too long.",
          },
          {
            status: 400,
          },
        );
      }

      if (endDate.length > 50) {
        return NextResponse.json(
          {
            error:
              "End date is too long.",
          },
          {
            status: 400,
          },
        );
      }

      // ===================================================
      // FIND USER PORTFOLIO
      // ===================================================

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

      // ===================================================
      // INVALIDATE CACHE
      // ===================================================

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
    // VALIDATION
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

    if (startDate.length > 50) {
      return NextResponse.json(
        {
          error:
            "Start date is too long.",
        },
        {
          status: 400,
        },
      );
    }

    if (endDate.length > 50) {
      return NextResponse.json(
        {
          error:
            "End date is too long.",
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
    // INSERT EXPERIENCE
    // =====================================================

    await db.insert(experiences).values({
      portfolioId:
        portfolio.id,

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