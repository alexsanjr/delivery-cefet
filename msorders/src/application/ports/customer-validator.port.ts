export interface ICustomerValidator {
  exists(customerId: number): Promise<boolean>;
  getCustomerData(customerId: number): Promise<CustomerData>;
}

export interface CustomerData {
  id: number;
  name: string;
  email: string;
  phone: string;
}

export const CUSTOMER_VALIDATOR = Symbol('ICustomerValidator');
