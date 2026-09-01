import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";

import {
  resumes,
  portfolioProfiles,
  projects,
  skills,
  experiences,
  education,
} from "@/db/schema";

import { eq, and } from "drizzle-orm";
import { GoogleGenAI, Type } from "@google/genai";

import {
  resumeAnalysisRateLimit,
} from "@/lib/rate-limit";

export const runtime = "nodejs";

/* =========================================================
   GEMINI
========================================================= */

const apiKey =
  process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error(
    "GEMINI_API_KEY is missing.",
  );
}

const ai = new GoogleGenAI({
  apiKey,
});

/* =========================================================
   TYPES
========================================================= */

type CleanSkill = {
  name: string | null;
  category: string | null;
};

type CleanProject = {
  name: string | null;
  description: string | null;
  technologies: string | null;
  projectUrl: string | null;
  githubUrl: string | null;
};

type CleanExperience = {
  company: string | null;
  role: string | null;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
};

type CleanEducation = {
  institution: string | null;
  degree: string | null;
  fieldOfStudy: string | null;
  startYear: number | null;
  endYear: number | null;
};

type CleanProfile = {
  fullName: string | null;
  headline: string | null;
  bio: string | null;
  location: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  websiteUrl: string | null;
  skills: CleanSkill[];
  projects: CleanProject[];
  experiences: CleanExperience[];
  education: CleanEducation[];
};

/* =========================================================
   RESPONSE SCHEMA
========================================================= */

const responseSchema = {
  type: Type.OBJECT,

  properties: {
    fullName: {
      type: Type.STRING,
    },

    headline: {
      type: Type.STRING,
    },

    bio: {
      type: Type.STRING,
    },

    location: {
      type: Type.STRING,
    },

    githubUrl: {
      type: Type.STRING,
    },

    linkedinUrl: {
      type: Type.STRING,
    },

    websiteUrl: {
      type: Type.STRING,
    },

    skills: {
      type: Type.ARRAY,

      items: {
        type: Type.OBJECT,

        properties: {
          name: {
            type: Type.STRING,
          },

          category: {
            type: Type.STRING,
          },
        },

        required: ["name"],
      },
    },

    projects: {
      type: Type.ARRAY,

      items: {
        type: Type.OBJECT,

        properties: {
          name: {
            type: Type.STRING,
          },

          description: {
            type: Type.STRING,
          },

          technologies: {
            type: Type.STRING,
          },

          projectUrl: {
            type: Type.STRING,
          },

          githubUrl: {
            type: Type.STRING,
          },
        },

        required: ["name"],
      },
    },

    experiences: {
      type: Type.ARRAY,

      items: {
        type: Type.OBJECT,

        properties: {
          company: {
            type: Type.STRING,
          },

          role: {
            type: Type.STRING,
          },

          description: {
            type: Type.STRING,
          },

          startDate: {
            type: Type.STRING,
          },

          endDate: {
            type: Type.STRING,
          },
        },

        required: [
          "company",
          "role",
        ],
      },
    },

    education: {
      type: Type.ARRAY,

      items: {
        type: Type.OBJECT,

        properties: {
          institution: {
            type: Type.STRING,
          },

          degree: {
            type: Type.STRING,
          },

          fieldOfStudy: {
            type: Type.STRING,
          },

          startYear: {
            type: Type.INTEGER,
          },

          endYear: {
            type: Type.INTEGER,
          },
        },

        required: ["institution"],
      },
    },
  },

  required: [
    "fullName",
    "headline",
    "bio",
    "skills",
    "projects",
    "experiences",
    "education",
  ],
};

/* =========================================================
   CLEAN TEXT
========================================================= */

function cleanText(
  value: unknown,
  maxLength = 5000,
): string | null {
  if (
    typeof value !== "string"
  ) {
    return null;
  }

  const cleaned =
    value
      .replace(/\s+/g, " ")
      .trim();

  if (!cleaned) {
    return null;
  }

  return cleaned.slice(
    0,
    maxLength,
  );
}

/* =========================================================
   CLEAN SHORT TEXT
========================================================= */

function cleanShortText(
  value: unknown,
  maxLength: number,
): string | null {
  return cleanText(
    value,
    maxLength,
  );
}

/* =========================================================
   CLEAN DATE
========================================================= */

