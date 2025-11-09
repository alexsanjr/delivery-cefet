import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import type { IAddressRepository } from '../repositories/interfaces/address-repository.interface';

/**
 * Single Responsibility Principle (S):
 * Esta classe é responsável APENAS por validações relacionadas a Address.
 * Separada do CustomerValidator para manter alta coesão.
 */
@Injectable()
export class AddressValidator {
  constructor(
    @Inject('IAddressRepository')
    private readonly addressRepository: IAddressRepository,
  ) {}

  /**
   * Valida se o endereço existe
   * @throws NotFoundException se não existir
   */
  async validateExists(addressId: number): Promise<void> {
    const address = await this.addressRepository.findById(addressId);
    if (!address) {
      throw new NotFoundException(`Endereço com ID ${addressId} não encontrado.`);
    }
  }
}
