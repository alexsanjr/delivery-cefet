import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { Observable } from 'rxjs';

interface CustomersService {
  getCustomer(data: { id: number }): Observable<any>;
  validateCustomer(data: { id: number }): Observable<any>;
}

@Injectable()
export class CustomersClient implements OnModuleInit {
  private customersService: CustomersService;

  constructor(
    @Inject('CUSTOMERS_PACKAGE') private readonly client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.customersService =
      this.client.getService<CustomersService>('CustomersService');
  }

  async getCustomer(id: number): Promise<any> {
    return new Promise((resolve, reject) => {
      this.customersService.getCustomer({ id }).subscribe({
        next: (data) => resolve(data),
        error: (error) =>
          reject(new Error(String(error) || 'Erro ao buscar cliente')),
      });
    });
  }

  async validateCustomer(id: number): Promise<any> {
    return new Promise((resolve, reject) => {
      this.customersService.validateCustomer({ id }).subscribe({
        next: (data) => resolve(data),
        error: (error) =>
          reject(new Error(String(error) || 'Erro ao validar cliente')),
      });
    });
  }
}
