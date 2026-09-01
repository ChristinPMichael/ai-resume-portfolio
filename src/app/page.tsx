import Link from "next/link";
import ThemeToggle from "@/components/theme-toggle";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          {/* Logo */}
          <Link
            href="/"
            className="text-lg font-bold tracking-tight"
          >
            AI Resume Portfolio
          </Link>

          {/* Navigation */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            <Link
              href="/login"
              className="rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-muted"
            >
              Login
            </Link>

            <Link
              href="/register"
              className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:opacity-90"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <div className="max-w-4xl">
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              AI-powered career portfolio
            </p>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-7xl">
              Turn your resume into a professional portfolio.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              Upload your resume and let AI analyze your
              experience, skills, projects, and education.
              Create a professional portfolio you can share
              with recruiters and employers.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/register"
                className="rounded-lg bg-foreground px-6 py-3 text-sm font-semibold text-background transition hover:opacity-90"
              >
                Create Your Portfolio →
              </Link>

              <Link
                href="/login"
                className="rounded-lg border px-6 py-3 text-sm font-semibold transition hover:bg-muted"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-6 md:grid-cols-3">
            <Feature
              title="AI Resume Analysis"
              description="Upload your resume and automatically extract your professional information using AI."
            />

            <Feature
              title="Professional Portfolio"
              description="Turn your resume data into a clean, responsive portfolio that you can share online."
            />

            <Feature
              title="Easy Customization"
              description="Edit your profile, projects, skills, experience, education, theme, and contact information."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section>
        <div className="mx-auto max-w-6xl px-6 py-20">
          <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            How it works
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            From resume to portfolio in three steps.
          </h2>

          <div className="mt-10 grid gap-8 md:grid-cols-3">
            <Step
              number="01"
              title="Upload"
              description="Upload your existing resume."
            />

            <Step
              number="02"
              title="Analyze"
              description="AI extracts and organizes your professional information."
            />

            <Step
              number="03"
              title="Share"
              description="Publish your portfolio and share it with recruiters."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center">
          <h2 className="text-3xl font-bold">
            Ready to build your portfolio?
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Create your professional portfolio from your
            existing resume.
          </p>

          <Link
            href="/register"
            className="mt-8 inline-block rounded-lg bg-foreground px-6 py-3 text-sm font-semibold text-background transition hover:opacity-90"
          >
            Get Started →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} AI Resume Portfolio
          </p>
        </div>
      </footer>
    </main>
  );
}

/* =========================================================
   FEATURE
========================================================= */

function Feature({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border p-6">
      <h3 className="text-xl font-semibold">
        {title}
      </h3>

      <p className="mt-3 leading-7 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

/* =========================================================
   STEP
========================================================= */

function Step({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-muted-foreground">
        {number}
      </p>

      <h3 className="mt-2 text-xl font-semibold">
        {title}
      </h3>

      <p className="mt-3 leading-7 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}