import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { Inject } from '@nestjs/common';
import { DeliveryServiceImpl } from './delivery.service';
import { DeliveryPerson, Delivery, MutationResponse } from './models/delivery.model';
import { DeliveryMutationResponse } from './models/delivery-mutation-response.model';
import {
  FindAvailableDeliveryPersonsInput,
  UpdateDeliveryPersonStatusInput,
  UpdateDeliveryPersonLocationInput,
  CreateDeliveryPersonInput,
  UpdateDeliveryPersonInput,
  CreateDeliveryInput,
} from './dto/delivery.input';
import { lastValueFrom } from 'rxjs';

@Resolver(() => DeliveryPerson)
export class DeliveryResolver {
  constructor(@Inject('DeliveryService') private readonly deliveryService: DeliveryServiceImpl) {}

  // Query: deliveryPersons - Lista TODOS entregadores (com filtro opcional por status)
  @Query(() => [DeliveryPerson], { name: 'deliveryPersons' })
  async listDeliveryPersons(
    @Args('status', { nullable: true }) status?: string,
  ): Promise<DeliveryPerson[]> {
    // Usando o novo método ListAllDeliveryPersons que retorna todos os entregadores
    const result = await lastValueFrom(
      this.deliveryService.listAllDeliveryPersons(status),
    );
    
    return result.deliveryPersons || [];
  }

