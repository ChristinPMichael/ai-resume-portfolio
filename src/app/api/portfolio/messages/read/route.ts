import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { db } from "@/db";

import {
  contactMessages,
  portfolioProfiles,
} from "@/db/schema";

import { eq, and } from "drizzle-orm";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    // =====================================================
    // AUTHENTICATION
    // =====================================================

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.redirect(
        new URL("/login", request.url),
      );
    }

    // =====================================================
    // FORM DATA
    // =====================================================

    const formData = await request.formData();

    const messageId = String(
      formData.get("messageId") ?? "",
    ).trim();

    if (!messageId) {
      return NextResponse.json(
        {
          error: "Message ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    // =====================================================
    // FIND USER'S PORTFOLIO
    // =====================================================

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
          error: "Portfolio not found.",
        },
        {
          status: 404,
        },
      );
    }

    // =====================================================
    // MARK MESSAGE AS READ
    // =====================================================

    const [updatedMessage] =
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
        )
        .returning({
          id: contactMessages.id,
        });

    // =====================================================
    // MESSAGE NOT FOUND
    // =====================================================

    if (!updatedMessage) {
      return NextResponse.json(
        {
          error: "Message not found.",
        },
        {
          status: 404,
        },
      );
    }

    // =====================================================
    // REDIRECT
    // =====================================================

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