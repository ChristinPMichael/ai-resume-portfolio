import { unstable_cache } from "next/cache";

import { db } from "@/db";

import {
  portfolioProfiles,
  skills,
  projects,
  experiences,
  education,
} from "@/db/schema";

import { eq } from "drizzle-orm";

/* =========================================================
   GET PORTFOLIO DATA
========================================================= */

export async function getPortfolioData(
  username: string,
) {
  return unstable_cache(
    async () => {
      const [portfolio] = await db
        .select()
        .from(portfolioProfiles)
        .where(
          eq(
            portfolioProfiles.username,
            username,
          ),
        )
        .limit(1);

      if (!portfolio) {
        return null;
      }

      const [
        profileSkills,
        profileProjects,
        profileExperiences,
        profileEducation,
      ] = await Promise.all([
        db
          .select()
          .from(skills)
          .where(
            eq(
              skills.portfolioId,
              portfolio.id,
            ),
          ),

        db
          .select()
          .from(projects)
          .where(
            eq(
              projects.portfolioId,
              portfolio.id,
            ),
          ),

        db
          .select()
          .from(experiences)
          .where(
            eq(
              experiences.portfolioId,
              portfolio.id,
            ),
          ),

        db
          .select()
          .from(education)
          .where(
            eq(
              education.portfolioId,
              portfolio.id,
            ),
          ),
      ]);

      return {
        portfolio,
        profileSkills,
        profileProjects,
        profileExperiences,
        profileEducation,
      };
    },
    [
      "portfolio",
      username,
    ],
    {
      revalidate: 60,
      tags: [
        `portfolio:${username}`,
      ],
    },
  )();
}