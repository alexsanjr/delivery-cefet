import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersClient } from '../grpc/orders.client';
import { DeliveryPersonsService } from '../delivery-persons/delivery-persons.service';
import { GeoUtils } from '../utils/geo.utils';
import { GeocodingService } from '../utils/geocoding.service';

@Injectable()
export class DeliveriesService {
  private readonly logger = new Logger(DeliveriesService.name);
  private readonly SEARCH_RADIUS_KM = 15;

  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersClient: OrdersClient,
    private readonly deliveryPersonsService: DeliveryPersonsService,
    private readonly geocodingService: GeocodingService,
  ) {}

  async assignDeliveryToOrder(orderId: number) {
    this.logger.log(`Iniciando atribuição de entrega para pedido ${orderId}`);

    const orderData: any = await this.ordersClient.getOrder(orderId);

    if (orderData.error) {
      throw new BadRequestException(`Erro ao buscar pedido: ${orderData.error}`);
    }

    if (orderData.status !== 'PREPARING') {
      throw new BadRequestException(
        `Pedido deve estar com status PREPARING. Status atual: ${orderData.status}`,
      );
    }

    const existingDelivery = await (this.prisma as any).delivery.findUnique({
      where: { orderId },
    });

    if (existingDelivery) {
      throw new BadRequestException('Pedido já possui uma entrega atribuída');
    }

    const deliveryAddress = orderData.deliveryAddress;
    let customerLat = deliveryAddress.latitude;
    let customerLon = deliveryAddress.longitude;

    if (!customerLat || !customerLon) {
      this.logger.log('Coordenadas não encontradas no endereço, buscando via API de geocoding...');
      
      const fullAddress = this.geocodingService.formatAddress(deliveryAddress);
      const coordinates = await this.geocodingService.getCoordinatesFromAddress(fullAddress);

      if (!coordinates) {
        throw new BadRequestException(
          'Não foi possível obter as coordenadas do endereço de entrega',
        );
      }

      customerLat = coordinates.latitude;
      customerLon = coordinates.longitude;
      
      this.logger.log(`Coordenadas obtidas via geocoding: ${customerLat}, ${customerLon}`);
    }

    const availableDeliveryPersons = 
      await this.deliveryPersonsService.findAvailableNearby(
        customerLat,
        customerLon,
        this.SEARCH_RADIUS_KM,
      );

    if (availableDeliveryPersons.length === 0) {
      throw new BadRequestException(
        'Não há entregadores disponíveis no momento',
      );
    }

    const nearestDeliveryPerson = this.findNearestDeliveryPerson(
      availableDeliveryPersons,
      customerLat,
      customerLon,
    );

    const delivery = await (this.prisma as any).delivery.create({
      data: {
        orderId,
        deliveryPersonId: nearestDeliveryPerson.id,
        status: 'ASSIGNED',
        customerLatitude: customerLat,
        customerLongitude: customerLon,
        customerAddress: this.formatAddress(deliveryAddress),
        assignedAt: new Date(),
        estimatedDeliveryTime: orderData.estimatedDeliveryTime,
      },
      include: {
        deliveryPerson: true,
      },
    });

    await this.deliveryPersonsService.updateStatus({
      deliveryPersonId: nearestDeliveryPerson.id,
      status: 'BUSY' as any,
    });

    await this.ordersClient.updateOrderStatus(orderId, 'OUT_FOR_DELIVERY');

    this.logger.log(
      `Entrega atribuída com sucesso. Pedido ${orderId} -> Entregador ${nearestDeliveryPerson.id}`,
    );

    return delivery;
  }

  private findNearestDeliveryPerson(
    deliveryPersons: any[],
    customerLat: number,
    customerLon: number,
  ) {
    let nearest = deliveryPersons[0];
    let minDistance = GeoUtils.calculateDistance(
      customerLat,
      customerLon,
      nearest.currentLatitude,
      nearest.currentLongitude,
    );

    for (const person of deliveryPersons) {
      const distance = GeoUtils.calculateDistance(
        customerLat,
        customerLon,
        person.currentLatitude,
        person.currentLongitude,
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearest = person;
      }
    }

    return nearest;
  }

  private formatAddress(address: any): string {
    return `${address.street}, ${address.number}${address.complement ? ' - ' + address.complement : ''}, ${address.neighborhood}, ${address.city}/${address.state}`;
  }

  async findAll() {
    return (this.prisma as any).delivery.findMany({
      include: {
        deliveryPerson: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByOrderId(orderId: number) {
    return (this.prisma as any).delivery.findUnique({
      where: { orderId },
      include: {
        deliveryPerson: true,
      },
    });
  }

  async findByDeliveryPersonId(deliveryPersonId: number) {
    return (this.prisma as any).delivery.findMany({
      where: { deliveryPersonId },
      include: {
        deliveryPerson: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
