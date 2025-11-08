-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'FAILED');

-- CreateTable
CREATE TABLE "deliveries" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "deliveryPersonId" INTEGER,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "customerLatitude" DOUBLE PRECISION NOT NULL,
    "customerLongitude" DOUBLE PRECISION NOT NULL,
    "customerAddress" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3),
    "pickedUpAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "estimatedDeliveryTime" INTEGER,
    "actualDeliveryTime" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "deliveries_orderId_key" ON "deliveries"("orderId");

-- CreateIndex
CREATE INDEX "deliveries_orderId_idx" ON "deliveries"("orderId");

-- CreateIndex
CREATE INDEX "deliveries_deliveryPersonId_idx" ON "deliveries"("deliveryPersonId");

-- CreateIndex
CREATE INDEX "deliveries_status_idx" ON "deliveries"("status");

-- CreateIndex
CREATE INDEX "delivery_persons_status_idx" ON "delivery_persons"("status");

-- CreateIndex
CREATE INDEX "delivery_persons_email_idx" ON "delivery_persons"("email");

-- CreateIndex
CREATE INDEX "delivery_persons_phone_idx" ON "delivery_persons"("phone");

-- CreateIndex
CREATE INDEX "delivery_persons_licensePlate_idx" ON "delivery_persons"("licensePlate");

-- CreateIndex
CREATE INDEX "delivery_persons_currentLatitude_currentLongitude_idx" ON "delivery_persons"("currentLatitude", "currentLongitude");

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_deliveryPersonId_fkey" FOREIGN KEY ("deliveryPersonId") REFERENCES "delivery_persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
