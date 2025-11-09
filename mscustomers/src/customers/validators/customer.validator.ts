import { ConflictException, Injectable, Inject } from '@nestjs/common';
import type { ICustomerRepository } from '../repositories/interfaces/customer-repository.interface';

/**
 * Single Responsibility Principle (S):
 * Esta classe é responsável APENAS por validações relacionadas a Customer.
 * Não faz persistência, não contém lógica de negócio complexa.
 * 
 * Open/Closed Principle (O):
 * Aberto para extensão: novos validadores podem ser adicionados sem modificar esta classe.
 * Pode-se criar CustomerBusinessValidator, CustomerSecurityValidator, etc.
 */
@Injectable()
export class CustomerValidator {
  constructor(
    @Inject('ICustomerRepository')
    private readonly customerRepository: ICustomerRepository,
  ) {}

  /**
   * Valida se o email já está cadastrado
   * @throws ConflictException se email já existir
   */
  async validateUniqueEmail(email: string): Promise<void> {
    const exists = await this.customerRepository.existsByEmail(email);
    if (exists) {
      throw new ConflictException(`Cliente com email ${email} já existe.`);
    }
  }

  /**
   * Valida se o cliente existe
   * @throws NotFoundException se não existir (implementação futura)
   */
  async validateExists(id: number): Promise<void> {
    const customer = await this.customerRepository.findById(id);
    if (!customer) {
      throw new ConflictException(`Cliente com ID ${id} não encontrado.`);
    }
  }
}
