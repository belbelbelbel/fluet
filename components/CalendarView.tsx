"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CalendarEvent {
  id: number;
  date: Date;
  title: string;
  platform: string;
  content: string;
}

interface CalendarViewProps {
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
}

export function CalendarView({ events, onEventClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();

  // Get first day of month and number of days
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  // Get previous month's days to fill the grid
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  const days: Array<{ date: number; isCurrentMonth: boolean; fullDate: Date }> = [];

  // Add previous month's trailing days
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const date = prevMonthLastDay - i;
    days.push({
      date,
      isCurrentMonth: false,
      fullDate: new Date(year, month - 1, date),
    });
  }

  // Add current month's days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      date: i,
      isCurrentMonth: true,
      fullDate: new Date(year, month, i),
    });
  }

  // Add next month's leading days to complete the grid (42 cells = 6 weeks)
  const remainingDays = 42 - days.length;
  for (let i = 1; i <= remainingDays; i++) {
    days.push({
      date: i,
      isCurrentMonth: false,
      fullDate: new Date(year, month + 1, i),
    });
  }

  // Group events by date
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, CalendarEvent[]> = {};
    events.forEach((event) => {
      const dateKey = event.date.toISOString().split("T")[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });
    return grouped;
  }, [events]);

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (day: { date: number; isCurrentMonth: boolean; fullDate: Date }) => {
    const today = new Date();
    return (
      day.isCurrentMonth &&
      day.date === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "twitter":
        return "bg-black";
      case "instagram":
        return "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500";
      case "linkedin":
        return "bg-blue-600";
      case "tiktok":
        return "bg-black";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header Bar - Dark gradient like reference */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4 flex items-center justify-between">
        <h2 className="text-white font-semibold text-lg">Flippr Schedule</h2>
        <div className="flex items-center gap-2">
          <Button
            onClick={goToToday}
            variant="ghost"
            size="sm"
            className="text-gray-300 hover:text-white hover:bg-gray-700/50 h-8 px-3 text-sm"
          >
            today
          </Button>
          <Button
            onClick={goToPreviousMonth}
            variant="ghost"
            size="sm"
            className="text-gray-300 hover:text-white hover:bg-gray-700/50 h-8 w-8 p-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            onClick={goToNextMonth}
            variant="ghost"
            size="sm"
            className="text-gray-300 hover:text-white hover:bg-gray-700/50 h-8 w-8 p-0"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="p-6">
        {/* Month/Year Header */}
        <h3 className="text-2xl font-bold text-gray-900 mb-6">
          {monthNames[month]} {year}
        </h3>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map((day) => (
            <div
              key={day}
              className="text-center text-sm font-medium text-blue-600 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            const dateKey = day.fullDate.toISOString().split("T")[0];
            const dayEvents = eventsByDate[dateKey] || [];
            const today = isToday(day);

            return (
              <div
                key={index}
                className={`min-h-[100px] border border-gray-200 rounded p-2 ${
                  !day.isCurrentMonth ? "bg-gray-50" : "bg-white"
                } ${today ? "ring-2 ring-blue-500 ring-inset" : ""}`}
              >
                {/* Date Number */}
                <div
                  className={`text-sm font-medium mb-1 ${
                    !day.isCurrentMonth
                      ? "text-gray-400"
                      : today
                      ? "text-blue-600 font-bold"
                      : "text-gray-900"
                  }`}
                >
                  {day.date}
                </div>

                {/* Events */}
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      onClick={() => onEventClick?.(event)}
                      className={`${getPlatformColor(event.platform)} text-white text-xs px-2 py-1 rounded cursor-pointer hover:opacity-90 transition-opacity truncate`}
                      title={event.title}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-500 font-medium">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
