import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { eq, desc } from "drizzle-orm";

import { db } from "@/db";

import {
  portfolioProfiles,
  contactMessages,
} from "@/db/schema";

import { auth } from "@/lib/auth";

export default async function MessagesPage() {
  const session =
    await auth.api.getSession({
      headers: await headers(),
    });

  if (!session) {
    redirect("/login");
  }

  /* =======================================================
     FIND USER PORTFOLIO
  ======================================================= */

  const [portfolio] = await db
    .select({
      id: portfolioProfiles.id,
      username: portfolioProfiles.username,
      fullName: portfolioProfiles.fullName,
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
    redirect("/dashboard");
  }

  /* =======================================================
     GET MESSAGES
  ======================================================= */

  const messages = await db
    .select()
    .from(contactMessages)
    .where(
      eq(
        contactMessages.portfolioId,
        portfolio.id,
      ),
    )
    .orderBy(
      desc(contactMessages.createdAt),
    );

  /* =======================================================
     UNREAD COUNT
  ======================================================= */

  const unreadCount =
    messages.filter(
      (message) => !message.isRead,
    ).length;

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

          <div>
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground transition hover:text-foreground"
            >
              ← Back to Dashboard
            </Link>

            <h1 className="mt-4 text-3xl font-bold tracking-tight">
              Messages
            </h1>

            <p className="mt-2 text-muted-foreground">
              Messages received through your
              public portfolio.
            </p>
          </div>

          {unreadCount > 0 && (
            <div className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background">
              {unreadCount} unread
            </div>
          )}
        </div>

        {/* =================================================
            EMPTY STATE
        ================================================= */}

        {messages.length === 0 ? (
          <div className="mt-10 rounded-2xl border p-10 text-center">

            <div className="text-4xl">
              ✉️
            </div>

            <h2 className="mt-4 text-xl font-semibold">
              No messages yet
            </h2>

            <p className="mt-2 text-muted-foreground">
              Messages from your portfolio
              visitors will appear here.
            </p>

            <Link
              href={`/portfolio/${portfolio.username}`}
              target="_blank"
              className="mt-6 inline-block rounded-lg bg-foreground px-5 py-3 text-sm font-medium text-background transition hover:opacity-90"
            >
              View Portfolio ↗
            </Link>

          </div>
        ) : (

          /* =================================================
             MESSAGE LIST
          ================================================= */

          <div className="mt-10 space-y-4">

            {messages.map((message) => (

              <article
                key={message.id}
                className={`rounded-2xl border p-6 transition ${
                  !message.isRead
                    ? "border-foreground/30 bg-muted/30"
                    : ""
                }`}
              >

                {/* -----------------------------------------
                    MESSAGE HEADER
                ----------------------------------------- */}

                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                  <div>

                    <div className="flex flex-wrap items-center gap-3">

                      <h2 className="font-semibold">
                        {message.name}
                      </h2>

                      {!message.isRead && (
                        <span className="rounded-full bg-foreground px-2.5 py-1 text-xs font-medium text-background">
                          New
                        </span>
                      )}

                    </div>

                    <a
                      href={`mailto:${message.email}`}
                      className="mt-1 block text-sm text-muted-foreground transition hover:text-foreground"
                    >
                      {message.email}
                    </a>

                  </div>

                  <time
                    dateTime={
                      message.createdAt.toISOString()
                    }
                    className="text-sm text-muted-foreground"
                  >
                    {message.createdAt.toLocaleDateString(
                      "en-IN",
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      },
                    )}
                  </time>

                </div>

                {/* -----------------------------------------
                    MESSAGE CONTENT
                ----------------------------------------- */}

                <div className="mt-5 rounded-xl bg-muted/40 p-4">

                  <p className="whitespace-pre-line text-sm leading-7">
                    {message.message}
                  </p>

                </div>

                {/* -----------------------------------------
                    ACTIONS
                ----------------------------------------- */}

                <div className="mt-5 flex flex-wrap gap-3">

                  {/* Reply */}

                  <a
                    href={`mailto:${message.email}`}
                    className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:opacity-90"
                  >
                    Reply ↗
                  </a>

                  {/* Mark Read */}

                  {!message.isRead && (
                    <form
                      action="/api/portfolio/messages/read"
                      method="POST"
                    >
                      <input
                        type="hidden"
                        name="messageId"
                        value={message.id}
                      />

                      <button
                        type="submit"
                        className="rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-muted"
                      >
                        Mark as Read
                      </button>
                    </form>
                  )}

                  {/* Read Status */}

                  {message.isRead && (
                    <span className="rounded-lg border px-4 py-2 text-sm text-muted-foreground">
                      ✓ Read
                    </span>
                  )}

                  {/* Delete */}

                  <form
                    action="/api/portfolio/messages/delete"
                    method="POST"
                  >
                    <input
                      type="hidden"
                      name="messageId"
                      value={message.id}
                    />

                    <button
                      type="submit"
                      className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </form>

                </div>

              </article>

            ))}

          </div>
        )}

      </div>
    </main>
  );
}