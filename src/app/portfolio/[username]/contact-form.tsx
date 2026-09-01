"use client";

import { useState } from "react";

type ContactFormProps = {
  username: string;
};

type FormStatus =
  | "idle"
  | "sending"
  | "success"
  | "error"
  | "rate-limited";

export default function ContactForm({
  username,
}: ContactFormProps) {
  const [status, setStatus] =
    useState<FormStatus>("idle");

  const [errorMessage, setErrorMessage] =
    useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setStatus("sending");
    setErrorMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);

    formData.set(
      "username",
      username,
    );

    try {
      const response = await fetch(
        "/api/portfolio/contact",
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await response
        .json()
        .catch(() => null);

      // ==========================================
      // RATE LIMITED
      // ==========================================

      if (response.status === 429) {
        setStatus("rate-limited");

        setErrorMessage(
          data?.error ||
            "Too many messages. Please try again later.",
        );

        return;
      }

      // ==========================================
      // OTHER ERRORS
      // ==========================================

      if (!response.ok) {
        setStatus("error");

        setErrorMessage(
          data?.error ||
            "Something went wrong. Please try again.",
        );

        return;
      }

      // ==========================================
      // SUCCESS
      // ==========================================

      form.reset();

      setStatus("success");
    } catch (error) {
      console.error(
        "Contact form error:",
        error,
      );

      setStatus("error");

      setErrorMessage(
        "Unable to send your message. Please try again.",
      );
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 max-w-2xl space-y-5"
    >
      {/* ==========================================
          NAME
      ========================================== */}

      <div>
        <label
          htmlFor="contact-name"
          className="text-sm font-medium"
        >
          Your Name
        </label>

        <input
          id="contact-name"
          name="name"
          required
          maxLength={100}
          autoComplete="name"
          placeholder="John Doe"
          className="mt-2 w-full rounded-lg border bg-background px-4 py-3 outline-none transition focus:ring-2"
        />
      </div>

      {/* ==========================================
          EMAIL
      ========================================== */}

      <div>
        <label
          htmlFor="contact-email"
          className="text-sm font-medium"
        >
          Email
        </label>

        <input
          id="contact-email"
          name="email"
          type="email"
          required
          maxLength={255}
          autoComplete="email"
          placeholder="john@example.com"
          className="mt-2 w-full rounded-lg border bg-background px-4 py-3 outline-none transition focus:ring-2"
        />
      </div>

      {/* ==========================================
          HONEYPOT
      ========================================== */}

      <div
        aria-hidden="true"
        className="hidden"
      >
        <label htmlFor="contact-website">
          Website
        </label>

        <input
          id="contact-website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {/* ==========================================
          MESSAGE
      ========================================== */}

      <div>
        <label
          htmlFor="contact-message"
          className="text-sm font-medium"
        >
          Message
        </label>

        <textarea
          id="contact-message"
          name="message"
          required
          maxLength={5000}
          rows={6}
          placeholder="I'd like to discuss an opportunity..."
          className="mt-2 w-full resize-y rounded-lg border bg-background px-4 py-3 outline-none transition focus:ring-2"
        />
      </div>

      {/* ==========================================
          SUBMIT
      ========================================== */}

      <button
        type="submit"
        disabled={
          status === "sending" ||
          status === "rate-limited"
        }
        className="rounded-lg bg-foreground px-6 py-3 text-sm font-semibold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status === "sending"
          ? "Sending..."
          : status === "rate-limited"
            ? "Please try later"
            : "Send Message"}
      </button>

      {/* ==========================================
          SUCCESS
      ========================================== */}

      {status === "success" && (
        <p
          role="status"
          className="text-sm text-green-600"
        >
          Message sent successfully.
        </p>
      )}

      {/* ==========================================
          RATE LIMIT ERROR
      ========================================== */}

      {status === "rate-limited" && (
        <p
          role="alert"
          className="text-sm text-orange-600"
        >
          {errorMessage}
        </p>
      )}

      {/* ==========================================
          GENERAL ERROR
      ========================================== */}

      {status === "error" && (
        <p
          role="alert"
          className="text-sm text-red-600"
        >
          {errorMessage}
        </p>
      )}
    </form>
  );
}