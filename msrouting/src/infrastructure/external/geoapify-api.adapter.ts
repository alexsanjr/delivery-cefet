import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import type { IServicoAPIMapas } from '../../domain/repositories/api-mapas.interface';
import { Rota, EstrategiaRota, PassoRota } from '../../domain/entities/rota.entity';
import { Ponto } from '../../domain/entities/ponto.entity';
import { Distancia } from '../../domain/value-objects/distancia.vo';
import { Duracao } from '../../domain/value-objects/duracao.vo';
import { CalculadorCustosRota } from '../../domain/services/calculador-custos.service';
import { firstValueFrom } from 'rxjs';

// Adapter para API Geoapify com fallback para dados mock
@Injectable()
export class GeoapifyAPIAdapter implements IServicoAPIMapas {
  private readonly logger = new Logger(GeoapifyAPIAdapter.name);
  private readonly apiKey: string;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.apiKey = this.config.get<string>('GEOAPIFY_API_KEY')?.trim() ?? '';
  }

  async calcularRota(
    origem: Ponto,
    destino: Ponto,
    pontosIntermediarios: Ponto[],
    estrategia: EstrategiaRota,
  ): Promise<Rota> {
    if (!this.apiKey) {
      this.logger.warn('API Key não configurada, usando cálculo mock');
      return this.calcularRotaMock(origem, destino, pontosIntermediarios, estrategia);
    }

    try {
      const mode = this.mapearModo(estrategia);
      const waypoints = this.construirWaypoints(origem, destino, pontosIntermediarios);
      const url = `https://api.geoapify.com/v1/routing?waypoints=${waypoints}&mode=${mode}&apiKey=${this.apiKey}`;

      this.logger.log(`Chamando Geoapify API: ${url.substring(0, 100)}...`);

      const { data } = await firstValueFrom(this.http.get(url));
      const feature = data.features?.[0];

      if (!feature) {
        throw new Error('Nenhuma rota encontrada pela API');
      }

      return this.converterRespostaAPI(feature, origem, destino, pontosIntermediarios, estrategia);
    } catch (error) {
      this.logger.error(`Erro ao chamar Geoapify API: ${error.message}`);
      this.logger.warn('Usando cálculo mock como fallback');
      return this.calcularRotaMock(origem, destino, pontosIntermediarios, estrategia);
    }
  }

  async verificarDisponibilidade(): Promise<boolean> {
    return !!this.apiKey;
  }

  private converterRespostaAPI(
    feature: any,
    origem: Ponto,
    destino: Ponto,
    pontosIntermediarios: Ponto[],
    estrategia: EstrategiaRota,
  ): Rota {
    const { properties, geometry } = feature;
    const coords = geometry.geometry?.coordinates?.[0] || geometry.coordinates?.[0] || [];

    const distancia = Distancia.criar(properties.distance || 0);
    const duracao = Duracao.criar(properties.time || 0);

    const passos = [
      new PassoRota(
        `Siga pela rota de ${distancia.obterQuilometros().toFixed(1)} km`,
        distancia,
        duracao,
        origem,
        destino,
      ),
    ];

    const polyline = this.codificarPolyline(coords);
    const custoEstimado = CalculadorCustosRota.calcularCustoEstimado(
      distancia,
      duracao,
      estrategia,
    );

    return Rota.criar({
      origem,
      destino,
      pontosIntermediarios,
      distanciaTotal: distancia,
      duracaoTotal: duracao,
      passos,
      polyline,
      custoEstimado,
      estrategia,
    });
  }

  private calcularRotaMock(
    origem: Ponto,
    destino: Ponto,
    pontosIntermediarios: Ponto[],
    estrategia: EstrategiaRota,
  ): Rota {
    const distanciaMetros = origem.calcularDistanciaAte(destino);
    const distancia = Distancia.criar(distanciaMetros);

    // Calcular duração baseada na estratégia
    let velocidadeKmH = 40; // Velocidade padrão
    switch (estrategia) {
      case EstrategiaRota.MAIS_RAPIDA:
        velocidadeKmH = 60;
        break;
      case EstrategiaRota.MAIS_CURTA:
        velocidadeKmH = 30;
        break;
      case EstrategiaRota.MAIS_ECONOMICA:
        velocidadeKmH = 45;
        break;
      case EstrategiaRota.ECO_FRIENDLY:
        velocidadeKmH = 35;
        break;
    }

    const duracaoSegundos = (distancia.obterQuilometros() / velocidadeKmH) * 3600;
    const duracao = Duracao.criar(duracaoSegundos);

    const passos = this.gerarPassosBrasileiros(origem, destino, distancia, duracao);
    const polyline = this.codificarPolylineMock(origem, destino);
    const custoEstimado = CalculadorCustosRota.calcularCustoEstimado(
      distancia,
      duracao,
      estrategia,
    );

    return Rota.criar({
      origem,
      destino,
      pontosIntermediarios,
      distanciaTotal: distancia,
      duracaoTotal: duracao,
      passos,
      polyline,
      custoEstimado,
      estrategia,
    });
  }

  private gerarPassosBrasileiros(
    origem: Ponto,
    destino: Ponto,
    distancia: Distancia,
    duracao: Duracao,
  ): PassoRota[] {
    const direcao = this.obterDirecaoCardeal(origem, destino);
    const distKm = distancia.obterQuilometros().toFixed(1);

    return [
      new PassoRota(
        `Siga ${direcao} por ${distKm} km`,
        Distancia.criar(distancia.obterMetros() * 0.7),
        Duracao.criar(duracao.obterSegundos() * 0.7),
        origem,
        this.pontoIntermediario(origem, destino, 0.7),
      ),
      new PassoRota(
        `Você chegará ao destino em ${Math.round(duracao.obterMinutos())} minutos`,
        Distancia.criar(distancia.obterMetros() * 0.3),
        Duracao.criar(duracao.obterSegundos() * 0.3),
        this.pontoIntermediario(origem, destino, 0.7),
        destino,
      ),
    ];
  }

  private pontoIntermediario(origem: Ponto, destino: Ponto, fator: number): Ponto {
    return Ponto.criar({
      latitude: origem.obterLatitude() + (destino.obterLatitude() - origem.obterLatitude()) * fator,
      longitude: origem.obterLongitude() + (destino.obterLongitude() - origem.obterLongitude()) * fator,
    });
  }

  private obterDirecaoCardeal(origem: Ponto, destino: Ponto): string {
    const deltaLat = destino.obterLatitude() - origem.obterLatitude();
    const deltaLng = destino.obterLongitude() - origem.obterLongitude();

    if (Math.abs(deltaLat) > Math.abs(deltaLng)) {
      return deltaLat > 0 ? 'ao norte' : 'ao sul';
    }
    return deltaLng > 0 ? 'ao leste' : 'ao oeste';
  }

  private mapearModo(estrategia: EstrategiaRota): string {
    switch (estrategia) {
      case EstrategiaRota.ECO_FRIENDLY:
        return 'bicycle';
      case EstrategiaRota.MAIS_CURTA:
        return 'drive';
      default:
        return 'drive';
    }
  }

  private construirWaypoints(origem: Ponto, destino: Ponto, intermediarios: Ponto[]): string {
    const pontos = [origem, ...intermediarios, destino];
    return pontos
      .map((p) => `${p.obterLatitude()},${p.obterLongitude()}`)
      .join('|');
  }

  private codificarPolyline(coords: number[][]): string {
    // Simplificação: retorna coordenadas como string
    return coords.map((c) => `${c[1]},${c[0]}`).join(';');
  }

  private codificarPolylineMock(origem: Ponto, destino: Ponto): string {
    return `${origem.obterLatitude()},${origem.obterLongitude()};${destino.obterLatitude()},${destino.obterLongitude()}`;
  }
}
