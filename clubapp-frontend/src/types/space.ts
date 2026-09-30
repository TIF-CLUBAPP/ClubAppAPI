export interface Space {
  id: number;
  name: string;
  sportCategory: string;
  location: string;
  lat?: number; // Added
  lng?: number; // Added
  isActive: boolean;
  allowReservations: boolean;
}

export interface SaveSpaceRequest {
  name: string;
  sportCategory: string;
  location: string;
  lat?: number; // Added
  lng?: number; // Added
  isActive: boolean;
  allowReservations: boolean;
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
  "Fútbol 11", "Fútbol 7", "Fútbol 5", "Padel", "Tenis", "Básquet", "Vóley", "Hockey", "Rugby", "Squash",
  "Gimnasio / Musculación", "Natación / Pileta", "Fitness / Funcional", "Artes Marciales / Boxeo",
  "SUM / Salón de Eventos", "Quincho / Parrilla", "Multideporte / General"
];

// Returns true if the category is typically NOT rentable privately by members by default
export const shouldDisableReservationsByDefault = (category: string): boolean => {
  const restrictedCategories = [
    "Gimnasio / Musculación",
    "Natación / Pileta",
    "SUM / Salón de Eventos",
    "Quincho / Parrilla"
  ];
  return restrictedCategories.includes(category);
};

