export class EntityNotFoundException extends Error {
  constructor(entity: string, id: number | string) {
    super(`${entity} com id ${id} não encontrado(a)`);
    this.name = 'EntityNotFoundException';
  }
}
