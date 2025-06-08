"use client";

import type { Booking } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { ListChecks } from 'lucide-react';

interface BookingListProps {
  bookings: Booking[];
}

export function BookingList({ bookings }: BookingListProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center gap-2">
         <ListChecks className="h-6 w-6 text-primary"/>
          All Bookings
        </CardTitle>
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <p className="text-muted-foreground">No bookings have been made yet.</p>
        ) : (
          <Table>
            <TableCaption>A list of all confirmed parent meetings.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Parent Name</TableHead>
                <TableHead>Child Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Appointment Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-medium">{booking.parentName}</TableCell>
                  <TableCell>{booking.childName}</TableCell>
                  <TableCell>{booking.email}</TableCell>
                  <TableCell>{booking.group}</TableCell>
                  <TableCell>{format(booking.appointmentTime, 'Pp')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
