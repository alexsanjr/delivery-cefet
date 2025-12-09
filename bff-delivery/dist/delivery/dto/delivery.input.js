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
exports.UpdateDeliveryPersonLocationInput = exports.UpdateDeliveryPersonStatusInput = exports.FindAvailableDeliveryPersonsInput = void 0;
const graphql_1 = require("@nestjs/graphql");
let FindAvailableDeliveryPersonsInput = class FindAvailableDeliveryPersonsInput {
};
exports.FindAvailableDeliveryPersonsInput = FindAvailableDeliveryPersonsInput;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Float),
    __metadata("design:type", Number)
], FindAvailableDeliveryPersonsInput.prototype, "latitude", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Float),
    __metadata("design:type", Number)
], FindAvailableDeliveryPersonsInput.prototype, "longitude", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Float),
    __metadata("design:type", Number)
], FindAvailableDeliveryPersonsInput.prototype, "radiusKm", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", String)
], FindAvailableDeliveryPersonsInput.prototype, "vehicleType", void 0);
exports.FindAvailableDeliveryPersonsInput = FindAvailableDeliveryPersonsInput = __decorate([
    (0, graphql_1.InputType)()
], FindAvailableDeliveryPersonsInput);
let UpdateDeliveryPersonStatusInput = class UpdateDeliveryPersonStatusInput {
};
exports.UpdateDeliveryPersonStatusInput = UpdateDeliveryPersonStatusInput;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    __metadata("design:type", Number)
], UpdateDeliveryPersonStatusInput.prototype, "deliveryPersonId", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], UpdateDeliveryPersonStatusInput.prototype, "status", void 0);
exports.UpdateDeliveryPersonStatusInput = UpdateDeliveryPersonStatusInput = __decorate([
    (0, graphql_1.InputType)()
], UpdateDeliveryPersonStatusInput);
let UpdateDeliveryPersonLocationInput = class UpdateDeliveryPersonLocationInput {
};
exports.UpdateDeliveryPersonLocationInput = UpdateDeliveryPersonLocationInput;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    __metadata("design:type", Number)
], UpdateDeliveryPersonLocationInput.prototype, "deliveryPersonId", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Float),
    __metadata("design:type", Number)
], UpdateDeliveryPersonLocationInput.prototype, "latitude", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Float),
    __metadata("design:type", Number)
], UpdateDeliveryPersonLocationInput.prototype, "longitude", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Float, { nullable: true }),
    __metadata("design:type", Number)
], UpdateDeliveryPersonLocationInput.prototype, "speed", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Float, { nullable: true }),
    __metadata("design:type", Number)
], UpdateDeliveryPersonLocationInput.prototype, "heading", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Float, { nullable: true }),
    __metadata("design:type", Number)
], UpdateDeliveryPersonLocationInput.prototype, "accuracy", void 0);
exports.UpdateDeliveryPersonLocationInput = UpdateDeliveryPersonLocationInput = __decorate([
    (0, graphql_1.InputType)()
], UpdateDeliveryPersonLocationInput);
//# sourceMappingURL=delivery.input.js.map