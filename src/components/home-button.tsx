import Link from "next/link";
import { Home } from "lucide-react";

export default function HomeButton() {
  return (
    <Link
      href="/"
      aria-label="Home"
      className="fixed left-4 top-4 z-50 inline-flex items-center gap-2 rounded-lg border bg-background/90 px-3 py-2 text-sm font-medium shadow-sm backdrop-blur transition hover:bg-muted"
    >
      <Home className="h-4 w-4" />
      <span className="hidden sm:inline">
        Home
      </span>
    </Link>
  );
}