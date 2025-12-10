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
exports.DeliveryResolver = void 0;
const graphql_1 = require("@nestjs/graphql");
const delivery_service_1 = require("./delivery.service");
const delivery_model_1 = require("./models/delivery.model");
const delivery_input_1 = require("./dto/delivery.input");
const rxjs_1 = require("rxjs");
let DeliveryResolver = class DeliveryResolver {
    constructor(deliveryService) {
        this.deliveryService = deliveryService;
    }
    async listDeliveryPersons(status) {
        const result = await (0, rxjs_1.lastValueFrom)(this.deliveryService.findAvailableDeliveryPersons(-19.9167, -43.9345, 100, undefined));
        let deliveryPersons = result.deliveryPersons || [];
        if (status) {
            deliveryPersons = deliveryPersons.filter(dp => dp.status === status);
        }
        return deliveryPersons;
    }
    async getDeliveryPerson(id) {
        const result = await (0, rxjs_1.lastValueFrom)(this.deliveryService.getDeliveryPerson(id));
        return result.success ? result.deliveryPerson : null;
    }
    async findAvailableDeliveryPersonsNearby(latitude, longitude, radiusKm, vehicleType) {
        const result = await (0, rxjs_1.lastValueFrom)(this.deliveryService.findAvailableDeliveryPersons(latitude, longitude, radiusKm, vehicleType));
        return result.deliveryPersons || [];
    }
    async updateDeliveryPersonStatus(input) {
        const result = await (0, rxjs_1.lastValueFrom)(this.deliveryService.updateDeliveryPersonStatus(input.deliveryPersonId, input.status));
        return result.success ? result.deliveryPerson : null;
    }
    async updateDeliveryPersonLocation(input) {
        const result = await (0, rxjs_1.lastValueFrom)(this.deliveryService.updateDeliveryPersonLocation(input.deliveryPersonId, input.latitude, input.longitude, input.speed, input.heading, input.accuracy));
        return result.success ? result.deliveryPerson : null;
    }
    async listDeliveries() {
        const result = await (0, rxjs_1.lastValueFrom)(this.deliveryService.getActiveDeliveries());
        return result.deliveries || [];
    }
    async getDeliveryByOrder(orderId) {
        const result = await (0, rxjs_1.lastValueFrom)(this.deliveryService.getDeliveryByOrder(orderId));
        return result.success ? result.delivery : null;
    }
    async getDeliveriesByDeliveryPerson(deliveryPersonId) {
        return [];
    }
};
exports.DeliveryResolver = DeliveryResolver;
__decorate([
    (0, graphql_1.Query)(() => [delivery_model_1.DeliveryPerson], { name: 'deliveryPersons' }),
    __param(0, (0, graphql_1.Args)('status', { nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DeliveryResolver.prototype, "listDeliveryPersons", null);
__decorate([
    (0, graphql_1.Query)(() => delivery_model_1.DeliveryPerson, { nullable: true, name: 'deliveryPerson' }),
    __param(0, (0, graphql_1.Args)('id', { type: () => graphql_1.Int })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], DeliveryResolver.prototype, "getDeliveryPerson", null);
__decorate([
    (0, graphql_1.Query)(() => [delivery_model_1.DeliveryPerson], { name: 'availableDeliveryPersonsNearby' }),
    __param(0, (0, graphql_1.Args)('latitude')),
    __param(1, (0, graphql_1.Args)('longitude')),
    __param(2, (0, graphql_1.Args)('radiusKm')),
    __param(3, (0, graphql_1.Args)('vehicleType', { nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number, String]),
    __metadata("design:returntype", Promise)
], DeliveryResolver.prototype, "findAvailableDeliveryPersonsNearby", null);
__decorate([
    (0, graphql_1.Mutation)(() => delivery_model_1.DeliveryPerson, { nullable: true }),
    __param(0, (0, graphql_1.Args)('updateStatusInput')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [delivery_input_1.UpdateDeliveryPersonStatusInput]),
    __metadata("design:returntype", Promise)
], DeliveryResolver.prototype, "updateDeliveryPersonStatus", null);
__decorate([
    (0, graphql_1.Mutation)(() => delivery_model_1.DeliveryPerson, { nullable: true }),
    __param(0, (0, graphql_1.Args)('updateLocationInput')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [delivery_input_1.UpdateDeliveryPersonLocationInput]),
    __metadata("design:returntype", Promise)
], DeliveryResolver.prototype, "updateDeliveryPersonLocation", null);
__decorate([
    (0, graphql_1.Query)(() => [delivery_model_1.Delivery], { name: 'deliveries' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DeliveryResolver.prototype, "listDeliveries", null);
__decorate([
    (0, graphql_1.Query)(() => delivery_model_1.Delivery, { nullable: true, name: 'deliveryByOrder' }),
    __param(0, (0, graphql_1.Args)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DeliveryResolver.prototype, "getDeliveryByOrder", null);
__decorate([
    (0, graphql_1.Query)(() => [delivery_model_1.Delivery], { name: 'deliveriesByDeliveryPerson' }),
    __param(0, (0, graphql_1.Args)('deliveryPersonId', { type: () => graphql_1.Int })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], DeliveryResolver.prototype, "getDeliveriesByDeliveryPerson", null);
exports.DeliveryResolver = DeliveryResolver = __decorate([
    (0, graphql_1.Resolver)(() => delivery_model_1.DeliveryPerson),
    __metadata("design:paramtypes", [delivery_service_1.DeliveryService])
], DeliveryResolver);
//# sourceMappingURL=delivery.resolver.js.map