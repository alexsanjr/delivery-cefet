import { Inject, Injectable } from '@nestjs/common';
import { DeliveryEntity } from '../../../domain/entities/delivery.entity';
import { DeliveryPersonStatus } from '../../../domain/enums/delivery-person-status.enum';
import { 
  IDeliveryRepository, 
  DELIVERY_REPOSITORY 
} from '../../../domain/repositories/delivery.repository.interface';
import { 
  IDeliveryPersonRepository, 
  DELIVERY_PERSON_REPOSITORY 
} from '../../../domain/repositories/delivery-person.repository.interface';
import { EntityNotFoundException } from '../../../domain/exceptions/entity-not-found.exception';
import { BusinessRuleException } from '../../../domain/exceptions/business-rule.exception';
import { AssignDeliveryDto } from '../../dtos/delivery/assign-delivery.dto';
import { IOrdersClient, ORDERS_CLIENT } from '../../ports/out/orders-client.port';
import { IGeocodingService, GEOCODING_SERVICE } from '../../ports/out/geocoding-service.port';
import { Location } from '../../../domain/value-objects/location.vo';

const MAX_DELIVERY_RADIUS_KM = 15;

@Injectable()
export class AssignDeliveryUseCase {
  constructor(
    @Inject(DELIVERY_REPOSITORY)
    private readonly deliveryRepository: IDeliveryRepository,
    @Inject(DELIVERY_PERSON_REPOSITORY)
    private readonly deliveryPersonRepository: IDeliveryPersonRepository,
    @Inject(ORDERS_CLIENT)
    private readonly ordersClient: IOrdersClient,
    @Inject(GEOCODING_SERVICE)
    private readonly geocodingService: IGeocodingService,
  ) {}

  async execute(dto: AssignDeliveryDto): Promise<DeliveryEntity> {
    // Buscar entrega existente
    let delivery = await this.deliveryRepository.findByOrderId(dto.orderId);

    // Se não existe, criar a partir dos dados do pedido
    if (!delivery) {
      delivery = await this.createDeliveryFromOrder(dto.orderId);
    }

    // Verificar se pode ser atribuída
    if (!delivery.canBeAssigned()) {
      throw new BusinessRuleException(
        `Entrega já foi atribuída ou está em andamento. Status atual: ${delivery.status}`,
      );
    }

    // Encontrar entregador
    const deliveryPerson = dto.deliveryPersonId
      ? await this.findSpecificDeliveryPerson(dto.deliveryPersonId)
      : await this.findNearestAvailableDeliveryPerson(delivery.customerLocation);

    // Calcular distância e tempo estimado
    const distanceToCustomer = deliveryPerson.currentLocation
      ? deliveryPerson.currentLocation.distanceTo(delivery.customerLocation)
      : 0;

    const estimatedDeliveryTime = this.calculateEstimatedDeliveryTime(
      distanceToCustomer,
      deliveryPerson.vehicleType,
    );

    // Atribuir entrega
    delivery.assign(deliveryPerson.id!, estimatedDeliveryTime);

    // Atualizar entrega
    const updatedDelivery = await this.deliveryRepository.update(delivery);

    // Mudar status do entregador para BUSY
    deliveryPerson.changeStatus(DeliveryPersonStatus.BUSY);
    await this.deliveryPersonRepository.update(deliveryPerson);

    return updatedDelivery;
  }

  private async createDeliveryFromOrder(orderId: number): Promise<DeliveryEntity> {
    const orderData = await this.ordersClient.getOrder(orderId);

    if (!orderData) {
      throw new EntityNotFoundException('Pedido', orderId);
    }

    if (!orderData.deliveryAddress) {
      throw new BusinessRuleException(`Pedido ${orderId} não possui endereço de entrega`);
    }

    let customerLocation: Location;

    if (orderData.deliveryAddress.latitude && orderData.deliveryAddress.longitude) {
      customerLocation = Location.create(
        orderData.deliveryAddress.latitude,
        orderData.deliveryAddress.longitude,
      );
    } else {
      const fullAddress = `${orderData.deliveryAddress.street}, ${orderData.deliveryAddress.number}, ${orderData.deliveryAddress.neighborhood}, ${orderData.deliveryAddress.city}, ${orderData.deliveryAddress.state}, ${orderData.deliveryAddress.zipCode}`;
      
      const coords = await this.geocodingService.geocode(fullAddress);
      
      if (!coords) {
        throw new BusinessRuleException(`Não foi possível geocodificar o endereço: ${fullAddress}`);
      }
      
      customerLocation = Location.create(coords.latitude, coords.longitude);
    }

    const fullAddress = `${orderData.deliveryAddress.street}, ${orderData.deliveryAddress.number}${orderData.deliveryAddress.complement ? ', ' + orderData.deliveryAddress.complement : ''}, ${orderData.deliveryAddress.neighborhood}, ${orderData.deliveryAddress.city}/${orderData.deliveryAddress.state}`;

    const delivery = DeliveryEntity.create({
      orderId,
      customerLocation,
      customerAddress: fullAddress,
    });

    return this.deliveryRepository.save(delivery);
  }

  private async findSpecificDeliveryPerson(deliveryPersonId: number) {
    const deliveryPerson = await this.deliveryPersonRepository.findById(deliveryPersonId);

    if (!deliveryPerson) {
      throw new EntityNotFoundException('Entregador', deliveryPersonId);
    }

    if (!deliveryPerson.isActive) {
      throw new BusinessRuleException(`Entregador ${deliveryPerson.name} está inativo`);
    }

    if (!deliveryPerson.canBeAssigned()) {
      throw new BusinessRuleException(
        `Entregador ${deliveryPerson.name} não está disponível. Status: ${deliveryPerson.status}`,
      );
    }

    return deliveryPerson;
  }

  private async findNearestAvailableDeliveryPerson(customerLocation: Location) {
    const availableDeliveryPersons = await this.deliveryPersonRepository.findAvailableNearby(
      customerLocation.latitude,
      customerLocation.longitude,
      MAX_DELIVERY_RADIUS_KM,
    );

    if (availableDeliveryPersons.length === 0) {
      throw new BusinessRuleException(
        `Nenhum entregador disponível dentro do raio de ${MAX_DELIVERY_RADIUS_KM}km`,
      );
    }

    // Ordenar por distância
    const sorted = availableDeliveryPersons
      .filter((dp) => dp.currentLocation)
      .map((dp) => ({
        deliveryPerson: dp,
        distance: dp.currentLocation!.distanceTo(customerLocation),
      }))
      .sort((a, b) => a.distance - b.distance);

    return sorted[0].deliveryPerson;
  }

  private calculateEstimatedDeliveryTime(distanceKm: number, vehicleType: string): number {
    const avgSpeed = vehicleType === 'BIKE' || vehicleType === 'WALKING' ? 20 : 30;
    const timeInHours = distanceKm / avgSpeed;
    const timeInMinutes = Math.ceil(timeInHours * 60);
    return timeInMinutes + 10; // Adiciona 10 minutos de margem
  }
}
