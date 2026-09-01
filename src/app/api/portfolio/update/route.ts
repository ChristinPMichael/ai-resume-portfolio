import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";

import { db } from "@/db";
import { portfolioProfiles } from "@/db/schema";

import { and, eq } from "drizzle-orm";

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

    const fullName = String(
      formData.get("fullName") || "",
    ).trim();

    const headline = String(
      formData.get("headline") || "",
    ).trim();

    const bio = String(
      formData.get("bio") || "",
    ).trim();

    const location = String(
      formData.get("location") || "",
    ).trim();

    const githubUrl = String(
      formData.get("githubUrl") || "",
    ).trim();

    const linkedinUrl = String(
      formData.get("linkedinUrl") || "",
    ).trim();

    const websiteUrl = String(
      formData.get("websiteUrl") || "",
    ).trim();

    // =====================================================
    // VALIDATION
    // =====================================================

    if (!portfolioId || !fullName) {
      return NextResponse.json(
        {
          error:
            "Portfolio ID and name are required.",
        },
        {
          status: 400,
        },
      );
    }

    if (fullName.length > 255) {
      return NextResponse.json(
        {
          error:
            "Full name is too long.",
        },
        {
          status: 400,
        },
      );
    }

    if (headline.length > 255) {
      return NextResponse.json(
        {
          error:
            "Headline is too long.",
        },
        {
          status: 400,
        },
      );
    }

    if (location.length > 255) {
      return NextResponse.json(
        {
          error:
            "Location is too long.",
        },
        {
          status: 400,
        },
      );
    }

    if (githubUrl.length > 500) {
      return NextResponse.json(
        {
          error:
            "GitHub URL is too long.",
        },
        {
          status: 400,
        },
      );
    }

    if (linkedinUrl.length > 500) {
      return NextResponse.json(
        {
          error:
            "LinkedIn URL is too long.",
        },
        {
          status: 400,
        },
      );
    }

    if (websiteUrl.length > 500) {
      return NextResponse.json(
        {
          error:
            "Website URL is too long.",
        },
        {
          status: 400,
        },
      );
    }

    // =====================================================
    // UPDATE PORTFOLIO
    // =====================================================

    const [updatedPortfolio] =
      await db
        .update(portfolioProfiles)
        .set({
          fullName,
          headline: headline || null,
          bio: bio || null,
          location: location || null,
          githubUrl: githubUrl || null,
          linkedinUrl:
            linkedinUrl || null,
          websiteUrl:
            websiteUrl || null,
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
        )
        .returning({
          username:
            portfolioProfiles.username,
        });

    // =====================================================
    // PORTFOLIO NOT FOUND
    // =====================================================

    if (!updatedPortfolio) {
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
    // INVALIDATE PUBLIC PORTFOLIO CACHE
    // =====================================================

    revalidateTag(
      `portfolio:${updatedPortfolio.username}`,
      "max",
    );

    // =====================================================
    // REDIRECT
    // =====================================================

    return NextResponse.redirect(
      new URL(
        `/portfolio/${updatedPortfolio.username}`,
        request.url,
      ),
    );
  } catch (error) {
    console.error(
      "Portfolio update error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to update portfolio.",
      },
      {
        status: 500,
      },
    );
  }
}