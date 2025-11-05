export function decodePolyline(encoded: string): { latitude: number; longitude: number }[] {
  //TODO: Se for um mock polyline, retornar pontos mock realistas
  //TODO: Retorna array vazio para que seja usado o generateRoutePoints
  if (encoded === 'mock_polyline_encoded_string' || encoded.includes('mock')) {
    return []; 
  }

  const points: { latitude: number; longitude: number }[] = [];
  let index = 0, lat = 0, lng = 0;

  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
    lng += dlng;

    points.push({
      latitude: lat * 1e-5,
      longitude: lng * 1e-5,
    });
  }
  return points;
}