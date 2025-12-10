/**
 * Calcula a distância em km entre duas coordenadas usando a fórmula de Haversine
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Raio da Terra em km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calcula tempo estimado de entrega baseado na distância
 * Velocidade média: 30 km/h para motos, 20 km/h para bicicletas/caminhada
 */
export function calculateEstimatedDeliveryTime(
  distanceKm: number,
  vehicleType: string,
): number {
  const slowVehicles = ['BIKE', 'WALKING', 'BICYCLE'];
  const avgSpeed = slowVehicles.includes(vehicleType) ? 20 : 30;
  const timeInHours = distanceKm / avgSpeed;
  const timeInMinutes = Math.ceil(timeInHours * 60);
  return timeInMinutes + 10; // Adiciona 10 minutos de margem
}
