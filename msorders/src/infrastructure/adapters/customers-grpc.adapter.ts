import { Injectable } from '@nestjs/common';
import { CustomersClient } from '../../grpc/customers.client';
import {
  CustomerData,
  ICustomerValidator,
} from '../../application/ports/customer-validator.port';

@Injectable()
export class CustomersGrpcAdapter implements ICustomerValidator {
  constructor(private readonly customersClient: CustomersClient) {}

  async exists(customerId: number): Promise<boolean> {
    try {
      const result = await this.customersClient.validateCustomer(customerId);
      return result.exists === true;
    } catch (error) {
      return false;
    }
  }

  async getCustomerData(customerId: number): Promise<CustomerData> {
    const customer = await this.customersClient.getCustomer(customerId);

    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
    };
  }
}
