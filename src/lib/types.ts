
export interface AppointmentSlot {
  id: string; // e.g., "slot-1", "slot-2"
  dateTime: Date;
  isBooked: boolean;
}

export interface Booking {
  id: string; // Firestore document ID
  parentName: string;
  childName: string;
  email: string;
  group: string;
  appointmentSlotId: string; // Corresponds to AppointmentSlot.id
  appointmentTime: Date;
  appointmentDateKey: string; // YYYY-MM-DD format, key for dailySlots document
  createdAt?: Date; // Firestore server timestamp, converted to Date on fetch
}

export interface BookingFormData {
  parentName: string;
  childName:string;
  email: string;
  group: string;
}

export const CHILD_GROUPS = ['Butterflies', 'Caterpillars', 'Ladybugs', 'Grasshoppers'] as const;
export type ChildGroup = typeof CHILD_GROUPS[number];

// Interface for how slots are stored in a daily document in Firestore
export interface DailySlotsDoc {
  date: Date; // Firestore Timestamp, converted to Date on fetch
  slots: AppointmentSlot[]; // Slots array, dateTime will be Firestore Timestamp
}
