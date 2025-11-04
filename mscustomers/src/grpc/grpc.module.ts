import { Module, Global } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [],
  exports: [],
})
export class GrpcModule {}
