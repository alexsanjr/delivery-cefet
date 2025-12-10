import { Resolver, ResolveField, Parent } from '@nestjs/graphql';
import { Delivery, DeliveryPerson } from './models/delivery.model';
import { DeliveryPersonLoader } from '../dataloaders/delivery-person.loader';

/**
 * Field Resolver para Delivery
 * Usa DataLoader para resolver o campo deliveryPerson de forma eficiente
 * Evita o problema N+1 ao fazer batching das chamadas gRPC
 */
@Resolver(() => Delivery)
export class DeliveryFieldResolver {
  constructor(private readonly deliveryPersonLoader: DeliveryPersonLoader) {}

  /**
   * Resolve o campo deliveryPerson usando DataLoader
   * Quando múltiplas Deliveries são retornadas, todas as chamadas para
   * buscar deliveryPerson são agrupadas em uma única operação batch
   */
  @ResolveField(() => DeliveryPerson, { nullable: true })
  async deliveryPerson(@Parent() delivery: Delivery): Promise<DeliveryPerson | null> {
    // Se não tem deliveryPersonId, retorna null
    if (!delivery.deliveryPersonId) {
      return null;
    }

    // Se já veio populado do gRPC, retorna direto
    if (delivery.deliveryPerson && delivery.deliveryPerson.id) {
      return delivery.deliveryPerson;
    }

    // Usa o DataLoader para buscar - chamadas são agrupadas em batch
    return this.deliveryPersonLoader.load(delivery.deliveryPersonId);
  }
}
