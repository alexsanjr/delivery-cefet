/**
 * Tokens únicos para injeção de dependências.
 * Usamos Symbol para garantir identificadores únicos e evitar conflitos.
 */
export const TOKEN_REPOSITORIO_CLIENTE = Symbol('IRepositorioCliente');
export const TOKEN_REPOSITORIO_ENDERECO = Symbol('IRepositorioEndereco');
