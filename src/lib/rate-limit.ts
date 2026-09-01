import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

const redis = Redis.fromEnv();

// =========================================================
// CONTACT FORM
// 5 requests / 10 minutes / IP
// =========================================================

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

// =========================================================
// RESUME UPLOAD
// 5 uploads / 10 minutes / USER
// =========================================================

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