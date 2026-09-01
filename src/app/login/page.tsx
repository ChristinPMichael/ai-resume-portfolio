"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setLoading(true);

    const { error } = await authClient.signIn.email({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(
        error.message || "Invalid email or password",
      );
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function handleGoogleLogin() {
    setError("");
    setGoogleLoading(true);

    const { error } =
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      });

    if (error) {
      setGoogleLoading(false);

      setError(
        error.message ||
          "Failed to sign in with Google",
      );
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-md">

        {/* Header */}

        <h1 className="text-3xl font-bold">
          Welcome back
        </h1>

        <p className="mt-2 text-muted-foreground">
          Sign in to continue building your portfolio.
        </p>

        {/* Google Login */}

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading || loading}
          className="mt-8 flex w-full items-center justify-center gap-3 rounded-md border bg-background px-4 py-3 font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          {googleLoading ? (
            "Connecting to Google..."
          ) : (
            <>
              <GoogleIcon />
              Continue with Google
            </>
          )}
        </button>

        {/* Divider */}

        <div className="my-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-border" />

          <span className="text-sm text-muted-foreground">
            OR
          </span>

          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Email Login */}

        <form
          onSubmit={handleLogin}
          className="space-y-4"
        >
          <input
            type="email"
            placeholder="Email"
            className="w-full rounded-md border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-ring"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            required
          />

          <div>
            <input
              type="password"
              placeholder="Password"
              className="w-full rounded-md border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-ring"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              required
            />

            {/* Forgot Password */}

            <div className="mt-2 flex justify-end">
              <Link
                href="/forgot-password"
                className="text-sm text-muted-foreground transition hover:text-foreground hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          {/* Error */}

          {error && (
            <p className="text-sm text-red-500">
              {error}
            </p>
          )}

          {/* Sign In */}

          <button
            type="submit"
            disabled={
              loading || googleLoading
            }
            className="w-full rounded-md bg-black px-4 py-3 font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black"
          >
            {loading
              ? "Signing in..."
              : "Sign in"}
          </button>
        </form>

        {/* Register */}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-foreground hover:underline"
          >
            Create account
          </Link>
        </p>

      </div>
    </main>
  );
}

/* =====================================================
   GOOGLE ICON
===================================================== */

function GoogleIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M21.35 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.23a4.47 4.47 0 0 1-1.94 2.93v2.43h3.14c1.84-1.69 2.92-4.18 2.92-7.19Z"
      />

      <path
        fill="#34A853"
        d="M12 21.75c2.63 0 4.84-.87 6.45-2.36l-3.14-2.43c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.29v2.51A9.74 9.74 0 0 0 12 21.75Z"
      />

      <path
        fill="#FBBC05"
        d="M6.54 13.85A5.86 5.86 0 0 1 6.23 12c0-.64.11-1.27.31-1.85V7.64H3.29A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.05 1.04 4.36l3.25-2.51Z"
      />

      <path
        fill="#EA4335"
        d="M12 6.12c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.17 14.63 2.25 12 2.25a9.74 9.74 0 0 0-8.71 5.39l3.25 2.51C7.31 7.84 9.46 6.12 12 6.12Z"
      />
    </svg>
  );
}