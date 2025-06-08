"use client";

import type { AppointmentSlot, BookingFormData, ChildGroup } from '@/lib/types';
import { CHILD_GROUPS } from '@/lib/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { User, Baby, Mail, Users, Send, Loader2 } from 'lucide-react';

const bookingFormSchema = z.object({
  parentName: z.string().min(2, { message: "Parent's name must be at least 2 characters." }),
  childName: z.string().min(2, { message: "Child's name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  group: z.enum(CHILD_GROUPS, { errorMap: () => ({ message: "Please select a group."}) }),
});

interface BookingFormProps {
  selectedSlot: AppointmentSlot | undefined; // Changed from null to undefined to match find result
  onSubmit: (data: BookingFormData) => Promise<void>;
  isLoading: boolean;
}

export function BookingForm({ selectedSlot, onSubmit, isLoading }: BookingFormProps) {
  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      parentName: '',
      childName: '',
      email: '',
      group: undefined,
    },
  });

  const handleSubmit = async (data: BookingFormData) => {
    await onSubmit(data);
    form.reset();
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center gap-2">
          <Send className="h-6 w-6 text-primary"/>
          Book Your Slot
        </CardTitle>
        {selectedSlot ? (
          <CardDescription>
            You are booking the slot for: <strong className="text-primary">{format(selectedSlot.dateTime, 'MMMM d, yyyy \'at\' p')}</strong>
          </CardDescription>
        ) : (
          <CardDescription>Please select an available time slot above to make a booking.</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="parentName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><User className="h-4 w-4" /> Parent's Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Jane Doe" {...field} disabled={!selectedSlot || isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="childName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><Baby className="h-4 w-4" /> Child's Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. John Doe" {...field} disabled={!selectedSlot || isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><Mail className="h-4 w-4" /> Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="e.g. jane.doe@example.com" {...field} disabled={!selectedSlot || isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="group"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><Users className="h-4 w-4" /> Child's Group</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedSlot || isLoading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a group" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CHILD_GROUPS.map((groupName) => (
                        <SelectItem key={groupName} value={groupName}>
                          {groupName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={!selectedSlot || selectedSlot.isBooked || isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Booking...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Confirm Booking
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
