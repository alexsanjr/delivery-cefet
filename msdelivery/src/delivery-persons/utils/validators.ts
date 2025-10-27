import { BadRequestException } from '@nestjs/common';

export class DeliveryPersonValidators {
  /**
   * Valida se o CPF é válido através dos dígitos verificadores
   */
  static validateCpf(cpf: string): boolean {
    // Remove caracteres não numéricos
    const cleanCpf = cpf.replace(/\D/g, '');

    // Verifica se tem 11 dígitos
    if (cleanCpf.length !== 11) {
      throw new BadRequestException('CPF deve conter 11 dígitos');
    }

    // Verifica se todos os dígitos são iguais (CPF inválido)
    if (/^(\d)\1{10}$/.test(cleanCpf)) {
      throw new BadRequestException('CPF inválido');
    }

    // Calcula o primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCpf.charAt(i)) * (10 - i);
    }
    let digit1 = 11 - (sum % 11);
    digit1 = digit1 >= 10 ? 0 : digit1;

    if (digit1 !== parseInt(cleanCpf.charAt(9))) {
      throw new BadRequestException('CPF inválido');
    }

    // Calcula o segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCpf.charAt(i)) * (11 - i);
    }
    let digit2 = 11 - (sum % 11);
    digit2 = digit2 >= 10 ? 0 : digit2;

    if (digit2 !== parseInt(cleanCpf.charAt(10))) {
      throw new BadRequestException('CPF inválido');
    }

    return true;
  }

  /**
   * Valida coordenadas geográficas
   */
  static validateCoordinates(latitude: number, longitude: number): boolean {
    if (latitude < -90 || latitude > 90) {
      throw new BadRequestException('Latitude deve estar entre -90 e 90');
    }

    if (longitude < -180 || longitude > 180) {
      throw new BadRequestException('Longitude deve estar entre -180 e 180');
    }

    return true;
  }

  /**
   * Calcula a distância entre duas coordenadas em km (Fórmula de Haversine)
   */
  static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Raio da Terra em km
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Valida se a distância entre duas localizações é razoável
   * Previne GPS spoofing verificando se a velocidade não ultrapassa 200 km/h
   */
  static validateLocationChange(
    prevLat: number,
    prevLon: number,
    newLat: number,
    newLon: number,
    timeDiffMinutes: number,
  ): boolean {
    const distance = this.calculateDistance(prevLat, prevLon, newLat, newLon);
    const maxSpeedKmh = 200; // Velocidade máxima razoável
    const maxDistanceKm = (maxSpeedKmh * timeDiffMinutes) / 60;

    if (distance > maxDistanceKm) {
      throw new BadRequestException(
        `Atualização de localização inválida: distância muito grande para o intervalo de tempo (${distance.toFixed(2)} km em ${timeDiffMinutes.toFixed(1)} minutos)`,
      );
    }

    return true;
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
