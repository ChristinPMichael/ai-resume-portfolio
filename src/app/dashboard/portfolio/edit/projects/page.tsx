import Link from "next/link";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { db } from "@/db";
import {
  portfolioProfiles,
  projects,
} from "@/db/schema";

import { eq } from "drizzle-orm";

export default async function EditProjectsPage() {
  // =========================================
  // Authentication
  // =========================================

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  // =========================================
  // Get user's portfolio
  // =========================================

  const [portfolio] = await db
    .select({
      id: portfolioProfiles.id,
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
    redirect("/dashboard");
  }

  // =========================================
  // Get projects
  // =========================================

  const profileProjects = await db
    .select()
    .from(projects)
    .where(
      eq(
        projects.portfolioId,
        portfolio.id,
      ),
    );

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl">

        {/* Back */}
        <Link
          href="/dashboard/portfolio/edit"
          className="text-sm text-muted-foreground transition hover:text-foreground"
        >
          ← Back to Portfolio
        </Link>

        {/* Header */}
        <div className="mt-6">
          <h1 className="text-3xl font-bold tracking-tight">
            Edit Projects
          </h1>

          <p className="mt-2 text-muted-foreground">
            Add, edit, or remove projects from your
            professional portfolio.
          </p>
        </div>

        {/* =====================================
            ADD PROJECT
        ====================================== */}

        <form
          action="/api/portfolio/projects"
          method="POST"
          className="mt-8 space-y-5 rounded-2xl border p-6"
        >
          <input
            type="hidden"
            name="action"
            value="add"
          />

          <input
            type="hidden"
            name="portfolioId"
            value={portfolio.id}
          />

          <div>
            <label
              htmlFor="name"
              className="text-sm font-medium"
            >
              Project Name
            </label>

            <input
              id="name"
              name="name"
              type="text"
              placeholder="AI Customer Support Platform"
              required
              className="mt-2 w-full rounded-lg border bg-background px-4 py-3 outline-none transition focus:ring-2"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="text-sm font-medium"
            >
              Description
            </label>

            <textarea
              id="description"
              name="description"
              rows={5}
              placeholder="Describe what the project does..."
              className="mt-2 w-full resize-y rounded-lg border bg-background px-4 py-3 outline-none transition focus:ring-2"
            />
          </div>

          <div>
            <label
              htmlFor="technologies"
              className="text-sm font-medium"
            >
              Technologies
            </label>

            <input
              id="technologies"
              name="technologies"
              type="text"
              placeholder="Next.js, React, PostgreSQL"
              className="mt-2 w-full rounded-lg border bg-background px-4 py-3 outline-none transition focus:ring-2"
            />

            <p className="mt-1 text-xs text-muted-foreground">
              Separate technologies with commas.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">

            <div>
              <label
                htmlFor="projectUrl"
                className="text-sm font-medium"
              >
                Live Project URL
              </label>

              <input
                id="projectUrl"
                name="projectUrl"
                type="url"
                placeholder="https://example.com"
                className="mt-2 w-full rounded-lg border bg-background px-4 py-3 outline-none transition focus:ring-2"
              />
            </div>

            <div>
              <label
                htmlFor="githubUrl"
                className="text-sm font-medium"
              >
                GitHub URL
              </label>

              <input
                id="githubUrl"
                name="githubUrl"
                type="url"
                placeholder="https://github.com/username/project"
                className="mt-2 w-full rounded-lg border bg-background px-4 py-3 outline-none transition focus:ring-2"
              />
            </div>

          </div>

          <button
            type="submit"
            className="rounded-lg bg-foreground px-5 py-3 text-sm font-medium text-background transition hover:opacity-90"
          >
            Add Project
          </button>
        </form>

        {/* =====================================
            EXISTING PROJECTS
        ====================================== */}

        <section className="mt-10">

          <div className="mb-5">
            <h2 className="text-xl font-semibold">
              Your Projects
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Projects currently displayed on your portfolio.
            </p>
          </div>

          {profileProjects.length === 0 ? (

            <div className="rounded-xl border p-6 text-sm text-muted-foreground">
              No projects added yet.
            </div>

          ) : (

            <div className="space-y-5">

              {profileProjects.map((project) => (

                <article
                  key={project.id}
                  className="rounded-2xl border p-6"
                >

                  {/* Project header */}
                  <div className="flex items-start justify-between gap-4">

                    <div className="min-w-0">

                      <h3 className="text-xl font-semibold">
                        {project.name}
                      </h3>

                      {project.description && (
                        <p className="mt-3 whitespace-pre-line leading-7 text-muted-foreground">
                          {project.description}
                        </p>
                      )}

                    </div>

                    {/* Delete */}
                    <form
                      action="/api/portfolio/projects"
                      method="POST"
                    >
                      <input
                        type="hidden"
                        name="action"
                        value="delete"
                      />

                      <input
                        type="hidden"
                        name="projectId"
                        value={project.id}
                      />

                      <button
                        type="submit"
                        className="rounded-lg border px-3 py-2 text-sm text-destructive transition hover:bg-muted"
                      >
                        Delete
                      </button>
                    </form>

                  </div>

                  {/* Technologies */}
                  {project.technologies && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {project.technologies
                        .split(",")
                        .map((technology) => {
                          const value =
                            technology.trim();

                          if (!value) return null;

                          return (
                            <span
                              key={value}
                              className="rounded-full bg-muted px-3 py-1 text-xs font-medium"
                            >
                              {value}
                            </span>
                          );
                        })}
                    </div>
                  )}

                  {/* Links */}
                  <div className="mt-5 flex flex-wrap gap-4 text-sm">

                    {project.projectUrl && (
                      <a
                        href={project.projectUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline underline-offset-4"
                      >
                        Live Project ↗
                      </a>
                    )}

                    {project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline underline-offset-4"
                      >
                        GitHub ↗
                      </a>
                    )}

                  </div>

                  {/* =================================
                      EDIT PROJECT
                  ================================== */}

                  <details className="mt-6 rounded-xl border">

                    <summary className="cursor-pointer px-4 py-3 text-sm font-medium">
                      Edit Project
                    </summary>

                    <form
                      action="/api/portfolio/projects"
                      method="POST"
                      className="space-y-5 border-t p-5"
                    >

                      <input
                        type="hidden"
                        name="action"
                        value="update"
                      />

                      <input
                        type="hidden"
                        name="projectId"
                        value={project.id}
                      />

                      <div>
                        <label className="text-sm font-medium">
                          Project Name
                        </label>

                        <input
                          name="name"
                          defaultValue={project.name}
                          required
                          className="mt-2 w-full rounded-lg border bg-background px-4 py-3 outline-none focus:ring-2"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium">
                          Description
                        </label>

                        <textarea
                          name="description"
                          defaultValue={
                            project.description ?? ""
                          }
                          rows={5}
                          className="mt-2 w-full rounded-lg border bg-background px-4 py-3 outline-none focus:ring-2"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium">
                          Technologies
                        </label>

                        <input
                          name="technologies"
                          defaultValue={
                            project.technologies ?? ""
                          }
                          placeholder="Next.js, React, PostgreSQL"
                          className="mt-2 w-full rounded-lg border bg-background px-4 py-3 outline-none focus:ring-2"
                        />
                      </div>

                      <div className="grid gap-5 sm:grid-cols-2">

                        <div>
                          <label className="text-sm font-medium">
                            Live Project URL
                          </label>

                          <input
                            name="projectUrl"
                            type="url"
                            defaultValue={
                              project.projectUrl ?? ""
                            }
                            className="mt-2 w-full rounded-lg border bg-background px-4 py-3 outline-none focus:ring-2"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium">
                            GitHub URL
                          </label>

                          <input
                            name="githubUrl"
                            type="url"
                            defaultValue={
                              project.githubUrl ?? ""
                            }
                            className="mt-2 w-full rounded-lg border bg-background px-4 py-3 outline-none focus:ring-2"
                          />
                        </div>

                      </div>

                      <button
                        type="submit"
                        className="rounded-lg bg-foreground px-5 py-3 text-sm font-medium text-background transition hover:opacity-90"
                      >
                        Save Project
                      </button>

                    </form>

                  </details>

                </article>

              ))}

            </div>

          )}

        </section>

        {/* Navigation */}
        <div className="mt-10 grid gap-3 sm:grid-cols-2">

          <Link
            href="/dashboard/portfolio/edit/skills"
            className="inline-flex items-center justify-center rounded-lg border px-5 py-3 text-sm font-medium transition hover:bg-muted"
          >
            ← Manage Skills
          </Link>

          <Link
            href="/dashboard/portfolio/edit"
            className="inline-flex items-center justify-center rounded-lg bg-foreground px-5 py-3 text-sm font-medium text-background transition hover:opacity-90"
          >
            Back to Profile
          </Link>

        </div>

      </div>
    </main>
  );
}