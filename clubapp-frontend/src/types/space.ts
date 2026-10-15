export interface Space {
  id: number;
  name: string;
  sportCategory: string;
  location: string;
  lat?: number; // Added
  lng?: number; // Added
  isActive: boolean;
  allowReservations: boolean;
  requiresApproval: boolean;
  permitir_superposicion: boolean;
  pricePerHour: number;
  slotDurationMinutes: number;
  is24Hours: boolean;
  openTime?: string | null;
  closeTime?: string | null;
}

export interface SaveSpaceRequest {
  name: string;
  sportCategory: string;
  location: string;
  lat?: number; // Added
  lng?: number; // Added
  isActive: boolean;
  allowReservations: boolean;
  requiresApproval: boolean;
  permitir_superposicion: boolean;
  pricePerHour: number;
  slotDurationMinutes: number;
  is24Hours: boolean;
  openTime?: string | null;
  closeTime?: string | null;
}

export interface SpaceBlock {
  id: number;
  spaceId: number;
  startDate: string;
  endDate: string;
  reason: string;
}

// Payload for Conflict Resolution Rule:
// When a new Activity or SpaceBlock is created, the system must perform:
// 1. Identify all active reservations (Booking) within the [startDate, endDate] range for the specific space.
// 2. Set them to 'cancelled' (or notify users).
// 3. Prevent new bookings in this range if isActive is true.
export interface ConflictResolutionPayload {
  spaceId: number;
  blockedRange: { start: string; end: string };
  action: 'cancel' | 'restrict';
}


export type ModalMode = 'create' | 'edit';

export const SPORT_CATEGORIES = [
  // Fútbol / Cancha
  "Fútbol 11", "Fútbol 5", "Fútbol 7", "Fútbol playa", "Fútbol para ciegos",
  // Básquet
  "Básquet (5vs5)", "Básquet 3x3",
  // Vóley
  "Vóley (indoor)", "Vóley de playa", "Newcom",
  // Rugby
  "Rugby union (15 jugadores)", "Rugby sevens (7 jugadores)", "Rugby tag",
  // Handball
  "Handball", "Beach handball", "Minihandball",
  // Hockey
  "Hockey sobre césped", "Hockey pista (indoor)", "Hockey sobre patines",
  // Cestoball
  "Cestoball", "Cestoball de playa",
  // Raqueta / Pala
  "Tenis", "Pádel", "Tenis de mesa", "Pickleball", "Pelota Paleta", "Paleta cuero y Frontón",
  // Ecuestres / Tradicionales
  "Pato", "Polo", "Jineteada gaucha",
  // Combate / Artes Marciales
  "Boxeo", "Taekwondo ITF", "Taekwondo WT", "Karate (Kumite / Kata)", "Artes Marciales Mixtas (MMA)", "Judo", "Lucha Olímpica",
  // Ciclismo
  "Ciclismo de ruta", "Ciclismo de pista", "Mountain Bike (MTB)", "BMX (Freestyle y Race)",
  // Atletismo
  "Atletismo (Pista / Velocidad / Fondo)", "Running / Maratón", "Trail running", "Pruebas de campo (Saltos / Lanzamientos)",
  // Acuáticos / Náuticos
  "Natación (Piscina)", "Aguas abiertas", "Yachting / Vela (Optimist / Laser)", "Windsurf", "Canotaje / Kayak", "Slalom", "Remo tradicional",
  // Patinaje
  "Patín artístico", "Patín carrera", "Roller derby",
  // Nieve
  "Esquí alpino / de fondo", "Snowboard / Freestyle",
  // Otros deportes e instalaciones (compatibilidad)
  "Bochas", "Squash",
  "Gimnasio / Musculación", "Fitness / Funcional",
  "SUM / Salón de Eventos", "Quincho / Parrilla", "Multideporte / General",
  "Espacio Cubierto (Comodín)", "Espacio al Aire Libre (Comodín)"
];

// Returns true if the category is typically NOT rentable privately by members by default
export const shouldDisableReservationsByDefault = (category: string): boolean => {
  const restrictedCategories = [
    "Gimnasio / Musculación",
    "Natación (Piscina)",
    "SUM / Salón de Eventos",
    "Quincho / Parrilla"
  ];
  return restrictedCategories.includes(category);
};

