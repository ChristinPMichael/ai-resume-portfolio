"use client";

import Link from "next/link";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    e: React.FormEvent,
  ) {
    e.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    const { error } =
      await authClient.requestPasswordReset({
        email,
        redirectTo: "/reset-password",
      });

    setLoading(false);

    if (error) {
      setError(
        error.message ||
          "Failed to send password reset email.",
      );
      return;
    }

    setSuccess(
      "If an account exists with this email, a password reset link has been sent.",
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-md">

        <Link
          href="/login"
          className="text-sm text-muted-foreground hover:text-foreground hover:underline"
        >
          ← Back to login
        </Link>

        <h1 className="mt-6 text-3xl font-bold">
          Forgot your password?
        </h1>

        <p className="mt-2 text-muted-foreground">
          Enter your email and we'll send you a
          password reset link.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-4"
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

          {error && (
            <p className="text-sm text-red-500">
              {error}
            </p>
          )}

          {success && (
            <p className="text-sm text-green-600">
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-black px-4 py-3 font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black"
          >
            {loading
              ? "Sending..."
              : "Send reset link"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Remember your password?{" "}
          <Link
            href="/login"
            className="font-medium text-foreground hover:underline"
          >
            Sign in
          </Link>
        </p>

      </div>
    </main>
  );
}