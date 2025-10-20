import { CreateProductInput } from './create-product.input';
import { InputType, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdateProductInput extends PartialType(CreateProductInput) {
  id: number;
}
