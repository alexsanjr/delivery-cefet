import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

interface GeocodingResult {
  lat: string;
  lon: string;
}

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);
  private readonly nominatimUrl = 'https://nominatim.openstreetmap.org/search';

  async getCoordinatesFromAddress(address: string): Promise<{ latitude: number; longitude: number } | null> {
    try {
      this.logger.log(`Buscando coordenadas para endereço: ${address}`);

      const response = await axios.get<GeocodingResult[]>(this.nominatimUrl, {
        params: {
          q: address,
          format: 'json',
          limit: 1,
        },
        headers: {
          'User-Agent': 'DeliveryApp/1.0',
        },
      });

      if (response.data && response.data.length > 0) {
        const result = response.data[0];
        const coordinates = {
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
        };

        this.logger.log(
          `Coordenadas encontradas: ${coordinates.latitude}, ${coordinates.longitude}`,
        );

        return coordinates;
      }

      this.logger.warn(`Nenhuma coordenada encontrada para o endereço: ${address}`);
      return null;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar coordenadas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
      return null;
    }
  }

  formatAddress(addressData: any): string {
    const parts = [
      addressData.street,
      addressData.number,
      addressData.neighborhood,
      addressData.city,
      addressData.state,
      addressData.zipCode,
      'Brasil',
    ].filter(Boolean);

    return parts.join(', ');
  }
}
