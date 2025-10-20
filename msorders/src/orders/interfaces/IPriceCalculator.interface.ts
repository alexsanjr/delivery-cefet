export interface IPriceCalculator {
  calculateSubtotal(items?: any[]): number;
  calculateDeliveryFee(): number; // address?: any
  calculateDeliveryTime(): number; //address?: any
}
