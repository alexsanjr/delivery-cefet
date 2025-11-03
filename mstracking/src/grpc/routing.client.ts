// No MSTracking - src/grpc/clients/routing.client.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Client, ClientGrpc, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { Observable } from 'rxjs';

interface RoutingGrpcService {
  CalculateETA(request: {
    origin: Point;
    destination: Point;
    strategy: string;
    traffic_level: number;
  }): Observable<{ eta_minutes: number }>;
}

@Injectable()
export class RoutingGrpcClient implements OnModuleInit {
  @Client({
    transport: Transport.GRPC,
    options: {
      package: 'routing',
      protoPath: join(__dirname, '../../shared/protos/routing.proto'),
      url: 'localhost:50054', // MSRouting port
    },
  })
  private client: ClientGrpc;

  private routingService: RoutingGrpcService;

  onModuleInit() {
    this.routingService = this.client.getService<RoutingGrpcService>('RoutingService');
  }

  async calculateETA(origin: Point, destination: Point, strategy: string = 'fastest'): Promise<number> {
    const response = await this.routingService.CalculateETA({
      origin,
      destination,
      strategy,
      traffic_level: 1,
    }).toPromise();
    
    return response.eta_minutes;
  }
}