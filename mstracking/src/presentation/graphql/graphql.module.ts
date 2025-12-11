import { Module } from '@nestjs/common';
import { TrackingResolver } from './tracking.resolver';
import { TrackingApplicationModule } from '../../application/application.module';

@Module({
  imports: [TrackingApplicationModule],
  providers: [TrackingResolver],
})
export class GraphQLPresentationModule {}
