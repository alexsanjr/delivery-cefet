import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StartTrackingUseCase } from './use-cases/start-tracking.use-case';
import { UpdatePositionUseCase } from './use-cases/update-position.use-case';
import { GetTrackingDataUseCase } from './use-cases/get-tracking-data.use-case';
import { GetActiveDeliveriesUseCase } from './use-cases/get-active-deliveries.use-case';
import { MarkAsDeliveredUseCase } from './use-cases/mark-as-delivered.use-case';
import { TrackingApplicationService } from './services/tracking-application.service';
import { TypeORMTrackingRepository } from '../infrastructure/persistence/typeorm-tracking.repository';
import { TypeORMDeliveryTrackingRepository } from '../infrastructure/persistence/typeorm-delivery-tracking.repository';
import { TrackingPositionORM } from '../infrastructure/persistence/tracking-position.orm';
import { DeliveryTrackingORM } from '../infrastructure/persistence/delivery-tracking.orm';
import { RabbitMQService } from '../infrastructure/rabbitmq.service';
import { RabbitMQConsumerService } from '../infrastructure/rabbitmq-consumer.service';
import { PositionLoggerObserver } from '../infrastructure/adapters/position-logger.observer';
import { PositionSubjectAdapter } from '../infrastructure/adapters/position-subject.adapter';
import { AdaptersModule } from '../infrastructure/adapters/adapters.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([TrackingPositionORM, DeliveryTrackingORM]),
        AdaptersModule,
    ],
    providers: [
        PositionLoggerObserver,
        PositionSubjectAdapter,
        TypeORMTrackingRepository,
        TypeORMDeliveryTrackingRepository,
        RabbitMQService,
        RabbitMQConsumerService,
        { provide: 'TrackingRepositoryPort', useExisting: TypeORMTrackingRepository },
        { provide: 'DeliveryTrackingRepositoryPort', useExisting: TypeORMDeliveryTrackingRepository },
        { provide: 'PositionSubjectPort', useExisting: PositionSubjectAdapter },
        StartTrackingUseCase,
        UpdatePositionUseCase,
        GetTrackingDataUseCase,
        GetActiveDeliveriesUseCase,
        MarkAsDeliveredUseCase,
        TrackingApplicationService,
    ],
    exports: [
        StartTrackingUseCase,
        UpdatePositionUseCase,
        GetTrackingDataUseCase,
        GetActiveDeliveriesUseCase,
        MarkAsDeliveredUseCase,
        TrackingApplicationService,
    ],
})
export class TrackingApplicationModule {}
