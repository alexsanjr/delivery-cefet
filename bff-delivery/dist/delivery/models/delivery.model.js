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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Delivery = exports.DeliveryPerson = void 0;
const graphql_1 = require("@nestjs/graphql");
let DeliveryPerson = class DeliveryPerson {
};
exports.DeliveryPerson = DeliveryPerson;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    __metadata("design:type", Number)
], DeliveryPerson.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], DeliveryPerson.prototype, "name", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], DeliveryPerson.prototype, "email", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], DeliveryPerson.prototype, "phone", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", String)
], DeliveryPerson.prototype, "cpf", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], DeliveryPerson.prototype, "vehicleType", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], DeliveryPerson.prototype, "licensePlate", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], DeliveryPerson.prototype, "status", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Float),
    __metadata("design:type", Number)
], DeliveryPerson.prototype, "rating", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    __metadata("design:type", Number)
], DeliveryPerson.prototype, "totalDeliveries", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Float, { nullable: true }),
    __metadata("design:type", Number)
], DeliveryPerson.prototype, "currentLatitude", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Float, { nullable: true }),
    __metadata("design:type", Number)
], DeliveryPerson.prototype, "currentLongitude", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", String)
], DeliveryPerson.prototype, "lastLocationUpdate", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", Boolean)
], DeliveryPerson.prototype, "isActive", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", String)
], DeliveryPerson.prototype, "createdAt", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", String)
], DeliveryPerson.prototype, "updatedAt", void 0);
exports.DeliveryPerson = DeliveryPerson = __decorate([
    (0, graphql_1.ObjectType)()
], DeliveryPerson);
let Delivery = class Delivery {
};
exports.Delivery = Delivery;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID),
    __metadata("design:type", String)
], Delivery.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], Delivery.prototype, "orderId", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], Delivery.prototype, "deliveryPersonId", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], Delivery.prototype, "status", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Float),
    __metadata("design:type", Number)
], Delivery.prototype, "customerLatitude", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Float),
    __metadata("design:type", Number)
], Delivery.prototype, "customerLongitude", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], Delivery.prototype, "customerAddress", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", String)
], Delivery.prototype, "assignedAt", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", String)
], Delivery.prototype, "pickedUpAt", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", String)
], Delivery.prototype, "deliveredAt", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int, { nullable: true }),
    __metadata("design:type", Number)
], Delivery.prototype, "estimatedDeliveryTime", void 0);
__decorate([
    (0, graphql_1.Field)(() => DeliveryPerson, { nullable: true }),
    __metadata("design:type", DeliveryPerson)
], Delivery.prototype, "deliveryPerson", void 0);
exports.Delivery = Delivery = __decorate([
    (0, graphql_1.ObjectType)()
], Delivery);
//# sourceMappingURL=delivery.model.js.map