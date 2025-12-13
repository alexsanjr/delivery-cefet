import { Injectable } from '@nestjs/common';
import { CustomersRabbitMQClient } from '../../rabbitmq/customers-rabbitmq.client';
import {
  CustomerData,
  ICustomerValidator,
} from '../../application/ports/customer-validator.port';

@Injectable()
export class CustomersRabbitMQAdapter implements ICustomerValidator {
  constructor(private readonly customersRabbitMQClient: CustomersRabbitMQClient) {}

  async exists(customerId: number): Promise<boolean> {
    try {
      const result = await this.customersRabbitMQClient.validateCustomer(customerId);
      return result.isValid === true;
    } catch (error) {
      return false;
    }
  }

  async getCustomerData(customerId: number): Promise<CustomerData> {
    const customer = await this.customersRabbitMQClient.getCustomer(customerId);

    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
    };
  }
}
