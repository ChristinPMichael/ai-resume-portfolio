"use client";

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

type ThemePreviewProps = {
  theme: ThemeName;
  accentColor: AccentName;
};

const accents: Record<
  AccentName,
  {
    button: string;
    text: string;
    border: string;
    soft: string;
  }
> = {
  default: {
    button: "bg-black text-white",
    text: "text-black",
    border: "border-black",
    soft: "bg-gray-100",
  },
  blue: {
    button: "bg-blue-600 text-white",
    text: "text-blue-600",
    border: "border-blue-600",
    soft: "bg-blue-50",
  },
  purple: {
    button: "bg-purple-600 text-white",
    text: "text-purple-600",
    border: "border-purple-600",
    soft: "bg-purple-50",
  },
  green: {
    button: "bg-green-600 text-white",
    text: "text-green-600",
    border: "border-green-600",
    soft: "bg-green-50",
  },
  orange: {
    button: "bg-orange-600 text-white",
    text: "text-orange-600",
    border: "border-orange-600",
    soft: "bg-orange-50",
  },
};

export function ThemePreview({
  theme,
  accentColor,
}: ThemePreviewProps) {
  const accent =
    accents[accentColor] || accents.default;

  const developer = theme === "developer";
  const modern = theme === "modern";

  return (
    <div
      className={`overflow-hidden rounded-2xl border bg-background text-foreground shadow-sm ${
        developer ? "font-mono" : ""
      }`}
    >
      {/* Browser bar */}
      <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-400" />

        <div className="ml-4 flex-1 rounded-md border bg-background px-3 py-1.5 text-xs text-muted-foreground">
          yourportfolio.com
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div
          className={`font-semibold ${
            accentColor !== "default"
              ? accent.text
              : ""
          }`}
        >
          Christin P. Michael
        </div>

        <div className="hidden gap-4 text-xs text-muted-foreground sm:flex">
          <span>About</span>
          <span>Skills</span>
          <span>Projects</span>
          <span>Experience</span>
        </div>
      </div>

      {/* Hero */}
      <div
        className={`px-6 ${
          modern
            ? "py-20 bg-muted/20"
            : "py-14"
        }`}
      >
        <p
          className={`text-xs font-semibold uppercase tracking-widest text-muted-foreground ${
            developer
              ? "normal-case tracking-normal"
              : ""
          }`}
        >
          {developer
            ? "// developer portfolio"
            : "Developer Portfolio"}
        </p>

        <h2
          className={`mt-3 font-bold tracking-tight ${
            modern
              ? "text-4xl sm:text-5xl"
              : "text-3xl sm:text-4xl"
          }`}
        >
          Christin P. Michael
        </h2>

        <p
          className={`mt-3 max-w-xl text-sm leading-6 text-muted-foreground ${
            modern ? "text-base" : ""
          }`}
        >
          Full Stack Developer & AI Engineer
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            className={`rounded-lg px-4 py-2 text-xs font-semibold ${
              accent.button
            } ${
              developer ? "rounded-none" : ""
            }`}
          >
            View Projects →
          </button>

          <button
            type="button"
            className={`rounded-lg border px-4 py-2 text-xs font-semibold ${
              developer
                ? "rounded-none border-dashed"
                : ""
            }`}
          >
            Download Resume
          </button>
        </div>
      </div>

      {/* Skills */}
      <div className="border-t px-6 py-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {developer
            ? "// skills"
            : "Skills"}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {[
            "Python",
            "JavaScript",
            "React",
            "Next.js",
            "AI",
            "PostgreSQL",
          ].map((skill) => (
            <span
              key={skill}
              className={`rounded-full border px-3 py-1.5 text-xs ${
                accentColor !== "default"
                  ? accent.text
                  : ""
              }`}
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Project */}
      <div
        className={`border-t px-6 py-8 ${
          modern ? accent.soft : ""
        }`}
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {developer
            ? "// featured project"
            : "Featured Project"}
        </p>

        <div
          className={`mt-4 rounded-xl border p-5 ${
            developer
              ? "rounded-none border-dashed"
              : ""
          }`}
        >
          <h3 className="font-semibold">
            AI Resume Portfolio
          </h3>

          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            An AI-powered platform that transforms
            resumes into professional portfolios.
          </p>

          <button
            type="button"
            className={`mt-4 text-xs font-semibold ${
              accent.text
            }`}
          >
            View Project →
          </button>
        </div>
      </div>

      {/* Theme indicator */}
      <div className="border-t px-6 py-4 text-center text-[11px] text-muted-foreground">
        Previewing{" "}
        <span className={`font-semibold ${accent.text}`}>
          {theme}
        </span>{" "}
        theme ·{" "}
        <span className={`font-semibold ${accent.text}`}>
          {accentColor}
        </span>{" "}
        accent
      </div>
    </div>
  );
}