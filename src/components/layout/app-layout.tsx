import { CalendarDays } from 'lucide-react';
import type { ReactNode } from 'react';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-7 w-7 text-primary" />
            <h1 className="text-xl font-bold font-headline text-primary">
              Parent Meeting Booking
            </h1>
          </div>
        </div>
      </header>
      <main className="container mx-auto p-4 sm:p-6 md:p-8 flex-grow">
        {children}
      </main>
      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Parent Meeting Booking App. All rights reserved.
      </footer>
    </div>
  );
}
