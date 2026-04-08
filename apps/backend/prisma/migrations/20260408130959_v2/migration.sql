/*
  Warnings:

  - You are about to drop the column `description` on the `user_skills` table. All the data in the column will be lost.
  - You are about to drop the column `emailLower` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `onboardingStep` on the `users` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "user_roles_enum" AS ENUM ('user', 'admin');

-- AlterTable
ALTER TABLE "user_skills" DROP COLUMN "description";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "emailLower",
DROP COLUMN "onboardingStep",
ADD COLUMN     "role" "user_roles_enum" NOT NULL DEFAULT 'user';
