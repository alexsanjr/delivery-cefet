import { Module } from '@nestjs/common';
import { CalcularRotaCasoDeUso } from './use-cases/calcular-rota.use-case';
import { CalcularETACasoDeUso } from './use-cases/calcular-eta.use-case';
import { OtimizarEntregasCasoDeUso } from './use-cases/otimizar-entregas.use-case';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { OtimizadorRotas } from '../domain/services/otimizador-rotas.service';
import { RotaEventPublisher } from '../domain/events/route-event.publisher';

/**
 * Módulo de Aplicação
 * Contém os use cases e DTOs
 */
@Module({
  imports: [InfrastructureModule],
  providers: [
    CalcularRotaCasoDeUso,
    CalcularETACasoDeUso,
    OtimizarEntregasCasoDeUso,
    OtimizadorRotas,
    RotaEventPublisher,
  ],
  exports: [
    CalcularRotaCasoDeUso,
    CalcularETACasoDeUso,
    OtimizarEntregasCasoDeUso,
  ],
})
export class ApplicationModule {}
