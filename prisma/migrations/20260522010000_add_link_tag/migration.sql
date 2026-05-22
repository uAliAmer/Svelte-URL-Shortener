-- AlterTable
ALTER TABLE "Link" ADD COLUMN "tag" TEXT;

-- CreateIndex
CREATE INDEX "Link_userId_tag_idx" ON "Link"("userId", "tag");
