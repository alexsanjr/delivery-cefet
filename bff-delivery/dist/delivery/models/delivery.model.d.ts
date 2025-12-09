export declare class DeliveryPerson {
    id: number;
    name: string;
    email: string;
    phone: string;
    cpf?: string;
    vehicleType: string;
    licensePlate: string;
    status: string;
    rating: number;
    totalDeliveries: number;
    currentLatitude?: number;
    currentLongitude?: number;
    lastLocationUpdate?: string;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}
export declare class Delivery {
    id: string;
    orderId: string;
    deliveryPersonId: string;
    status: string;
    customerLatitude: number;
    customerLongitude: number;
    customerAddress: string;
    assignedAt?: string;
    pickedUpAt?: string;
    deliveredAt?: string;
    estimatedDeliveryTime?: number;
    deliveryPerson?: DeliveryPerson;
}
