import Link from "next/link";

import { db } from "@/db";
import { portfolioProfiles } from "@/db/schema";

import { auth } from "@/lib/auth";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { eq } from "drizzle-orm";

export default async function EditPortfolioPage() {
  // =========================================
  // 1. Authentication
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
    .select()
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
  // 3. Page
  // =========================================

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl">

        {/* =====================================
            HEADER
        ====================================== */}

        <div className="mb-8">
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground transition hover:text-foreground"
          >
            ← Back to Dashboard
          </Link>

          <h1 className="mt-4 text-3xl font-bold tracking-tight">
            Edit Portfolio
          </h1>

          <p className="mt-2 text-muted-foreground">
            Update the information displayed on your
            public portfolio.
          </p>
        </div>

        {/* =====================================
            PORTFOLIO SECTIONS
        ====================================== */}

        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold">
            Portfolio Sections
          </h2>

          <div className="grid gap-4 md:grid-cols-3">

            {/* Profile */}
            <div className="rounded-xl border p-5">
              <h3 className="font-semibold">
                Profile
              </h3>

              <p className="mt-2 text-sm text-muted-foreground">
                Name, headline, bio, location and
                social links.
              </p>

              <div className="mt-4 rounded-lg bg-muted px-3 py-2 text-center text-sm font-medium">
                Currently Editing
              </div>
            </div>

            {/* Skills */}
            <Link
              href="/dashboard/portfolio/edit/skills"
              className="rounded-xl border p-5 transition hover:bg-muted"
            >
              <h3 className="font-semibold">
                Skills
              </h3>

              <p className="mt-2 text-sm text-muted-foreground">
                Manage your programming languages,
                frameworks and technologies.
              </p>

              <div className="mt-4 text-sm font-medium">
                Manage Skills →
              </div>
            </Link>

            {/* Projects */}
            <Link
              href="/dashboard/portfolio/edit/projects"
              className="rounded-xl border p-5 transition hover:bg-muted"
            >
              <h3 className="font-semibold">
                Projects
              </h3>

              <p className="mt-2 text-sm text-muted-foreground">
                Add and manage your professional and
                personal projects.
              </p>

              <div className="mt-4 text-sm font-medium">
                Manage Projects →
              </div>
            </Link>

            {/* Experience */}
            <Link
              href="/dashboard/portfolio/edit/experience"
              className="rounded-xl border p-5 transition hover:bg-muted"
            >
              <h3 className="font-semibold">
                Experience
              </h3>

              <p className="mt-2 text-sm text-muted-foreground">
                Add your work experience, roles and
                responsibilities.
              </p>

              <div className="mt-4 text-sm font-medium">
                Manage Experience →
              </div>
            </Link>

            {/* Education */}
            <Link
              href="/dashboard/portfolio/edit/education"
              className="rounded-xl border p-5 transition hover:bg-muted"
            >
              <h3 className="font-semibold">
                Education
              </h3>

              <p className="mt-2 text-sm text-muted-foreground">
                Manage your degrees, institutions and
                education history.
              </p>

              <div className="mt-4 text-sm font-medium">
                Manage Education →
              </div>
            </Link>

            {/* Theme */}
            <Link
              href="/dashboard/portfolio/edit/theme"
              className="rounded-xl border p-5 transition hover:bg-muted"
            >
              <h3 className="font-semibold">
                Theme
              </h3>

              <p className="mt-2 text-sm text-muted-foreground">
                Customize your portfolio style and
                accent color.
              </p>

              <div className="mt-4 text-sm font-medium">
                Customize Theme →
              </div>
            </Link>

          </div>
        </section>

        {/* =====================================
            PROFILE FORM
        ====================================== */}

        <form
          action="/api/portfolio/update"
          method="POST"
          className="space-y-6 rounded-2xl border p-6"
        >
          <input
            type="hidden"
            name="portfolioId"
            value={portfolio.id}
          />

          {/* Full Name */}
          <div>
            <label
              htmlFor="fullName"
              className="text-sm font-medium"
            >
              Full Name
            </label>

            <input
              id="fullName"
              name="fullName"
              defaultValue={
                portfolio.fullName ?? ""
              }
              required
              className="mt-2 w-full rounded-lg border bg-background px-4 py-3 outline-none transition focus:ring-2"
            />
          </div>

          {/* Headline */}
          <div>
            <label
              htmlFor="headline"
              className="text-sm font-medium"
            >
              Headline
            </label>

            <input
              id="headline"
              name="headline"
              defaultValue={
                portfolio.headline ?? ""
              }
              placeholder="Software Developer | AI Engineer"
              className="mt-2 w-full rounded-lg border bg-background px-4 py-3 outline-none transition focus:ring-2"
            />
          </div>

          {/* Bio */}
          <div>
            <label
              htmlFor="bio"
              className="text-sm font-medium"
            >
              Bio
            </label>

            <textarea
              id="bio"
              name="bio"
              defaultValue={
                portfolio.bio ?? ""
              }
              rows={6}
              placeholder="Write a short professional introduction..."
              className="mt-2 w-full resize-y rounded-lg border bg-background px-4 py-3 outline-none transition focus:ring-2"
            />
          </div>

          {/* Location */}
          <div>
            <label
              htmlFor="location"
              className="text-sm font-medium"
            >
              Location
            </label>

            <input
              id="location"
              name="location"
              defaultValue={
                portfolio.location ?? ""
              }
              placeholder="Kerala, India"
              className="mt-2 w-full rounded-lg border bg-background px-4 py-3 outline-none transition focus:ring-2"
            />
          </div>

          {/* =================================
              SOCIAL LINKS
          ================================== */}

          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold">
              Social Links
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Add links that visitors can use to
              find you online.
            </p>
          </div>

          {/* GitHub */}
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
              defaultValue={
                portfolio.githubUrl ?? ""
              }
              placeholder="https://github.com/username"
              className="mt-2 w-full rounded-lg border bg-background px-4 py-3 outline-none transition focus:ring-2"
            />
          </div>

          {/* LinkedIn */}
          <div>
            <label
              htmlFor="linkedinUrl"
              className="text-sm font-medium"
            >
              LinkedIn URL
            </label>

            <input
              id="linkedinUrl"
              name="linkedinUrl"
              type="url"
              defaultValue={
                portfolio.linkedinUrl ?? ""
              }
              placeholder="https://linkedin.com/in/username"
              className="mt-2 w-full rounded-lg border bg-background px-4 py-3 outline-none transition focus:ring-2"
            />
          </div>

          {/* Website */}
          <div>
            <label
              htmlFor="websiteUrl"
              className="text-sm font-medium"
            >
              Website URL
            </label>

            <input
              id="websiteUrl"
              name="websiteUrl"
              type="url"
              defaultValue={
                portfolio.websiteUrl ?? ""
              }
              placeholder="https://example.com"
              className="mt-2 w-full rounded-lg border bg-background px-4 py-3 outline-none transition focus:ring-2"
            />
          </div>

          {/* Save */}
          <button
            type="submit"
            className="w-full rounded-lg bg-foreground px-5 py-3 font-medium text-background transition hover:opacity-90"
          >
            Save Profile Changes
          </button>
        </form>

        {/* =====================================
            APPEARANCE
        ====================================== */}

        <section className="mt-8 rounded-2xl border p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                Appearance
              </h2>

              <p className="mt-2 text-sm text-muted-foreground">
                Customize the visual style of your
                public portfolio.
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                  Theme: {portfolio.theme || "minimal"}
                </span>

                <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                  Accent: {portfolio.accentColor || "default"}
                </span>
              </div>
            </div>

            <Link
              href="/dashboard/portfolio/edit/theme"
              className="inline-flex shrink-0 items-center justify-center rounded-lg border px-5 py-3 text-sm font-medium transition hover:bg-muted"
            >
              Customize Theme →
            </Link>
          </div>
        </section>

        {/* =====================================
            PUBLIC PORTFOLIO
        ====================================== */}

        <section className="mt-8 rounded-2xl border p-6">
          <h2 className="text-lg font-semibold">
            Public Portfolio
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Your portfolio is publicly available at:
          </p>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/portfolio/${portfolio.username}`}
              target="_blank"
              className="inline-flex items-center justify-center rounded-lg bg-foreground px-5 py-3 text-sm font-medium text-background transition hover:opacity-90"
            >
              View Portfolio →
            </Link>

            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-lg border px-5 py-3 text-sm font-medium transition hover:bg-muted"
            >
              Back to Dashboard
            </Link>
          </div>
        </section>

      </div>
    </main>
  );
}