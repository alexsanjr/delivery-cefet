import { Injectable } from '@nestjs/common';
import { IGeocodingService, GeocodingResult } from '../../../../application/ports/out/geocoding-service.port';

@Injectable()
export class NominatimGeocodingAdapter implements IGeocodingService {
  async geocode(address: string): Promise<GeocodingResult | null> {
    try {
      const encodedAddress = encodeURIComponent(address);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`,
        {
          headers: {
            'User-Agent': 'DeliveryCefet/1.0',
          },
        },
      );

      const data = await response.json();

      if (data && data.length > 0) {
        return {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
        };
      }

      return null;
    } catch (error) {
      console.error('Erro ao geocodificar endereço:', error);
      return null;
    }
  }
}
