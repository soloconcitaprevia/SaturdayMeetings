
"use client";

import { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Calendar } from "@/components/ui/calendar";
import { CalendarDisplay } from '@/components/booking/calendar-display';
import { BookingForm } from '@/components/booking/booking-form';
import { BookingList } from '@/components/booking/booking-list';
import type { AppointmentSlot, Booking, BookingFormData } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { format, addMinutes, setHours, setMinutes, setSeconds, setMilliseconds, startOfDay, parseISO } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Clock, CalendarDays as CalendarIcon, Loader2 } from 'lucide-react';

import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  getDocs,
  query,
  orderBy,
  writeBatch,
  Timestamp,
  serverTimestamp,
  DocumentData,
  UpdateData
} from 'firebase/firestore';

// Generates slots for a given date, IDs are now simple like "slot-1"
const generateSlotsForDate = (date: Date): AppointmentSlot[] => {
  const slots: AppointmentSlot[] = [];
  // Ensure date is start of day to avoid timezone issues if time part is present
  const dayStart = startOfDay(date);
  const startTime = setMilliseconds(setSeconds(setMinutes(setHours(dayStart, 9), 0), 0), 0);

  for (let i = 0; i < 16; i++) { // 9 AM to 5 PM, 16 slots
    const slotTime = addMinutes(startTime, i * 30);
    slots.push({
      id: `slot-${i + 1}`, // Simplified ID
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
  const [isLoading, setIsLoading] = useState(false); // For booking submission
  const [isLoadingSlots, setIsLoadingSlots] = useState(false); // For fetching slots
  const [isLoadingBookings, setIsLoadingBookings] = useState(false); // For fetching booking list
  const { toast } = useToast();

  const [isBookingListUnlocked, setIsBookingListUnlocked] = useState(false);
  const [enteredPassword, setEnteredPassword] = useState('');

  useEffect(() => {
    const today = startOfDay(new Date());
    setCalendarDisplayMonth(today);
    setMinSelectableDate(today);
  }, []);

  const fetchOrGenerateSlots = useCallback(async (date: Date) => {
    setIsLoadingSlots(true);
    setSelectedSlotId(null); // Reset selected slot
    const dateKey = format(date, 'yyyy-MM-dd');
    const dailySlotsRef = doc(db, "dailySlots", dateKey);

    try {
      const docSnap = await getDoc(dailySlotsRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as DocumentData;
        const fetchedSlots = data.slots.map((slot: any) => ({
          ...slot,
          dateTime: (slot.dateTime as Timestamp).toDate(),
        }));
        setAppointmentSlots(fetchedSlots);
      } else {
        // No slots in Firestore for this date, generate and save them
        const newSlots = generateSlotsForDate(date);
        const firestoreSlots = newSlots.map(slot => ({
          ...slot,
          dateTime: Timestamp.fromDate(slot.dateTime),
        }));
        await setDoc(dailySlotsRef, { 
          date: Timestamp.fromDate(startOfDay(date)), 
          slots: firestoreSlots 
        });
        setAppointmentSlots(newSlots); // Set with JS Dates
      }
    } catch (error) {
      console.error("Error fetching or generating slots:", error);
      toast({ title: "Error", description: "Could not load appointment slots for this day.", variant: "destructive" });
      setAppointmentSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  }, [toast]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const normalizedDate = startOfDay(date); // Ensure we use start of day
      if (normalizedDate.getDay() !== 6) { // Saturday is 6
        toast({
          title: "Invalid Date",
          description: "Please select a Saturday.",
          variant: "destructive",
        });
        setSelectedDate(undefined);
        setAppointmentSlots([]);
        return;
      }
      if (minSelectableDate && normalizedDate < minSelectableDate) {
        toast({
          title: "Invalid Date",
          description: "Cannot select a past date.",
          variant: "destructive",
        });
        setSelectedDate(undefined);
        setAppointmentSlots([]);
        return;
      }
      setSelectedDate(normalizedDate);
      fetchOrGenerateSlots(normalizedDate);
    } else {
      setSelectedDate(undefined);
      setAppointmentSlots([]);
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
    if (!selectedSlot || selectedSlot.isBooked || !selectedDate) {
      toast({ title: "Booking Error", description: "This slot is not available or already booked, or date not selected.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const dailySlotsRef = doc(db, "dailySlots", dateKey);
    const bookingsColRef = collection(db, "bookings");

    const batch = writeBatch(db);

    // 1. Add to bookings collection
    const newBookingData = {
      ...data,
      appointmentSlotId: selectedSlot.id,
      appointmentTime: Timestamp.fromDate(selectedSlot.dateTime),
      appointmentDateKey: dateKey,
      createdAt: serverTimestamp(),
    };
    const newBookingRef = doc(collection(db, "bookings")); // Create a ref to get ID later if needed
    batch.set(newBookingRef, newBookingData);

    // 2. Update the slot in dailySlots document
    // To update an item in an array, we need to read the doc, modify array, then write back.
    // Firestore security rules can also handle this more atomically with arrayUnion/arrayRemove if slots were individual docs.
    // For simplicity here, we'll fetch, update, and set. This could have race conditions without transactions.
    // A more robust way would be a transaction or a Cloud Function.
    try {
      const dailySlotsSnap = await getDoc(dailySlotsRef);
      if (!dailySlotsSnap.exists()) {
        throw new Error("Daily slots document not found for update.");
      }
      const currentSlotsData = dailySlotsSnap.data();
      const updatedSlots = currentSlotsData.slots.map((s: any) => 
        s.id === selectedSlot.id ? { ...s, isBooked: true, dateTime: Timestamp.fromDate(s.dateTime.toDate()) } : {...s, dateTime: Timestamp.fromDate(s.dateTime.toDate())}
      );
      batch.update(dailySlotsRef, { slots: updatedSlots });

      await batch.commit();

      // Update local state for immediate UI feedback
      setAppointmentSlots(prevSlots =>
        prevSlots.map(slot =>
          slot.id === selectedSlotId
            ? { ...slot, isBooked: true }
            : slot
        )
      );
      
      // If booking list is open, add to it or refetch
      if (isBookingListUnlocked) {
         const newBookingForList: Booking = {
            id: newBookingRef.id, 
            ...data,
            appointmentSlotId: selectedSlot.id,
            appointmentTime: selectedSlot.dateTime,
            appointmentDateKey: dateKey,
            createdAt: new Date() // Approximate, real value is serverTimestamp
          };
        setBookings(prevBookings => [...prevBookings, newBookingForList].sort((a,b) => a.appointmentTime.getTime() - b.appointmentTime.getTime()));
      }


      setSelectedSlotId(null);
      toast({ 
        title: "Booking Confirmed!", 
        description: `Meeting booked for ${data.parentName} (${data.childName}) on ${format(selectedSlot.dateTime, "MMMM d, yyyy 'at' p")}.`,
        variant: "default",
        duration: 5000,
      });

    } catch (error) {
      console.error("Error submitting booking:", error);
      toast({ title: "Booking Error", description: "Failed to save booking. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isBookingListUnlocked) {
      const fetchBookings = async () => {
        setIsLoadingBookings(true);
        try {
          const bookingsCol = collection(db, "bookings");
          const q = query(bookingsCol, orderBy("appointmentTime", "asc"));
          const bookingSnapshot = await getDocs(q);
          const fetchedBookings = bookingSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              appointmentTime: (data.appointmentTime as Timestamp).toDate(),
              createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : undefined,
            } as Booking;
          });
          setBookings(fetchedBookings);
        } catch (error) {
          console.error("Error fetching bookings:", error);
          toast({ title: "Error", description: "Could not fetch bookings.", variant: "destructive" });
        } finally {
          setIsLoadingBookings(false);
        }
      };
      fetchBookings();
    } else {
      setBookings([]); 
    }
  }, [isBookingListUnlocked, toast]);


  const handlePasswordSubmit = () => {
    if (enteredPassword === '1') { // Hardcoded password
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
                  const day = startOfDay(date);
                  return day.getDay() !== 6 || day < minSelectableDate;
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

        {isLoadingSlots && (
          <div className="flex items-center justify-center p-10">
            <Loader2 className="h-8 w-8 mr-2 animate-spin text-primary" /> Loading available slots...
          </div>
        )}

        {!isLoadingSlots && selectedDate && appointmentSlots.length > 0 && (
          <CalendarDisplay
            slots={appointmentSlots}
            selectedSlotId={selectedSlotId}
            onSlotSelect={handleSlotSelect}
            selectedDate={selectedDate}
          />
        )}
         {!isLoadingSlots && selectedDate && appointmentSlots.length === 0 && (
          <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline text-xl flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                No Slots Available
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p>There are no slots available for {format(selectedDate, 'MMMM d, yyyy')}, or they are all booked.</p>
            </CardContent>
          </Card>
        )}
        
        {selectedDate && <Separator />}

        <BookingForm
          selectedSlot={selectedSlot}
          onSubmit={handleBookingSubmit}
          isLoading={isLoading}
        />
        
        <Separator />

        {isBookingListUnlocked ? (
          isLoadingBookings ? (
            <div className="flex items-center justify-center p-10">
              <Loader2 className="h-8 w-8 mr-2 animate-spin text-primary" /> Loading bookings...
            </div>
          ) : (
            <BookingList bookings={bookings} />
          )
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
