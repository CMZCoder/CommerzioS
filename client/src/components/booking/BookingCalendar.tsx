/**
 * BookingCalendar Component
 * 
 * Displays available time slots for a service and allows selection
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, addDays, isSameDay, startOfDay, isAfter, isBefore } from 'date-fns';
import { Clock, CalendarDays, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimeSlot {
  start: string;
  end: string;
}

interface BookingCalendarProps {
  serviceId: string;
  durationMinutes?: number;
  onSelectSlot: (slot: { start: Date; end: Date }) => void;
  selectedSlot?: { start: Date; end: Date } | null;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
}

export function BookingCalendar({
  serviceId,
  durationMinutes = 60,
  onSelectSlot,
  selectedSlot,
  minDate = new Date(),
  maxDate = addDays(new Date(), 90),
  className,
}: BookingCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    selectedSlot ? startOfDay(selectedSlot.start) : undefined
  );

  // Fetch available slots for selected date
  const { data: slots = [], isLoading: slotsLoading } = useQuery<TimeSlot[]>({
    queryKey: ['available-slots', serviceId, selectedDate?.toISOString(), durationMinutes],
    queryFn: async () => {
      if (!selectedDate) return [];
      const res = await fetch(
        `/api/services/${serviceId}/available-slots?date=${selectedDate.toISOString()}&duration=${durationMinutes}`
      );
      if (!res.ok) throw new Error('Failed to fetch slots');
      return res.json();
    },
    enabled: !!selectedDate,
  });

  // Group slots by morning/afternoon/evening
  const groupedSlots = useMemo(() => {
    const groups = {
      morning: [] as TimeSlot[],
      afternoon: [] as TimeSlot[],
      evening: [] as TimeSlot[],
    };

    slots.forEach((slot) => {
      const hour = new Date(slot.start).getHours();
      if (hour < 12) {
        groups.morning.push(slot);
      } else if (hour < 17) {
        groups.afternoon.push(slot);
      } else {
        groups.evening.push(slot);
      }
    });

    return groups;
  }, [slots]);

  const isSlotSelected = (slot: TimeSlot) => {
    if (!selectedSlot) return false;
    return new Date(slot.start).getTime() === selectedSlot.start.getTime();
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    onSelectSlot({
      start: new Date(slot.start),
      end: new Date(slot.end),
    });
  };

  const formatTime = (dateStr: string) => {
    return format(new Date(dateStr), 'HH:mm');
  };

  return (
    <div className={cn("grid gap-4 md:grid-cols-2", className)}>
      {/* Calendar */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            Select Date
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={(date) => 
              isBefore(date, startOfDay(minDate)) || 
              isAfter(date, maxDate)
            }
            className="rounded-md border"
          />
        </CardContent>
      </Card>

      {/* Time Slots */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {selectedDate 
              ? `Available Times - ${format(selectedDate, 'EEE, MMM d')}`
              : 'Select a date first'
            }
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedDate ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <CalendarDays className="w-10 h-10 mb-2 opacity-50" />
              <p>Pick a date to see available times</p>
            </div>
          ) : slotsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i}>
                  <Skeleton className="h-4 w-20 mb-2" />
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((j) => (
                      <Skeleton key={j} className="h-10" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : slots.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <Clock className="w-10 h-10 mb-2 opacity-50" />
              <p>No available slots on this day</p>
              <p className="text-sm">Try selecting another date</p>
            </div>
          ) : (
            <ScrollArea className="h-64">
              <div className="space-y-4">
                {groupedSlots.morning.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      MORNING
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {groupedSlots.morning.map((slot) => (
                        <Button
                          key={slot.start}
                          variant={isSlotSelected(slot) ? "default" : "outline"}
                          size="sm"
                          className={cn(
                            "h-10",
                            isSlotSelected(slot) && "ring-2 ring-primary/20"
                          )}
                          onClick={() => handleSlotSelect(slot)}
                        >
                          {formatTime(slot.start)}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {groupedSlots.afternoon.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      AFTERNOON
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {groupedSlots.afternoon.map((slot) => (
                        <Button
                          key={slot.start}
                          variant={isSlotSelected(slot) ? "default" : "outline"}
                          size="sm"
                          className={cn(
                            "h-10",
                            isSlotSelected(slot) && "ring-2 ring-primary/20"
                          )}
                          onClick={() => handleSlotSelect(slot)}
                        >
                          {formatTime(slot.start)}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {groupedSlots.evening.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      EVENING
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {groupedSlots.evening.map((slot) => (
                        <Button
                          key={slot.start}
                          variant={isSlotSelected(slot) ? "default" : "outline"}
                          size="sm"
                          className={cn(
                            "h-10",
                            isSlotSelected(slot) && "ring-2 ring-primary/20"
                          )}
                          onClick={() => handleSlotSelect(slot)}
                        >
                          {formatTime(slot.start)}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Selected Slot Summary */}
      {selectedSlot && (
        <div className="md:col-span-2">
          <Card className="border-primary bg-primary/5">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="default" className="px-3 py-1">
                  Selected
                </Badge>
                <div>
                  <p className="font-medium">
                    {format(selectedSlot.start, 'EEEE, MMMM d, yyyy')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(selectedSlot.start, 'HH:mm')} - {format(selectedSlot.end, 'HH:mm')}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default BookingCalendar;

