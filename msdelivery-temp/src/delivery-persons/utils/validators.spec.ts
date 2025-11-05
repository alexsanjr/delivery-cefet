import { BadRequestException } from '@nestjs/common';
import { DeliveryPersonValidators } from './validators';

describe('DeliveryPersonValidators', () => {
  describe('validateCpf', () => {
    it('deve validar CPF válido', () => {
      expect(DeliveryPersonValidators.validateCpf('11144477735')).toBe(true);
    });

    it('deve rejeitar CPF com menos de 11 dígitos', () => {
      expect(() => DeliveryPersonValidators.validateCpf('123456789')).toThrow(BadRequestException);
    });

    it('deve rejeitar CPF com todos os dígitos iguais', () => {
      expect(() => DeliveryPersonValidators.validateCpf('11111111111')).toThrow(BadRequestException);
    });

    it('deve rejeitar CPF com dígitos verificadores inválidos', () => {
      expect(() => DeliveryPersonValidators.validateCpf('12345678901')).toThrow(BadRequestException);
    });
  });

  describe('validateCoordinates', () => {
    it('deve validar coordenadas válidas', () => {
      expect(DeliveryPersonValidators.validateCoordinates(-19.9167, -43.9345)).toBe(true);
    });

    it('deve rejeitar latitude fora do intervalo', () => {
      expect(() => DeliveryPersonValidators.validateCoordinates(-91, -43.9345)).toThrow(BadRequestException);
      expect(() => DeliveryPersonValidators.validateCoordinates(91, -43.9345)).toThrow(BadRequestException);
    });

    it('deve rejeitar longitude fora do intervalo', () => {
      expect(() => DeliveryPersonValidators.validateCoordinates(-19.9167, -181)).toThrow(BadRequestException);
      expect(() => DeliveryPersonValidators.validateCoordinates(-19.9167, 181)).toThrow(BadRequestException);
    });
  });

  describe('calculateDistance', () => {
    it('deve calcular distância entre duas coordenadas', () => {
      // Distância entre Belo Horizonte e Rio de Janeiro (aproximadamente 342 km)
      const distance = DeliveryPersonValidators.calculateDistance(
        -19.9167, -43.9345, // BH
        -22.9068, -43.1729  // Rio
      );
      expect(distance).toBeGreaterThan(330);
      expect(distance).toBeLessThan(350);
    });

    it('deve retornar 0 para mesma localização', () => {
      const distance = DeliveryPersonValidators.calculateDistance(
        -19.9167, -43.9345,
        -19.9167, -43.9345
      );
      expect(distance).toBeCloseTo(0, 1);
    });
  });

  describe('validateLocationChange', () => {
    it('deve aceitar mudança de localização razoável', () => {
      // 10 km em 10 minutos = 60 km/h
      expect(
        DeliveryPersonValidators.validateLocationChange(
          -19.9167, -43.9345,
          -19.8267, -43.9345,
          10
        )
      ).toBe(true);
    });

    it('deve rejeitar mudança de localização muito rápida (GPS spoofing)', () => {
      // 100 km em 1 minuto = 6000 km/h (impossível)
      expect(() =>
        DeliveryPersonValidators.validateLocationChange(
          -19.9167, -43.9345,
          -18.9167, -43.9345,
          1
        )
      ).toThrow(BadRequestException);
    });
  });
});
