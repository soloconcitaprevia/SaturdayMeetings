
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock } from 'lucide-react';

const generateInitialSlots = (currentDate: Date): AppointmentSlot[] => {
  const slots: AppointmentSlot[] = [];
  const startTime = setMilliseconds(setSeconds(setMinutes(setHours(currentDate, 9), 0), 0), 0); // Today at 9:00:00.000 AM

  for (let i = 0; i < 16; i++) { // 8 hours of slots, 30 min intervals (9 AM to 5 PM, 16 slots)
    const slotTime = addMinutes(startTime, i * 30);
    slots.push({
      id: `slot-${i + 1}-${currentDate.getTime()}`,
      dateTime: slotTime,
      isBooked: false,
    });
  }
  return slots;
};


export default function HomePage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointmentSlots, setAppointmentSlots] = useState<AppointmentSlot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [isBookingListUnlocked, setIsBookingListUnlocked] = useState(false);
  const [enteredPassword, setEnteredPassword] = useState('');

  useEffect(() => {
    const today = new Date();
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

  const handlePasswordSubmit = () => {
    if (enteredPassword === '1') {
      setIsBookingListUnlocked(true);
      toast({
        title: "Access Granted",
        description: "You can now see the list of bookings.",
        variant: "default",
      });
    } else {
      toast({
        title: "Access Denied",
        description: "Incorrect password. Please try again.",
        variant: "destructive",
      });
      setEnteredPassword(''); 
    }
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

        {isBookingListUnlocked ? (
          <BookingList bookings={bookings} />
        ) : (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-2xl flex items-center gap-2">
                <Lock className="h-6 w-6 text-primary" />
                View Bookings
              </CardTitle>
              <CardDescription>
                This section is password protected. Please enter the password to view all bookings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex w-full max-w-sm items-center space-x-2">
                <Input
                  type="password"
                  placeholder="Password"
                  value={enteredPassword}
                  onChange={(e) => setEnteredPassword(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handlePasswordSubmit();
                    }
                  }}
                />
                <Button type="button" onClick={handlePasswordSubmit}>
                  Unlock
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
