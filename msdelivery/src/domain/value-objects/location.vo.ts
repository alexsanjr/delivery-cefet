import { DomainException } from '../exceptions/domain.exception';

export class Location {
  private readonly _latitude: number;
  private readonly _longitude: number;

  private constructor(latitude: number, longitude: number) {
    this._latitude = latitude;
    this._longitude = longitude;
  }

  static create(latitude: number, longitude: number): Location {
    if (!Location.isValidLatitude(latitude)) {
      throw new DomainException(`Latitude inválida: ${latitude}. Deve estar entre -90 e 90`);
    }

    if (!Location.isValidLongitude(longitude)) {
      throw new DomainException(`Longitude inválida: ${longitude}. Deve estar entre -180 e 180`);
    }

    return new Location(latitude, longitude);
  }

  static isValidLatitude(latitude: number): boolean {
    return latitude >= -90 && latitude <= 90;
  }

  static isValidLongitude(longitude: number): boolean {
    return longitude >= -180 && longitude <= 180;
  }

  get latitude(): number {
    return this._latitude;
  }

  get longitude(): number {
    return this._longitude;
  }

  /**
   * Calcula a distância em km entre duas coordenadas usando a fórmula de Haversine
   */
  distanceTo(other: Location): number {
    const R = 6371; // Raio da Terra em km
    const dLat = this.toRadians(other.latitude - this._latitude);
    const dLon = this.toRadians(other.longitude - this._longitude);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(this._latitude)) *
        Math.cos(this.toRadians(other.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Verifica se a distância percorrida é plausível dado o tempo decorrido
   * Velocidade máxima considerada: 120 km/h
   */
  isReasonableDistanceFrom(other: Location, timeMinutes: number): boolean {
    const maxSpeedKmH = 120;
    const maxDistanceKm = (maxSpeedKmH * timeMinutes) / 60;
    const actualDistance = this.distanceTo(other);
    return actualDistance <= maxDistanceKm;
  }

  equals(other: Location): boolean {
    return this._latitude === other._latitude && this._longitude === other._longitude;
  }

  toString(): string {
    return `(${this._latitude}, ${this._longitude})`;
  }
}
