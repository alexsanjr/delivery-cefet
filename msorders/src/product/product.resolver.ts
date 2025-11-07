import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { ProductService } from './product.service';
import { CreateProductInput } from './dto/create-product.input';
import type { Product } from '../../generated/prisma';
import { UpdateProductInput } from './dto/update-product.input';

@Resolver('Product')
export class ProductResolver {
  constructor(private readonly productService: ProductService) {}

  @Query('products')
  async getProducts() {
    try {
      return await this.productService.findAll();
    } catch (error) {
      throw new Error(
        `Ocorreu um erro ao buscar os produtos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
    }
  }

  @Query('product')
  async getProduct(@Args('id') id: number) {
    try {
      return await this.productService.findById(id);
    } catch (error) {
      throw new Error(
        `Ocorreu um erro ao buscar o produto ${id}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
    }
  }

  @Mutation('updateProduct')
  async updateProduct(
    @Args('updateProductInput') updateProductInput: UpdateProductInput,
  ) {
    try {
      console.log(updateProductInput);
      return await this.productService.update(updateProductInput);
    } catch (error) {
      throw new Error(
        `Ocorreu um erro ao atualizar o produto ${updateProductInput.id}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
    }
  }

  @Mutation('createProduct')
  async createProduct(
    @Args('createProductInput') createProductInput: CreateProductInput,
  ) {
    try {
      return await this.productService.create(createProductInput);
    } catch (error) {
      throw new Error(
        `Ocorreu um erro ao criar o produto: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
    }
  }

  @Mutation('deleteProduct')
  async deleteProduct(@Args('id') id: number) {
    try {
      return await this.productService.delete(id);
    } catch (error) {
      throw new Error(
        `Ocorreu um erro ao deletar o produto ${id}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
    }
  }

  @ResolveField('createdAt')
  getCreatedAt(@Parent() product: Product): string {
    return new Date(product.createdAt).toLocaleString('pt-BR');
  }

  @ResolveField('updatedAt')
  getUpdatedAt(@Parent() product: Product): string {
    return new Date(product.updatedAt).toLocaleString('pt-BR');
  }
}
