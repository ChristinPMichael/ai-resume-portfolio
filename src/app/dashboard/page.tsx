import Link from "next/link";

import { ResumeUpload } from "@/components/resume-upload";
import { LogoutButton } from "@/components/logout-button";
import ThemeToggle from "@/components/theme-toggle";

import { auth } from "@/lib/auth";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { db } from "@/db";

import {
  portfolioProfiles,
  resumes,
  contactMessages,
} from "@/db/schema";

import {
  eq,
  desc,
} from "drizzle-orm";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  /* =======================================================
     LATEST RESUME
  ======================================================= */

  const [latestResume] = await db
    .select({
      id: resumes.id,
      fileName: resumes.fileName,
      createdAt: resumes.createdAt,
    })
    .from(resumes)
    .where(
      eq(
        resumes.userId,
        session.user.id,
      ),
    )
    .orderBy(
      desc(resumes.createdAt),
    )
    .limit(1);

  /* =======================================================
     USER PORTFOLIO
  ======================================================= */

  const [portfolio] = await db
    .select({
      id: portfolioProfiles.id,
      username: portfolioProfiles.username,
      fullName: portfolioProfiles.fullName,
      headline: portfolioProfiles.headline,
    })
    .from(portfolioProfiles)
    .where(
      eq(
        portfolioProfiles.userId,
        session.user.id,
      ),
    )
    .limit(1);

  /* =======================================================
     CONTACT MESSAGE COUNT
  ======================================================= */

  let unreadMessageCount = 0;
  let totalMessageCount = 0;

  if (portfolio) {
    const messages = await db
      .select({
        id: contactMessages.id,
        isRead: contactMessages.isRead,
      })
      .from(contactMessages)
      .where(
        eq(
          contactMessages.portfolioId,
          portfolio.id,
        ),
      );

    totalMessageCount = messages.length;

    unreadMessageCount = messages.filter(
      (message) => !message.isRead,
    ).length;
  }

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-6xl">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex items-start justify-between gap-4">

          <div>
            <p className="text-sm text-muted-foreground">
              AI Resume Portfolio
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              Welcome,{" "}
              {session.user.name}
            </h1>

            <p className="mt-2 text-muted-foreground">
              Build your professional portfolio with AI.
            </p>
          </div>

          {/* HEADER ACTIONS */}

          <div className="flex items-center gap-3">
            <ThemeToggle />

            <LogoutButton />
          </div>

        </div>

        {/* =================================================
            STATUS CARDS
        ================================================= */}

        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">

          {/* -------------------------------------------------
              RESUME
          ------------------------------------------------- */}

          <div className="rounded-xl border p-6">

            <div className="flex items-center justify-between">

              <h2 className="font-semibold">
                Resume
              </h2>

              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  latestResume
                    ? "bg-green-100 text-green-700"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {latestResume
                  ? "Uploaded"
                  : "Not uploaded"}
              </span>

            </div>

            {latestResume ? (
              <>
                <p className="mt-4 truncate text-sm">
                  {latestResume.fileName}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Ready for AI analysis
                </p>
              </>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                Upload your resume to get started.
              </p>
            )}

          </div>

          {/* -------------------------------------------------
              AI PROFILE
          ------------------------------------------------- */}

          <div className="rounded-xl border p-6">

            <div className="flex items-center justify-between">

              <h2 className="font-semibold">
                AI Profile
              </h2>

              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  portfolio
                    ? "bg-green-100 text-green-700"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {portfolio
                  ? "Generated"
                  : "Not generated"}
              </span>

            </div>

            {portfolio ? (
              <>
                <p className="mt-4 text-sm font-medium">
                  {portfolio.fullName}
                </p>

                {portfolio.headline && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {portfolio.headline}
                  </p>
                )}
              </>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                Analyze your resume to generate your AI profile.
              </p>
            )}

          </div>

          {/* -------------------------------------------------
              PORTFOLIO
          ------------------------------------------------- */}

          <div className="rounded-xl border p-6">

            <div className="flex items-center justify-between">

              <h2 className="font-semibold">
                Portfolio
              </h2>

              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  portfolio
                    ? "bg-green-100 text-green-700"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {portfolio
                  ? "Live"
                  : "Not ready"}
              </span>

            </div>

            {portfolio ? (
              <>
                <p className="mt-4 text-sm text-muted-foreground">
                  Your public portfolio is ready.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">

                  <Link
                    href={`/portfolio/${portfolio.username}`}
                    className="inline-flex rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:opacity-90"
                  >
                    View Portfolio →
                  </Link>

                  <Link
                    href="/dashboard/portfolio/edit"
                    className="inline-flex rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-muted"
                  >
                    Edit
                  </Link>

                </div>
              </>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                Your portfolio will appear here after analysis.
              </p>
            )}

          </div>

          {/* -------------------------------------------------
              MESSAGES
          ------------------------------------------------- */}

          <Link
            href={
              portfolio
                ? "/dashboard/portfolio/messages"
                : "/dashboard"
            }
            className="group rounded-xl border p-6 transition hover:-translate-y-1 hover:bg-muted/40 hover:shadow-md"
          >

            <div className="flex items-center justify-between">

              <h2 className="font-semibold">
                Messages
              </h2>

              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  unreadMessageCount > 0
                    ? "bg-red-100 text-red-700"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {unreadMessageCount > 0
                  ? `${unreadMessageCount} unread`
                  : "No unread"}
              </span>

            </div>

            {portfolio ? (
              <>
                <p className="mt-4 text-sm text-muted-foreground">
                  Messages from people who contact you through
                  your portfolio.
                </p>

                <p className="mt-4 text-sm font-medium transition group-hover:underline">
                  View Messages →
                </p>
              </>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                Create your portfolio to receive messages.
              </p>
            )}

          </Link>

        </div>

        {/* =================================================
            QUICK ACTIONS
        ================================================= */}

        {portfolio && (
          <section className="mt-8">

            <h2 className="text-xl font-semibold">
              Quick Actions
            </h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

              {/* Edit Profile */}

              <Link
                href="/dashboard/portfolio/edit"
                className="rounded-xl border p-5 transition hover:bg-muted"
              >
                <div className="text-lg font-semibold">
                  Edit Profile
                </div>

                <p className="mt-1 text-sm text-muted-foreground">
                  Update your name, bio and social links.
                </p>
              </Link>

              {/* Customize Theme */}

              <Link
                href="/dashboard/portfolio/edit/theme"
                className="rounded-xl border p-5 transition hover:bg-muted"
              >
                <div className="text-lg font-semibold">
                  Customize Theme
                </div>

                <p className="mt-1 text-sm text-muted-foreground">
                  Change portfolio style and accent color.
                </p>
              </Link>

              {/* Messages */}

              <Link
                href="/dashboard/portfolio/messages"
                className="rounded-xl border p-5 transition hover:bg-muted"
              >
                <div className="text-lg font-semibold">
                  Messages
                </div>

                <p className="mt-1 text-sm text-muted-foreground">
                  View recruiter and visitor messages.
                </p>
              </Link>

              {/* Public Portfolio */}

              <Link
                href={`/portfolio/${portfolio.username}`}
                target="_blank"
                className="rounded-xl border p-5 transition hover:bg-muted"
              >
                <div className="text-lg font-semibold">
                  Public Portfolio
                </div>

                <p className="mt-1 text-sm text-muted-foreground">
                  Open your live portfolio.
                </p>
              </Link>

              {/* Account Settings */}

              <Link
                href="/dashboard/settings"
                className="rounded-xl border p-5 transition hover:bg-muted"
              >
                <div className="text-lg font-semibold">
                  Account Settings
                </div>

                <p className="mt-1 text-sm text-muted-foreground">
                  Manage your account and password.
                </p>
              </Link>

            </div>

          </section>
        )}

        {/* =================================================
            UPLOAD
        ================================================= */}

        <section className="mt-8 rounded-2xl border p-6">

          <div className="mb-6">

            <h2 className="text-xl font-semibold">
              {latestResume
                ? "Upload a New Resume"
                : "Upload Your Resume"}
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              PDF or DOCX · Maximum 5MB
            </p>

          </div>

          <ResumeUpload />

        </section>

        {/* =================================================
            WORKFLOW
        ================================================= */}

        <section className="mt-8">

          <h2 className="text-xl font-semibold">
            How it works
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-3">

            {/* Step 01 */}

            <div className="rounded-xl border p-5">

              <div className="text-2xl">
                01
              </div>

              <h3 className="mt-3 font-semibold">
                Upload Resume
              </h3>

              <p className="mt-2 text-sm text-muted-foreground">
                Upload your existing resume in PDF or DOCX
                format.
              </p>

            </div>

            {/* Step 02 */}

            <div className="rounded-xl border p-5">

              <div className="text-2xl">
                02
              </div>

              <h3 className="mt-3 font-semibold">
                AI Analysis
              </h3>

              <p className="mt-2 text-sm text-muted-foreground">
                AI extracts your skills, experience, projects
                and education.
              </p>

            </div>

            {/* Step 03 */}

            <div className="rounded-xl border p-5">

              <div className="text-2xl">
                03
              </div>

              <h3 className="mt-3 font-semibold">
                Publish Portfolio
              </h3>

              <p className="mt-2 text-sm text-muted-foreground">
                Your professional portfolio is generated
                and ready to share.
              </p>

            </div>

          </div>

        </section>

      </div>
    </main>
  );
}