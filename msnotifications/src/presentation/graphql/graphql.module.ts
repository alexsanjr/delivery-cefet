import { Module } from '@nestjs/common';
import { NotificationsResolver } from './notifications.resolver';
import { NotificationsApplicationModule } from '../../application/application.module';

@Module({
    imports: [NotificationsApplicationModule],
    providers: [NotificationsResolver],
    exports: [NotificationsResolver],
})
export class GraphQLNotificationsModule {}
