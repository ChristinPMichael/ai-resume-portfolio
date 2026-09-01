import ContactForm from "./contact-form";

import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Home } from "lucide-react";

import PortfolioNav from "@/components/portfolio-nav";
import { getPortfolioData } from "@/lib/portfolio-cache";

type Props = {
  params: Promise<{
    username: string;
  }>;
};

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

/* =========================================================
   ACCENT STYLES
========================================================= */

const accentStyles: Record<
  AccentName,
  {
    text: string;
    bg: string;
    border: string;
    soft: string;
  }
> = {
  default: {
    text: "text-foreground",
    bg: "bg-foreground",
    border: "border-foreground",
    soft: "bg-muted",
  },

  blue: {
    text: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-600",
    border: "border-blue-600",
    soft: "bg-blue-50 dark:bg-blue-950/30",
  },

  purple: {
    text: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-600",
    border: "border-purple-600",
    soft: "bg-purple-50 dark:bg-purple-950/30",
  },

  green: {
    text: "text-green-600 dark:text-green-400",
    bg: "bg-green-600",
    border: "border-green-600",
    soft: "bg-green-50 dark:bg-green-950/30",
  },

  orange: {
    text: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-600",
    border: "border-orange-600",
    soft: "bg-orange-50 dark:bg-orange-950/30",
  },
};

/* =========================================================
   HELPERS
========================================================= */

function getTheme(
  value: string | null,
): ThemeName {
  if (
    value === "developer" ||
    value === "modern"
  ) {
    return value;
  }

  return "minimal";
}

function getAccent(
  value: string | null,
): AccentName {
  if (
    value === "blue" ||
    value === "purple" ||
    value === "green" ||
    value === "orange"
  ) {
    return value;
  }

  return "default";
}

/* =========================================================
   SEO
========================================================= */

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { username } = await params;

  const data =
    await getPortfolioData(username);

  if (!data) {
    return {
      title: "Portfolio Not Found",
      description:
        "The requested portfolio could not be found.",
    };
  }

  const { portfolio } = data;

  const name =
    portfolio.fullName ||
    "Developer";

  const description =
    portfolio.headline ||
    portfolio.bio ||
    `${name}'s professional portfolio.`;

  return {
    title: `${name} | Portfolio`,

    description,

    openGraph: {
      title: `${name} | Portfolio`,
      description,
      type: "website",
    },

    twitter: {
      card: "summary",
      title: `${name} | Portfolio`,
      description,
    },

    robots: {
      index: true,
      follow: true,
    },
  };
}

/* =========================================================
   PORTFOLIO PAGE
========================================================= */

