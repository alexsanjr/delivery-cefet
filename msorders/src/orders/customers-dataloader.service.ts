import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';
import { CustomersClient } from '../grpc/customers.client';

interface CustomerData {
  id: number;
  name: string;
  email: string;
  phone: string;
  isPremium: boolean;
  addresses?: Array<{
    id: number;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    isDefault: boolean;
  }>;
}

@Injectable({ scope: Scope.REQUEST })
export class CustomersDataloaderService {
  private readonly dataLoader: DataLoader<number, CustomerData | null>;

  constructor(private readonly customersClient: CustomersClient) {
    this.dataLoader = new DataLoader<number, CustomerData | null>(
      async (customerIds: readonly number[]) => {
        // Faz chamadas em paralelo para cada customerId
        const customerPromises = customerIds.map((id) => this.getCustomer(id));
        return Promise.all(customerPromises);
      },
      {
        // Cacheia durante toda a requisição
        cache: true,
      },
    );
  }

  private async getCustomer(customerId: number): Promise<CustomerData | null> {
    try {
      const customer = await this.customersClient.getCustomer(customerId);

      if ('error' in customer && customer.error) return null;

      // Mapeia isPrimary para isDefault para compatibilidade
      const mappedCustomer: CustomerData = {
        ...customer,
        addresses: customer.addresses?.map((address: any) => ({
          ...address,
          isDefault: address.isPrimary ?? false,
        })),
      };

      return mappedCustomer;
    } catch {
      return null;
    }
  }

  async load(customerId: number): Promise<CustomerData | null> {
    return this.dataLoader.load(customerId);
  }
}
