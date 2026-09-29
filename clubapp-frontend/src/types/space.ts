export interface Space {
  id: number;
  name: string;
  sportCategory: string;
  location: string;
  isActive: boolean;
  allowReservationsDuringClasses: boolean;
}

export interface SaveSpaceRequest {
  name: string;
  sportCategory: string;
  location: string;
  isActive: boolean;
  allowReservationsDuringClasses: boolean;
}
