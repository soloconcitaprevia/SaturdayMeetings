
"use client";

import type { AppointmentSlot } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';

interface CalendarDisplayProps {
  slots: AppointmentSlot[];
  selectedSlotId: string | null;
  onSlotSelect: (slotId: string) => void;
  selectedDate: Date; // Changed from currentDate to selectedDate
}

export function CalendarDisplay({ slots, selectedSlotId, onSlotSelect, selectedDate }: CalendarDisplayProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center gap-2">
          <Clock className="h-6 w-6 text-primary" />
          Available Slots for {format(selectedDate, 'MMMM d, yyyy')}
        </CardTitle>
        {(!slots || slots.length === 0) && (
          <CardDescription>
            No appointment slots available for this day, or all slots are booked.
          </CardDescription>
        )}
      </CardHeader>
      {slots && slots.length > 0 && (
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {slots.map((slot) => (
              <Button
                key={slot.id}
                variant={slot.isBooked ? 'destructive' : (selectedSlotId === slot.id ? 'default' : 'outline')}
                disabled={slot.isBooked}
                onClick={() => onSlotSelect(slot.id)}
                className={cn(
                  "p-3 h-auto flex flex-col items-center justify-center transition-all duration-200 ease-in-out transform hover:scale-105",
                  slot.isBooked && "cursor-not-allowed opacity-70 line-through",
                  selectedSlotId === slot.id && "ring-2 ring-primary ring-offset-2"
                )}
                aria-pressed={selectedSlotId === slot.id}
                aria-label={slot.isBooked ? `Slot at ${format(slot.dateTime, 'p')} is booked` : `Select slot at ${format(slot.dateTime, 'p')}`}
              >
                <span className="text-lg font-medium">{format(slot.dateTime, 'p')}</span>
                {slot.isBooked && <span className="text-xs">(Booked)</span>}
              </Button>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
