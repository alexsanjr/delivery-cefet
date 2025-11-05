import { registerEnumType } from '@nestjs/graphql';

export enum DeliveryPersonStatus {
  AVAILABLE = 'AVAILABLE',
  BUSY = 'BUSY',
  OFFLINE = 'OFFLINE',
  ON_BREAK = 'ON_BREAK',
}

registerEnumType(DeliveryPersonStatus, {
  name: 'DeliveryPersonStatus',
  description: 'Status disponíveis para entregadores',
});
