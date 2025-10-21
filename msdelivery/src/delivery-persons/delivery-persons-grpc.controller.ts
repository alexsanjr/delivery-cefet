import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { DeliveryPersonsService } from './delivery-persons.service';
import { DeliveryPersonStatus } from '@prisma/client';

interface FindAvailableRequest {
  latitude: number;
  longitude: number;
  radiusKm: number;
  vehicleType?: string;
}

interface DeliveryPersonInfo {
  id: string;
  name: string;
  vehicleType: string;
  currentLatitude: number;
  currentLongitude: number;
  rating: number;
  totalDeliveries: number;
  distanceKm: number;
  estimatedTimeMinutes: number;
}

interface DeliveryPersonsList {
  deliveryPersons: DeliveryPersonInfo[];
}

interface GetLocationRequest {
  deliveryPersonId: string;
}

interface LocationResponse {
  success: boolean;
  latitude: number;
  longitude: number;
  timestamp: string;
  speed: number;
  heading: number;
}

@Controller()
export class DeliveryPersonsGrpcController {
  constructor(private readonly deliveryPersonsService: DeliveryPersonsService) {}

  @GrpcMethod('DeliveryService', 'FindAvailableDeliveryPersons')
  async findAvailableDeliveryPersons(
    data: FindAvailableRequest,
  ): Promise<DeliveryPersonsList> {
    const { latitude, longitude, radiusKm, vehicleType } = data;

    let deliveryPersons = await this.deliveryPersonsService.findAvailableNearby(
      latitude,
      longitude,
      radiusKm,
    );

    if (vehicleType) {
      deliveryPersons = deliveryPersons.filter((dp) => dp.vehicleType === vehicleType);
    }

    const deliveryPersonsInfo: DeliveryPersonInfo[] = deliveryPersons.map((dp) => {
      const distance = this.calculateDistance(
        latitude,
        longitude,
        dp.currentLatitude!,
        dp.currentLongitude!,
      );

      const estimatedTime = Math.ceil((distance / 30) * 60);

      return {
        id: dp.id,
        name: dp.name,
        vehicleType: dp.vehicleType,
        currentLatitude: dp.currentLatitude!,
        currentLongitude: dp.currentLongitude!,
        rating: dp.rating,
        totalDeliveries: dp.totalDeliveries,
        distanceKm: parseFloat(distance.toFixed(2)),
        estimatedTimeMinutes: estimatedTime,
      };
    });

    return { deliveryPersons: deliveryPersonsInfo };
  }

  @GrpcMethod('DeliveryService', 'GetDeliveryPersonLocation')
  async getDeliveryPersonLocation(data: GetLocationRequest): Promise<LocationResponse> {
    const deliveryPerson = await this.deliveryPersonsService.findOne(data.deliveryPersonId);

    return {
      success: true,
      latitude: deliveryPerson.currentLatitude || 0,
      longitude: deliveryPerson.currentLongitude || 0,
      timestamp: deliveryPerson.lastLocationUpdate?.toISOString() || new Date().toISOString(),
      speed: 0,
      heading: 0,
    };
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
