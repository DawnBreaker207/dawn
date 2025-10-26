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
