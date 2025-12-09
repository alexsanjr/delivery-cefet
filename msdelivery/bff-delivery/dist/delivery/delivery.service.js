"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeliveryService = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
let DeliveryService = class DeliveryService {
    constructor(client) {
        this.client = client;
    }
    onModuleInit() {
        this.deliveryPersonService = this.client.getService('DeliveryPersonService');
    }
    getDeliveryPerson(deliveryPersonId) {
        return this.deliveryPersonService.GetDeliveryPerson({ deliveryPersonId });
    }
    findAvailableDeliveryPersons(latitude, longitude, radiusKm, vehicleType) {
        return this.deliveryPersonService.FindAvailableDeliveryPersons({
            latitude,
            longitude,
            radiusKm,
            vehicleType,
        });
    }
    updateDeliveryPersonStatus(deliveryPersonId, status) {
        return this.deliveryPersonService.UpdateDeliveryPersonStatus({
            deliveryPersonId,
            status,
        });
    }
    updateDeliveryPersonLocation(deliveryPersonId, latitude, longitude, speed, heading, accuracy) {
        return this.deliveryPersonService.UpdateDeliveryPersonLocation({
            deliveryPersonId,
            latitude,
            longitude,
            speed,
            heading,
            accuracy,
        });
    }
    getDeliveryByOrder(orderId) {
        return new rxjs_1.Observable((observer) => {
            observer.next({ success: false, delivery: null });
            observer.complete();
        });
    }
    getActiveDeliveries() {
        return new rxjs_1.Observable((observer) => {
            observer.next({ deliveries: [] });
            observer.complete();
        });
    }
};
exports.DeliveryService = DeliveryService;
exports.DeliveryService = DeliveryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('DELIVERY_PACKAGE')),
    __metadata("design:paramtypes", [Object])
], DeliveryService);
//# sourceMappingURL=delivery.service.js.map