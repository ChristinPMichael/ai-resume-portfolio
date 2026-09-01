"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";
import ThemeToggle from "@/components/theme-toggle";

export default function ResetPasswordForm() {
  const searchParams = useSearchParams();

  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    e: React.FormEvent,
  ) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!token) {
      setError(
        "Invalid or missing password reset link.",
      );
      return;
    }

    if (password.length < 8) {
      setError(
        "Password must be at least 8 characters.",
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { error } =
      await authClient.resetPassword({
        newPassword: password,
        token,
      });

    setLoading(false);

    if (error) {
      setError(
        error.message ||
          "Failed to reset password.",
      );
      return;
    }

    setSuccess(
      "Your password has been reset successfully.",
    );

    setPassword("");
    setConfirmPassword("");
  }

  return (
    <main className="min-h-screen bg-background px-6 text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-md items-center">
        <div className="w-full">

          {/* Theme Toggle */}

          <div className="mb-6 flex justify-end">
            <ThemeToggle />
          </div>

          {/* Back to Login */}

          <Link
            href="/login"
            className="text-sm text-muted-foreground transition hover:text-foreground hover:underline"
          >
            ← Back to login
          </Link>

          {/* Header */}

          <h1 className="mt-6 text-3xl font-bold">
            Reset your password
          </h1>

          <p className="mt-2 text-muted-foreground">
            Enter a new password for your account.
          </p>

          {!success ? (
            <form
              onSubmit={handleSubmit}
              className="mt-8 space-y-4"
            >

              {/* New Password */}

              <input
                type="password"
                placeholder="New password"
                className="w-full rounded-md border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-ring"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                required
                minLength={8}
              />

              {/* Confirm Password */}

              <input
                type="password"
                placeholder="Confirm new password"
                className="w-full rounded-md border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-ring"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                required
                minLength={8}
              />

              {/* Error */}

              {error && (
                <p className="text-sm text-red-500">
                  {error}
                </p>
              )}

              {/* Submit */}

              <button
                type="submit"
                disabled={loading || !token}
                className="w-full rounded-md bg-black px-4 py-3 font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black"
              >
                {loading
                  ? "Resetting password..."
                  : "Reset password"}
              </button>
            </form>
          ) : (
            <div className="mt-8 space-y-4">

              {/* Success */}

              <p className="rounded-md border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-600 dark:text-green-400">
                {success}
              </p>

              <Link
                href="/login"
                className="block w-full rounded-md bg-black px-4 py-3 text-center font-medium text-white transition hover:opacity-90 dark:bg-white dark:text-black"
              >
                Continue to login
              </Link>

            </div>
          )}

        </div>
      </div>
    </main>
  );
}