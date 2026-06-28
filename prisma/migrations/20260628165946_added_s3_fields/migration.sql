/*
  Warnings:

  - Changed the type of `context` on the `projects` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "last_backup_at" TIMESTAMP(3),
ADD COLUMN     "s3_backup_key" TEXT,
DROP COLUMN "context",
ADD COLUMN     "context" JSONB NOT NULL;
