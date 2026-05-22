-- AlterTable
ALTER TABLE "Post" ADD COLUMN "injectedById" TEXT;
ALTER TABLE "Post" ADD COLUMN "label" TEXT;
ALTER TABLE "Post" ADD COLUMN "scheduledFor" DATETIME;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "verifiedType" TEXT;
