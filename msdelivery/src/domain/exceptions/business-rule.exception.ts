export class BusinessRuleException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BusinessRuleException';
  }
}
