import { Injectable, NotFoundException, Inject, Logger } from '@nestjs/common';
import type { ICustomerRepository } from '../repositories/interfaces/customer-repository.interface';
import type { IAddressRepository } from '../repositories/interfaces/address-repository.interface';
import { CustomerValidator } from '../validators/customer.validator';
import { AddressValidator } from '../validators/address.validator';
import { CreateCustomerInput } from '../dto/create-customer.input';
import { UpdateCustomerInput } from '../dto/update-customer.input';
import { CreateAddressInput } from '../dto/create-address.input';
import { UpdateAddressInput } from '../dto/update-address.input';

/**
 * SOLID Principles Applied:
 * 
 * S - Single Responsibility: 
 *     Responsável APENAS pela lógica de negócio de clientes.
 *     Validações delegadas a CustomerValidator/AddressValidator.
 *     Persistência delegada aos Repositories.
 * 
 * O - Open/Closed:
 *     Aberto para extensão: novos métodos podem ser adicionados.
 *     Fechado para modificação: usa interfaces, não implementações.
 * 
 * D - Dependency Inversion:
 *     Depende de abstrações (interfaces), não de implementações concretas.
 *     Permite trocar repositórios sem modificar este service.
 */
@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  constructor(
    @Inject('ICustomerRepository')
    private readonly customerRepository: ICustomerRepository,
    @Inject('IAddressRepository')
    private readonly addressRepository: IAddressRepository,
    private readonly customerValidator: CustomerValidator,
    private readonly addressValidator: AddressValidator,
  ) {
    this.logger.log('✅ CustomersService inicializado');
  }

  async create(createCustomerInput: CreateCustomerInput) {
    this.logger.log(
      `📝 [Business Logic] Iniciando criação de cliente: ${createCustomerInput.email}`
    );

    await this.customerValidator.validateUniqueEmail(createCustomerInput.email);

    const customer = await this.customerRepository.create(createCustomerInput);

    this.logger.log(
      `✅ [Business Logic] Cliente criado: ID ${customer.id} - ${customer.name}`
    );

    return customer;
  }

  async findAll() {
    this.logger.debug('📋 [Business Logic] Listando todos os clientes');
    return await this.customerRepository.findAll();
  }

  async findById(id: number) {
    this.logger.debug(`🔍 [Business Logic] Buscando cliente ID: ${id}`);
    const customer = await this.customerRepository.findById(id);

    if (!customer) {
      this.logger.warn(`⚠️ [Business Logic] Cliente ID: ${id} não encontrado`);
      throw new NotFoundException(`Cliente ${id} nao encontrado.`);
    }

    return customer;
  }

  async findByEmail(email: string) {
    this.logger.debug(`🔍 [Business Logic] Buscando cliente por email: ${email}`);
    const customer = await this.customerRepository.findByEmail(email);

    if (!customer) {
      this.logger.warn(`⚠️ [Business Logic] Cliente com email ${email} não encontrado`);
      throw new NotFoundException(`Cliente com email ${email} nao encontrado.`);
    }

    return customer;
  }

  async update(id: number, updateCustomerInput: UpdateCustomerInput) {
    this.logger.log(`🔄 [Business Logic] Atualizando cliente ID: ${id}`);
    await this.findById(id);

    const updated = await this.customerRepository.update(id, updateCustomerInput);
    this.logger.log(`✅ [Business Logic] Cliente ${id} atualizado com sucesso`);

    return updated;
  }

  async addAddress(customerId: number, createAddressInput: CreateAddressInput) {
    this.logger.log(
      `📍 [Business Logic] Adicionando endereço ao cliente ID: ${customerId}`
    );
    await this.findById(customerId);

    await this.addressRepository.addToCustomer(customerId, createAddressInput);

    this.logger.log(`✅ [Business Logic] Endereço adicionado ao cliente ${customerId}`);

    return await this.findById(customerId);
  }

  async updateAddress(addressId: number, updateAddressInput: UpdateAddressInput) {
    this.logger.log(`🔄 [Business Logic] Atualizando endereço ID: ${addressId}`);
    
    await this.addressValidator.validateExists(addressId);

    const updated = await this.addressRepository.update(addressId, updateAddressInput);
    this.logger.log(`✅ [Business Logic] Endereço ${addressId} atualizado`);

    return updated;
  }

  async setPrimaryAddress(customerId: number, addressId: number) {
    this.logger.log(
      `⭐ [Business Logic] Definindo endereço ${addressId} como primário para cliente ${customerId}`
    );

    await this.addressValidator.validateExists(addressId);

    await this.addressRepository.removePrimaryFromCustomer(customerId);

    await this.addressRepository.setPrimary(addressId);

    this.logger.log(`✅ [Business Logic] Endereço primário atualizado para cliente ${customerId}`);

    return await this.findById(customerId);
  }

  async removeAddress(addressId: number) {
    this.logger.log(`🗑️ [Business Logic] Removendo endereço ID: ${addressId}`);
    
    await this.addressValidator.validateExists(addressId);

    await this.addressRepository.remove(addressId);

    this.logger.log(`✅ [Business Logic] Endereço ${addressId} removido com sucesso`);

    return true;
  }
}