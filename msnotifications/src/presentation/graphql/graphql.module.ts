import { Module } from '@nestjs/common';
import { NotificationsResolver } from './notifications.resolver';
import { NotificationsModule } from '../../application/application.module';

@Module({
    imports: [NotificationsModule],
    providers: [NotificationsResolver],
    exports: [NotificationsResolver],
})
export class GraphQLNotificationsModule {}
