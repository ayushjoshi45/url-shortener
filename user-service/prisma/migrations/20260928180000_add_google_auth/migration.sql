-- AlterTable: allow password-less (Google-only) accounts
ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;

-- AlterTable: link Google accounts
ALTER TABLE "users" ADD COLUMN "googleId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");
