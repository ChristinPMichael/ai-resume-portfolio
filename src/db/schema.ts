import {
  pgTable,
  text,
  varchar,
  timestamp,
  integer,
  uuid,
  boolean,
  index,
} from "drizzle-orm/pg-core";

import { user } from "./auth-schema";

/* =========================================================
   RESUMES
========================================================= */

export const resumes = pgTable(
  "resumes",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    userId: text("user_id")
      .notNull()
      .references(() => user.id, {
        onDelete: "cascade",
      }),

    fileName: varchar("file_name", {
      length: 255,
    }).notNull(),

    fileType: varchar("file_type", {
      length: 100,
    }).notNull(),

    /*
     * Original uploaded PDF/DOCX file.
     *
     * Nullable so existing resume records
     * remain valid.
     */
    fileData: text("file_data"),

    /*
     * Extracted resume text used for AI analysis.
     */
    rawText: text("raw_text"),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("resumes_user_id_idx")
      .on(table.userId),
  ],
);

/* =========================================================
   PORTFOLIO PROFILES
========================================================= */

export const portfolioProfiles = pgTable(
  "portfolio_profiles",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    userId: text("user_id")
      .notNull()
      .references(() => user.id, {
        onDelete: "cascade",
      }),

    username: varchar("username", {
      length: 100,
    })
      .notNull()
      .unique(),

    fullName: varchar("full_name", {
      length: 255,
    }),

    headline: varchar("headline", {
      length: 255,
    }),

    bio: text("bio"),

    location: varchar("location", {
      length: 255,
    }),

    githubUrl: varchar("github_url", {
      length: 500,
    }),

    linkedinUrl: varchar("linkedin_url", {
      length: 500,
    }),

    websiteUrl: varchar("website_url", {
      length: 500,
    }),

    /*
     * Portfolio visual theme.
     */
    theme: varchar("theme", {
      length: 50,
    })
      .notNull()
      .default("minimal"),

    /*
     * Portfolio accent color.
     */
    accentColor: varchar("accent_color", {
      length: 50,
    })
      .notNull()
      .default("default"),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("portfolio_profiles_user_id_idx")
      .on(table.userId),
  ],
);

/* =========================================================
   PROJECTS
========================================================= */

export const projects = pgTable(
  "projects",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    portfolioId: uuid("portfolio_id")
      .notNull()
      .references(
        () => portfolioProfiles.id,
        {
          onDelete: "cascade",
        },
      ),

    name: varchar("name", {
      length: 255,
    }).notNull(),

    description: text("description"),

    technologies: text("technologies"),

    projectUrl: varchar("project_url", {
      length: 500,
    }),

    githubUrl: varchar("github_url", {
      length: 500,
    }),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("projects_portfolio_id_idx")
      .on(table.portfolioId),
  ],
);

/* =========================================================
   SKILLS
========================================================= */

export const skills = pgTable(
  "skills",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    portfolioId: uuid("portfolio_id")
      .notNull()
      .references(
        () => portfolioProfiles.id,
        {
          onDelete: "cascade",
        },
      ),

    name: varchar("name", {
      length: 100,
    }).notNull(),

    category: varchar("category", {
      length: 100,
    }),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("skills_portfolio_id_idx")
      .on(table.portfolioId),
  ],
);

/* =========================================================
   EXPERIENCES
========================================================= */

export const experiences = pgTable(
  "experiences",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    portfolioId: uuid("portfolio_id")
      .notNull()
      .references(
        () => portfolioProfiles.id,
        {
          onDelete: "cascade",
        },
      ),

    company: varchar("company", {
      length: 255,
    }).notNull(),

    role: varchar("role", {
      length: 255,
    }).notNull(),

    description: text("description"),

    startDate: varchar("start_date", {
      length: 50,
    }),

    endDate: varchar("end_date", {
      length: 50,
    }),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("experiences_portfolio_id_idx")
      .on(table.portfolioId),
  ],
);

/* =========================================================
   EDUCATION
========================================================= */

export const education = pgTable(
  "education",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    portfolioId: uuid("portfolio_id")
      .notNull()
      .references(
        () => portfolioProfiles.id,
        {
          onDelete: "cascade",
        },
      ),

    institution: varchar("institution", {
      length: 255,
    }).notNull(),

    degree: varchar("degree", {
      length: 255,
    }),

    fieldOfStudy: varchar(
      "field_of_study",
      {
        length: 255,
      },
    ),

    startYear: integer("start_year"),

    endYear: integer("end_year"),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("education_portfolio_id_idx")
      .on(table.portfolioId),
  ],
);

/* =========================================================
   CONTACT MESSAGES
========================================================= */

export const contactMessages = pgTable(
  "contact_messages",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    portfolioId: uuid("portfolio_id")
      .notNull()
      .references(
        () => portfolioProfiles.id,
        {
          onDelete: "cascade",
        },
      ),

    name: varchar("name", {
      length: 100,
    }).notNull(),

    email: varchar("email", {
      length: 255,
    }).notNull(),

    message: text("message").notNull(),

    isRead: boolean("is_read")
      .default(false)
      .notNull(),

    readAt: timestamp("read_at"),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index(
      "contact_messages_portfolio_id_idx",
    ).on(table.portfolioId),

    index(
      "contact_messages_created_at_idx",
    ).on(table.createdAt),
  ],
);