import { Injectable, Logger, Inject } from '@nestjs/common';
import { Customer, Address } from '@prisma/client';
import type { ICustomerRepository } from './interfaces/customer-repository.interface';
import { CreateCustomerInput } from '../dto/create-customer.input';
import { UpdateCustomerInput } from '../dto/update-customer.input';

/**
 * Decorator Pattern aplicado para Logging
 * 
 * Open/Closed Principle (O):
 * - Adiciona funcionalidade de logging SEM modificar CustomerRepository
 * - Estende comportamento mantendo o código base fechado para modificação
 * 
 * Single Responsibility Principle (S):
 * - Responsável APENAS por logging de operações de Customer
 * 
 * Liskov Substitution Principle (L):
 * - Pode substituir qualquer ICustomerRepository sem quebrar o código
 * 
 * Dependency Inversion Principle (D):
 * - Depende da interface ICustomerRepository, não de implementação concreta
 */
@Injectable()
export class CustomerRepositoryLogger implements ICustomerRepository {
  private readonly logger = new Logger('CustomerRepository');

  constructor(
    @Inject('ICustomerRepository.Base')
    private readonly repository: ICustomerRepository,
  ) {}

  async findAll(): Promise<(Customer & { addresses: Address[] })[]> {
    this.logger.log('🔍 Buscando todos os clientes');
    const startTime = Date.now();
    
    try {
      const customers = await this.repository.findAll();
      const duration = Date.now() - startTime;
      this.logger.log(`✅ ${customers.length} clientes encontrados em ${duration}ms`);
      return customers;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`❌ Erro ao buscar clientes após ${duration}ms`, error.stack);
      throw error;
    }
  }

  async findById(id: number): Promise<(Customer & { addresses: Address[] }) | null> {
    this.logger.log(`🔍 Buscando cliente ID: ${id}`);
    const startTime = Date.now();
    
    try {
      const customer = await this.repository.findById(id);
      const duration = Date.now() - startTime;
      
      if (customer) {
        this.logger.log(`✅ Cliente encontrado: ${customer.name} (${customer.email}) em ${duration}ms`);
      } else {
        this.logger.warn(`⚠️ Cliente ID: ${id} não encontrado em ${duration}ms`);
      }
      
      return customer;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`❌ Erro ao buscar cliente ID: ${id} após ${duration}ms`, error.stack);
      throw error;
    }
  }

  async findByEmail(email: string): Promise<(Customer & { addresses: Address[] }) | null> {
    this.logger.log(`🔍 Buscando cliente por email: ${email}`);
    const startTime = Date.now();
    
    try {
      const customer = await this.repository.findByEmail(email);
      const duration = Date.now() - startTime;
      
      if (customer) {
        this.logger.log(`✅ Cliente encontrado: ${customer.name} em ${duration}ms`);
      } else {
        this.logger.warn(`⚠️ Cliente com email ${email} não encontrado em ${duration}ms`);
      }
      
      return customer;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`❌ Erro ao buscar cliente por email: ${email} após ${duration}ms`, error.stack);
      throw error;
    }
  }

  async create(data: CreateCustomerInput): Promise<Customer & { addresses: Address[] }> {
    this.logger.log(`➕ Criando novo cliente: ${data.name} (${data.email})`);
    const startTime = Date.now();
    
    try {
      const customer = await this.repository.create(data);
      const duration = Date.now() - startTime;
      this.logger.log(
        `✅ Cliente criado com sucesso: ID ${customer.id} - ${customer.name} em ${duration}ms`
      );
      return customer;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `❌ Erro ao criar cliente ${data.name} (${data.email}) após ${duration}ms`,
        error.stack
      );
      throw error;
    }
  }

  async update(id: number, data: UpdateCustomerInput): Promise<Customer & { addresses: Address[] }> {
    this.logger.log(`🔄 Atualizando cliente ID: ${id}`);
    const startTime = Date.now();
    
    try {
      const customer = await this.repository.update(id, data);
      const duration = Date.now() - startTime;
      this.logger.log(
        `✅ Cliente atualizado: ID ${customer.id} - ${customer.name} em ${duration}ms`
      );
      return customer;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`❌ Erro ao atualizar cliente ID: ${id} após ${duration}ms`, error.stack);
      throw error;
    }
  }

  async existsByEmail(email: string): Promise<boolean> {
    this.logger.debug(`🔍 Verificando existência do email: ${email}`);
    const startTime = Date.now();
    
    try {
      const exists = await this.repository.existsByEmail(email);
      const duration = Date.now() - startTime;
      this.logger.debug(
        `${exists ? '✅' : '❌'} Email ${email} ${exists ? 'existe' : 'não existe'} (${duration}ms)`
      );
      return exists;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `❌ Erro ao verificar email: ${email} após ${duration}ms`,
        error.stack
      );
      throw error;
    }
  }
}
