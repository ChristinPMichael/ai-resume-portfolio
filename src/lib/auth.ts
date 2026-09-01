import { betterAuth } from "better-auth";

import { drizzleAdapter } from "@better-auth/drizzle-adapter";

import { db } from "@/db";

import * as schema from "@/db/auth-schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),

  baseURL:
    process.env.BETTER_AUTH_URL ||
    "http://localhost:3000",

  /* =======================================================
     EMAIL + PASSWORD
  ======================================================= */

  emailAndPassword: {
    enabled: true,

    sendResetPassword: async ({
      user,
      url,
    }) => {
      const { sendEmail } = await import(
        "@/lib/email"
      );

      try {
        await sendEmail({
          to: user.email,
          subject:
            "Reset your AI Resume Portfolio password",
          text: `Click this link to reset your password:\n\n${url}`,
        });
      } catch (error) {
        console.error(
          "Failed to send password reset email:",
          error,
        );
      }
    },

    revokeSessionsOnPasswordReset: true,
  },

  /* =======================================================
     USER
  ======================================================= */

  user: {
    deleteUser: {
      enabled: true,
    },
  },

  /* =======================================================
     GOOGLE
  ======================================================= */

  socialProviders: {
    google: {
      clientId:
        process.env.GOOGLE_CLIENT_ID!,
      clientSecret:
        process.env.GOOGLE_CLIENT_SECRET!,
    },
  },

  /* =======================================================
     ACCOUNT LINKING
  ======================================================= */

  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
      allowDifferentEmails: false,
      disableImplicitLinking: false,
      updateUserInfoOnLink: true,
    },
  },
});