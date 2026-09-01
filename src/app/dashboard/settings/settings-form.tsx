"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";

type Props = {
  name: string;
  email: string;
};

export default function SettingsForm({
  name: initialName,
  email,
}: Props) {
  const router = useRouter();

  const [name, setName] = useState(initialName);

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [profileLoading, setProfileLoading] =
    useState(false);

  const [passwordLoading, setPasswordLoading] =
    useState(false);

  const [deleteLoading, setDeleteLoading] =
    useState(false);

  const [profileError, setProfileError] =
    useState("");

  const [profileSuccess, setProfileSuccess] =
    useState("");

  const [passwordError, setPasswordError] =
    useState("");

  const [passwordSuccess, setPasswordSuccess] =
    useState("");

  const [deleteError, setDeleteError] =
    useState("");

  const [deleteConfirm, setDeleteConfirm] =
    useState("");

  /* =====================================================
     PROFILE UPDATE
  ===================================================== */

  async function handleProfileUpdate(
    e: React.FormEvent,
  ) {
    e.preventDefault();

    setProfileError("");
    setProfileSuccess("");

    const trimmedName = name.trim();

    if (!trimmedName) {
      setProfileError("Name cannot be empty.");
      return;
    }

    setProfileLoading(true);

    const { error } =
      await authClient.updateUser({
        name: trimmedName,
      });

    setProfileLoading(false);

    if (error) {
      setProfileError(
        error.message ||
          "Failed to update profile.",
      );
      return;
    }

    setProfileSuccess(
      "Profile updated successfully.",
    );

    router.refresh();
  }

  /* =====================================================
     PASSWORD CHANGE
  ===================================================== */

  async function handlePasswordChange(
    e: React.FormEvent,
  ) {
    e.preventDefault();

    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword.length < 8) {
      setPasswordError(
        "New password must be at least 8 characters.",
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(
        "New passwords do not match.",
      );
      return;
    }

    setPasswordLoading(true);

    const { error } =
      await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });

    setPasswordLoading(false);

    if (error) {
      setPasswordError(
        error.message ||
          "Failed to change password.",
      );
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");

    setPasswordSuccess(
      "Password changed successfully. Other sessions have been signed out.",
    );
  }

  /* =====================================================
     DELETE ACCOUNT
  ===================================================== */

  async function handleDeleteAccount() {
    setDeleteError("");

    if (deleteConfirm !== "DELETE") {
      setDeleteError(
        'Type "DELETE" to confirm account deletion.',
      );
      return;
    }

    setDeleteLoading(true);

    const { error } =
      await authClient.deleteUser();

    if (error) {
      setDeleteLoading(false);

      setDeleteError(
        error.message ||
          "Failed to delete your account.",
      );

      return;
    }

    /*
     * Account deletion succeeded.
     *
     * Send the user back to login.
     */
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="space-y-8">
      {/* =================================================
          PROFILE
      ================================================= */}

      <section className="rounded-2xl border p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">
            Profile Information
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Update the name associated with your account.
          </p>
        </div>

        <form
          onSubmit={handleProfileUpdate}
          className="space-y-5"
        >
          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-medium"
            >
              Name
            </label>

            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              required
              className="w-full rounded-lg border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium"
            >
              Email
            </label>

            <input
              id="email"
              type="email"
              value={email}
              disabled
              className="w-full cursor-not-allowed rounded-lg border bg-muted px-4 py-3 text-muted-foreground"
            />

            <p className="mt-2 text-xs text-muted-foreground">
              Email changes are not enabled yet.
            </p>
          </div>

          {profileError && (
            <p className="text-sm text-red-500">
              {profileError}
            </p>
          )}

          {profileSuccess && (
            <p className="text-sm text-green-600">
              {profileSuccess}
            </p>
          )}

          <button
            type="submit"
            disabled={profileLoading}
            className="rounded-lg bg-foreground px-5 py-3 text-sm font-medium text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {profileLoading
              ? "Saving..."
              : "Save changes"}
          </button>
        </form>
      </section>

      {/* =================================================
          PASSWORD
      ================================================= */}

      <section className="rounded-2xl border p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">
            Change Password
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Change your password and sign out other active
            sessions.
          </p>
        </div>

        <form
          onSubmit={handlePasswordChange}
          className="space-y-5"
        >
          <div>
            <label
              htmlFor="current-password"
              className="mb-2 block text-sm font-medium"
            >
              Current password
            </label>

            <input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) =>
                setCurrentPassword(e.target.value)
              }
              required
              autoComplete="current-password"
              className="w-full rounded-lg border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label
              htmlFor="new-password"
              className="mb-2 block text-sm font-medium"
            >
              New password
            </label>

            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) =>
                setNewPassword(e.target.value)
              }
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full rounded-lg border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-ring"
            />

            <p className="mt-2 text-xs text-muted-foreground">
              Minimum 8 characters.
            </p>
          </div>

          <div>
            <label
              htmlFor="confirm-password"
              className="mb-2 block text-sm font-medium"
            >
              Confirm new password
            </label>

            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(e.target.value)
              }
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full rounded-lg border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {passwordError && (
            <p className="text-sm text-red-500">
              {passwordError}
            </p>
          )}

          {passwordSuccess && (
            <p className="text-sm text-green-600">
              {passwordSuccess}
            </p>
          )}

          <button
            type="submit"
            disabled={passwordLoading}
            className="rounded-lg bg-foreground px-5 py-3 text-sm font-medium text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {passwordLoading
              ? "Changing password..."
              : "Change password"}
          </button>
        </form>
      </section>

      {/* =================================================
          DANGER ZONE
      ================================================= */}

      <section className="rounded-2xl border border-red-200 p-6 dark:border-red-900">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-red-600">
            Danger Zone
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Permanently delete your account and sign out.
            This action cannot be undone.
          </p>
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50 p-5 dark:border-red-900 dark:bg-red-950/20">
          <h3 className="font-semibold">
            Delete account
          </h3>

          <p className="mt-2 text-sm text-muted-foreground">
            Your account will be permanently deleted.
            Make sure you have downloaded anything you
            want to keep.
          </p>

          <div className="mt-5">
            <label
              htmlFor="delete-confirm"
              className="mb-2 block text-sm font-medium"
            >
              Type DELETE to confirm
            </label>

            <input
              id="delete-confirm"
              type="text"
              value={deleteConfirm}
              onChange={(e) =>
                setDeleteConfirm(e.target.value)
              }
              placeholder="DELETE"
              autoComplete="off"
              className="w-full rounded-lg border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {deleteError && (
            <p className="mt-4 text-sm text-red-600">
              {deleteError}
            </p>
          )}

          <button
            type="button"
            onClick={handleDeleteAccount}
            disabled={
              deleteLoading ||
              deleteConfirm !== "DELETE"
            }
            className="mt-5 rounded-lg bg-red-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deleteLoading
              ? "Deleting account..."
              : "Delete account"}
          </button>
        </div>
      </section>
    </div>
  );
}