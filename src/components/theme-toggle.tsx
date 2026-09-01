"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        type="button"
        className="flex h-10 w-10 items-center justify-center rounded-lg border"
        aria-label="Theme"
      >
        <Sun className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1 rounded-lg border p-1">
      <button
        type="button"
        onClick={() => setTheme("light")}
        className={`flex h-9 w-9 items-center justify-center rounded-md ${
          theme === "light"
            ? "bg-muted"
            : "hover:bg-muted"
        }`}
        aria-label="Light mode"
        title="Light mode"
      >
        <Sun className="h-5 w-5" />
      </button>

      <button
        type="button"
        onClick={() => setTheme("dark")}
        className={`flex h-9 w-9 items-center justify-center rounded-md ${
          theme === "dark"
            ? "bg-muted"
            : "hover:bg-muted"
        }`}
        aria-label="Dark mode"
        title="Dark mode"
      >
        <Moon className="h-5 w-5" />
      </button>

      <button
        type="button"
        onClick={() => setTheme("system")}
        className={`flex h-9 w-9 items-center justify-center rounded-md ${
          theme === "system"
            ? "bg-muted"
            : "hover:bg-muted"
        }`}
        aria-label="System theme"
        title="System theme"
      >
        <Monitor className="h-5 w-5" />
      </button>
    </div>
  );
}