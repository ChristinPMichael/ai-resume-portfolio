import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";

import { db } from "@/db";

import {
  portfolioProfiles,
  projects,
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
      const projectId = String(
        formData.get("projectId") || "",
      ).trim();

      if (!projectId) {
        return NextResponse.json(
          {
            error: "Project ID is required.",
          },
          {
            status: 400,
          },
        );
      }

      // Find the current user's portfolio
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

      // Delete only a project belonging
      // to the user's portfolio
      await db
        .delete(projects)
        .where(
          and(
            eq(projects.id, projectId),
            eq(
              projects.portfolioId,
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
          "/dashboard/portfolio/edit/projects",
          request.url,
        ),
      );
    }

    // =====================================================
    // UPDATE
    // =====================================================

    if (action === "update") {
      const projectId = String(
        formData.get("projectId") || "",
      ).trim();

      const name = String(
        formData.get("name") || "",
      ).trim();

      const description = String(
        formData.get("description") || "",
      ).trim();

      const technologies = String(
        formData.get("technologies") || "",
      ).trim();

      const projectUrl = String(
        formData.get("projectUrl") || "",
      ).trim();

      const githubUrl = String(
        formData.get("githubUrl") || "",
      ).trim();

      if (!projectId || !name) {
        return NextResponse.json(
          {
            error:
              "Project ID and name are required.",
          },
          {
            status: 400,
          },
        );
      }

      // ===================================================
      // VALIDATION
      // ===================================================

      if (name.length > 255) {
        return NextResponse.json(
          {
            error:
              "Project name is too long.",
          },
          {
            status: 400,
          },
        );
      }

      if (projectUrl.length > 500) {
        return NextResponse.json(
          {
            error:
              "Project URL is too long.",
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

      // ===================================================
      // VERIFY PORTFOLIO OWNERSHIP
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
      // UPDATE PROJECT
      // ===================================================

      const [updatedProject] =
        await db
          .update(projects)
          .set({
            name,
            description:
              description || null,
            technologies:
              technologies || null,
            projectUrl:
              projectUrl || null,
            githubUrl:
              githubUrl || null,
          })
          .where(
            and(
              eq(
                projects.id,
                projectId,
              ),
              eq(
                projects.portfolioId,
                portfolio.id,
              ),
            ),
          )
          .returning({
            id: projects.id,
          });

      if (!updatedProject) {
        return NextResponse.json(
          {
            error:
              "Project not found.",
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
          "/dashboard/portfolio/edit/projects",
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

    const name = String(
      formData.get("name") || "",
    ).trim();

    const description = String(
      formData.get("description") || "",
    ).trim();

    const technologies = String(
      formData.get("technologies") || "",
    ).trim();

    const projectUrl = String(
      formData.get("projectUrl") || "",
    ).trim();

    const githubUrl = String(
      formData.get("githubUrl") || "",
    ).trim();

    // =====================================================
    // VALIDATION
    // =====================================================

    if (!portfolioId || !name) {
      return NextResponse.json(
        {
          error:
            "Portfolio ID and project name are required.",
        },
        {
          status: 400,
        },
      );
    }

    if (name.length > 255) {
      return NextResponse.json(
        {
          error:
            "Project name is too long.",
        },
        {
          status: 400,
        },
      );
    }

    if (projectUrl.length > 500) {
      return NextResponse.json(
        {
          error:
            "Project URL is too long.",
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

    // =====================================================
    // VERIFY PORTFOLIO OWNERSHIP
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
    // INSERT PROJECT
    // =====================================================

    await db.insert(projects).values({
      portfolioId:
        portfolio.id,

      name,

      description:
        description || null,

      technologies:
        technologies || null,

      projectUrl:
        projectUrl || null,

      githubUrl:
        githubUrl || null,
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
        "/dashboard/portfolio/edit/projects",
        request.url,
      ),
    );
  } catch (error) {
    console.error(
      "Projects update error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to update projects.",
      },
      {
        status: 500,
      },
    );
  }
}