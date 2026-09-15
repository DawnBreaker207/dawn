-- CreateEnum
CREATE TYPE "StatsType" AS ENUM ('blog', 'snippet');

-- CreateTable
CREATE TABLE "stats" (
    "type" "StatsType" NOT NULL DEFAULT 'blog',
    "slug" VARCHAR(255) NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "loves" INTEGER NOT NULL DEFAULT 0,
    "applauses" INTEGER NOT NULL DEFAULT 0,
    "ideas" INTEGER NOT NULL DEFAULT 0,
    "bullseye" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "stats_pkey" PRIMARY KEY ("type","slug")
);

-- Enable RLS on all tables in the public schema.
-- Access model: Prisma server-side only (service role via DATABASE_URL).
-- supabase-js / PostgREST (anon/authenticated keys) NOT used in this codebase, so
-- deny everything by default. RLS only applies to non-owner/superuser roles.
ALTER TABLE "stats" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stats_no_access" ON "stats" AS PERMISSIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prisma_migrations_no_access" ON "_prisma_migrations" AS PERMISSIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
