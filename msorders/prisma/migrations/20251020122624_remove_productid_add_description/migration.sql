/*
  Warnings:

  - You are about to drop the column `productId` on the `order_items` table. All the data in the column will be lost.
  - You are about to drop the column `total` on the `order_items` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "order_items" DROP COLUMN "productId",
DROP COLUMN "total",
ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "orders" ALTER COLUMN "subtotal" DROP DEFAULT,
ALTER COLUMN "deliveryFee" DROP DEFAULT,
ALTER COLUMN "total" DROP DEFAULT;
