import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

const redis = Redis.fromEnv();

/* =========================================================
   CONTACT — IP RATE LIMIT
   5 requests / 10 minutes / IP
========================================================= */

export const contactRateLimit =
  new Ratelimit({
    redis,

    limiter:
      Ratelimit.slidingWindow(
        5,
        "10 m",
      ),

    analytics: true,

    prefix:
      "ai-portfolio:contact",
  });

/* =========================================================
   CONTACT — EMAIL RATE LIMIT
   5 requests / 10 minutes / EMAIL
========================================================= */

export const contactEmailRateLimit =
  new Ratelimit({
    redis,

    limiter:
      Ratelimit.slidingWindow(
        5,
        "10 m",
      ),

    analytics: true,

    prefix:
      "ai-portfolio:contact-email",
  });

/* =========================================================
   RESUME ANALYSIS RATE LIMIT
   10 requests / 10 minutes / USER
========================================================= */

export const resumeAnalysisRateLimit =
  new Ratelimit({
    redis,

    limiter:
      Ratelimit.slidingWindow(
        10,
        "10 m",
      ),

    analytics: true,

    prefix:
      "ai-portfolio:resume-analysis",
  });

/* =========================================================
   RESUME UPLOAD RATE LIMIT
   5 requests / 10 minutes / USER
========================================================= */

export const resumeUploadRateLimit =
  new Ratelimit({
    redis,

    limiter:
      Ratelimit.slidingWindow(
        5,
        "10 m",
      ),

    analytics: true,

    prefix:
      "ai-portfolio:resume-upload",
  });