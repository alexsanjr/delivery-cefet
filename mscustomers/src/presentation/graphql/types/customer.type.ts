import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class EnderecoType {
  @Field(() => ID)
  id: number;

  @Field()
  rua: string;

  @Field()
  numero: string;

  @Field(() => String, { nullable: true })
  complemento?: string | null;

  @Field()
  bairro: string;

  @Field()
  cidade: string;

  @Field()
  estado: string;

  @Field()
  cep: string;

  @Field()
  ehPrincipal: boolean;

  @Field()
  criadoEm: Date;

  @Field()
  atualizadoEm: Date;
}

@ObjectType()
export class ClienteType {
  @Field(() => ID)
  id: number;

  @Field()
  nome: string;

  @Field()
  email: string;

  @Field()
  telefone: string;

  @Field()
  ehPremium: boolean;

  @Field(() => [EnderecoType])
  enderecos: EnderecoType[];

  @Field()
  criadoEm: Date;

  @Field()
  atualizadoEm: Date;
}
