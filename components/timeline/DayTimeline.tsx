"use client";

import React, { useState } from "react";
import { format, addDays, subDays } from "date-fns";
import BookingModal, { BookingModalResource } from "@/components/booking/BookingModal";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  DoorOpen,
  Mic,
  Laptop,
  Glasses,
  Car,
  Clock,
  Wrench,
  Users,
  MapPin,
  Sparkles,
  Info,
} from "lucide-react";

interface TimelineProps {
  resources: any[];
  initialDateIso: string;
}

const START_HOUR = 8; // 08:00 AM
const END_HOUR = 20; // 08:00 PM
const TOTAL_HOURS = END_HOUR - START_HOUR; // 12 hours

export default function DayTimeline({ resources, initialDateIso }: TimelineProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date(initialDateIso));
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [bookingModalState, setBookingModalState] = useState<{
    isOpen: boolean;
    resource: BookingModalResource | null;
    startTime: string;
    endTime: string;
  }>({
    isOpen: false,
    resource: null,
    startTime: "10:00",
    endTime: "11:00",
  });

  const hoursArray = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => START_HOUR + i);

  const getCategoryIcon = (iconName?: string) => {
    switch (iconName) {
      case "DoorOpen":
        return DoorOpen;
      case "Mic":
        return Mic;
      case "Laptop":
        return Laptop;
      case "Glasses":
        return Glasses;
      case "Car":
        return Car;
      default:
        return DoorOpen;
    }
  };

  // Convert time to percentage from 08:00
  const getPositionPercent = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const decimalHours = hours + minutes / 60;
    const clampedHours = Math.max(START_HOUR, Math.min(END_HOUR, decimalHours));
    return ((clampedHours - START_HOUR) / TOTAL_HOURS) * 100;
  };

  const isToday =
    new Date().toISOString().split("T")[0] === currentDate.toISOString().split("T")[0];

  const filteredResources = resources.filter((res) => {
    if (selectedCategory !== "ALL" && res.categoryId !== selectedCategory) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Timeline Controls Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="h-5 w-5 text-emerald-600" />
            Visual Day Timeline & Availability
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time schedule blocks across all resources. Click any open slot to reserve immediately.
          </p>
        </div>

        {/* Date Selector Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentDate(subDays(currentDate, 1))}
            className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <button
            onClick={() => setCurrentDate(new Date())}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${
              isToday
                ? "bg-emerald-600 text-white"
                : "border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
            }`}
          >
            Today
          </button>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
            <CalendarIcon className="h-3.5 w-3.5 text-emerald-600" />
            {format(currentDate, "EEEE, MMMM d, yyyy")}
          </div>

          <button
            onClick={() => setCurrentDate(addDays(currentDate, 1))}
            className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Legend & Help bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-emerald-500" />
            <span>Confirmed Booking</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-blue-500" />
            <span>Checked In (Active)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-amber-400" />
            <span>Maintenance Window</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded border border-dashed border-slate-300 bg-slate-50 dark:bg-slate-800/40" />
            <span>Free / Click to Book</span>
          </div>
        </div>
        <span className="flex items-center gap-1 text-[11px] text-slate-400">
          <Info className="h-3.5 w-3.5" />
          Operating hours: 08:00 AM – 08:00 PM
        </span>
      </div>

      {/* The Timeline Board */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-x-auto">
        <div className="min-w-[900px]">
          {/* Timeline Grid Header (Hours) */}
          <div className="flex border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-800/60">
            <div className="w-64 p-3.5 border-r border-slate-200 dark:border-slate-800 shrink-0">
              Resource / Asset
            </div>
            <div className="flex-1 relative h-11 flex items-center">
              {hoursArray.map((hour, idx) => {
                if (idx === hoursArray.length - 1) return null;
                const hourFormatted = `${String(hour).padStart(2, "0")}:00`;
                return (
                  <div
                    key={hour}
                    className="flex-1 border-r border-slate-200/60 px-2 text-center dark:border-slate-800"
                  >
                    {hourFormatted}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timeline Rows */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredResources.map((resource) => {
              const CategoryIcon = getCategoryIcon(resource.category?.icon);

              // Filter reservations for this resource on the selected day
              const dayStart = new Date(currentDate);
              dayStart.setHours(0, 0, 0, 0);
              const dayEnd = new Date(currentDate);
              dayEnd.setHours(23, 59, 59, 999);

              const dayReservations = (resource.reservations || []).filter((res: any) => {
                const s = new Date(res.startTime);
                const e = new Date(res.endTime);
                return s <= dayEnd && e >= dayStart && res.status !== "CANCELLED" && res.status !== "REJECTED";
              });

              const dayMaintenance = (resource.maintenanceWindows || []).filter((m: any) => {
                const s = new Date(m.startTime);
                const e = new Date(m.endTime);
                return s <= dayEnd && e >= dayStart;
              });

              return (
                <div key={resource.id} className="flex hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                  {/* Left Column: Resource Identity */}
                  <div className="w-64 p-3.5 border-r border-slate-200 dark:border-slate-800 shrink-0 flex items-center justify-between">
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <CategoryIcon className="h-4 w-4 text-emerald-600 shrink-0" />
                        <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                          {resource.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                        <span className="font-mono text-emerald-700 dark:text-emerald-300 font-semibold">
                          {resource.code}
                        </span>
                        {resource.capacity && (
                          <span className="flex items-center gap-0.5">
                            <Users className="h-2.5 w-2.5" />
                            {resource.capacity}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setBookingModalState({
                          isOpen: true,
                          resource,
                          startTime: "10:00",
                          endTime: "11:00",
                        });
                      }}
                      className="rounded-lg bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 shrink-0"
                    >
                      + Book
                    </button>
                  </div>

                  {/* Right Track: Horizontal 12-hour Lane */}
                  <div
                    className="flex-1 relative h-16 flex items-center cursor-pointer select-none group"
                    onClick={(e) => {
                      // Detect clicked hour based on mouse x position inside track
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickX = e.clientX - rect.left;
                      const fraction = clickX / rect.width;
                      const clickedHour = Math.floor(START_HOUR + fraction * TOTAL_HOURS);
                      const startH = String(Math.max(START_HOUR, Math.min(END_HOUR - 1, clickedHour))).padStart(2, "0");
                      const endH = String(Math.max(START_HOUR + 1, Math.min(END_HOUR, clickedHour + 1))).padStart(2, "0");

                      setBookingModalState({
                        isOpen: true,
                        resource,
                        startTime: `${startH}:00`,
                        endTime: `${endH}:00`,
                      });
                    }}
                  >
                    {/* Hour grid vertical dividers */}
                    <div className="absolute inset-0 flex pointer-events-none">
                      {hoursArray.map((hour, idx) => {
                        if (idx === hoursArray.length - 1) return null;
                        return (
                          <div
                            key={hour}
                            className="flex-1 border-r border-slate-100 dark:border-slate-800/80 h-full"
                          />
                        );
                      })}
                    </div>

                    {/* Maintenance Blocks */}
                    {dayMaintenance.map((m: any) => {
                      const start = new Date(m.startTime);
                      const end = new Date(m.endTime);
                      const left = getPositionPercent(start);
                      const right = getPositionPercent(end);
                      const width = Math.max(2, right - left);

                      return (
                        <div
                          key={m.id}
                          style={{ left: `${left}%`, width: `${width}%` }}
                          className="absolute h-10 rounded-lg bg-amber-100 border border-amber-300 dark:bg-amber-950/70 dark:border-amber-700 p-1.5 text-xs text-amber-900 dark:text-amber-200 overflow-hidden shadow-sm z-10"
                          title={`Maintenance: ${m.title} (${format(start, "HH:mm")} - ${format(end, "HH:mm")})`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center gap-1 font-bold text-[10px] truncate">
                            <Wrench className="h-3 w-3 shrink-0" />
                            {m.title}
                          </div>
                          <p className="text-[9px] text-amber-700 dark:text-amber-400">
                            {format(start, "HH:mm")} - {format(end, "HH:mm")}
                          </p>
                        </div>
                      );
                    })}

                    {/* Reservation Blocks */}
                    {dayReservations.map((res: any) => {
                      const start = new Date(res.startTime);
                      const end = new Date(res.endTime);
                      const left = getPositionPercent(start);
                      const right = getPositionPercent(end);
                      const width = Math.max(3, right - left);

                      const isCheckedIn = res.status === "CHECKED_IN";
                      const isCompleted = res.status === "COMPLETED";

                      return (
                        <div
                          key={res.id}
                          style={{ left: `${left}%`, width: `${width}%` }}
                          className={`absolute h-11 rounded-xl p-1.5 text-xs overflow-hidden shadow-md z-20 transition-transform hover:scale-[1.02] cursor-pointer ${
                            isCheckedIn
                              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                              : isCompleted
                              ? "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                              : "bg-gradient-to-r from-emerald-600 to-teal-600 text-white"
                          }`}
                          title={`${res.title} by ${res.user.name} (${format(start, "HH:mm")} - ${format(end, "HH:mm")})`}
                          onClick={(e) => {
                            e.stopPropagation();
                            alert(
                              `Reservation Details:\nTitle: ${res.title}\nHost: ${res.user.name}\nTime: ${format(
                                start,
                                "HH:mm"
                              )} - ${format(end, "HH:mm")}\nStatus: ${res.status}`
                            );
                          }}
                        >
                          <p className="font-bold text-[11px] truncate leading-tight">{res.title}</p>
                          <p className="text-[10px] opacity-90 truncate">
                            {res.user.name} • {format(start, "HH:mm")}-{format(end, "HH:mm")}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={bookingModalState.isOpen}
        onClose={() => setBookingModalState({ ...bookingModalState, isOpen: false })}
        resource={bookingModalState.resource}
        initialDate={currentDate}
        initialStartTime={bookingModalState.startTime}
        initialEndTime={bookingModalState.endTime}
        onSuccess={() => window.location.reload()}
      />
    </div>
  );
}