  // Query: deliveryPerson - Busca por ID
  @Query(() => DeliveryPerson, { nullable: true, name: 'deliveryPerson' })
  async getDeliveryPerson(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<DeliveryPerson | null> {
    const result = await lastValueFrom(
      this.deliveryService.getDeliveryPerson(id),
    );
    return result.success ? result.deliveryPerson : null;
  }

  // Query: availableDeliveryPersonsNearby - Busca por geolocalização
  @Query(() => [DeliveryPerson], { name: 'availableDeliveryPersonsNearby' })
  async findAvailableDeliveryPersonsNearby(
    @Args('latitude') latitude: number,
    @Args('longitude') longitude: number,
    @Args('radiusKm') radiusKm: number,
    @Args('vehicleType', { nullable: true }) vehicleType?: string,
  ): Promise<DeliveryPerson[]> {
    const result = await lastValueFrom(
      this.deliveryService.findAvailableDeliveryPersons(
        latitude,
        longitude,
        radiusKm,
        vehicleType,
      ),
    );
    return result.deliveryPersons || [];
  }

  // Mutation: updateDeliveryPersonStatus
  @Mutation(() => MutationResponse)
  async updateDeliveryPersonStatus(
    @Args('updateStatusInput') input: UpdateDeliveryPersonStatusInput,
  ): Promise<MutationResponse> {
    const result = await lastValueFrom(
      this.deliveryService.updateDeliveryPersonStatus(
        input.deliveryPersonId,
        input.status,
      ),
    );
    return {
      success: result.success,
      message: result.message,
      deliveryPerson: result.success ? result.deliveryPerson : null,
    };
  }

  // Mutation: updateDeliveryPersonLocation
  @Mutation(() => MutationResponse)
  async updateDeliveryPersonLocation(
    @Args('updateLocationInput') input: UpdateDeliveryPersonLocationInput,
  ): Promise<MutationResponse> {
    const result = await lastValueFrom(
      this.deliveryService.updateDeliveryPersonLocation(
        input.deliveryPersonId,
        input.latitude,
        input.longitude,
        input.speed,
        input.heading,
        input.accuracy,
      ),
    );
    return {
      success: result.success,
      message: result.message,
      deliveryPerson: result.success ? result.deliveryPerson : null,
    };
  }

  // Query: deliveries - Lista todas entregas
  @Query(() => [Delivery], { name: 'deliveries' })
  async listDeliveries(): Promise<Delivery[]> {
    const result = await lastValueFrom(
      this.deliveryService.getActiveDeliveries(),
    );
    return (result as any).deliveries || [];
  }

  // Query: deliveryByOrder - Busca entrega por pedido
  @Query(() => Delivery, { nullable: true, name: 'deliveryByOrder' })
  async getDeliveryByOrder(
    @Args('orderId', { type: () => Int }) orderId: number,
  ): Promise<Delivery | null> {
    const result = await lastValueFrom(
      this.deliveryService.getDeliveryByOrder(orderId.toString()),
    );
    return (result as any).success ? (result as any).delivery : null;
  }

  // Query: deliveriesByDeliveryPerson - Lista entregas de um entregador
  @Query(() => [Delivery], { name: 'deliveriesByDeliveryPerson' })
  async getDeliveriesByDeliveryPerson(
    @Args('deliveryPersonId', { type: () => Int }) deliveryPersonId: number,
  ): Promise<Delivery[]> {
    const result = await lastValueFrom(
      this.deliveryService.getDeliveriesByDeliveryPerson(deliveryPersonId),
    );
    return (result as any).deliveries || [];
  }

  // ==================== CRUD MUTATIONS ====================

  // Mutation: createDeliveryPerson
  @Mutation(() => MutationResponse)
  async createDeliveryPerson(
    @Args('input') input: CreateDeliveryPersonInput,
  ): Promise<MutationResponse> {
    const result = await lastValueFrom(
      this.deliveryService.createDeliveryPerson(
        input.name,
        input.email,
        input.phone,
        input.cpf,
        input.vehicleType,
        input.licensePlate,
      ),
    );
    return {
      success: result.success,
      message: result.message,
      deliveryPerson: result.success ? result.deliveryPerson : null,
    };
  }

  // Mutation: updateDeliveryPerson
  @Mutation(() => MutationResponse)
  async updateDeliveryPerson(
    @Args('input') input: UpdateDeliveryPersonInput,
  ): Promise<MutationResponse> {
    const result = await lastValueFrom(
      this.deliveryService.updateDeliveryPerson(
        input.id,
        input.name,
        input.email,
        input.phone,
        input.vehicleType,
        input.licensePlate,
      ),
    );
    return {
      success: result.success,
      message: result.message,
      deliveryPerson: result.success ? result.deliveryPerson : null,
    };
  }

  // Mutation: deleteDeliveryPerson
  @Mutation(() => MutationResponse)
  async deleteDeliveryPerson(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<MutationResponse> {
    const result = await lastValueFrom(
      this.deliveryService.deleteDeliveryPerson(id),
    );
    return {
      success: result.success,
      message: result.message,
      deliveryPerson: result.success ? result.deliveryPerson : null,
    };
  }

  // ==================== ACTIVATE/DEACTIVATE MUTATIONS ====================

  // Mutation: activateDeliveryPerson
  @Mutation(() => MutationResponse)
  async activateDeliveryPerson(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<MutationResponse> {
    const result = await lastValueFrom(
      this.deliveryService.activateDeliveryPerson(id),
    );
    return {
      success: result.success,
      message: result.message,
      deliveryPerson: result.success ? result.deliveryPerson : null,
    };
  }

  // Mutation: deactivateDeliveryPerson
  @Mutation(() => MutationResponse)
  async deactivateDeliveryPerson(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<MutationResponse> {
    const result = await lastValueFrom(
      this.deliveryService.deactivateDeliveryPerson(id),
    );
    return {
      success: result.success,
      message: result.message,
      deliveryPerson: result.success ? result.deliveryPerson : null,
    };
  }

  // ==================== DELIVERY MUTATIONS ====================

  // Mutation: assignDelivery - Atribuir entrega a um entregador
  @Mutation(() => DeliveryMutationResponse)
  async assignDelivery(
    @Args('orderId', { type: () => Int }) orderId: number,
  ): Promise<DeliveryMutationResponse> {
    const result = await lastValueFrom(
      this.deliveryService.assignDelivery(orderId),
    );
    return {
      success: result.success,
      message: result.message,
      delivery: result.success ? result.delivery : null,
    };
  }

  // Mutation: createDelivery - Criar uma nova entrega
  @Mutation(() => DeliveryMutationResponse)
  async createDelivery(
    @Args('input') input: CreateDeliveryInput,
  ): Promise<DeliveryMutationResponse> {
    const result = await lastValueFrom(
      this.deliveryService.createDelivery(
        input.orderId,
        input.customerLatitude,
        input.customerLongitude,
        input.customerAddress,
      ),
    );
    return {
      success: result.success,
      message: result.message,
      delivery: result.success ? result.delivery : null,
    };
  }
}
