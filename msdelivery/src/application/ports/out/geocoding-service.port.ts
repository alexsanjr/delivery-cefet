export interface GeocodingResult {
  latitude: number;
  longitude: number;
}

export interface IGeocodingService {
  geocode(address: string): Promise<GeocodingResult | null>;
}

export const GEOCODING_SERVICE = Symbol('IGeocodingService');
