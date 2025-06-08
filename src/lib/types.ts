export interface AppointmentSlot {
  id: string;
  dateTime: Date;
  isBooked: boolean;
}

export interface Booking {
  id: string;
  parentName: string;
  childName: string;
  email: string;
  group: string;
  appointmentSlotId: string;
  appointmentTime: Date;
}

export interface BookingFormData {
  parentName: string;
  childName:string;
  email: string;
  group: string;
}

export const CHILD_GROUPS = ['Butterflies', 'Caterpillars', 'Ladybugs', 'Grasshoppers'] as const;
export type ChildGroup = typeof CHILD_GROUPS[number];
