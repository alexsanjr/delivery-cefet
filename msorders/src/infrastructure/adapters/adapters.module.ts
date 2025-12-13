import { Module, forwardRef } from '@nestjs/common';
import { CUSTOMER_VALIDATOR } from '../../application/ports/customer-validator.port';
import { NOTIFICATION_SENDER } from '../../application/ports/notification-sender.port';
import { ROUTING_CALCULATOR } from '../../application/ports/routing-calculator.port';

import { CustomersRabbitMQAdapter } from './customers-grpc.adapter';
import { NotificationAdapter } from './notification.adapter';
import { RoutingAdapter } from './routing.adapter';
import { RabbitMQModule } from '../../rabbitmq/rabbitmq.module';

@Module({
  imports: [forwardRef(() => RabbitMQModule)],
  providers: [
    {
      provide: CUSTOMER_VALIDATOR,
      useClass: CustomersRabbitMQAdapter,
    },
    {
      provide: NOTIFICATION_SENDER,
      useClass: NotificationAdapter,
    },
    {
      provide: ROUTING_CALCULATOR,
      useClass: RoutingAdapter,
    },
  ],
  exports: [CUSTOMER_VALIDATOR, NOTIFICATION_SENDER, ROUTING_CALCULATOR],
})
export class AdaptersModule {}
