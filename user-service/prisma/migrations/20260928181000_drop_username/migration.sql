-- DropIndex
DROP INDEX "users_username_key";

-- AlterTable: username is now derived from the email local-part, not stored
ALTER TABLE "users" DROP COLUMN "username";
