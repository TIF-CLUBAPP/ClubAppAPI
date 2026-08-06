export type SportDiscipline = 'Tenis' | 'Pádel' | 'Fútbol';

export interface Court {
  id: string;
  name: string;
  discipline: SportDiscipline;
  surface: string;
}

export interface Reservation {
  id: string;
  courtId: string;
  userEmail: string;
  startTime: string;       // Ej: "10:00"
  endTime: string;         // Ej: "11:00"
  bufferEndTime: string;   // Ej: "11:15"
  date: string;            // Ej: "2026-08-04"
  status: 'confirmed' | 'cancelled';
}

export interface ClubScheduleConfig {
  openTime: string;          // Ej: "08:00"
  closeTime: string;         // Ej: "23:00"
  slotDurationMinutes: number; // 60
  bufferMinutes: number;       // 15 o 30
}