import Link from "next/link";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { portfolioProfiles, experiences } from "@/db/schema";

import { eq } from "drizzle-orm";

export default async function EditExperiencePage() {
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
  // Get portfolio
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
  // Get experiences
  // =========================================

  const profileExperiences = await db
    .select()
    .from(experiences)
    .where(
      eq(
        experiences.portfolioId,
        portfolio.id,
      ),
    );

  // =========================================
  // Render
  // =========================================

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl">

        {/* Back */}
        <Link
          href="/dashboard/portfolio/edit"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to Portfolio
        </Link>

        {/* Header */}
        <div className="mt-6">
          <h1 className="text-3xl font-bold tracking-tight">
            Edit Experience
          </h1>

          <p className="mt-2 text-muted-foreground">
            Add, edit, or remove your professional
            work experience.
          </p>
        </div>

        {/* =====================================
            ADD EXPERIENCE
        ====================================== */}

        <form
          action="/api/portfolio/experience"
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

          {/* Company */}
          <div>
            <label
              htmlFor="company"
              className="text-sm font-medium"
            >
              Company
            </label>

            <input
              id="company"
              name="company"
              type="text"
              placeholder="NDimensionZ Solutions Pvt. Ltd."
              required
              className="mt-2 w-full rounded-lg border bg-background px-4 py-3 outline-none focus:ring-2"
            />
          </div>

          {/* Role */}
          <div>
            <label
              htmlFor="role"
              className="text-sm font-medium"
            >
              Role / Job Title
            </label>

            <input
              id="role"
              name="role"
              type="text"
              placeholder="Software Developer Intern"
              required
              className="mt-2 w-full rounded-lg border bg-background px-4 py-3 outline-none focus:ring-2"
            />
          </div>

          {/* Description */}
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
              rows={6}
              placeholder="Describe your responsibilities, achievements, and work..."
              className="mt-2 w-full resize-y rounded-lg border bg-background px-4 py-3 outline-none focus:ring-2"
            />
          </div>

          {/* Dates */}
          <div className="grid gap-5 sm:grid-cols-2">

            <div>
              <label
                htmlFor="startDate"
                className="text-sm font-medium"
              >
                Start Date
              </label>

              <input
                id="startDate"
                name="startDate"
                type="text"
                placeholder="Nov 2025"
                className="mt-2 w-full rounded-lg border bg-background px-4 py-3 outline-none focus:ring-2"
              />
            </div>

            <div>
              <label
                htmlFor="endDate"
                className="text-sm font-medium"
              >
                End Date
              </label>

              <input
                id="endDate"
                name="endDate"
                type="text"
                placeholder="Present"
                className="mt-2 w-full rounded-lg border bg-background px-4 py-3 outline-none focus:ring-2"
              />
            </div>

          </div>

          <button
            type="submit"
            className="rounded-lg bg-foreground px-5 py-3 text-sm font-medium text-background hover:opacity-90"
          >
            Add Experience
          </button>
        </form>

        {/* =====================================
            EXISTING EXPERIENCE
        ====================================== */}

        <section className="mt-10">

          <div className="mb-5">
            <h2 className="text-xl font-semibold">
              Your Experience
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Professional experience currently shown
              on your portfolio.
            </p>
          </div>

          {profileExperiences.length === 0 ? (
            <div className="rounded-xl border p-6 text-sm text-muted-foreground">
              No experience added yet.
            </div>
          ) : (
            <div className="space-y-5">

              {profileExperiences.map((experience) => (
                <article
                  key={experience.id}
                  className="rounded-2xl border p-6"
                >

                  {/* Experience header */}
                  <div className="flex items-start justify-between gap-4">

                    <div className="min-w-0">

                      <h3 className="text-xl font-semibold">
                        {experience.role}
                      </h3>

                      <p className="mt-1 font-medium">
                        {experience.company}
                      </p>

                      {(experience.startDate ||
                        experience.endDate) && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          {experience.startDate ?? ""}
                          {experience.startDate &&
                          experience.endDate
                            ? " — "
                            : ""}
                          {experience.endDate ?? ""}
                        </p>
                      )}

                    </div>

                    {/* Delete */}
                    <form
                      action="/api/portfolio/experience"
                      method="POST"
                    >
                      <input
                        type="hidden"
                        name="action"
                        value="delete"
                      />

                      <input
                        type="hidden"
                        name="experienceId"
                        value={experience.id}
                      />

                      <button
                        type="submit"
                        className="rounded-lg border px-3 py-2 text-sm text-destructive hover:bg-muted"
                      >
                        Delete
                      </button>
                    </form>

                  </div>

                  {/* Description */}
                  {experience.description && (
                    <p className="mt-5 whitespace-pre-line leading-7 text-muted-foreground">
                      {experience.description}
                    </p>
                  )}

                  {/* =================================
                      EDIT
                  ================================== */}

                  <details className="mt-6 rounded-xl border">

                    <summary className="cursor-pointer px-4 py-3 text-sm font-medium">
                      Edit Experience
                    </summary>

                    <form
                      action="/api/portfolio/experience"
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
                        name="experienceId"
                        value={experience.id}
                      />

                      {/* Company */}
                      <div>
                        <label className="text-sm font-medium">
                          Company
                        </label>

                        <input
                          name="company"
                          defaultValue={
                            experience.company
                          }
                          required
                          className="mt-2 w-full rounded-lg border bg-background px-4 py-3 outline-none focus:ring-2"
                        />
                      </div>

                      {/* Role */}
                      <div>
                        <label className="text-sm font-medium">
                          Role / Job Title
                        </label>

                        <input
                          name="role"
                          defaultValue={
                            experience.role
                          }
                          required
                          className="mt-2 w-full rounded-lg border bg-background px-4 py-3 outline-none focus:ring-2"
                        />
                      </div>

                      {/* Description */}
                      <div>
                        <label className="text-sm font-medium">
                          Description
                        </label>

                        <textarea
                          name="description"
                          defaultValue={
                            experience.description ?? ""
                          }
                          rows={6}
                          className="mt-2 w-full resize-y rounded-lg border bg-background px-4 py-3 outline-none focus:ring-2"
                        />
                      </div>

                      {/* Dates */}
                      <div className="grid gap-5 sm:grid-cols-2">

                        <div>
                          <label className="text-sm font-medium">
                            Start Date
                          </label>

                          <input
                            name="startDate"
                            defaultValue={
                              experience.startDate ?? ""
                            }
                            placeholder="Nov 2025"
                            className="mt-2 w-full rounded-lg border bg-background px-4 py-3 outline-none focus:ring-2"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium">
                            End Date
                          </label>

                          <input
                            name="endDate"
                            defaultValue={
                              experience.endDate ?? ""
                            }
                            placeholder="Present"
                            className="mt-2 w-full rounded-lg border bg-background px-4 py-3 outline-none focus:ring-2"
                          />
                        </div>

                      </div>

                      <button
                        type="submit"
                        className="rounded-lg bg-foreground px-5 py-3 text-sm font-medium text-background hover:opacity-90"
                      >
                        Save Experience
                      </button>

                    </form>

                  </details>

                </article>
              ))}

            </div>
          )}

        </section>

        {/* =====================================
            NAVIGATION
        ====================================== */}

        <div className="mt-10 grid gap-3 sm:grid-cols-3">

          <Link
            href="/dashboard/portfolio/edit/skills"
            className="inline-flex items-center justify-center rounded-lg border px-5 py-3 text-sm font-medium hover:bg-muted"
          >
            ← Skills
          </Link>

          <Link
            href="/dashboard/portfolio/edit/projects"
            className="inline-flex items-center justify-center rounded-lg border px-5 py-3 text-sm font-medium hover:bg-muted"
          >
            Projects
          </Link>

          <Link
            href="/dashboard/portfolio/edit"
            className="inline-flex items-center justify-center rounded-lg bg-foreground px-5 py-3 text-sm font-medium text-background hover:opacity-90"
          >
            Profile
          </Link>

        </div>

      </div>
    </main>
  );
}