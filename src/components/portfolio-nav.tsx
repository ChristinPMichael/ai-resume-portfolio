"use client";

import { useState } from "react";

const links = [
  { href: "#about", label: "About" },
  { href: "#skills", label: "Skills" },
  { href: "#projects", label: "Projects" },
  { href: "#experience", label: "Experience" },
  { href: "#education", label: "Education" },
  { href: "#contact", label: "Contact" },
];

export default function PortfolioNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop navigation */}
      <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="transition-colors hover:text-foreground"
          >
            {link.label}
          </a>
        ))}
      </nav>

      {/* Mobile navigation */}
      <div className="relative md:hidden">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-label="Toggle navigation"
          aria-expanded={open}
          className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
        >
          {open ? "Close" : "Menu"}
        </button>

        {open && (
          <div className="absolute right-0 top-12 z-50 w-56 rounded-xl border bg-background p-2 shadow-lg">
            <nav className="flex flex-col">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-4 py-3 text-sm font-medium transition-colors hover:bg-muted"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>
        )}
      </div>
    </>
  );
}