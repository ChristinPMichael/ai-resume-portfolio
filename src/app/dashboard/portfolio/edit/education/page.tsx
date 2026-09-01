import Link from "next/link";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { portfolioProfiles, education } from "@/db/schema";

import { eq } from "drizzle-orm";

export default async function EditEducationPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

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

  const profileEducation = await db
    .select()
    .from(education)
    .where(
      eq(
        education.portfolioId,
        portfolio.id,
      ),
    );

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl">

        <Link
          href="/dashboard/portfolio/edit"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to Portfolio
        </Link>

        <div className="mt-6">
          <h1 className="text-3xl font-bold tracking-tight">
            Edit Education
          </h1>

          <p className="mt-2 text-muted-foreground">
            Add, edit, or remove your education history.
          </p>
        </div>

        {/* ADD EDUCATION */}

        <form
          action="/api/portfolio/education"
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
              htmlFor="institution"
              className="text-sm font-medium"
            >
              Institution
            </label>

            <input
              id="institution"
              name="institution"
              placeholder="College of Engineering, Cherthala"
              required
              className="mt-2 w-full rounded-lg border bg-background px-4 py-3 outline-none focus:ring-2"
            />
          </div>

          <div>
            <label
              htmlFor="degree"
              className="text-sm font-medium"
            >
              Degree
            </label>

            <input
              id="degree"
              name="degree"
              placeholder="Bachelor of Technology"
              className="mt-2 w-full rounded-lg border bg-background px-4 py-3 outline-none focus:ring-2"
            />
          </div>

          <div>
            <label
              htmlFor="fieldOfStudy"
              className="text-sm font-medium"
            >
              Field of Study
            </label>

            <input
              id="fieldOfStudy"
              name="fieldOfStudy"
              placeholder="Computer Science and Engineering"
              className="mt-2 w-full rounded-lg border bg-background px-4 py-3 outline-none focus:ring-2"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">

            <div>
              <label
                htmlFor="startYear"
                className="text-sm font-medium"
              >
                Start Year
              </label>

              <input
                id="startYear"
                name="startYear"
                type="number"
                min="1900"
                max="2100"
                step="1"
                placeholder="2021"
                className="mt-2 w-full rounded-lg border bg-background px-4 py-3 outline-none focus:ring-2"
              />
            </div>

            <div>
              <label
                htmlFor="endYear"
                className="text-sm font-medium"
              >
                End Year
              </label>

              <input
                id="endYear"
                name="endYear"
                type="number"
                min="1900"
                max="2100"
                step="1"
                placeholder="2025"
                className="mt-2 w-full rounded-lg border bg-background px-4 py-3 outline-none focus:ring-2"
              />
            </div>

          </div>

          <button
            type="submit"
            className="rounded-lg bg-foreground px-5 py-3 text-sm font-medium text-background hover:opacity-90"
          >
            Add Education
          </button>
        </form>

        {/* EXISTING EDUCATION */}

        <section className="mt-10">

          <h2 className="text-xl font-semibold">
            Your Education
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Education currently displayed on your portfolio.
          </p>

          <div className="mt-5 space-y-5">

            {profileEducation.length === 0 ? (

              <div className="rounded-xl border p-6 text-sm text-muted-foreground">
                No education added yet.
              </div>

            ) : (

              profileEducation.map((item) => (

                <article
                  key={item.id}
                  className="rounded-2xl border p-6"
                >

                  <div className="flex items-start justify-between gap-4">

                    <div>
                      <h3 className="text-xl font-semibold">
                        {item.degree ||
                          "Education"}
                      </h3>

                      <p className="mt-1 font-medium">
                        {item.institution}
                      </p>

                      {item.fieldOfStudy && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {item.fieldOfStudy}
                        </p>
                      )}

                      {(item.startYear ||
                        item.endYear) && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          {item.startYear ?? ""}
                          {item.startYear &&
                          item.endYear
                            ? " — "
                            : ""}
                          {item.endYear ?? ""}
                        </p>
                      )}
                    </div>

                    <form
                      action="/api/portfolio/education"
                      method="POST"
                    >
                      <input
                        type="hidden"
                        name="action"
                        value="delete"
                      />

                      <input
                        type="hidden"
                        name="educationId"
                        value={item.id}
                      />

                      <button
                        type="submit"
                        className="rounded-lg border px-3 py-2 text-sm text-destructive hover:bg-muted"
                      >
                        Delete
                      </button>
                    </form>

                  </div>

                  {/* EDIT */}

                  <details className="mt-6 rounded-xl border">

                    <summary className="cursor-pointer px-4 py-3 text-sm font-medium">
                      Edit Education
                    </summary>

                    <form
                      action="/api/portfolio/education"
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
                        name="educationId"
                        value={item.id}
                      />

                      <div>
                        <label className="text-sm font-medium">
                          Institution
                        </label>

                        <input
                          name="institution"
                          defaultValue={
                            item.institution
                          }
                          required
                          className="mt-2 w-full rounded-lg border bg-background px-4 py-3 outline-none focus:ring-2"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium">
                          Degree
                        </label>

                        <input
                          name="degree"
                          defaultValue={
                            item.degree ?? ""
                          }
                          className="mt-2 w-full rounded-lg border bg-background px-4 py-3 outline-none focus:ring-2"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium">
                          Field of Study
                        </label>

                        <input
                          name="fieldOfStudy"
                          defaultValue={
                            item.fieldOfStudy ?? ""
                          }
                          className="mt-2 w-full rounded-lg border bg-background px-4 py-3 outline-none focus:ring-2"
                        />
                      </div>

                      <div className="grid gap-5 sm:grid-cols-2">

                        <div>
                          <label className="text-sm font-medium">
                            Start Year
                          </label>

                          <input
                            name="startYear"
                            type="number"
                            min="1900"
                            max="2100"
                            step="1"
                            defaultValue={
                              item.startYear ?? ""
                            }
                            className="mt-2 w-full rounded-lg border bg-background px-4 py-3 outline-none focus:ring-2"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium">
                            End Year
                          </label>

                          <input
                            name="endYear"
                            type="number"
                            min="1900"
                            max="2100"
                            step="1"
                            defaultValue={
                              item.endYear ?? ""
                            }
                            className="mt-2 w-full rounded-lg border bg-background px-4 py-3 outline-none focus:ring-2"
                          />
                        </div>

                      </div>

                      <button
                        type="submit"
                        className="rounded-lg bg-foreground px-5 py-3 text-sm font-medium text-background hover:opacity-90"
                      >
                        Save Education
                      </button>

                    </form>

                  </details>

                </article>

              ))

            )}

          </div>
        </section>

        {/* NAVIGATION */}

        <div className="mt-10 grid gap-3 sm:grid-cols-4">

          <Link
            href="/dashboard/portfolio/edit"
            className="inline-flex items-center justify-center rounded-lg border px-5 py-3 text-sm font-medium hover:bg-muted"
          >
            Profile
          </Link>

          <Link
            href="/dashboard/portfolio/edit/skills"
            className="inline-flex items-center justify-center rounded-lg border px-5 py-3 text-sm font-medium hover:bg-muted"
          >
            Skills
          </Link>

          <Link
            href="/dashboard/portfolio/edit/projects"
            className="inline-flex items-center justify-center rounded-lg border px-5 py-3 text-sm font-medium hover:bg-muted"
          >
            Projects
          </Link>

          <Link
            href="/dashboard/portfolio/edit/experience"
            className="inline-flex items-center justify-center rounded-lg border px-5 py-3 text-sm font-medium hover:bg-muted"
          >
            Experience
          </Link>

        </div>

      </div>
    </main>
  );
}