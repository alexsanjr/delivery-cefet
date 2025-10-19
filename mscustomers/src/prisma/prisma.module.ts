import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()  // ← Você adiciona manualmente o @Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}