export default async function PortfolioPage({
  params,
}: Props) {
  const { username } = await params;

  const data =
    await getPortfolioData(username);

  if (!data) {
    notFound();
  }

  const {
    portfolio,
    profileSkills,
    profileProjects,
    profileExperiences,
    profileEducation,
  } = data;

  /* =======================================================
     THEME
  ======================================================= */

  const theme = getTheme(
    portfolio.theme,
  );

  const accentColor = getAccent(
    portfolio.accentColor,
  );

  const accent =
    accentStyles[accentColor];

  const isDeveloper =
    theme === "developer";

  const isModern =
    theme === "modern";

  /* =======================================================
     GROUP SKILLS
  ======================================================= */

  const groupedSkills =
    profileSkills.reduce(
      (groups, skill) => {
        const category =
          skill.category?.trim() ||
          "Other";

        if (!groups[category]) {
          groups[category] = [];
        }

        groups[category].push(skill);

        return groups;
      },
      {} as Record<
        string,
        typeof profileSkills
      >,
    );

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <main
      className={`min-h-screen bg-background text-foreground ${
        isDeveloper
          ? "font-mono"
          : ""
      }`}
    >
      {/* ===================================================
          HEADER
      =================================================== */}

      <header
        className={`border-b ${
          isModern
            ? "sticky top-0 z-40 bg-background/90 backdrop-blur"
            : ""
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">

          {/* Dashboard Home */}

          <Link
            href="/dashboard"
            aria-label="Dashboard"
            title="Dashboard"
            className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full border bg-background/90 shadow-sm backdrop-blur transition hover:bg-muted"
          >
            <Home className="h-5 w-5" />
          </Link>

          {/* Portfolio Name */}

          <Link
            href={`/portfolio/${portfolio.username}`}
            className={`font-semibold tracking-tight ${accent.text}`}
          >
            {isDeveloper
              ? `~/ ${
                  portfolio.fullName ||
                  "portfolio"
                }`
              : portfolio.fullName ||
                "Portfolio"}
          </Link>

          <PortfolioNav />

        </div>
      </header>

      {/* ===================================================
          HERO
      =================================================== */}

      <section
        className={`border-b ${
          isModern
            ? accent.soft
            : ""
        }`}
      >
        <div
          className={`mx-auto max-w-6xl px-6 ${
            isModern
              ? "py-28"
              : "py-20 md:py-28"
          }`}
        >
          <div className="max-w-4xl">

            <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {isDeveloper
                ? "// developer portfolio"
                : "Developer Portfolio"}
            </p>

            <h1
              className={`font-bold tracking-tight ${
                isModern
                  ? "text-5xl md:text-7xl"
                  : "text-4xl sm:text-5xl md:text-6xl"
              }`}
            >
              {portfolio.fullName ||
                "Developer"}
            </h1>

            {portfolio.headline && (
              <p
                className={`mt-5 max-w-3xl leading-8 text-muted-foreground ${
                  isModern
                    ? "text-2xl"
                    : "text-xl"
                }`}
              >
                {portfolio.headline}
              </p>
            )}

            {portfolio.location && (
              <p className="mt-4 text-sm text-muted-foreground">
                📍 {portfolio.location}
              </p>
            )}

            {portfolio.bio && (
              <p className="mt-8 max-w-3xl whitespace-pre-line text-base leading-7 text-muted-foreground">
                {portfolio.bio}
              </p>
            )}

            {/* Buttons */}

            <div className="mt-8 flex flex-wrap gap-3">

              {portfolio.githubUrl && (
                <a
                  href={portfolio.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`rounded-lg border px-5 py-3 text-sm font-medium transition hover:bg-muted ${
                    isDeveloper
                      ? "rounded-none border-dashed"
                      : ""
                  }`}
                >
                  GitHub ↗️
                </a>
              )}

              {portfolio.linkedinUrl && (
                <a
                  href={portfolio.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`rounded-lg border px-5 py-3 text-sm font-medium transition hover:bg-muted ${
                    isDeveloper
                      ? "rounded-none border-dashed"
                      : ""
                  }`}
                >
                  LinkedIn ↗️
                </a>
              )}

              {portfolio.websiteUrl && (
                <a
                  href={portfolio.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`rounded-lg border px-5 py-3 text-sm font-medium transition hover:bg-muted ${
                    isDeveloper
                      ? "rounded-none border-dashed"
                      : ""
                  }`}
                >
                  Website ↗️
                </a>
              )}

              {/* Download Resume */}

              <a
                href={`/api/resume/download?userId=${portfolio.userId}`}
                className={`rounded-lg px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 ${accent.bg} ${
                  isDeveloper
                    ? "rounded-none"
                    : ""
                }`}
              >
                Download Resume
              </a>

            </div>
          </div>
        </div>
      </section>

      {/* ===================================================
          ABOUT
      =================================================== */}

      {portfolio.bio && (
        <section
          id="about"
          className="border-b"
        >
          <div className="mx-auto max-w-6xl px-6 py-16">

            <p
              className={`text-sm font-semibold uppercase tracking-wider ${accent.text}`}
            >
              {isDeveloper
                ? "// about"
                : "About"}
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              About Me
            </h2>

            <p className="mt-6 max-w-4xl whitespace-pre-line text-lg leading-8 text-muted-foreground">
              {portfolio.bio}
            </p>

          </div>
        </section>
      )}

      {/* ===================================================
          SKILLS
      =================================================== */}

      {profileSkills.length > 0 && (
        <section
          id="skills"
          className="border-b"
        >
          <div className="mx-auto max-w-6xl px-6 py-16">

            <p
              className={`text-sm font-semibold uppercase tracking-wider ${accent.text}`}
            >
              {isDeveloper
                ? "// skills"
                : "Skills"}
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              Technologies & Skills
            </h2>

            <div className="mt-8 grid gap-6 md:grid-cols-2">

              {Object.entries(
                groupedSkills,
              ).map(
                ([
                  category,
                  categorySkills,
                ]) => (
                  <div
                    key={category}
                    className={`rounded-2xl border p-6 ${
                      isDeveloper
                        ? "rounded-none border-dashed"
                        : ""
                    }`}
                  >
                    <h3 className="font-semibold">
                      {category}
                    </h3>

                    <div className="mt-4 flex flex-wrap gap-2">

                      {categorySkills.map(
                        (skill) => (
                          <span
                            key={skill.id}
                            className={`rounded-full border px-3 py-1.5 text-sm ${accent.text}`}
                          >
                            {skill.name}
                          </span>
                        ),
                      )}

                    </div>
                  </div>
                ),
              )}

            </div>
          </div>
        </section>
      )}

      {/* ===================================================
          PROJECTS
      =================================================== */}

      {profileProjects.length > 0 && (
        <section
          id="projects"
          className="border-b"
        >
          <div className="mx-auto max-w-6xl px-6 py-16">

            <p
              className={`text-sm font-semibold uppercase tracking-wider ${accent.text}`}
            >
              {isDeveloper
                ? "// projects"
                : "Projects"}
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              Featured Projects
            </h2>

            <div className="mt-8 grid gap-6 md:grid-cols-2">

              {profileProjects.map(
                (project) => (
                  <article
                    key={project.id}
                    className={`flex flex-col rounded-2xl border p-6 transition hover:-translate-y-1 hover:shadow-lg ${
                      isDeveloper
                        ? "rounded-none border-dashed"
                        : ""
                    } ${
                      isModern
                        ? accent.soft
                        : ""
                    }`}
                  >

                    <h3 className="text-xl font-semibold">
                      {project.name}
                    </h3>

                    {project.description && (
                      <p className="mt-3 flex-1 whitespace-pre-line leading-7 text-muted-foreground">
                        {project.description}
                      </p>
                    )}

                    {project.technologies && (
                      <div className="mt-5">

                        <p
                          className={`text-xs font-semibold uppercase tracking-wider ${accent.text}`}
                        >
                          Technologies
                        </p>

                        <p className="mt-2 text-sm">
                          {project.technologies}
                        </p>

                      </div>
                    )}

                    <div className="mt-6 flex flex-wrap gap-3">

                      {project.projectUrl && (
                        <a
                          href={project.projectUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${accent.bg} ${
                            isDeveloper
                              ? "rounded-none"
                              : ""
                          }`}
                        >
                          Live Project ↗️
                        </a>
                      )}

                      {project.githubUrl && (
                        <a
                          href={project.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-muted"
                        >
                          GitHub ↗️
                        </a>
                      )}

                    </div>
                  </article>
                ),
              )}

            </div>
          </div>
        </section>
      )}

      {/* ===================================================
          EXPERIENCE
      =================================================== */}

      {profileExperiences.length > 0 && (
        <section
          id="experience"
          className="border-b"
        >
          <div className="mx-auto max-w-6xl px-6 py-16">

            <p
              className={`text-sm font-semibold uppercase tracking-wider ${accent.text}`}
            >
              {isDeveloper
                ? "// experience"
                : "Experience"}
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              Work Experience
            </h2>

            <div className="mt-10 space-y-8">

              {profileExperiences.map(
                (experience) => (
                  <article
                    key={experience.id}
                    className={`relative border-l-2 pl-6 ${
                      isDeveloper
                        ? "border-dashed"
                        : ""
                    }`}
                  >

                    <div
                      className={`absolute -left-[7px] top-1 h-3 w-3 rounded-full ${accent.bg}`}
                    />

                    <div className="flex flex-col justify-between gap-2 sm:flex-row">

                      <div>

                        <h3 className="text-xl font-semibold">
                          {experience.role}
                        </h3>

                        <p className="mt-1 font-medium text-muted-foreground">
                          {experience.company}
                        </p>

                      </div>

                      {(experience.startDate ||
                        experience.endDate) && (
                        <p className="text-sm text-muted-foreground">

                          {experience.startDate ||
                            ""}

                          {experience.startDate &&
                          experience.endDate
                            ? " — "
                            : ""}

                          {experience.endDate ||
                            ""}

                        </p>
                      )}

                    </div>

                    {experience.description && (
                      <p className="mt-4 whitespace-pre-line leading-7 text-muted-foreground">
                        {experience.description}
                      </p>
                    )}

                  </article>
                ),
              )}

            </div>
          </div>
        </section>
      )}

      {/* ===================================================
          EDUCATION
      =================================================== */}

      {profileEducation.length > 0 && (
        <section
          id="education"
          className="border-b"
        >
          <div className="mx-auto max-w-6xl px-6 py-16">

            <p
              className={`text-sm font-semibold uppercase tracking-wider ${accent.text}`}
            >
              {isDeveloper
                ? "// education"
                : "Education"}
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              Education
            </h2>

            <div className="mt-8 grid gap-6 md:grid-cols-2">

              {profileEducation.map(
                (item) => (
                  <article
                    key={item.id}
                    className={`rounded-2xl border p-6 ${
                      isDeveloper
                        ? "rounded-none border-dashed"
                        : ""
                    }`}
                  >

                    <h3 className="text-xl font-semibold">
                      {item.degree ||
                        "Education"}
                    </h3>

                    {item.fieldOfStudy && (
                      <p className="mt-2 text-muted-foreground">
                        {item.fieldOfStudy}
                      </p>
                    )}

                    <p className="mt-4 font-medium">
                      {item.institution}
                    </p>

                    {(item.startYear ||
                      item.endYear) && (
                      <p
                        className={`mt-2 text-sm ${accent.text}`}
                      >

                        {item.startYear ||
                          ""}

                        {item.startYear &&
                        item.endYear
                          ? " — "
                          : ""}

                        {item.endYear ||
                          ""}

                      </p>
                    )}

                  </article>
                ),
              )}

            </div>
          </div>
        </section>
      )}

      {/* ===================================================
          CONTACT
      =================================================== */}

      <section
        id="contact"
        className="border-b"
      >
        <div className="mx-auto max-w-6xl px-6 py-16">

          <p
            className={`text-sm font-semibold uppercase tracking-wider ${accent.text}`}
          >
            {isDeveloper
              ? "// contact"
              : "Contact"}
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            Let's Work Together
          </h2>

          <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">
            Have an opportunity, project, or
            question? Send me a message.
          </p>

          <ContactForm
            username={portfolio.username}
          />

        </div>
      </section>

      {/* ===================================================
          FOOTER
      =================================================== */}

      <footer>
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">

          <p>
            ©{" "}
            {new Date().getFullYear()}{" "}
            {portfolio.fullName ||
              "Portfolio"}
          </p>

          <p>
            Built with{" "}
            <span className={accent.text}>
              AI Resume Portfolio
            </span>
          </p>

        </div>
      </footer>

    </main>
  );
}