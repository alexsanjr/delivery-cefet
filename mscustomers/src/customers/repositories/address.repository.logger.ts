import { Injectable, Logger, Inject } from '@nestjs/common';
import { Address } from '@prisma/client';
import type { IAddressRepository } from './interfaces/address-repository.interface';
import { CreateAddressInput } from '../dto/create-address.input';
import { UpdateAddressInput } from '../dto/update-address.input';

/**
 * Decorator Pattern aplicado para Logging de Address
 * 
 * Open/Closed Principle (O):
 * - Adiciona logging SEM modificar AddressRepository existente
 * 
 * Single Responsibility Principle (S):
 * - Responsável APENAS por logging de operações de Address
 * 
 * Liskov Substitution Principle (L):
 * - Substitui qualquer IAddressRepository mantendo comportamento
 */
@Injectable()
export class AddressRepositoryLogger implements IAddressRepository {
  private readonly logger = new Logger('AddressRepository');

  constructor(
    @Inject('IAddressRepository.Base')
    private readonly repository: IAddressRepository,
  ) {}

  async addToCustomer(customerId: number, data: CreateAddressInput): Promise<Address> {
    this.logger.log(
      `➕ Adicionando endereço para cliente ID: ${customerId} - ${data.street}, ${data.city}`
    );
    const startTime = Date.now();

    try {
      const address = await this.repository.addToCustomer(customerId, data);
      const duration = Date.now() - startTime;
      this.logger.log(
        `✅ Endereço adicionado: ID ${address.id} para cliente ${customerId} em ${duration}ms`
      );
      return address;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `❌ Erro ao adicionar endereço para cliente ${customerId} após ${duration}ms`,
        error.stack
      );
      throw error;
    }
  }

  async update(addressId: number, data: UpdateAddressInput): Promise<Address> {
    this.logger.log(`🔄 Atualizando endereço ID: ${addressId}`);
    const startTime = Date.now();

    try {
      const address = await this.repository.update(addressId, data);
      const duration = Date.now() - startTime;
      this.logger.log(
        `✅ Endereço atualizado: ID ${address.id} - ${address.street}, ${address.city} em ${duration}ms`
      );
      return address;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `❌ Erro ao atualizar endereço ID: ${addressId} após ${duration}ms`,
        error.stack
      );
      throw error;
    }
  }

  async findById(addressId: number): Promise<Address | null> {
    this.logger.debug(`🔍 Buscando endereço ID: ${addressId}`);
    const startTime = Date.now();

    try {
      const address = await this.repository.findById(addressId);
      const duration = Date.now() - startTime;

      if (address) {
        this.logger.debug(
          `✅ Endereço encontrado: ${address.street}, ${address.city} em ${duration}ms`
        );
      } else {
        this.logger.warn(`⚠️ Endereço ID: ${addressId} não encontrado em ${duration}ms`);
      }

      return address;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `❌ Erro ao buscar endereço ID: ${addressId} após ${duration}ms`,
        error.stack
      );
      throw error;
    }
  }

  async removePrimaryFromCustomer(customerId: number): Promise<void> {
    this.logger.debug(`🔄 Removendo flag primary dos endereços do cliente ID: ${customerId}`);
    const startTime = Date.now();

    try {
      await this.repository.removePrimaryFromCustomer(customerId);
      const duration = Date.now() - startTime;
      this.logger.debug(
        `✅ Flags primary removidas para cliente ${customerId} em ${duration}ms`
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `❌ Erro ao remover flags primary do cliente ${customerId} após ${duration}ms`,
        error.stack
      );
      throw error;
    }
  }

  async setPrimary(addressId: number): Promise<Address> {
    this.logger.log(`⭐ Definindo endereço ID: ${addressId} como primário`);
    const startTime = Date.now();

    try {
      const address = await this.repository.setPrimary(addressId);
      const duration = Date.now() - startTime;
      this.logger.log(
        `✅ Endereço ${address.id} definido como primário em ${duration}ms`
      );
      return address;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `❌ Erro ao definir endereço ${addressId} como primário após ${duration}ms`,
        error.stack
      );
      throw error;
    }
  }

  async remove(addressId: number): Promise<void> {
    this.logger.log(`🗑️ Removendo endereço ID: ${addressId}`);
    const startTime = Date.now();

    try {
      await this.repository.remove(addressId);
      const duration = Date.now() - startTime;
      this.logger.log(`✅ Endereço ${addressId} removido com sucesso em ${duration}ms`);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `❌ Erro ao remover endereço ${addressId} após ${duration}ms`,
        error.stack
      );
      throw error;
    }
  }
}
