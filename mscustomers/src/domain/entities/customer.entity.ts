import { Email } from '../value-objects/email';
import { Telefone } from '../value-objects/phone';
import { Endereco } from './address';

// Aggregate Root: gerencia o ciclo de vida dos endereços e garante consistência dos dados
export class Cliente {
  private constructor(
    private readonly _id: number | null,
    private _nome: string,
    private _email: Email,
    private _telefone: Telefone,
    private _enderecos: Endereco[],
    private _ehPremium: boolean,
    private readonly _criadoEm: Date,
    private _atualizadoEm: Date,
  ) {}

  static criar(propriedades: {
    nome: string;
    email: string;
    telefone: string;
    ehPremium?: boolean;
  }): Cliente {
    return new Cliente(
      null,
      propriedades.nome,
      new Email(propriedades.email),
      new Telefone(propriedades.telefone),
      [],
      propriedades.ehPremium ?? false,
      new Date(),
      new Date(),
    );
  }

  // Método fábrica para reconstituir cliente do banco de dados
  static reconstituir(propriedades: {
    id: number;
    nome: string;
    email: string;
    telefone: string;
    enderecos: Endereco[];
    ehPremium: boolean;
    criadoEm: Date;
    atualizadoEm: Date;
  }): Cliente {
    return new Cliente(
      propriedades.id,
      propriedades.nome,
      new Email(propriedades.email),
      new Telefone(propriedades.telefone),
      propriedades.enderecos,
      propriedades.ehPremium,
      propriedades.criadoEm,
      propriedades.atualizadoEm,
    );
  }

  // Getters
  get id(): number | null {
    return this._id;
  }

  get nome(): string {
    return this._nome;
  }

  get email(): Email {
    return this._email;
  }

  get telefone(): Telefone {
    return this._telefone;
  }

  get enderecos(): Endereco[] {
    return [...this._enderecos];
  }

  get ehPremium(): boolean {
    return this._ehPremium;
  }

  get criadoEm(): Date {
    return this._criadoEm;
  }

  get atualizadoEm(): Date {
    return this._atualizadoEm;
  }

  // Métodos de negócio
  atualizar(propriedades: {
    nome?: string;
    email?: string;
    telefone?: string;
  }): void {
    if (propriedades.nome !== undefined) this._nome = propriedades.nome;
    if (propriedades.email !== undefined)
      this._email = new Email(propriedades.email);
    if (propriedades.telefone !== undefined)
      this._telefone = new Telefone(propriedades.telefone);

    this._atualizadoEm = new Date();
  }

  adicionarEndereco(endereco: Endereco): void {
    if (this._enderecos.length === 0) {
      endereco.marcarComoPrincipal();
    }

    if (endereco.ehPrincipal) {
      this._enderecos.forEach((end) => end.marcarComoSecundario());
    }

    this._enderecos.push(endereco);
    this._atualizadoEm = new Date();
  }

  removerEndereco(idEndereco: number): void {
    const indice = this._enderecos.findIndex((end) => end.id === idEndereco);

    if (indice === -1) {
      throw new Error('Endereço não encontrado');
    }

    const enderecoRemovidoEraPrincipal = this._enderecos[indice].ehPrincipal;
    this._enderecos.splice(indice, 1);

    if (enderecoRemovidoEraPrincipal && this._enderecos.length > 0) {
      this._enderecos[0].marcarComoPrincipal();
    }

    this._atualizadoEm = new Date();
  }

  definirEnderecoPrincipal(idEndereco: number): void {
    const endereco = this._enderecos.find((end) => end.id === idEndereco);

    if (!endereco) {
      throw new Error('Endereço não encontrado');
    }

    this._enderecos.forEach((end) => end.marcarComoSecundario());
    endereco.marcarComoPrincipal();
    this._atualizadoEm = new Date();
  }

  promoverParaPremium(): void {
    this._ehPremium = true;
    this._atualizadoEm = new Date();
  }

  rebaixarDePremium(): void {
    this._ehPremium = false;
    this._atualizadoEm = new Date();
  }

  obterEnderecoPrincipal(): Endereco | null {
    return this._enderecos.find((end) => end.ehPrincipal) ?? null;
  }

  possuiEndereco(): boolean {
    return this._enderecos.length > 0;
  }

  obterQuantidadeEnderecos(): number {
    return this._enderecos.length;
  }
}
