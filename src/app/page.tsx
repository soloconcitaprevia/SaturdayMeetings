
"use client";

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Calendar } from "@/components/ui/calendar"; // ShadCN Calendar
import { CalendarDisplay } from '@/components/booking/calendar-display'; // For slots
import { BookingForm } from '@/components/booking/booking-form';
import { BookingList } from '@/components/booking/booking-list';
import type { AppointmentSlot, Booking, BookingFormData } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { format, addMinutes, setHours, setMinutes, setSeconds, setMilliseconds, startOfDay } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Clock, CalendarDays as CalendarIcon } from 'lucide-react';

const generateSlotsForDate = (date: Date): AppointmentSlot[] => {
  const slots: AppointmentSlot[] = [];
  const startTime = setMilliseconds(setSeconds(setMinutes(setHours(date, 9), 0), 0), 0); // Selected date at 9:00:00.000 AM

  for (let i = 0; i < 16; i++) { // 8 hours of slots, 30 min intervals (9 AM to 5 PM, 16 slots)
    const slotTime = addMinutes(startTime, i * 30);
    slots.push({
      id: `slot-${i + 1}-${date.getTime()}`,
      dateTime: slotTime,
      isBooked: false,
    });
  }
  return slots;
};


export default function HomePage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [calendarDisplayMonth, setCalendarDisplayMonth] = useState<Date | undefined>(undefined);
  const [minSelectableDate, setMinSelectableDate] = useState<Date | undefined>(undefined);
  
  const [appointmentSlots, setAppointmentSlots] = useState<AppointmentSlot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [isBookingListUnlocked, setIsBookingListUnlocked] = useState(false);
  const [enteredPassword, setEnteredPassword] = useState('');

  useEffect(() => {
    const today = new Date();
    setCalendarDisplayMonth(startOfDay(today));
    setMinSelectableDate(startOfDay(today));
  }, []);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      if (date.getDay() !== 6) { // Saturday is 6
        toast({
          title: "Invalid Date",
          description: "Please select a Saturday.",
          variant: "destructive",
        });
        setSelectedDate(undefined);
        setAppointmentSlots([]);
        setSelectedSlotId(null);
        return;
      }
      if (minSelectableDate && date < minSelectableDate) {
        toast({
          title: "Invalid Date",
          description: "Cannot select a past date.",
          variant: "destructive",
        });
        setSelectedDate(undefined);
        setAppointmentSlots([]);
        setSelectedSlotId(null);
        return;
      }
      setSelectedDate(date);
      setAppointmentSlots(generateSlotsForDate(date));
      setSelectedSlotId(null); // Reset selected slot when date changes
    } else {
      setSelectedDate(undefined);
      setAppointmentSlots([]);
      setSelectedSlotId(null);
    }
  };

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
    
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

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

    setSelectedSlotId(null); // Reset selected slot after booking
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
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl flex items-center gap-2">
              <CalendarIcon className="h-6 w-6 text-primary" />
              Select a Day for the Meeting
            </CardTitle>
            <CardDescription>
              Choose an available Saturday from the calendar below. Meetings can be booked for the current month and the next.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            {calendarDisplayMonth && minSelectableDate ? (
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                month={calendarDisplayMonth}
                onMonthChange={setCalendarDisplayMonth}
                numberOfMonths={2}
                disabled={(date: Date) => {
                  return date.getDay() !== 6 || date < minSelectableDate;
                }}
                modifiers={{
                  isSaturday: (date) => date.getDay() === 6,
                }}
                modifiersClassNames={{
                  isSaturday: 'font-bold text-primary',
                }}
                className="rounded-md border"
              />
            ) : (
               <div className="flex items-center justify-center p-10">
                 <Clock className="h-5 w-5 mr-2 animate-spin text-primary" /> Loading calendar...
               </div>
            )}
          </CardContent>
        </Card>
        
        <Separator />

        {selectedDate && (
          <CalendarDisplay
            slots={appointmentSlots}
            selectedSlotId={selectedSlotId}
            onSlotSelect={handleSlotSelect}
            selectedDate={selectedDate} // Pass selectedDate here
          />
        )}
        
        {selectedDate && <Separator />}

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

