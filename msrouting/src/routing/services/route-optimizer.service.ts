import { Injectable } from '@nestjs/common';
import { Point, DeliveryPoint, Vehicle } from '../dto/routing.objects';

interface OptimizedRoute {
  vehicle: Vehicle;
  deliveries: DeliveryPoint[];
  sequence: number[];
  total_distance: number;
  total_duration: number;
}

@Injectable()
export class RouteOptimizerService {
  async solveVRP(
    depot: Point,
    deliveries: DeliveryPoint[],
    vehicles: Vehicle[],
  ): Promise<OptimizedRoute[]> {
    const points = [depot, ...deliveries.map(d => d.location)];
    const distanceMatrix = await this.calculateDistanceMatrix(points);
    const clusters = this.clusterDeliveries(deliveries, vehicles, distanceMatrix);

    const optimizedRoutes: OptimizedRoute[] = [];

    for (let i = 0; i < clusters.length; i++) {
      if (clusters[i].length > 0) {
        const vehicle = vehicles[i] || vehicles[0];
        const route = await this.solveTSPForCluster(depot, clusters[i], distanceMatrix, vehicle);
        optimizedRoutes.push(route);
      }
    }

    return optimizedRoutes;
  }

  private async calculateDistanceMatrix(points: Point[]): Promise<number[][]> {
    const matrix: number[][] = [];
    
    for (let i = 0; i < points.length; i++) {
      matrix[i] = [];
      for (let j = 0; j < points.length; j++) {
        if (i === j) {
          matrix[i][j] = 0;
        } else {
          matrix[i][j] = this.haversineDistance(points[i], points[j]);
        }
      }
    }
    
    return matrix;
  }

  private clusterDeliveries(
    deliveries: DeliveryPoint[],
    vehicles: Vehicle[],
    distanceMatrix: number[][]
  ): DeliveryPoint[][] {
    const clusters: DeliveryPoint[][] = Array(vehicles.length).fill(null).map(() => []);
    const sortedDeliveries = [...deliveries].sort((a, b) => {
      const aIndex = deliveries.indexOf(a) + 1;
      const bIndex = deliveries.indexOf(b) + 1;
      return distanceMatrix[0][aIndex] - distanceMatrix[0][bIndex];
    });
    
    const vehicleCapacities = vehicles.map(v => v.capacity_kg);
    const vehicleWorkloads = Array(vehicles.length).fill(0);
    
    for (const delivery of sortedDeliveries) {
      let bestVehicle = -1;
      let bestCost = Infinity;
      
      for (let i = 0; i < vehicles.length; i++) {
        if (vehicleWorkloads[i] < vehicleCapacities[i]) {
          const deliveryIndex = deliveries.indexOf(delivery) + 1;
          const cost = distanceMatrix[0][deliveryIndex] * (1 + vehicleWorkloads[i] / vehicleCapacities[i]);
          
          if (cost < bestCost) {
            bestCost = cost;
            bestVehicle = i;
          }
        }
      }
      
      if (bestVehicle !== -1) {
        clusters[bestVehicle].push(delivery);
        vehicleWorkloads[bestVehicle]++;
      }
    }
    
    return clusters;
  }

  private async solveTSPForCluster(
    depot: Point,
    deliveries: DeliveryPoint[],
    distanceMatrix: number[][],
    vehicle: Vehicle
  ): Promise<OptimizedRoute> {
    if (deliveries.length === 0) {
      return {
        vehicle,
        deliveries: [],
        sequence: [],
        total_distance: 0,
        total_duration: 0,
      };
    }
    
    const unvisited = [...deliveries];
    const sequence: number[] = [0];
    
    let currentIndex = 0;
    let totalDistance = 0;
    
    while (unvisited.length > 0) {
      let nearestIndex = -1;
      let nearestDistance = Infinity;
      
      for (let i = 0; i < unvisited.length; i++) {
        const deliveryIndex = deliveries.indexOf(unvisited[i]) + 1;
        const distance = distanceMatrix[currentIndex][deliveryIndex];
        
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = i;
        }
      }
      
      if (nearestIndex !== -1) {
        const nearestDelivery = unvisited[nearestIndex];
        const deliveryIndex = deliveries.indexOf(nearestDelivery) + 1;
        
        sequence.push(deliveryIndex);
        totalDistance += nearestDistance;
        currentIndex = deliveryIndex;
        unvisited.splice(nearestIndex, 1);
      }
    }
    
    totalDistance += distanceMatrix[currentIndex][0];
    sequence.push(0);
    
    const totalDuration = this.calculateRouteDuration(totalDistance, deliveries, sequence, vehicle.max_speed_kph);
    
    return {
      vehicle,
      deliveries,
      sequence,
      total_distance: Math.round(totalDistance),
      total_duration: Math.round(totalDuration),
    };
  }

  private calculateRouteDuration(
    distance: number,
    deliveries: DeliveryPoint[],
    sequence: number[],
    speed: number
  ): number {
    const travelTime = (distance / 1000) / speed * 3600;
    const serviceTime = deliveries.reduce((sum, delivery) => sum + delivery.service_time_seconds, 0);
    
    return travelTime + serviceTime;
  }

  private haversineDistance(point1: Point, point2: Point): number {
    const R = 6371000;
    const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
    const dLon = (point2.longitude - point1.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}