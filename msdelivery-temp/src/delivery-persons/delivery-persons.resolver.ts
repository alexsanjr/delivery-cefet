import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { DeliveryPersonsService } from './delivery-persons.service';
import { DeliveryPerson } from './models/delivery-person.model';
import { CreateDeliveryPersonInput } from './dto/create-delivery-person.input';
import { UpdateDeliveryPersonInput } from './dto/update-delivery-person.input';
import { UpdateStatusInput } from './dto/update-status.input';
import { UpdateLocationInput } from './dto/update-location.input';
import { DeliveryPersonStatus } from './models/delivery-person-status.enum';

@Resolver(() => DeliveryPerson)
export class DeliveryPersonsResolver {
  constructor(private readonly deliveryPersonsService: DeliveryPersonsService) {}

  @Mutation(() => DeliveryPerson)
  async createDeliveryPerson(
    @Args('createDeliveryPersonInput') createDeliveryPersonInput: CreateDeliveryPersonInput,
  ) {
    return this.deliveryPersonsService.create(createDeliveryPersonInput);
  }

  @Query(() => [DeliveryPerson], { name: 'deliveryPersons' })
  async findAll(
    @Args('status', { type: () => String, nullable: true }) status?: DeliveryPersonStatus,
    @Args('isActive', { type: () => Boolean, nullable: true }) isActive?: boolean,
  ) {
    return this.deliveryPersonsService.findAll(status, isActive);
  }

  @Query(() => DeliveryPerson, { name: 'deliveryPerson' })
  async findOne(@Args('id', { type: () => ID }) id: string) {
    return this.deliveryPersonsService.findOne(id);
  }

  @Mutation(() => DeliveryPerson)
  async updateDeliveryPerson(
    @Args('id', { type: () => ID }) id: string,
    @Args('updateDeliveryPersonInput') updateDeliveryPersonInput: UpdateDeliveryPersonInput,
  ) {
    return this.deliveryPersonsService.update(id, updateDeliveryPersonInput);
  }

  @Mutation(() => DeliveryPerson, { description: 'Desativar entregador (soft delete)' })
  async deactivateDeliveryPerson(@Args('id', { type: () => ID }) id: string) {
    return this.deliveryPersonsService.updateActiveStatus(id, false);
  }

  @Mutation(() => DeliveryPerson, { description: 'Ativar entregador' })
  async activateDeliveryPerson(@Args('id', { type: () => ID }) id: string) {
    return this.deliveryPersonsService.updateActiveStatus(id, true);
  }

  @Mutation(() => DeliveryPerson, { description: 'Deletar entregador permanentemente (hard delete)' })
  async removeDeliveryPerson(@Args('id', { type: () => ID }) id: string) {
    return this.deliveryPersonsService.remove(id);
  }

  @Mutation(() => DeliveryPerson)
  async updateDeliveryPersonStatus(
    @Args('updateStatusInput') updateStatusInput: UpdateStatusInput,
  ) {
    return this.deliveryPersonsService.updateStatus(updateStatusInput);
  }

  @Mutation(() => DeliveryPerson)
  async updateDeliveryPersonLocation(
    @Args('updateLocationInput') updateLocationInput: UpdateLocationInput,
  ) {
    return this.deliveryPersonsService.updateLocation(updateLocationInput);
  }

  @Query(() => [DeliveryPerson], { name: 'availableDeliveryPersonsNearby' })
  async findAvailableNearby(
    @Args('latitude', { type: () => Number }) latitude: number,
    @Args('longitude', { type: () => Number }) longitude: number,
    @Args('radiusKm', { type: () => Number }) radiusKm: number,
  ) {
    return this.deliveryPersonsService.findAvailableNearby(latitude, longitude, radiusKm);
  }
}
