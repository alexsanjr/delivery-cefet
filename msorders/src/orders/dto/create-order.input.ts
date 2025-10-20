import { Field, InputType, Int, registerEnumType } from '@nestjs/graphql';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsPositive,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  PIX = 'PIX',
  CASH = 'CASH',
}

// Registrar o enum no GraphQL
registerEnumType(PaymentMethod, {
  name: 'PaymentMethod',
  description: 'Métodos de pagamento disponíveis',
});

@InputType()
export class OrderItemInput {
  @Field(() => Int)
  @IsPositive({ message: 'O ID do produto deve ser maior que zero' })
  productId!: number;

  @Field(() => Int)
  @Min(1, { message: 'A quantidade deve ser maior que zero' })
  quantity!: number;
}

@InputType()
export class CreateOrderInput {
  @Field(() => Int, { nullable: true })
  @IsOptional()
  customerId?: number;

  @Field(() => [OrderItemInput])
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemInput)
  items!: OrderItemInput[];

  @Field(() => PaymentMethod)
  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;
}
