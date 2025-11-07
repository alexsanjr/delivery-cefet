import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Point } from '../../routing/dto/routing.objects';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ExternalMapsClient {
  private readonly apiKey: string;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.apiKey = this.config.get<string>('GEOAPIFY_API_KEY')?.trim() ?? '';
    console.log('🔑 API Key loaded:', this.apiKey ? `${this.apiKey.substring(0, 8)}...` : 'NOT FOUND');
  }

  /** Retorna rota completa usando apenas a API do Geoapify */
  async getDirections(
    origin: Point,
    destination: Point,
    options: {
      waypoints?: Point[];
      mode?: 'driving' | 'walking' | 'bicycling';
      avoid?: ('tolls' | 'highways')[];
    } = {},
  ): Promise<{
    polyline: string;
    distance: number;   // metros
    duration: number;   // segundos
    steps: Array<{
      instruction: string;
      distance_meters: number;
      duration_seconds: number;
      start_location: Point;
      end_location: Point;
    }>;
  }> {
    // Se não há API key, usa implementação mock
    if (!this.apiKey) {
      return this.getMockDirections(origin, destination, options);
    }

    try {
      const mode = this.mapMode(options.mode);
      const waypoints = this.buildWaypoints(origin, destination, options.waypoints);
      const avoid = this.buildAvoid(options.avoid);
      const url = `https://api.geoapify.com/v1/routing?waypoints=${waypoints}&mode=${mode}${avoid}&apiKey=${this.apiKey}`;

      console.log('🌍 Calling Geoapify API:', url.replace(this.apiKey, 'API_KEY'));
      
      // Debug: testar com coordenadas da Europa primeiro
      if (origin.latitude < -10) {
        console.log('🌎 Brazil coordinates detected, testing with Europe first...');
        const testUrl = `https://api.geoapify.com/v1/routing?waypoints=48.8566,2.3522|48.8606,2.3376&mode=drive&apiKey=${this.apiKey}`;
        try {
          const testResponse = await firstValueFrom(this.http.get(testUrl));
          console.log('✅ Europe test successful, features:', testResponse.data.features?.length || 0);
        } catch (err) {
          console.log('❌ Europe test failed:', err.message);
        }
      }
      
      const { data } = await firstValueFrom(this.http.get(url));
      console.log('📊 API Response features:', data.features?.length || 0);
      console.log('📊 Full API Response:', JSON.stringify(data, null, 2));
      const feature = data.features?.[0];
      if (!feature) throw new Error('No route found (Geoapify)');

      const { properties, geometry } = feature;
      
      // A estrutura da Geoapify é diferente - coordenadas estão em geometry.geometry.coordinates
      const coords = geometry.geometry?.coordinates?.[0] || geometry.coordinates?.[0] || [];
      console.log('🛣️ Route coordinates found:', coords.length);

      const result = {
        polyline: this.encodePolyline(coords), // polyline encoded
        distance: properties.distance || 0,
        duration: properties.time || 0,
        steps: [{
          instruction: `Siga pela rota de ${(properties.distance / 1000).toFixed(1)} km`,
          distance_meters: properties.distance || 0,
          duration_seconds: properties.time || 0,
          start_location: {
            latitude: coords[0]?.[1] || 0,
            longitude: coords[0]?.[0] || 0,
          },
          end_location: {
            latitude: coords[coords.length - 1]?.[1] || 0,
            longitude: coords[coords.length - 1]?.[0] || 0,
          },
        }],
        // Adiciona coordenadas brutas para debug
        rawCoordinates: coords,
      };
      
      console.log('✅ Real API result:', { 
        coordsLength: geometry.coordinates?.length,
        polylineLength: result.polyline?.length,
        distance: result.distance 
      });
      
      return result;
    } catch (error) {
      // Em caso de erro, fallback para mock
      console.warn('❌ Geoapify API error, using mock data:');
      console.warn('Error:', error.message);
      console.warn('Response data:', error.response?.data);
      console.warn('Status:', error.response?.status);
      return this.getMockDirections(origin, destination, options);
    }
  }

  /** Implementação mock para desenvolvimento e fallback */
  private getMockDirections(
    origin: Point,
    destination: Point,
    options: {
      mode?: 'driving' | 'walking' | 'bicycling';
      avoid?: ('tolls' | 'highways')[];
    } = {},
  ): {
    polyline: string;
    distance: number;
    duration: number;
    steps: Array<{
      instruction: string;
      distance_meters: number;
      duration_seconds: number;
      start_location: Point;
      end_location: Point;
    }>;
  } {
    const distance = this.haversineDistance(origin, destination);
    
    // Adjust speed based on mode
    let speedKph = 40; // default driving speed
    let modeText = 'de carro';
    if (options.mode === 'walking') {
      speedKph = 5;
      modeText = 'a pé';
    }
    if (options.mode === 'bicycling') {
      speedKph = 15;
      modeText = 'de bicicleta';
    }
    
    const duration = (distance / 1000) / speedKph * 3600; // seconds
    
    return {
      polyline: this.encodeMockPolyline(origin, destination),
      distance: Math.round(distance),
      duration: Math.round(duration),
      steps: this.generateBrazilianSteps(origin, destination, distance, duration, modeText),
    };
  }

  /**
   * Gera instruções mais realistas em português brasileiro
   */
  private generateBrazilianSteps(
    origin: Point,
    destination: Point,
    totalDistance: number,
    totalDuration: number,
    mode: string
  ): Array<{
    instruction: string;
    distance_meters: number;
    duration_seconds: number;
    start_location: Point;
    end_location: Point;
  }> {
    const steps: Array<{
      instruction: string;
      distance_meters: number;
      duration_seconds: number;
      start_location: Point;
      end_location: Point;
    }> = [];
    
    const direction = this.getCardinalDirection(origin, destination);
    const distanceKm = (totalDistance / 1000).toFixed(1);
    const durationMin = Math.round(totalDuration / 60);

    // Primeira instrução - saída
    steps.push({
      instruction: `Siga ${direction} ${mode} por ${distanceKm} km`,
      distance_meters: Math.round(totalDistance * 0.7),
      duration_seconds: Math.round(totalDuration * 0.7),
      start_location: origin,
      end_location: {
        latitude: origin.latitude + (destination.latitude - origin.latitude) * 0.7,
        longitude: origin.longitude + (destination.longitude - origin.longitude) * 0.7,
      },
    });

    // Instrução intermediária
    if (totalDistance > 1000) {
      const midPoint = {
        latitude: origin.latitude + (destination.latitude - origin.latitude) * 0.7,
        longitude: origin.longitude + (destination.longitude - origin.longitude) * 0.7,
      };

      steps.push({
        instruction: 'Continue em frente na via principal',
        distance_meters: Math.round(totalDistance * 0.2),
        duration_seconds: Math.round(totalDuration * 0.2),
        start_location: midPoint,
        end_location: {
          latitude: origin.latitude + (destination.latitude - origin.latitude) * 0.9,
          longitude: origin.longitude + (destination.longitude - origin.longitude) * 0.9,
        },
      });
    }

    // Instrução final
    const lastPoint = steps.length > 1 ? steps[steps.length - 1].end_location : origin;
    steps.push({
      instruction: `Você chegará ao destino em ${durationMin} minutos`,
      distance_meters: Math.round(totalDistance * 0.1),
      duration_seconds: Math.round(totalDuration * 0.1),
      start_location: lastPoint,
      end_location: destination,
    });

    return steps;
  }

  /* ---------- helpers ---------- */

  private mapMode(mode?: string): string {
    return mode === 'walking' ? 'walk' :
           mode === 'bicycling' ? 'bicycle' : 'drive';
  }

  private buildWaypoints(origin: Point, dest: Point, waypoints?: Point[]): string {
    const pts = [origin, ...(waypoints ?? []), dest];
    // Tentando latitude,longitude baseado no erro da API
    return pts.map(p => `${p.latitude},${p.longitude}`).join('|');
  }

  private buildAvoid(avoid?: ('tolls' | 'highways')[]): string {
    if (!avoid?.length) return '';
    const map = { tolls: 'tollways', highways: 'motorway' };
    const values = avoid.map(v => map[v]).filter(Boolean);
    return values.length ? `&avoid=${values.join('|')}` : '';
  }

  /** Converte GeoJSON → Google-encoded polyline */
  private encodePolyline(coords: number[][]): string {
    let encoded = '';
    let prevLat = 0;
    let prevLng = 0;

    for (const [lng, lat] of coords) {
      const iLat = Math.round(lat * 1e5);
      const iLng = Math.round(lng * 1e5);
      encoded += this.encodeValue(iLat - prevLat) + this.encodeValue(iLng - prevLng);
      prevLat = iLat;
      prevLng = iLng;
    }
    return encoded;
  }

  private encodeValue(v: number): string {
    const signed = v < 0 ? ~(v << 1) : v << 1;
    let str = '';
    let val = signed;
    while (val >= 0x20) {
      str += String.fromCharCode((0x20 | (val & 0x1f)) + 63);
      val >>= 5;
    }
    str += String.fromCharCode(val + 63);
    return str;
  }

  private haversineDistance(point1: Point, point2: Point): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
    const dLon = (point2.longitude - point1.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private getDirection(origin: Point, destination: Point): string {
    const dLat = destination.latitude - origin.latitude;
    const dLon = destination.longitude - origin.longitude;
    
    if (Math.abs(dLat) > Math.abs(dLon)) {
      return dLat > 0 ? 'north' : 'south';
    } else {
      return dLon > 0 ? 'east' : 'west';
    }
  }

  private getCardinalDirection(origin: Point, destination: Point): string {
    const dLat = destination.latitude - origin.latitude;
    const dLon = destination.longitude - origin.longitude;
    
    if (Math.abs(dLat) > Math.abs(dLon)) {
      return dLat > 0 ? 'para o norte' : 'para o sul';
    } else {
      return dLon > 0 ? 'para o leste' : 'para o oeste';
    }
  }

  private encodeMockPolyline(origin: Point, destination: Point): string {
    // Polyline mais realista
    return `mock_polyline_encoded_string`;
  }

  /**
   * Gera pontos intermediários mais realistas para a rota
   */
  private generateRoutePoints(origin: Point, destination: Point): Point[] {
    const points: Point[] = [origin];
    
    // Adicionar 3-5 pontos intermediários
    const numPoints = 4;
    for (let i = 1; i < numPoints; i++) {
      const ratio = i / numPoints;
      
      // Adicionar pequena variação para simular uma rota real
      const variation = 0.002 * (Math.random() - 0.5); // ~200m de variação
      
      points.push({
        latitude: origin.latitude + (destination.latitude - origin.latitude) * ratio + variation,
        longitude: origin.longitude + (destination.longitude - origin.longitude) * ratio + variation,
      });
    }
    
    points.push(destination);
    return points;
  }
}