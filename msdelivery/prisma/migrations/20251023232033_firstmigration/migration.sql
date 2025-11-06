-- CreateEnum
CREATE TYPE "DeliveryPersonStatus" AS ENUM ('AVAILABLE', 'BUSY', 'OFFLINE', 'ON_BREAK');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('BIKE', 'MOTORCYCLE', 'CAR', 'SCOOTER', 'WALKING');

-- CreateTable
CREATE TABLE "delivery_persons" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "vehicleType" "VehicleType" NOT NULL,
    "licensePlate" TEXT,
    "status" "DeliveryPersonStatus" NOT NULL DEFAULT 'OFFLINE',
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "totalDeliveries" INTEGER NOT NULL DEFAULT 0,
    "currentLatitude" DOUBLE PRECISION,
    "currentLongitude" DOUBLE PRECISION,
    "lastLocationUpdate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_persons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "delivery_persons_email_key" ON "delivery_persons"("email");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_persons_cpf_key" ON "delivery_persons"("cpf");

-- CreateIndex
CREATE INDEX "delivery_persons_status_idx" ON "delivery_persons"("status");

-- CreateIndex
CREATE INDEX "delivery_persons_email_idx" ON "delivery_persons"("email");

-- CreateIndex
CREATE INDEX "delivery_persons_currentLatitude_currentLongitude_idx" ON "delivery_persons"("currentLatitude", "currentLongitude");
