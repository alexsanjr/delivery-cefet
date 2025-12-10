import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CriarClienteInput {
  @Field()
  nome: string;

  @Field()
  email: string;

  @Field()
  telefone: string;
}

@InputType()
export class AtualizarClienteInput {
  @Field({ nullable: true })
  nome?: string;

  @Field({ nullable: true })
  email?: string;

  @Field({ nullable: true })
  telefone?: string;

  @Field({ nullable: true })
  ehPremium?: boolean;
}

@InputType()
export class CriarEnderecoInput {
  @Field()
  idCliente: number;

  @Field()
  rua: string;

  @Field()
  numero: string;

  @Field({ nullable: true })
  complemento?: string;

  @Field()
  bairro: string;

  @Field()
  cidade: string;

  @Field()
  estado: string;

  @Field()
  cep: string;

  @Field({ nullable: true })
  ehPrincipal?: boolean;
}

@InputType()
export class AtualizarEnderecoInput {
  @Field({ nullable: true })
  rua?: string;

  @Field({ nullable: true })
  numero?: string;

  @Field({ nullable: true })
  complemento?: string;

  @Field({ nullable: true })
  bairro?: string;

  @Field({ nullable: true })
  cidade?: string;

  @Field({ nullable: true })
  estado?: string;

  @Field({ nullable: true })
  cep?: string;

  @Field({ nullable: true })
  ehPrincipal?: boolean;
}
