import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { CustomersService } from '../services/customers.service';
import { Customer } from '../models/customer.model';
import { Address } from '../models/address.model';
import { CreateCustomerInput } from '../dto/create-customer.input';
import { UpdateCustomerInput } from '../dto/update-customer.input';
import { CreateAddressInput } from '../dto/create-address.input';
import { UpdateAddressInput } from '../dto/update-address.input';

@Resolver(() => Customer)
export class CustomersResolver {
  constructor(private readonly customersService: CustomersService) {}

  @Query(() => [Customer])
  async customers(): Promise<Customer[]> {
    return this.customersService.findAll();
  }

  @Query(() => Customer)
  async customer(@Args('id') id: string): Promise<Customer> {
    return this.customersService.findById(id);
  }

  @Query(() => Customer)
  async customerByEmail(@Args('email') email: string): Promise<Customer> {
    return this.customersService.findByEmail(email);
  }

  @Mutation(() => Customer)
  async createCustomer(@Args('input') input: CreateCustomerInput): Promise<Customer> {
    return this.customersService.create(input);
  }

  @Mutation(() => Customer)
  async updateCustomer(
    @Args('id') id: string,
    @Args('input') input: UpdateCustomerInput,
  ): Promise<Customer> {
    return this.customersService.update(id, input);
  }

  @Mutation(() => Customer)
  async addAddress(
    @Args('customerId') customerId: string,
    @Args('input') input: CreateAddressInput,
  ): Promise<Customer> {
    return this.customersService.addAddress(customerId, input);
  }

  @Mutation(() => Address)
  async updateAddress(
    @Args('addressId') addressId: string,
    @Args('input') input: UpdateAddressInput,
  ): Promise<Address> {
    return this.customersService.updateAddress(addressId, input);
  }

  @Mutation(() => Customer)
  async setPrimaryAddress(
    @Args('customerId') customerId: string,
    @Args('addressId') addressId: string,
  ): Promise<Customer> {
    return this.customersService.setPrimaryAddress(customerId, addressId);
  }

  @Mutation(() => Boolean)
  async removeAddress(@Args('addressId') addressId: string): Promise<boolean> {
    return this.customersService.removeAddress(addressId);
  }
}