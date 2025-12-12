import { Cep } from '../value-objects/postal-code';

/**
 * Representa um endereço de entrega do cliente.
 *
 * Cada endereço possui identidade única e pode ser marcado como principal.
 */
export class Endereco {
  private constructor(
    private readonly _id: number | null,
    private _rua: string,
    private _numero: string,
    private _complemento: string | null,
    private _bairro: string,
    private _cidade: string,
    private _estado: string,
    private _cep: Cep,
    private _ehPrincipal: boolean,
    private readonly _idCliente: number,
    private readonly _criadoEm: Date,
    private _atualizadoEm: Date,
  ) {}

  static criar(propriedades: {
    rua: string;
    numero: string;
    complemento?: string | null;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
    ehPrincipal?: boolean;
    idCliente: number;
  }): Endereco {
    return new Endereco(
      null,
      propriedades.rua,
      propriedades.numero,
      propriedades.complemento ?? null,
      propriedades.bairro,
      propriedades.cidade,
      propriedades.estado,
      new Cep(propriedades.cep),
      propriedades.ehPrincipal ?? false,
      propriedades.idCliente,
      new Date(),
      new Date(),
    );
  }

  static reconstituir(propriedades: {
    id: number;
    rua: string;
    numero: string;
    complemento: string | null;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
    ehPrincipal: boolean;
    idCliente: number;
    criadoEm: Date;
    atualizadoEm: Date;
  }): Endereco {
    return new Endereco(
      propriedades.id,
      propriedades.rua,
      propriedades.numero,
      propriedades.complemento,
      propriedades.bairro,
      propriedades.cidade,
      propriedades.estado,
      new Cep(propriedades.cep),
      propriedades.ehPrincipal,
      propriedades.idCliente,
      propriedades.criadoEm,
      propriedades.atualizadoEm,
    );
  }

  get id(): number | null {
    return this._id;
  }

  get rua(): string {
    return this._rua;
  }

  get numero(): string {
    return this._numero;
  }

  get complemento(): string | null {
    return this._complemento;
  }

  get bairro(): string {
    return this._bairro;
  }

  get cidade(): string {
    return this._cidade;
  }

  get estado(): string {
    return this._estado;
  }

  get cep(): Cep {
    return this._cep;
  }

  get ehPrincipal(): boolean {
    return this._ehPrincipal;
  }

  get idCliente(): number {
    return this._idCliente;
  }

  get criadoEm(): Date {
    return this._criadoEm;
  }

  get atualizadoEm(): Date {
    return this._atualizadoEm;
  }

  atualizar(propriedades: {
    rua?: string;
    numero?: string;
    complemento?: string | null;
    bairro?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
  }): void {
    if (propriedades.rua !== undefined) this._rua = propriedades.rua;
    if (propriedades.numero !== undefined) this._numero = propriedades.numero;
    if (propriedades.complemento !== undefined)
      this._complemento = propriedades.complemento;
    if (propriedades.bairro !== undefined) this._bairro = propriedades.bairro;
    if (propriedades.cidade !== undefined) this._cidade = propriedades.cidade;
    if (propriedades.estado !== undefined) this._estado = propriedades.estado;
    if (propriedades.cep !== undefined) this._cep = new Cep(propriedades.cep);

    this._atualizadoEm = new Date();
  }

  marcarComoPrincipal(): void {
    this._ehPrincipal = true;
    this._atualizadoEm = new Date();
  }

  marcarComoSecundario(): void {
    this._ehPrincipal = false;
    this._atualizadoEm = new Date();
  }

  obterEnderecoCompleto(): string {
    const complemento = this._complemento ? `, ${this._complemento}` : '';
    return `${this._rua}, ${this._numero}${complemento}, ${this._bairro}, ${this._cidade}/${this._estado}, CEP: ${this._cep.obterFormatado()}`;
  }
}
