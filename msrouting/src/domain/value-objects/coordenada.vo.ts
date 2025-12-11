// Coordenada geográfica com validação de latitude/longitude
export class Coordenada {
  private readonly latitude: number;
  private readonly longitude: number;

  private constructor(latitude: number, longitude: number) {
    this.latitude = latitude;
    this.longitude = longitude;
  }

  static criar(latitude: number, longitude: number): Coordenada {
    if (latitude < -90 || latitude > 90) {
      throw new Error('Latitude deve estar entre -90 e 90 graus');
    }

    if (longitude < -180 || longitude > 180) {
      throw new Error('Longitude deve estar entre -180 e 180 graus');
    }

    return new Coordenada(latitude, longitude);
  }

  obterLatitude(): number {
    return this.latitude;
  }

  obterLongitude(): number {
    return this.longitude;
  }

  /**
   * Calcula distância até outra coordenada usando fórmula de Haversine
   * @returns distância em metros
   */
  calcularDistanciaAte(outra: Coordenada): number {
    const R = 6371e3; // Raio da Terra em metros
    const φ1 = (this.latitude * Math.PI) / 180;
    const φ2 = (outra.latitude * Math.PI) / 180;
    const Δφ = ((outra.latitude - this.latitude) * Math.PI) / 180;
    const Δλ = ((outra.longitude - this.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distância em metros
  }

  equals(outra: Coordenada): boolean {
    return (
      this.latitude === outra.latitude && this.longitude === outra.longitude
    );
  }

  toString(): string {
    return `(${this.latitude}, ${this.longitude})`;
  }
}
