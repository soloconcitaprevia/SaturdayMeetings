"use client";

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { CalendarDisplay } from '@/components/booking/calendar-display';
import { BookingForm } from '@/components/booking/booking-form';
import { BookingList } from '@/components/booking/booking-list';
import type { AppointmentSlot, Booking, BookingFormData } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { format, addMinutes, setHours, setMinutes, setSeconds, setMilliseconds } from 'date-fns';
import { Separator } from '@/components/ui/separator';

const generateInitialSlots = (currentDate: Date): AppointmentSlot[] => {
  const slots: AppointmentSlot[] = [];
  const startTime = setMilliseconds(setSeconds(setMinutes(setHours(currentDate, 9), 0), 0), 0); // Today at 9:00:00.000 AM

  for (let i = 0; i < 16; i++) { // 8 hours of slots, 30 min intervals (9 AM to 5 PM, 16 slots)
    const slotTime = addMinutes(startTime, i * 30);
    slots.push({
      id: `slot-${i + 1}-${currentDate.getTime()}`, // Add timestamp to ID for potential future date changes
      dateTime: slotTime,
      isBooked: false,
    });
  }
  // Pre-book one slot for demonstration if desired
  // if (slots.length > 2) {
  //   slots[2].isBooked = true;
  // }
  return slots;
};


export default function HomePage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointmentSlots, setAppointmentSlots] = useState<AppointmentSlot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const today = new Date();
    // Ensure currentDate is set to today without time, to avoid re-generating slots on minor time changes
    const startOfToday = setMilliseconds(setSeconds(setMinutes(setHours(today, 0), 0), 0), 0);
    setCurrentDate(startOfToday);
    setAppointmentSlots(generateInitialSlots(startOfToday));
  }, []);


  const selectedSlot = appointmentSlots.find(slot => slot.id === selectedSlotId);

  const handleSlotSelect = (slotId: string) => {
    const slot = appointmentSlots.find(s => s.id === slotId);
    if (slot && !slot.isBooked) {
      setSelectedSlotId(slotId);
    } else if (slot && slot.isBooked) {
      setSelectedSlotId(null);
      toast({
        title: "Slot Unavailable",
        description: "This slot is already booked.",
        variant: "destructive",
      });
    } else {
      setSelectedSlotId(null);
    }
  };

  const handleBookingSubmit = async (data: BookingFormData) => {
    if (!selectedSlot || selectedSlot.isBooked) {
      toast({ title: "Booking Error", description: "This slot is not available or already booked.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    setAppointmentSlots(prevSlots =>
      prevSlots.map(slot =>
        slot.id === selectedSlotId
          ? { ...slot, isBooked: true }
          : slot
      )
    );

    const newBooking: Booking = {
      id: `booking-${Date.now()}`,
      ...data,
      appointmentSlotId: selectedSlot.id,
      appointmentTime: selectedSlot.dateTime,
    };
    setBookings(prevBookings => [...prevBookings, newBooking].sort((a,b) => a.appointmentTime.getTime() - b.appointmentTime.getTime()));

    setSelectedSlotId(null);
    setIsLoading(false);
    toast({ 
      title: "Booking Confirmed!", 
      description: `Meeting booked for ${data.parentName} (${data.childName}) on ${format(selectedSlot.dateTime, "MMMM d, yyyy 'at' p")}.`,
      variant: "default",
      duration: 5000,
    });
  };

  return (
    <AppLayout>
      <div className="space-y-8 md:space-y-12">
        <CalendarDisplay
          slots={appointmentSlots}
          selectedSlotId={selectedSlotId}
          onSlotSelect={handleSlotSelect}
          currentDate={currentDate}
        />
        
        <Separator />

        <BookingForm
          selectedSlot={selectedSlot}
          onSubmit={handleBookingSubmit}
          isLoading={isLoading}
        />
        
        <Separator />

        <BookingList bookings={bookings} />
      </div>
    </AppLayout>
  );
}
