import Link from "next/link";

import { db } from "@/db";
import { portfolioProfiles } from "@/db/schema";

import { auth } from "@/lib/auth";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { eq } from "drizzle-orm";

import ThemeSelector from "./theme-selector";

type ThemeName =
  | "minimal"
  | "developer"
  | "modern";

type AccentName =
  | "default"
  | "blue"
  | "purple"
  | "green"
  | "orange";

export default async function EditThemePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const [portfolio] = await db
    .select({
      id: portfolioProfiles.id,
      username: portfolioProfiles.username,
      fullName: portfolioProfiles.fullName,
      theme: portfolioProfiles.theme,
      accentColor:
        portfolioProfiles.accentColor,
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

  const initialTheme: ThemeName =
    portfolio.theme === "developer" ||
    portfolio.theme === "modern"
      ? portfolio.theme
      : "minimal";

  const initialAccent: AccentName =
    portfolio.accentColor === "blue" ||
    portfolio.accentColor === "purple" ||
    portfolio.accentColor === "green" ||
    portfolio.accentColor === "orange"
      ? portfolio.accentColor
      : "default";

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl">

        <Link
          href="/dashboard/portfolio/edit"
          className="text-sm text-muted-foreground transition hover:text-foreground"
        >
          ← Back to Portfolio
        </Link>

        <div className="mt-6">
          <p className="text-sm font-medium text-muted-foreground">
            Portfolio Customization
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Choose Your Theme
          </h1>

          <p className="mt-2 max-w-2xl text-muted-foreground">
            Customize the appearance of your
            public portfolio.
          </p>
        </div>

        <div className="mt-8">
          <ThemeSelector
            portfolioId={portfolio.id}
            username={portfolio.username}
            initialTheme={initialTheme}
            initialAccent={initialAccent}
          />
        </div>
      </div>
    </main>
  );
}