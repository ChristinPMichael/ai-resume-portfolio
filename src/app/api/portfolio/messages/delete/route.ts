import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";

import { db } from "@/db";

import {
  contactMessages,
  portfolioProfiles,
} from "@/db/schema";

import {
  eq,
  and,
} from "drizzle-orm";

export const runtime = "nodejs";

export async function POST(
  request: Request,
) {
  try {
    /* =====================================================
       AUTHENTICATION
    ===================================================== */

    const session =
      await auth.api.getSession({
        headers: await headers(),
      });

    if (!session) {
      return NextResponse.redirect(
        new URL(
          "/login",
          request.url,
        ),
      );
    }

    /* =====================================================
       FORM DATA
    ===================================================== */

    const formData =
      await request.formData();

    const messageId =
      String(
        formData.get("messageId") ?? "",
      ).trim();

    if (!messageId) {
      return NextResponse.json(
        {
          error:
            "Message ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    /* =====================================================
       FIND USER PORTFOLIO
    ===================================================== */

    const [portfolio] =
      await db
        .select({
          id: portfolioProfiles.id,
        })
        .from(portfolioProfiles)
        .where(
          eq(
            portfolioProfiles.userId,
            session.user.id,
          ),
        )
        .limit(1);

    if (!portfolio) {
      return NextResponse.json(
        {
          error:
            "Portfolio not found.",
        },
        {
          status: 404,
        },
      );
    }

    /* =====================================================
       DELETE ONLY OWN MESSAGE
    ===================================================== */

    const deleted =
      await db
        .delete(contactMessages)
        .where(
          and(
            eq(
              contactMessages.id,
              messageId,
            ),
            eq(
              contactMessages.portfolioId,
              portfolio.id,
            ),
          ),
        )
        .returning({
          id: contactMessages.id,
        });

    if (deleted.length === 0) {
      return NextResponse.json(
        {
          error:
            "Message not found.",
        },
        {
          status: 404,
        },
      );
    }

    /* =====================================================
       REDIRECT
    ===================================================== */

    return NextResponse.redirect(
      new URL(
        "/dashboard/portfolio/messages",
        request.url,
      ),
    );
  } catch (error) {
    console.error(
      "Delete message error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to delete message.",
      },
      {
        status: 500,
      },
    );
  }
}