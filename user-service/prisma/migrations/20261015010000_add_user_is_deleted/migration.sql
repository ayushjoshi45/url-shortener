-- AlterTable: soft-delete flag; deleted accounts can never log in or re-register
ALTER TABLE "users" ADD COLUMN "isDeleted" BOOLEAN NOT NULL DEFAULT false;
