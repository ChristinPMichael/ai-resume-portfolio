import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";

import { db } from "@/db";

import {
  portfolioProfiles,
  education,
} from "@/db/schema";

import { eq, and } from "drizzle-orm";

import { revalidateTag } from "next/cache";

export const runtime = "nodejs";

/* =========================================================
   Parse year safely
========================================================= */

function parseYear(
  value: FormDataEntryValue | null,
): number | null {
  if (value === null) {
    return null;
  }

  const text = String(value).trim();

  if (!text) {
    return null;
  }

  if (!/^\d{4}$/.test(text)) {
    return null;
  }

  const year = Number(text);

  if (!Number.isSafeInteger(year)) {
    return null;
  }

  if (year < 1900 || year > 2100) {
    return null;
  }

  return year;
}

/* =========================================================
   POST
========================================================= */

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
      const educationId = String(
        formData.get("educationId") || "",
      ).trim();

      if (!educationId) {
        return NextResponse.json(
          {
            error:
              "Education ID is required.",
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

      // Delete only user's education
      const [deletedEducation] =
        await db
          .delete(education)
          .where(
            and(
              eq(
                education.id,
                educationId,
              ),
              eq(
                education.portfolioId,
                portfolio.id,
              ),
            ),
          )
          .returning({
            id: education.id,
          });

      if (!deletedEducation) {
        return NextResponse.json(
          {
            error:
              "Education not found.",
          },
          {
            status: 404,
          },
        );
      }

      // Invalidate public portfolio cache
      revalidateTag(
        `portfolio:${portfolio.username}`,
        "max",
      );

      return NextResponse.redirect(
        new URL(
          "/dashboard/portfolio/edit/education",
          request.url,
        ),
      );
    }

    // =====================================================
    // UPDATE
    // =====================================================

    if (action === "update") {
      const educationId = String(
        formData.get("educationId") || "",
      ).trim();

      const institution = String(
        formData.get("institution") || "",
      ).trim();

      const degree = String(
        formData.get("degree") || "",
      ).trim();

      const fieldOfStudy = String(
        formData.get("fieldOfStudy") || "",
      ).trim();

      const startYear = parseYear(
        formData.get("startYear"),
      );

      const endYear = parseYear(
        formData.get("endYear"),
      );

      // ===================================================
      // VALIDATION
      // ===================================================

      if (!educationId || !institution) {
        return NextResponse.json(
          {
            error:
              "Education ID and institution are required.",
          },
          {
            status: 400,
          },
        );
      }

      if (institution.length > 255) {
        return NextResponse.json(
          {
            error:
              "Institution name is too long.",
          },
          {
            status: 400,
          },
        );
      }

      if (degree.length > 255) {
        return NextResponse.json(
          {
            error:
              "Degree is too long.",
          },
          {
            status: 400,
          },
        );
      }

      if (fieldOfStudy.length > 255) {
        return NextResponse.json(
          {
            error:
              "Field of study is too long.",
          },
          {
            status: 400,
          },
        );
      }

      if (
        startYear !== null &&
        endYear !== null &&
        endYear < startYear
      ) {
        return NextResponse.json(
          {
            error:
              "End year cannot be before start year.",
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
      // UPDATE EDUCATION
      // ===================================================

      const [updatedEducation] =
        await db
          .update(education)
          .set({
            institution,
            degree: degree || null,
            fieldOfStudy:
              fieldOfStudy || null,
            startYear,
            endYear,
          })
          .where(
            and(
              eq(
                education.id,
                educationId,
              ),
              eq(
                education.portfolioId,
                portfolio.id,
              ),
            ),
          )
          .returning({
            id: education.id,
          });

      if (!updatedEducation) {
        return NextResponse.json(
          {
            error:
              "Education not found.",
          },
          {
            status: 404,
          },
        );
      }

      // ===================================================
      // INVALIDATE PUBLIC PORTFOLIO CACHE
      // ===================================================

      revalidateTag(
        `portfolio:${portfolio.username}`,
        "max",
      );

      return NextResponse.redirect(
        new URL(
          "/dashboard/portfolio/edit/education",
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

    const institution = String(
      formData.get("institution") || "",
    ).trim();

    const degree = String(
      formData.get("degree") || "",
    ).trim();

    const fieldOfStudy = String(
      formData.get("fieldOfStudy") || "",
    ).trim();

    const startYear = parseYear(
      formData.get("startYear"),
    );

    const endYear = parseYear(
      formData.get("endYear"),
    );

    // =====================================================
    // VALIDATION
    // =====================================================

    if (!portfolioId || !institution) {
      return NextResponse.json(
        {
          error:
            "Portfolio ID and institution are required.",
        },
        {
          status: 400,
        },
      );
    }

    if (institution.length > 255) {
      return NextResponse.json(
        {
          error:
            "Institution name is too long.",
        },
        {
          status: 400,
        },
      );
    }

    if (degree.length > 255) {
      return NextResponse.json(
        {
          error:
            "Degree is too long.",
        },
        {
          status: 400,
        },
      );
    }

    if (fieldOfStudy.length > 255) {
      return NextResponse.json(
        {
          error:
            "Field of study is too long.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      startYear !== null &&
      endYear !== null &&
      endYear < startYear
    ) {
      return NextResponse.json(
        {
          error:
            "End year cannot be before start year.",
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
    // INSERT EDUCATION
    // =====================================================

    await db.insert(education).values({
      portfolioId:
        portfolio.id,

      institution,

      degree:
        degree || null,

      fieldOfStudy:
        fieldOfStudy || null,

      startYear,

      endYear,
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
        "/dashboard/portfolio/edit/education",
        request.url,
      ),
    );
  } catch (error) {
    console.error(
      "Education API error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to update education.",
      },
      {
        status: 500,
      },
    );
  }
}