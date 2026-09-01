"use client";

import { useState } from "react";
import { ThemePreview } from "./theme-preview";

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

type Props = {
  portfolioId: string;
  username: string;
  initialTheme: ThemeName;
  initialAccent: AccentName;
};

const themes: {
  value: ThemeName;
  title: string;
  description: string;
}[] = [
  {
    value: "minimal",
    title: "Minimal",
    description:
      "Clean, simple and professional.",
  },
  {
    value: "developer",
    title: "Developer",
    description:
      "Technical, bold and developer-focused.",
  },
  {
    value: "modern",
    title: "Modern",
    description:
      "Contemporary with strong visual sections.",
  },
];

const accents: {
  value: AccentName;
  title: string;
  color: string;
}[] = [
  {
    value: "default",
    title: "Default",
    color: "bg-foreground",
  },
  {
    value: "blue",
    title: "Blue",
    color: "bg-blue-500",
  },
  {
    value: "purple",
    title: "Purple",
    color: "bg-purple-500",
  },
  {
    value: "green",
    title: "Green",
    color: "bg-green-500",
  },
  {
    value: "orange",
    title: "Orange",
    color: "bg-orange-500",
  },
];

export default function ThemeSelector({
  portfolioId,
  username,
  initialTheme,
  initialAccent,
}: Props) {
  const [theme, setTheme] =
    useState<ThemeName>(initialTheme);

  const [accentColor, setAccentColor] =
    useState<AccentName>(initialAccent);

  return (
    <div className="space-y-8">
      {/* =========================================
          THEME SELECTION
      ========================================== */}

      <section className="rounded-2xl border p-6">
        <div>
          <h2 className="text-lg font-semibold">
            Portfolio Style
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Select the visual style for your
            portfolio.
          </p>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {themes.map((item) => (
            <label
              key={item.value}
              className="cursor-pointer"
            >
              <input
                type="radio"
                name="theme"
                value={item.value}
                checked={theme === item.value}
                onChange={() =>
                  setTheme(item.value)
                }
                className="peer sr-only"
              />

              <div
                className={`rounded-2xl border-2 p-5 transition-all hover:-translate-y-1 hover:shadow-md ${
                  theme === item.value
                    ? "border-foreground ring-2 ring-foreground/10"
                    : "border-border"
                }`}
              >
                {/* Preview thumbnail */}

                {item.value === "minimal" && (
                  <div className="rounded-xl border p-4">
                    <div className="h-3 w-20 rounded bg-foreground" />

                    <div className="mt-4 h-2 w-full rounded bg-muted" />

                    <div className="mt-2 h-2 w-3/4 rounded bg-muted" />

                    <div className="mt-5 grid grid-cols-2 gap-2">
                      <div className="h-12 rounded-lg bg-muted" />
                      <div className="h-12 rounded-lg bg-muted" />
                    </div>
                  </div>
                )}

                {item.value === "developer" && (
                  <div className="rounded-xl border bg-muted/30 p-4 font-mono">
                    <div className="text-xs text-muted-foreground">
                      {"<developer>"}
                    </div>

                    <div className="mt-3 h-3 w-24 rounded bg-foreground" />

                    <div className="mt-3 h-2 w-full rounded bg-muted" />

                    <div className="mt-2 h-2 w-2/3 rounded bg-muted" />

                    <div className="mt-4 flex gap-2">
                      <div className="h-6 w-12 rounded bg-foreground/20" />
                      <div className="h-6 w-16 rounded bg-foreground/20" />
                    </div>
                  </div>
                )}

                {item.value === "modern" && (
                  <div className="overflow-hidden rounded-xl border">
                    <div className="h-8 bg-foreground" />

                    <div className="p-3">
                      <div className="h-3 w-24 rounded bg-foreground" />

                      <div className="mt-3 h-2 w-full rounded bg-muted" />

                      <div className="mt-2 h-2 w-3/4 rounded bg-muted" />

                      <div className="mt-4 h-12 rounded-lg bg-muted" />
                    </div>
                  </div>
                )}

                <h3 className="mt-4 font-semibold">
                  {item.title}
                </h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </label>
          ))}
        </div>
      </section>

      {/* =========================================
          ACCENT COLOR
      ========================================== */}

      <section className="rounded-2xl border p-6">
        <div>
          <h2 className="text-lg font-semibold">
            Accent Color
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Choose the accent used throughout
            your portfolio.
          </p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-5">
          {accents.map((item) => (
            <label
              key={item.value}
              className="cursor-pointer"
            >
              <input
                type="radio"
                name="accentColor"
                value={item.value}
                checked={
                  accentColor === item.value
                }
                onChange={() =>
                  setAccentColor(item.value)
                }
                className="peer sr-only"
              />

              <div
                className={`flex items-center gap-3 rounded-xl border-2 p-3 transition ${
                  accentColor === item.value
                    ? "border-foreground ring-2 ring-foreground/10"
                    : "border-border"
                }`}
              >
                <span
                  className={`h-6 w-6 rounded-full ${item.color}`}
                />

                <span className="text-sm font-medium">
                  {item.title}
                </span>
              </div>
            </label>
          ))}
        </div>
      </section>

      {/* =========================================
          LIVE PREVIEW
      ========================================== */}

      <section>
        <div className="mb-5">
          <h2 className="text-xl font-semibold">
            Live Preview
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Changes appear immediately.
          </p>
        </div>

        <ThemePreview
          theme={theme}
          accentColor={accentColor}
        />
      </section>

      {/* =========================================
          ACTIONS
      ========================================== */}

      <form
        action="/api/portfolio/theme"
        method="POST"
        className="flex flex-col gap-3 sm:flex-row"
      >
        <input
          type="hidden"
          name="portfolioId"
          value={portfolioId}
        />

        <input
          type="hidden"
          name="theme"
          value={theme}
        />

        <input
          type="hidden"
          name="accentColor"
          value={accentColor}
        />

        <button
          type="submit"
          className="rounded-xl bg-foreground px-6 py-3 text-sm font-semibold text-background transition hover:opacity-90"
        >
          Save Theme
        </button>

        <a
          href={`/portfolio/${username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl border px-6 py-3 text-center text-sm font-semibold transition hover:bg-muted"
        >
          Preview Portfolio ↗
        </a>
      </form>
    </div>
  );
}