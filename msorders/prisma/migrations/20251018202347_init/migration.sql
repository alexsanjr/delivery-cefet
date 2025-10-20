/*
  Warnings:

  - You are about to drop the column `totalAmount` on the `orders` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "orders" DROP COLUMN "totalAmount",
ALTER COLUMN "subtotal" SET DEFAULT 0,
ALTER COLUMN "deliveryFee" SET DEFAULT 0,
ALTER COLUMN "total" SET DEFAULT 0;