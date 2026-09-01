import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { revalidateTag } from "next/cache";
import { and, eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/db";

import {
  portfolioProfiles,
  projects,
} from "@/db/schema";

export const runtime = "nodejs";

function isValidOptionalUrl(value: string): boolean {
  if (!value) return true;

  try {
    const url = new URL(value);

    return (
      url.protocol === "http:" ||
      url.protocol === "https:"
    );
  } catch {
    return false;
  }
}

function validateProjectUrls(
  projectUrl: string,
  githubUrl: string,
) {
  if (!isValidOptionalUrl(projectUrl)) {
    return "Project URL must be a valid HTTP or HTTPS URL.";
  }

  if (!isValidOptionalUrl(githubUrl)) {
    return "GitHub URL must be a valid HTTP or HTTPS URL.";
  }

  return null;
}

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
    // GET USER PORTFOLIO
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

      const [deletedProject] = await db
        .delete(projects)
        .where(
          and(
            eq(projects.id, projectId),
            eq(
              projects.portfolioId,
              portfolio.id,
            ),
          ),
        )
        .returning({
          id: projects.id,
        });

      if (!deletedProject) {
        return NextResponse.json(
          {
            error: "Project not found.",
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
      // LENGTH VALIDATION
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

      if (description.length > 10000) {
        return NextResponse.json(
          {
            error:
              "Project description is too long.",
          },
          {
            status: 400,
          },
        );
      }

      if (technologies.length > 2000) {
        return NextResponse.json(
          {
            error:
              "Technologies field is too long.",
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
      // URL VALIDATION
      // ===================================================

      const urlError = validateProjectUrls(
        projectUrl,
        githubUrl,
      );

      if (urlError) {
        return NextResponse.json(
          {
            error: urlError,
          },
          {
            status: 400,
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
    // REQUIRED FIELDS
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

    // =====================================================
    // LENGTH VALIDATION
    // =====================================================

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

    if (description.length > 10000) {
      return NextResponse.json(
        {
          error:
            "Project description is too long.",
        },
        {
          status: 400,
        },
      );
    }

    if (technologies.length > 2000) {
      return NextResponse.json(
        {
          error:
            "Technologies field is too long.",
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
    // URL VALIDATION
    // =====================================================

    const urlError = validateProjectUrls(
      projectUrl,
      githubUrl,
    );

    if (urlError) {
      return NextResponse.json(
        {
          error: urlError,
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
    // INSERT PROJECT
    // =====================================================

    await db.insert(projects).values({
      portfolioId: portfolio.id,
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