/**
 * Utilidades para generar URLs estándar de navegación externa a partir de
 * coordenadas guardadas (lat, lng). Permiten a los socios abrir la ubicación
 * en Google Maps, Waze o Apple Maps con un solo clic.
 */

export function googleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

export function wazeUrl(lat: number, lng: number): string {
  return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
}

export function appleMapsUrl(lat: number, lng: number): string {
  // En web la URL correcta es https://maps.apple.com/?q=lat,lng.
  // El esquema "maps://" es un deep-link de iOS, por lo que no funciona en desktop.
  return `https://maps.apple.com/?q=${lat},${lng}`;
}

export function buildNavigationLinks(lat: number, lng: number) {
  return [
    { label: 'Google Maps', url: googleMapsUrl(lat, lng) },
    { label: 'Waze', url: wazeUrl(lat, lng) },
    { label: 'Apple Maps', url: appleMapsUrl(lat, lng) },
  ];
}