function cleanDate(
  value: unknown,
): string | null {
  if (
    typeof value !== "string" &&
    typeof value !== "number"
  ) {
    return null;
  }

  const text =
    String(value).trim();

  if (!text) {
    return null;
  }

  if (
    /\b(present|current|ongoing)\b/i.test(
      text,
    )
  ) {
    return "Present";
  }

  const monthYear =
    text.match(
      /\b(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\s+\d{4}\b/i,
    );

  if (monthYear) {
    return monthYear[0];
  }

  const year =
    text.match(
      /\b(19|20)\d{2}\b/,
    );

  if (year) {
    return year[0];
  }

  return null;
}

/* =========================================================
   CLEAN YEAR
========================================================= */

function cleanYear(
  value: unknown,
): number | null {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const text =
    String(value).trim();

  if (!text) {
    return null;
  }

  const match =
    text.match(
      /\b(19|20)\d{2}\b/,
    );

  if (!match) {
    return null;
  }

  const year =
    Number(match[0]);

  if (
    !Number.isInteger(year) ||
    year < 1900 ||
    year > 2100
  ) {
    return null;
  }

  return year;
}

/* =========================================================
   CLEAN URL
========================================================= */

function cleanUrl(
  value: unknown,
): string | null {
  if (
    typeof value !== "string"
  ) {
    return null;
  }

  const text =
    value.trim();

  if (!text) {
    return null;
  }

  if (
    text.startsWith(
      "https://",
    ) ||
    text.startsWith(
      "http://",
    )
  ) {
    return text.slice(
      0,
      500,
    );
  }

  return null;
}

/* =========================================================
   GEMINI REQUEST
========================================================= */

async function requestGemini(
  model: string,
  prompt: string,
) {
  console.log(
    `Gemini request: ${model}`,
  );

  const response =
    await ai.models.generateContent({
      model,

      contents: prompt,

      config: {
        responseMimeType:
          "application/json",

        responseSchema,
      },
    });

  if (!response.text) {
    throw new Error(
      `${model} returned an empty response`,
    );
  }

  console.log(
    `Gemini ${model} succeeded`,
  );

  return response;
}

/* =========================================================
   GEMINI WITH FALLBACK
========================================================= */

async function generateResumeAnalysis(
  prompt: string,
) {
  const primaryModel =
    "gemini-3.7-flash";

  const fallbackModel =
    "gemini-3.6-flash";

  try {
    return await requestGemini(
      primaryModel,
      prompt,
    );
  } catch (error: unknown) {
    const geminiError =
      error as {
        status?: number;
        code?: number;
        response?: {
          status?: number;
        };
      };

    const status =
      geminiError?.status ??
      geminiError?.code ??
      geminiError?.response?.status;

    console.error(
      `Gemini ${primaryModel} failed:`,
      error,
    );

    if (
      status === 503 ||
      status === 429
    ) {
      console.log(
        `Switching from ${primaryModel} to ${fallbackModel}...`,
      );
    } else {
      console.log(
        `Primary model failed. Trying ${fallbackModel}...`,
      );
    }

    try {
      return await requestGemini(
        fallbackModel,
        prompt,
      );
    } catch (
      fallbackError: unknown
    ) {
      console.error(
        `Gemini ${fallbackModel} failed:`,
        fallbackError,
      );

      throw fallbackError;
    }
  }
}

/* =========================================================
   DELETE OLD CHILD RECORDS
========================================================= */

async function deletePortfolioChildren(
  portfolioId: string,
) {
  await db
    .delete(skills)
    .where(
      eq(
        skills.portfolioId,
        portfolioId,
      ),
    );

  await db
    .delete(projects)
    .where(
      eq(
        projects.portfolioId,
        portfolioId,
      ),
    );

  await db
    .delete(experiences)
    .where(
      eq(
        experiences.portfolioId,
        portfolioId,
      ),
    );

  await db
    .delete(education)
    .where(
      eq(
        education.portfolioId,
        portfolioId,
      ),
    );
}

/* =========================================================
   POST
========================================================= */

export async function POST(
  request: Request,
) {
  try {
    /* =====================================================
       1. AUTHENTICATION
    ===================================================== */

    const session =
      await auth.api.getSession({
        headers: await headers(),
      });

    if (!session) {
      return NextResponse.json(
        {
          error:
            "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    /* =====================================================
       2. AI ANALYSIS RATE LIMIT
       5 analyses / 10 minutes / USER
    ===================================================== */

    const {
      success: analysisAllowed,
      limit,
      remaining,
      reset,
    } =
      await resumeAnalysisRateLimit.limit(
        session.user.id,
      );

    const rateLimitHeaders = {
      "X-RateLimit-Limit":
        String(limit),

      "X-RateLimit-Remaining":
        String(remaining),

      "X-RateLimit-Reset":
        String(reset),
    };

    if (!analysisAllowed) {
      const retryAfter =
        Math.max(
          1,
          Math.ceil(
            (reset -
              Date.now()) /
              1000,
          ),
        );

      return NextResponse.json(
        {
          error:
            "Too many AI resume analyses. Please try again later.",
        },
        {
          status: 429,

          headers: {
            ...rateLimitHeaders,

            "Retry-After":
              String(
                retryAfter,
              ),
          },
        },
      );
    }

    /* =====================================================
       3. GET RESUME ID
    ===================================================== */

    let body: {
      resumeId?: unknown;
    };

    try {
      body =
        await request.json();
    } catch {
      return NextResponse.json(
        {
          error:
            "Invalid JSON request.",
        },
        {
          status: 400,
        },
      );
    }

    const resumeId =
      body?.resumeId;

    if (
      typeof resumeId !==
        "string" ||
      !resumeId.trim()
    ) {
      return NextResponse.json(
        {
          error:
            "resumeId is required.",
        },
        {
          status: 400,
        },
      );
    }

    /* =====================================================
       4. GET USER'S RESUME
    ===================================================== */

    const [resume] =
      await db
        .select()
        .from(resumes)
        .where(
          and(
            eq(
              resumes.id,
              resumeId.trim(),
            ),

            eq(
              resumes.userId,
              session.user.id,
            ),
          ),
        )
        .limit(1);

    if (!resume) {
      return NextResponse.json(
        {
          error:
            "Resume not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (!resume.rawText) {
      return NextResponse.json(
        {
          error:
            "Resume has no extracted text.",
        },
        {
          status: 400,
        },
      );
    }

    /* =====================================================
       5. GEMINI PROMPT
    ===================================================== */

    const prompt = `
You are an expert resume parser and professional portfolio writer.

Analyze the resume below and convert it into structured portfolio data.

IMPORTANT RULES:

1. Use ONLY information explicitly supported by the resume.
2. Never invent information.
3. Never invent companies.
4. Never invent projects.
5. Never invent skills.
6. Never invent education.
7. Never invent dates.
8. Never invent URLs.
9. Never invent achievements.
10. Never put explanations inside fields.
11. Never repeat the prompt.
12. Never put instructions inside fields.
13. Never output phrases such as:
    "mapping logic",
    "pattern matching",
    "standard text",
    "raw parsing",
    "clean pattern",
    "representation logic",
    "format matching",
    "text mapping".
14. If information is missing, return an empty string.
15. Keep fields concise and professional.

TEXT CLEANING:

- Remove duplicated text.
- Remove parser artifacts.
- Remove OCR noise.
- Remove repeated phrases.
- Remove instructions accidentally included in the text.
- Preserve the actual resume information.

DATE RULES:

- startDate and endDate should contain ONLY a real date value.
- Examples:
  "Nov 2025"
  "November 2025"
  "2025"
  "Present"

- Never put explanations in date fields.

YEAR RULES:

- startYear and endYear must contain ONLY a four-digit year.
- Example:
  2021
  2025

- Never return large numeric strings.
- Never return timestamps.
- Never return IDs.
- Never return decimals.
- If unknown, return an empty value.

URL RULES:

- Return ONLY the actual URL.
- If no URL exists, return an empty string.

DESCRIPTION RULES:

- Keep descriptions concise.
- Do not invent achievements.
- Do not repeat the entire resume.

RESUME:

${resume.rawText}
`;

    /* =====================================================
       6. GEMINI
    ===================================================== */

    const response =
      await generateResumeAnalysis(
        prompt,
      );

    if (!response.text) {
      throw new Error(
        "Gemini returned an empty response.",
      );
    }

    /* =====================================================
       7. PARSE JSON
    ===================================================== */

    let profile: Record<
      string,
      unknown
    >;

    try {
      const parsed =
        JSON.parse(
          response.text,
        );

      if (
        typeof parsed !==
          "object" ||
        parsed === null ||
        Array.isArray(parsed)
      ) {
        throw new Error(
          "Gemini returned an invalid object.",
        );
      }

      profile =
        parsed as Record<
          string,
          unknown
        >;
    } catch {
      console.error(
        "Invalid Gemini JSON:",
        response.text,
      );

      throw new Error(
        "Gemini returned invalid JSON.",
      );
    }

    /* =====================================================
       8. CLEAN PROFILE
    ===================================================== */

    const cleanProfile: CleanProfile =
      {
        fullName:
          cleanShortText(
            profile?.fullName,
            255,
          ),

        headline:
          cleanShortText(
            profile?.headline,
            255,
          ),

        bio:
          cleanText(
            profile?.bio,
            5000,
          ),

        location:
          cleanShortText(
            profile?.location,
            255,
          ),

        githubUrl:
          cleanUrl(
            profile?.githubUrl,
          ),

        linkedinUrl:
          cleanUrl(
            profile?.linkedinUrl,
          ),

        websiteUrl:
          cleanUrl(
            profile?.websiteUrl,
          ),

        skills:
          Array.isArray(
            profile?.skills,
          )
            ? profile.skills
                .map(
                  (
                    skill: unknown,
                  ): CleanSkill => {
                    const data =
                      skill as Record<
                        string,
                        unknown
                      >;

                    return {
                      name:
                        cleanShortText(
                          data?.name,
                          100,
                        ),

                      category:
                        cleanShortText(
                          data?.category,
                          100,
                        ),
                    };
                  },
                )
                .filter(
                  (
                    skill: CleanSkill,
                  ) =>
                    Boolean(
                      skill.name,
                    ),
                )
            : [],

        projects:
          Array.isArray(
            profile?.projects,
          )
            ? profile.projects
                .map(
                  (
                    project: unknown,
                  ): CleanProject => {
                    const data =
                      project as Record<
                        string,
                        unknown
                      >;

                    return {
                      name:
                        cleanShortText(
                          data?.name,
                          255,
                        ),

                      description:
                        cleanText(
                          data?.description,
                          5000,
                        ),

                      technologies:
                        cleanText(
                          data?.technologies,
                          1000,
                        ),

                      projectUrl:
                        cleanUrl(
                          data?.projectUrl,
                        ),

                      githubUrl:
                        cleanUrl(
                          data?.githubUrl,
                        ),
                    };
                  },
                )
                .filter(
                  (
                    project: CleanProject,
                  ) =>
                    Boolean(
                      project.name,
                    ),
                )
            : [],

        experiences:
          Array.isArray(
            profile?.experiences,
          )
            ? profile.experiences
                .map(
                  (
                    experience: unknown,
                  ): CleanExperience => {
                    const data =
                      experience as Record<
                        string,
                        unknown
                      >;

                    return {
                      company:
                        cleanShortText(
                          data?.company,
                          255,
                        ),

                      role:
                        cleanShortText(
                          data?.role,
                          255,
                        ),

                      description:
                        cleanText(
                          data?.description,
                          5000,
                        ),

                      startDate:
                        cleanDate(
                          data?.startDate,
                        ),

                      endDate:
                        cleanDate(
                          data?.endDate,
                        ),
                    };
                  },
                )
                .filter(
                  (
                    experience: CleanExperience,
                  ) =>
                    Boolean(
                      experience.company &&
                        experience.role,
                    ),
                )
            : [],

        education:
          Array.isArray(
            profile?.education,
          )
            ? profile.education
                .map(
                  (
                    item: unknown,
                  ): CleanEducation => {
                    const data =
                      item as Record<
                        string,
                        unknown
                      >;

                    return {
                      institution:
                        cleanShortText(
                          data?.institution,
                          255,
                        ),

                      degree:
                        cleanShortText(
                          data?.degree,
                          255,
                        ),

                      fieldOfStudy:
                        cleanShortText(
                          data?.fieldOfStudy,
                          255,
                        ),

                      startYear:
                        cleanYear(
                          data?.startYear,
                        ),

                      endYear:
                        cleanYear(
                          data?.endYear,
                        ),
                    };
                  },
                )
                .filter(
                  (
                    item: CleanEducation,
                  ) =>
                    Boolean(
                      item.institution,
                    ),
                )
            : [],
      };

    /* =====================================================
       9. USERNAME
    ===================================================== */

    const baseUsername =
      (
        cleanProfile.fullName ||
        session.user.name ||
        "user"
      )
        .toLowerCase()
        .replace(
          /[^a-z0-9]+/g,
          "-",
        )
        .replace(
          /^-|-$/g,
          "",
        )
        .slice(
          0,
          80,
        );

    const username =
      `${baseUsername}-${session.user.id.slice(
        0,
        6,
      )}`;

    /* =====================================================
       10. FIND EXISTING PORTFOLIO
    ===================================================== */

    const [
      existingPortfolio,
    ] =
      await db
        .select({
          id:
            portfolioProfiles.id,

          username:
            portfolioProfiles.username,
        })
        .from(
          portfolioProfiles,
        )
        .where(
          eq(
            portfolioProfiles.userId,
            session.user.id,
          ),
        )
        .limit(1);

    /* =====================================================
       11. CREATE OR UPDATE PORTFOLIO
    ===================================================== */

    let portfolio: {
      id: string;
      username: string;
    };

    if (
      existingPortfolio
    ) {
      console.log(
        `Updating existing portfolio: ${existingPortfolio.id}`,
      );

      const [
        updatedPortfolio,
      ] = await db
        .update(
          portfolioProfiles,
        )
        .set({
          fullName:
            cleanProfile.fullName ||
            session.user.name,

          headline:
            cleanProfile.headline,

          bio:
            cleanProfile.bio,

          location:
            cleanProfile.location,

          githubUrl:
            cleanProfile.githubUrl,

          linkedinUrl:
            cleanProfile.linkedinUrl,

          websiteUrl:
            cleanProfile.websiteUrl,

          updatedAt:
            new Date(),
        })
        .where(
          eq(
            portfolioProfiles.id,
            existingPortfolio.id,
          ),
        )
        .returning({
          id:
            portfolioProfiles.id,

          username:
            portfolioProfiles.username,
        });

      if (
        !updatedPortfolio
      ) {
        throw new Error(
          "Failed to update portfolio profile.",
        );
      }

      portfolio =
        updatedPortfolio;

      await deletePortfolioChildren(
        portfolio.id,
      );
    } else {
      console.log(
        `Creating new portfolio: ${username}`,
      );

      const [newPortfolio] =
        await db
          .insert(
            portfolioProfiles,
          )
          .values({
            userId:
              session.user.id,

            username,

            fullName:
              cleanProfile.fullName ||
              session.user.name,

            headline:
              cleanProfile.headline,

            bio:
              cleanProfile.bio,

            location:
              cleanProfile.location,

            githubUrl:
              cleanProfile.githubUrl,

            linkedinUrl:
              cleanProfile.linkedinUrl,

            websiteUrl:
              cleanProfile.websiteUrl,
          })
          .returning({
            id:
              portfolioProfiles.id,

            username:
              portfolioProfiles.username,
          });

      if (
        !newPortfolio
      ) {
        throw new Error(
          "Failed to create portfolio profile.",
        );
      }

      portfolio =
        newPortfolio;
    }

    /* =====================================================
       12. SAVE SKILLS
    ===================================================== */

    if (
      cleanProfile.skills.length >
      0
    ) {
      await db
        .insert(skills)
        .values(
          cleanProfile.skills.map(
            (
              skill: CleanSkill,
            ) => ({
              portfolioId:
                portfolio.id,

              name:
                skill.name!,

              category:
                skill.category,
            }),
          ),
        );
    }

    /* =====================================================
       13. SAVE PROJECTS
    ===================================================== */

    if (
      cleanProfile.projects.length >
      0
    ) {
      await db
        .insert(projects)
        .values(
          cleanProfile.projects.map(
            (
              project: CleanProject,
            ) => ({
              portfolioId:
                portfolio.id,

              name:
                project.name!,

              description:
                project.description,

              technologies:
                project.technologies,

              projectUrl:
                project.projectUrl,

              githubUrl:
                project.githubUrl,
            }),
          ),
        );
    }

    /* =====================================================
       14. SAVE EXPERIENCE
    ===================================================== */

    if (
      cleanProfile.experiences
        .length > 0
    ) {
      await db
        .insert(experiences)
        .values(
          cleanProfile.experiences.map(
            (
              experience: CleanExperience,
            ) => ({
              portfolioId:
                portfolio.id,

              company:
                experience.company!,

              role:
                experience.role!,

              description:
                experience.description,

              startDate:
                experience.startDate,

              endDate:
                experience.endDate,
            }),
          ),
        );
    }

    /* =====================================================
       15. SAVE EDUCATION
    ===================================================== */

    if (
      cleanProfile.education.length >
      0
    ) {
      await db
        .insert(education)
        .values(
          cleanProfile.education.map(
            (
              item: CleanEducation,
            ) => ({
              portfolioId:
                portfolio.id,

              institution:
                item.institution!,

              degree:
                item.degree,

              fieldOfStudy:
                item.fieldOfStudy,

              startYear:
                item.startYear,

              endYear:
                item.endYear,
            }),
          ),
        );
    }

    /* =====================================================
       16. SUCCESS
    ===================================================== */

    return NextResponse.json(
      {
        success: true,

        portfolioId:
          portfolio.id,

        username:
          portfolio.username,

        profile:
          cleanProfile,

        message:
          "AI portfolio generated successfully!",
      },
      {
        status: 200,

        headers:
          rateLimitHeaders,
      },
    );
  } catch (
    error: unknown
  ) {
    console.error(
      "Resume AI analysis error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to analyze resume.",
      },
      {
        status: 500,
      },
    );
  }
}