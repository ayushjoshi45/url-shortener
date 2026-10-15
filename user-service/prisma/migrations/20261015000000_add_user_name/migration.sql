-- AlterTable: editable display name (null = fall back to email local-part)
ALTER TABLE "users" ADD COLUMN "name" TEXT;
