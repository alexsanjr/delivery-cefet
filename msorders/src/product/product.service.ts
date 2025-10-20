import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ProductDatasource } from './product.datasource';
import { CreateProductInput } from './dto/create-product.input';
import { UpdateProductInput } from './dto/update-product.input';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(private readonly productDatasource: ProductDatasource) {}

  async findAll() {
    this.logger.log('Buscando todos os Produtos');

    try {
      const products = await this.productDatasource.findAll();
      this.logger.log(`Encontrados ${products.length} produtos`);
      return products;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar produtos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
      throw error;
    }
  }

  async findById(id: number) {
    this.logger.log(`Buscando pedido com ID: ${id}`);

    // Validação defensiva
    if (!id || id <= 0) {
      throw new BadRequestException(
        'ID do pedido é obrigatório e deve ser maior que zero',
      );
    }

    try {
      const product = await this.productDatasource.findById(id);

      if (!product) {
        this.logger.warn(`Produto não encontrado: ID ${id}`);
        throw new NotFoundException(`Produto ${id} não encontrado`);
      }

      this.logger.log(`Produto encontrado: ID ${id}`);
      return product;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      this.logger.error(
        `Erro ao buscar pedido ${id}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
      throw new Error(`Erro interno ao buscar pedido ${id}`);
    }
  }

  async create(createProductInput: CreateProductInput) {
    this.logger.log('Criando um novo produto');

    try {
      const product = await this.productDatasource.create(createProductInput);
      this.logger.log(`Produto criado: ID ${product.id}`);
      return product;
    } catch (error) {
      this.logger.error(
        `Erro ao criar produto: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
      throw new Error(`Erro interno ao criar produto`);
    }
  }

  async update(updateProductInput: UpdateProductInput) {
    this.logger.log(`Atualizando produto: ID ${updateProductInput.id}`);

    try {
      this.validateUpdateProductInput(updateProductInput);

      await this.findById(updateProductInput.id);

      const updatedProduct =
        await this.productDatasource.updateStatus(updateProductInput);
      this.logger.log(
        `Produto ${updateProductInput.id} atualizado com sucesso!`,
      );

      return updatedProduct;
    } catch (error) {
      this.logger.error(
        `Erro ao atualizar produto ${updateProductInput.id}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
      throw error;
    }
  }

  async delete(id: number) {
    this.logger.log(`Deletando produto: ID ${id}`);

    try {
      if (!id || id <= 0) {
        throw new BadRequestException(
          'ID do produto é obrigatório e deve ser maior que zero',
        );
      }

      const existingProduct = await this.productDatasource.findById(id);
      if (existingProduct == null) {
        this.logger.warn(`Produto não encontrado para deleção: ID ${id}`);
        throw new NotFoundException(`Produto ${id} não encontrado`);
      }

      const deletedProduct = await this.productDatasource.delete(id);
      this.logger.log(`Produto ${id} deletado com sucesso!`);
      return deletedProduct;
    } catch (error) {
      this.logger.error(
        `Erro ao deletar produto ${id}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
      throw error;
    }
  }

  public validateUpdateProductInput(input: UpdateProductInput): void {
    if (!input) {
      throw new BadRequestException('Dados de atualização são obrigatórios');
    }

    if (!input.id || input.id <= 0) {
      throw new BadRequestException(
        'ID do produto é obrigatório e deve ser maior que zero',
      );
    }
  }
}
