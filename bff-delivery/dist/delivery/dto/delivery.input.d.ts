export declare class FindAvailableDeliveryPersonsInput {
    latitude: number;
    longitude: number;
    radiusKm: number;
    vehicleType?: string;
}
export declare class UpdateDeliveryPersonStatusInput {
    deliveryPersonId: number;
    status: string;
}
export declare class UpdateDeliveryPersonLocationInput {
    deliveryPersonId: number;
    latitude: number;
    longitude: number;
    speed?: number;
    heading?: number;
    accuracy?: number;
}
