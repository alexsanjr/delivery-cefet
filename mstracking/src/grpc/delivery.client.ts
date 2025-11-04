import { Injectable, OnModuleInit } from '@nestjs/common';
import { Client, ClientGrpc } from '@nestjs/microservices';
import { join } from 'path';
import { Observable } from 'rxjs';

interface DeliveryGrpcService {
  AssignDeliveryPerson(request: { delivery_id: string; person_id: string }): Observable<any>;
  UpdateDeliveryStatus(request: { delivery_id: string; status: string }): Observable<any>;
}

@Injectable()
export class DeliveryGrpcClient implements OnModuleInit {
  @Client({
    transport: Transport.GRPC,
    options: {
      package: 'delivery',
      protoPath: join(__dirname, '../../shared/protos/delivery.proto'),
      url: 'localhost:50052',
    },
  })
  private client: ClientGrpc;

  private deliveryService: DeliveryGrpcService;

  onModuleInit() {
    this.deliveryService = this.client.getService<DeliveryGrpcService>('DeliveryService');
  }

  async assignDeliveryPerson(deliveryId: string, personId: string): Promise<any> {
    return this.deliveryService.AssignDeliveryPerson({ 
      delivery_id: deliveryId, 
      person_id: personId 
    }).toPromise();
  }

  async updateDeliveryStatus(deliveryId: string, status: string): Promise<any> {
    return this.deliveryService.UpdateDeliveryStatus({ 
      delivery_id: deliveryId, 
      status 
    }).toPromise();
  }
}