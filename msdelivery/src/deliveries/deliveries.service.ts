import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DeliveryStatus, DeliveryPersonStatus } from '@prisma/client';
import { OrdersRabbitMQClient } from '../rabbitmq/orders-rabbitmq.client';

const MAX_DELIVERY_RADIUS_KM = 15; // Raio máximo de 15km

@Injectable()
export class DeliveriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersRabbitMQClient: OrdersRabbitMQClient,
  ) {}

  /**
   * Calcula a distância em km entre duas coordenadas usando a fórmula de Haversine
   */
  private calculateDistanceKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Raio da Terra em km
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

  /**
   * Busca coordenadas a partir de um endereço usando API externa (Nominatim/OpenStreetMap)
   */
  async geocodeAddress(address: string): Promise<{ latitude: number; longitude: number } | null> {
    try {
      const encodedAddress = encodeURIComponent(address);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`,
        {
          headers: {
            'User-Agent': 'DeliveryCefet/1.0',
          },
        },
      );
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        return {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
        };
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao geocodificar endereço:', error);
      return null;
    }
  }

  /**
   * Calcula tempo estimado de entrega baseado na distância
   * Velocidade média: 30 km/h para motos, 20 km/h para bicicletas
   */
  private calculateEstimatedDeliveryTime(distanceKm: number, vehicleType: string): number {
    const avgSpeed = vehicleType === 'BICYCLE' ? 20 : 30; // km/h
    const timeInHours = distanceKm / avgSpeed;
    const timeInMinutes = Math.ceil(timeInHours * 60);
    // Adiciona 10 minutos de margem para coleta
    return timeInMinutes + 10;
  }

  async findByOrderId(orderId: number) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { orderId },
      include: { deliveryPerson: true },
    });

    return delivery;
  }

  async findByStatuses(statuses: string[]) {
    const statusList = statuses.length > 0 
      ? statuses.map(s => s as DeliveryStatus)
      : [DeliveryStatus.PENDING, DeliveryStatus.ASSIGNED, DeliveryStatus.PICKED_UP, DeliveryStatus.IN_TRANSIT];

    const deliveries = await this.prisma.delivery.findMany({
      where: { status: { in: statusList } },
      include: { deliveryPerson: true },
      orderBy: { createdAt: 'desc' },
    });

    return deliveries;
  }

  async findByDeliveryPersonId(deliveryPersonId: number) {
    const deliveries = await this.prisma.delivery.findMany({
      where: { deliveryPersonId },
      include: { deliveryPerson: true },
      orderBy: { createdAt: 'desc' },
    });

    return deliveries;
  }

  async create(data: {
    orderId: number;
    customerLatitude: number;
    customerLongitude: number;
    customerAddress: string;
  }) {
    // Verificar se já existe entrega para este pedido
    const existing = await this.prisma.delivery.findUnique({
      where: { orderId: data.orderId },
    });

    if (existing) {
      throw new BadRequestException(`Já existe uma entrega para o pedido ${data.orderId}`);
    }

    const delivery = await this.prisma.delivery.create({
      data: {
        orderId: data.orderId,
        customerLatitude: data.customerLatitude,
        customerLongitude: data.customerLongitude,
        customerAddress: data.customerAddress,
        status: DeliveryStatus.PENDING,
      },
      include: { deliveryPerson: true },
    });

    return delivery;
  }

  async assignDelivery(orderId: number, deliveryPersonId?: number) {
    // Buscar entrega existente ou criar se não existir
    let delivery = await this.prisma.delivery.findUnique({
      where: { orderId },
      include: { deliveryPerson: true },
    });

    if (!delivery) {
      // Buscar dados do pedido do msorders via RabbitMQ
      console.log(`Buscando dados do pedido ${orderId} no msorders via RabbitMQ...`);
      
      let orderData: any;
      try {
        orderData = await this.ordersRabbitMQClient.getOrder(orderId);
        
        if (!orderData || orderData.error) {
          throw new NotFoundException(`Pedido ${orderId} não encontrado no msorders: ${orderData?.error || 'Desconhecido'}`);
        }
        
        console.log(`Pedido encontrado via RabbitMQ: Cliente ${orderData.customerName}, Endereço: ${orderData.deliveryAddress?.street}`);
      } catch (error) {
        throw new NotFoundException(`Erro ao buscar pedido ${orderId}: ${error.message}`);
      }

      // Verificar se o pedido tem endereço de entrega
      if (!orderData.deliveryAddress) {
        throw new BadRequestException(`Pedido ${orderId} não possui endereço de entrega`);
      }

      let customerLatitude = orderData.deliveryAddress.latitude;
      let customerLongitude = orderData.deliveryAddress.longitude;

      // Se o pedido não tem coordenadas, tentar geocodificar o endereço
      if (!customerLatitude || !customerLongitude) {
        console.log(`Coordenadas não encontradas, geocodificando endereço...`);
        
        const fullAddress = `${orderData.deliveryAddress.street}, ${orderData.deliveryAddress.number}, ${orderData.deliveryAddress.neighborhood}, ${orderData.deliveryAddress.city}, ${orderData.deliveryAddress.state}, ${orderData.deliveryAddress.zipCode}`;
        
        const coords = await this.geocodeAddress(fullAddress);
        
        if (!coords) {
          throw new BadRequestException(`Não foi possível geocodificar o endereço: ${fullAddress}`);
        }
        
        customerLatitude = coords.latitude;
        customerLongitude = coords.longitude;
        
        console.log(`Endereço geocodificado: (${customerLatitude}, ${customerLongitude})`);
      }

      // Criar entrega com dados reais do pedido
      const fullAddress = `${orderData.deliveryAddress.street}, ${orderData.deliveryAddress.number}${orderData.deliveryAddress.complement ? ', ' + orderData.deliveryAddress.complement : ''}, ${orderData.deliveryAddress.neighborhood}, ${orderData.deliveryAddress.city}/${orderData.deliveryAddress.state}`;
      
      delivery = await this.prisma.delivery.create({
        data: {
          orderId,
          customerLatitude,
          customerLongitude,
          customerAddress: fullAddress,
          status: DeliveryStatus.PENDING,
        },
        include: { deliveryPerson: true },
      });
    }

    if (delivery.status !== DeliveryStatus.PENDING) {
      throw new BadRequestException(`Entrega já foi atribuída ou está em andamento. Status atual: ${delivery.status}`);
    }

    let assignedDeliveryPersonId = deliveryPersonId;
    let selectedDeliveryPerson: any = null;
    let distanceToCustomer = 0;

    // Se não foi especificado um entregador, buscar o mais próximo disponível dentro do raio de 15km
    if (!assignedDeliveryPersonId) {
      // Buscar todos os entregadores disponíveis com localização
      const availableDeliveryPersons = await this.prisma.deliveryPerson.findMany({
        where: {
          status: DeliveryPersonStatus.AVAILABLE,
          isActive: true,
          currentLatitude: { not: null },
          currentLongitude: { not: null },
        },
      });

      if (availableDeliveryPersons.length === 0) {
        throw new BadRequestException('Nenhum entregador disponível no momento');
      }

      // Calcular distância de cada entregador até o cliente e ordenar
      const deliveryPersonsWithDistance = availableDeliveryPersons
        .map((person) => ({
          ...person,
          distance: this.calculateDistanceKm(
            person.currentLatitude!,
            person.currentLongitude!,
            delivery!.customerLatitude,
            delivery!.customerLongitude,
          ),
        }))
        .filter((person) => person.distance <= MAX_DELIVERY_RADIUS_KM) // Filtrar apenas dentro do raio de 15km
        .sort((a, b) => a.distance - b.distance); // Ordenar por distância (mais próximo primeiro)

      if (deliveryPersonsWithDistance.length === 0) {
        throw new BadRequestException(
          `Nenhum entregador disponível dentro do raio de ${MAX_DELIVERY_RADIUS_KM}km. ` +
          `Coordenadas do cliente: (${delivery.customerLatitude}, ${delivery.customerLongitude})`,
        );
      }

      // Selecionar o entregador mais próximo
      selectedDeliveryPerson = deliveryPersonsWithDistance[0];
      assignedDeliveryPersonId = selectedDeliveryPerson.id;
      distanceToCustomer = selectedDeliveryPerson.distance;

      console.log(`Entregador mais próximo: ${selectedDeliveryPerson.name} a ${distanceToCustomer.toFixed(2)}km`);
    } else {
      // Se foi especificado um entregador, verificar se está disponível
      selectedDeliveryPerson = await this.prisma.deliveryPerson.findUnique({
        where: { id: assignedDeliveryPersonId },
      });

      if (selectedDeliveryPerson?.currentLatitude && selectedDeliveryPerson?.currentLongitude) {
        distanceToCustomer = this.calculateDistanceKm(
          selectedDeliveryPerson.currentLatitude,
          selectedDeliveryPerson.currentLongitude,
          delivery.customerLatitude,
          delivery.customerLongitude,
        );
      }
    }

    // Verificar se o entregador existe e está disponível
    const deliveryPerson = selectedDeliveryPerson || await this.prisma.deliveryPerson.findUnique({
      where: { id: assignedDeliveryPersonId },
    });

    if (!deliveryPerson) {
      throw new NotFoundException(`Entregador ${assignedDeliveryPersonId} não encontrado`);
    }

    if (!deliveryPerson.isActive) {
      throw new BadRequestException(`Entregador ${deliveryPerson.name} está inativo`);
    }

    if (deliveryPerson.status !== DeliveryPersonStatus.AVAILABLE) {
      throw new BadRequestException(`Entregador ${deliveryPerson.name} não está disponível. Status: ${deliveryPerson.status}`);
    }

    // Calcular tempo estimado de entrega baseado na distância e tipo de veículo
    const estimatedDeliveryTime = this.calculateEstimatedDeliveryTime(
      distanceToCustomer,
      deliveryPerson.vehicleType,
    );

    // Atualizar entrega com o entregador
    delivery = await this.prisma.delivery.update({
      where: { id: delivery.id },
      data: {
        deliveryPersonId: assignedDeliveryPersonId,
        status: DeliveryStatus.ASSIGNED,
        assignedAt: new Date(),
        estimatedDeliveryTime,
      },
      include: { deliveryPerson: true },
    });

    // Atualizar status do entregador para BUSY
    await this.prisma.deliveryPerson.update({
      where: { id: assignedDeliveryPersonId },
      data: { status: DeliveryPersonStatus.BUSY },
    });

    console.log(
      `Entrega ${delivery.id} atribuída ao entregador ${deliveryPerson.name} ` +
      `(${deliveryPerson.vehicleType}) - Distância: ${distanceToCustomer.toFixed(2)}km - ` +
      `Tempo estimado: ${estimatedDeliveryTime} minutos`,
    );

    return delivery;
  }

  async updateStatus(deliveryId: number, status: string) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
    });

    if (!delivery) {
      throw new NotFoundException(`Entrega ${deliveryId} não encontrada`);
    }

    const newStatus = status as DeliveryStatus;
    const updateData: any = { status: newStatus };

    // Atualizar timestamps conforme status
    if (newStatus === DeliveryStatus.PICKED_UP) {
      updateData.pickedUpAt = new Date();
    } else if (newStatus === DeliveryStatus.DELIVERED) {
      updateData.deliveredAt = new Date();
      // Calcular tempo real de entrega
      if (delivery.assignedAt) {
        updateData.actualDeliveryTime = Math.round(
          (new Date().getTime() - delivery.assignedAt.getTime()) / 60000
        );
      }
    } else if (newStatus === DeliveryStatus.CANCELLED) {
      updateData.cancelledAt = new Date();
    }

    const updatedDelivery = await this.prisma.delivery.update({
      where: { id: deliveryId },
      data: updateData,
      include: { deliveryPerson: true },
    });

    // Se entrega foi finalizada, liberar entregador
    const finalStatuses: DeliveryStatus[] = [DeliveryStatus.DELIVERED, DeliveryStatus.CANCELLED, DeliveryStatus.FAILED];
    if (finalStatuses.includes(newStatus)) {
      if (delivery.deliveryPersonId) {
        await this.prisma.deliveryPerson.update({
          where: { id: delivery.deliveryPersonId },
          data: { 
            status: DeliveryPersonStatus.AVAILABLE,
            totalDeliveries: newStatus === DeliveryStatus.DELIVERED 
              ? { increment: 1 } 
              : undefined,
          },
        });
      }
    }

    return updatedDelivery;
  }
}
