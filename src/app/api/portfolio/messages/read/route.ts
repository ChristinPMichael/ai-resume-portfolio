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

    /* -----------------------------------------------------
       Find user's portfolio
    ----------------------------------------------------- */

    const [portfolio] = await db
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

    /* -----------------------------------------------------
       Mark message as read
    ----------------------------------------------------- */

    await db
      .update(contactMessages)
      .set({
        isRead: true,
        readAt: new Date(),
      })
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
      );

    return NextResponse.redirect(
      new URL(
        "/dashboard/portfolio/messages",
        request.url,
      ),
    );
  } catch (error) {
    console.error(
      "Mark message read error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to update message.",
      },
      {
        status: 500,
      },
    );
  }
}