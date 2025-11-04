import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Point } from '../../routing/strategies/route.strategy';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ExternalMapsClient {
  private googleMapsKey: string;
  private mapboxKey: string;
  private openRouteKey: string;
  private useService: 'google' | 'mapbox' | 'osrm' | 'openroute'; // ← ADICIONAR 'openroute'

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    // Forçar string com valores padrão
    this.googleMapsKey = this.configService.get('GOOGLE_MAPS_API_KEY') || '';
    this.mapboxKey = this.configService.get('MAPBOX_API_KEY') || '';
    this.openRouteKey = this.configService.get('OPENROUTE_API_KEY') || ''; // ← NOVA CHAVE
    this.useService = (this.configService.get('MAPS_SERVICE') as 'google' | 'mapbox' | 'osrm' | 'openroute') || 'osrm'; // ← ATUALIZAR
  }

  async getDirections(
    origin: Point,
    destination: Point,
    options: {
      waypoints?: Point[];
      optimize?: boolean;
      alternatives?: boolean;
      mode?: 'driving' | 'walking' | 'bicycling';
      avoid?: string[];
    } = {}
  ): Promise<any> {
    try {
      switch (this.useService) {
        case 'google':
          return await this.getGoogleDirections(origin, destination, options);
        case 'mapbox':
          return await this.getMapboxDirections(origin, destination, options);
        case 'openroute': // ← NOVO CASE
          return await this.getOpenRouteDirections(origin, destination, options);
        case 'osrm':
        default:
          return await this.getOSRMDirections(origin, destination, options);
      }
    } catch (error) {
      // Fallback para OSRM se outras APIs falharem
      if (this.useService !== 'osrm') {
        console.warn(`${this.useService} failed, falling back to OSRM:`, error.message);
        return await this.getOSRMDirections(origin, destination, options);
      }
      throw error;
    }
  }

  // 🔽 ADICIONAR ESTE NOVO MÉTODO 🔽
  private async getOpenRouteDirections(
    origin: Point,
    destination: Point,
    options: any
  ): Promise<any> {
    if (!this.openRouteKey) {
      throw new Error('OpenRouteService API key not configured');
    }

    const profile = options.mode === 'walking' ? 'foot-walking' : 
                   options.mode === 'bicycling' ? 'cycling-regular' : 'driving-car';

    const body = {
      coordinates: [
        [origin.longitude, origin.latitude],
        [destination.longitude, destination.latitude]
      ],
      instructions: true,
      geometry: true
    };

    const url = `https://api.openrouteservice.org/v2/directions/${profile}/geojson`;
    
    const response = await firstValueFrom(
      this.httpService.post(url, body, {
        headers: {
          'Authorization': this.openRouteKey,
          'Content-Type': 'application/json'
        }
      })
    );

    const feature = response.data.features[0];
    const properties = feature.properties;
    const geometry = feature.geometry;

    return {
      polyline: JSON.stringify(geometry), // Converter para string
      distance: properties.summary.distance,
      duration: properties.summary.duration,
      steps: properties.segments[0].steps.map((step: any) => ({
        instructions: step.instruction,
        distance: step.distance,
        duration: step.duration,
        start_location: { 
          lat: geometry.coordinates[step.way_points[0]][1], 
          lng: geometry.coordinates[step.way_points[0]][0] 
        },
        end_location: { 
          lat: geometry.coordinates[step.way_points[1]][1], 
          lng: geometry.coordinates[step.way_points[1]][0] 
        },
      })),
    };
  }

  private async getGoogleDirections(
    origin: Point,
    destination: Point,
    options: any
  ): Promise<any> {
    if (!this.googleMapsKey) {
      throw new Error('Google Maps API key not configured');
    }

    const waypoints = options.waypoints 
      ? `&waypoints=${options.optimize ? 'optimize:true|' : ''}${options.waypoints.map(wp => `${wp.latitude},${wp.longitude}`).join('|')}`
      : '';

    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}${waypoints}&mode=${options.mode || 'driving'}&key=${this.googleMapsKey}`;

    const response = await firstValueFrom(this.httpService.get(url));
    
    if (response.data.routes.length === 0) {
      throw new Error('No routes found from Google Maps');
    }

    const route = response.data.routes[0];
    const leg = route.legs[0];

    return {
      polyline: route.overview_polyline.points,
      distance: leg.distance.value,
      duration: leg.duration.value,
      steps: leg.steps.map((step: any) => ({
        instructions: this.cleanInstructions(step.html_instructions),
        distance: step.distance.value,
        duration: step.duration.value,
        start_location: step.start_location,
        end_location: step.end_location,
      })),
    };
  }

  private async getMapboxDirections(
    origin: Point,
    destination: Point,
    options: any
  ): Promise<any> {
    if (!this.mapboxKey) {
      throw new Error('Mapbox API key not configured');
    }

    const waypoints = options.waypoints 
      ? `;${options.waypoints.map((wp: Point) => `${wp.longitude},${wp.latitude}`).join(';')}`
      : '';

    const profile = options.mode === 'walking' ? 'walking' : 
                   options.mode === 'bicycling' ? 'cycling' : 'driving';

    const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${origin.longitude},${origin.latitude}${waypoints};${destination.longitude},${destination.latitude}?access_token=${this.mapboxKey}&geometries=polyline&overview=full`;

    const response = await firstValueFrom(this.httpService.get(url));
    const route = response.data.routes[0];

    if (!route) {
      throw new Error('No routes found from Mapbox');
    }

    return {
      polyline: route.geometry,
      distance: route.distance,
      duration: route.duration,
      steps: route.legs.flatMap((leg: any) => 
        leg.steps.map((step: any) => ({
          instructions: step.maneuver.instruction,
          distance: step.distance,
          duration: step.duration,
          start_location: { 
            lat: step.maneuver.location[1], 
            lng: step.maneuver.location[0] 
          },
          end_location: { 
            lat: step.maneuver.location[1], 
            lng: step.maneuver.location[0] 
          },
        }))
      ),
    };
  }

  private async getOSRMDirections(
    origin: Point,
    destination: Point,
    options: any
  ): Promise<any> {
    const waypoints = options.waypoints 
      ? `;${options.waypoints.map((wp: Point) => `${wp.longitude},${wp.latitude}`).join(';')}`
      : '';

    const profile = options.mode === 'walking' ? 'foot' : 
                   options.mode === 'bicycling' ? 'bike' : 'car';

    const url = `https://router.project-osrm.org/route/v1/${profile}/${origin.longitude},${origin.latitude}${waypoints};${destination.longitude},${destination.latitude}?overview=full&geometries=polyline&steps=true`;

    const response = await firstValueFrom(this.httpService.get(url));
    
    if (response.data.routes.length === 0) {
      throw new Error('No routes found from OSRM');
    }

    const route = response.data.routes[0];

    return {
      polyline: route.geometry,
      distance: route.distance,
      duration: route.duration,
      steps: route.legs.flatMap((leg: any) => 
        leg.steps.map((step: any) => ({
          instructions: step.maneuver.instruction,
          distance: step.distance,
          duration: step.duration,
          start_location: { lat: 0, lng: 0 },
          end_location: { lat: 0, lng: 0 },
        }))
      ),
    };
  }

  private cleanInstructions(html: string): string {
    return html.replace(/<[^>]*>/g, '');
  }
}