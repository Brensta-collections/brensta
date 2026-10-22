-- Wishlist: allow guest ownership via httpOnly brensta_guest cookie.
-- Additive only: userId becomes nullable, guestToken added, new unique index.
-- Application invariant: exactly one of (userId, guestToken) is non-null per row.

-- AlterTable
ALTER TABLE "Wishlist" ADD COLUMN     "guestToken" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Wishlist_guestToken_idx" ON "Wishlist"("guestToken");

-- CreateIndex
CREATE UNIQUE INDEX "Wishlist_guestToken_productId_key" ON "Wishlist"("guestToken", "productId");
