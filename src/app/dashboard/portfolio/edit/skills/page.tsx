import Link from "next/link";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { db } from "@/db";
import {
  portfolioProfiles,
  skills,
} from "@/db/schema";

import { eq } from "drizzle-orm";

export default async function EditSkillsPage() {
  // =========================================
  // 1. Check authentication
  // =========================================

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  // =========================================
  // 2. Get user's portfolio
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
  // 3. Get portfolio skills
  // =========================================

  const profileSkills = await db
    .select()
    .from(skills)
    .where(
      eq(
        skills.portfolioId,
        portfolio.id,
      ),
    );

  // =========================================
  // 4. Render page
  // =========================================

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-3xl">

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
            Edit Skills
          </h1>

          <p className="mt-2 text-muted-foreground">
            Add or remove the technologies and skills
            shown on your portfolio.
          </p>
        </div>

        {/* =====================================
            ADD SKILL
        ====================================== */}

        <form
          action="/api/portfolio/skills"
          method="POST"
          className="mt-8 rounded-2xl border bg-background p-6"
        >
          <input
            type="hidden"
            name="portfolioId"
            value={portfolio.id}
          />

          <div className="grid gap-5 sm:grid-cols-2">

            {/* Skill name */}
            <div>
              <label
                htmlFor="name"
                className="text-sm font-medium"
              >
                Skill
              </label>

              <input
                id="name"
                name="name"
                type="text"
                placeholder="Python"
                required
                className="mt-2 w-full rounded-lg border bg-background px-4 py-3 outline-none transition focus:ring-2"
              />
            </div>

            {/* Category */}
            <div>
              <label
                htmlFor="category"
                className="text-sm font-medium"
              >
                Category
              </label>

              <input
                id="category"
                name="category"
                type="text"
                placeholder="Programming Languages"
                className="mt-2 w-full rounded-lg border bg-background px-4 py-3 outline-none transition focus:ring-2"
              />
            </div>

          </div>

          <button
            type="submit"
            className="mt-5 rounded-lg bg-foreground px-5 py-3 text-sm font-medium text-background transition hover:opacity-90"
          >
            Add Skill
          </button>
        </form>

        {/* =====================================
            EXISTING SKILLS
        ====================================== */}

        <section className="mt-8">

          <div className="mb-4">
            <h2 className="text-xl font-semibold">
              Your Skills
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Skills currently displayed on your portfolio.
            </p>
          </div>

          {profileSkills.length === 0 ? (

            <div className="rounded-xl border p-6 text-sm text-muted-foreground">
              No skills added yet.
            </div>

          ) : (

            <div className="space-y-3">

              {profileSkills.map((skill) => (

                <div
                  key={skill.id}
                  className="flex items-center justify-between gap-4 rounded-xl border p-4"
                >

                  {/* Skill information */}
                  <div className="min-w-0">

                    <p className="font-medium">
                      {skill.name}
                    </p>

                    {skill.category && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {skill.category}
                      </p>
                    )}

                  </div>

                  {/* Delete */}
                  <form
                    action="/api/portfolio/skills"
                    method="POST"
                  >
                    <input
                      type="hidden"
                      name="action"
                      value="delete"
                    />

                    <input
                      type="hidden"
                      name="skillId"
                      value={skill.id}
                    />

                    <button
                      type="submit"
                      className="rounded-lg border px-3 py-2 text-sm text-destructive transition hover:bg-muted"
                    >
                      Delete
                    </button>
                  </form>

                </div>

              ))}

            </div>

          )}

        </section>

        {/* =====================================
            NAVIGATION
        ====================================== */}

        <div className="mt-8 grid gap-3 sm:grid-cols-2">

          <Link
            href="/dashboard/portfolio/edit"
            className="inline-flex items-center justify-center rounded-lg border px-5 py-3 text-sm font-medium transition hover:bg-muted"
          >
            ← Edit Profile
          </Link>

          <Link
            href="/dashboard/portfolio/edit/projects"
            className="inline-flex items-center justify-center rounded-lg bg-foreground px-5 py-3 text-sm font-medium text-background transition hover:opacity-90"
          >
            Manage Projects →
          </Link>

        </div>

      </div>
    </main>
  );
}