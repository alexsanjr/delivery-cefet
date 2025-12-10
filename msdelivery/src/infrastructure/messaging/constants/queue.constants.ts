// Queue names for RabbitMQ
export const QUEUE_NAMES = {
  // Delivery queues
  DELIVERY_CREATED: 'delivery.created',
  DELIVERY_ASSIGNED: 'delivery.assigned',
  DELIVERY_STATUS_UPDATED: 'delivery.status.updated',
  DELIVERY_COMPLETED: 'delivery.completed',

  // Delivery Person queues
  DELIVERY_PERSON_CREATED: 'delivery-person.created',
  DELIVERY_PERSON_STATUS_UPDATED: 'delivery-person.status.updated',
  DELIVERY_PERSON_LOCATION_UPDATED: 'delivery-person.location.updated',

  // Command queues (for async processing)
  ASSIGN_DELIVERY_COMMAND: 'delivery.command.assign',
  CREATE_DELIVERY_COMMAND: 'delivery.command.create',
  UPDATE_DELIVERY_STATUS_COMMAND: 'delivery.command.update-status',
} as const;

// Exchange names
export const EXCHANGE_NAMES = {
  DELIVERY_EVENTS: 'delivery.events',
  DELIVERY_COMMANDS: 'delivery.commands',
} as const;

// Routing keys
export const ROUTING_KEYS = {
  DELIVERY_CREATED: 'delivery.created',
  DELIVERY_ASSIGNED: 'delivery.assigned',
  DELIVERY_STATUS_UPDATED: 'delivery.status.updated',
  DELIVERY_COMPLETED: 'delivery.completed',
  DELIVERY_PERSON_CREATED: 'delivery-person.created',
  DELIVERY_PERSON_STATUS_UPDATED: 'delivery-person.status.updated',
  DELIVERY_PERSON_LOCATION_UPDATED: 'delivery-person.location.updated',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
export type ExchangeName = (typeof EXCHANGE_NAMES)[keyof typeof EXCHANGE_NAMES];
export type RoutingKey = (typeof ROUTING_KEYS)[keyof typeof ROUTING_KEYS];
