import { Injectable, Logger } from '@nestjs/common';
import { CustomersClient } from '../customers.client';
import {
  ICustomerDataEnricher,
  CustomerData,
} from '../interfaces/grpc-orders.interfaces';

@Injectable()
export class CustomerDataEnricherService implements ICustomerDataEnricher {
  private readonly logger = new Logger(CustomerDataEnricherService.name);

  constructor(private readonly customersClient: CustomersClient) {}

  async enrichWithCustomerData(customerId: number): Promise<CustomerData> {
    const defaultCustomerData: CustomerData = {
      name: '',
      email: '',
      phone: '',
      isPremium: false,
      addresses: [],
    };

    try {
      const customerData = await this.customersClient.getCustomer(customerId);
      this.logger.log(
        `[Enricher] Dados do cliente ${customerId} obtidos via gRPC`,
      );

      return {
        name: customerData.name || '',
        email: customerData.email || '',
        phone: customerData.phone || '',
        isPremium: customerData.isPremium || false,
        addresses: customerData.addresses || [],
      };
    } catch (error) {
      this.logger.warn(
        `[Enricher] Não foi possível buscar dados do cliente ${customerId}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
      return defaultCustomerData;
    }
  }

  getPrimaryAddress(addresses: any[]): any {
    if (!addresses || addresses.length === 0) {
      return {};
    }

    const primaryAddress = addresses.find((addr) => addr.isPrimary);
    return primaryAddress || addresses[0] || {};
  }
}
