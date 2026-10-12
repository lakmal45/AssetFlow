"use client";

import React, { useState, useEffect, useTransition } from "react";
import { usePersona } from "@/context/PersonaContext";
import {
  createReservationAction,
  checkAvailabilityAction,
} from "@/lib/actions/reservations";
import {
  X,
  Calendar,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Sparkles,
  MapPin,
  ShieldAlert,
} from "lucide-react";

export interface BookingModalResource {
  id: string;
  name: string;
  code: string;
  location: string;
  capacity?: number | null;
  imageUrl?: string | null;
  minBookingMinutes: number;
  maxBookingMinutes: number;
  requiresApproval: boolean;
  category?: {
    name: string;
  };
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: BookingModalResource | null;
  initialDate?: Date;
  initialStartTime?: string; // "14:00"
  initialEndTime?: string; // "15:30"
  onSuccess?: () => void;
}

export default function BookingModal({
  isOpen,
  onClose,
  resource,
  initialDate,
  initialStartTime,
  initialEndTime,
  onSuccess,
}: BookingModalProps) {
  const { currentUser } = usePersona();
  const [isPending, startTransition] = useTransition();

  // Form states
  const [title, setTitle] = useState("");
  const [purpose, setPurpose] = useState("");
  const [date, setDate] = useState(() => {
    const d = initialDate || new Date();
    return d.toISOString().split("T")[0];
  });
  const [startTime, setStartTime] = useState(initialStartTime || "10:00");
  const [endTime, setEndTime] = useState(initialEndTime || "11:00");
  const [attendeeCount, setAttendeeCount] = useState(1);

  // Pre-flight availability check state
  const [isCheckingConflict, setIsCheckingConflict] = useState(false);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [isSlotAvailable, setIsSlotAvailable] = useState<boolean | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Synchronize initial props
  useEffect(() => {
    if (initialDate) {
      setDate(initialDate.toISOString().split("T")[0]);
    }
    if (initialStartTime) setStartTime(initialStartTime);
    if (initialEndTime) setEndTime(initialEndTime);
    setTitle("");
    setPurpose("");
    setConflictWarning(null);
    setIsSlotAvailable(null);
    setSubmissionError(null);
    setSuccessMessage(null);
  }, [initialDate, initialStartTime, initialEndTime, resource, isOpen]);

  // Real-time conflict checking when time/date changes
  useEffect(() => {
    if (!isOpen || !resource || !date || !startTime || !endTime) return;

    const startDateTime = new Date(`${date}T${startTime}:00`);
    const endDateTime = new Date(`${date}T${endTime}:00`);

    if (endDateTime <= startDateTime) {
      setIsSlotAvailable(false);
      setConflictWarning("End time must be after start time.");
      return;
    }

    setIsCheckingConflict(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await checkAvailabilityAction(
          resource.id,
          startDateTime.toISOString(),
          endDateTime.toISOString()
        );

        if (res.success && res.data) {
          if (res.data.available) {
            setIsSlotAvailable(true);
            setConflictWarning(null);
          } else {
            setIsSlotAvailable(false);
            setConflictWarning(res.data.conflictReason || "Time slot is unavailable.");
          }
        } else {
          setIsSlotAvailable(null);
        }
      } catch {
        // network or server check catch
      } finally {
        setIsCheckingConflict(false);
      }
    }, 350);

    return () => clearTimeout(timeout);
  }, [isOpen, resource, date, startTime, endTime]);

  if (!isOpen || !resource) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setSubmissionError("Please select a demo persona to make reservations.");
      return;
    }

    const startDateTime = new Date(`${date}T${startTime}:00`);
    const endDateTime = new Date(`${date}T${endTime}:00`);

    if (endDateTime <= startDateTime) {
      setSubmissionError("End time must be after start time.");
      return;
    }

    setSubmissionError(null);

    startTransition(async () => {
      const result = await createReservationAction({
        resourceId: resource.id,
        userId: currentUser.id,
        title,
        purpose,
        startTime: startDateTime,
        endTime: endDateTime,
        attendeeCount: Number(attendeeCount) || 1,
      });

      if (result.success) {
        setSuccessMessage("Reservation successfully booked!");
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1200);
      } else {
        setSubmissionError(result.error || "Failed to create reservation.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl ring-1 ring-black/10 dark:bg-slate-900 dark:ring-white/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-600" />
              Reserve {resource.name}
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span className="font-mono font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded dark:bg-emerald-950 dark:text-emerald-300">
                {resource.code}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {resource.location}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Success Banner */}
          {successMessage && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800 border border-emerald-200 dark:bg-emerald-950/70 dark:border-emerald-800 dark:text-emerald-200">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              {successMessage}
            </div>
          )}

          {/* Submission Error Banner */}
          {submissionError && (
            <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 p-4 text-sm text-rose-800 border border-rose-200 dark:bg-rose-950/60 dark:border-rose-800 dark:text-rose-200">
              <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Reservation Conflict / Error</p>
                <p className="text-xs mt-0.5">{submissionError}</p>
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Reservation Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Client Demo, Sprint Retrospective, Hardware Testing"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Purpose */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Purpose / Agenda (Optional)
            </label>
            <input
              type="text"
              placeholder="Brief description of the session or deliverables"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Date & Time Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                Start Time
              </label>
              <input
                type="time"
                required
                step="900"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                End Time
              </label>
              <input
                type="time"
                required
                step="900"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          {/* Quick Duration Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[11px] text-slate-400 font-medium">Quick duration:</span>
            {[
              { label: "30 min", mins: 30 },
              { label: "1 hour", mins: 60 },
              { label: "2 hours", mins: 120 },
              { label: "Half day", mins: 240 },
            ].map((dur) => (
              <button
                type="button"
                key={dur.label}
                onClick={() => {
                  const [h, m] = startTime.split(":").map(Number);
                  const newEnd = new Date();
                  newEnd.setHours(h, m + dur.mins, 0, 0);
                  const endH = String(newEnd.getHours()).padStart(2, "0");
                  const endM = String(newEnd.getMinutes()).padStart(2, "0");
                  setEndTime(`${endH}:${endM}`);
                }}
                className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                {dur.label}
              </button>
            ))}
          </div>

          {/* Attendees */}
          {resource.capacity && resource.capacity > 1 && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-slate-400" />
                Attendees (Max {resource.capacity})
              </label>
              <input
                type="number"
                min="1"
                max={resource.capacity}
                value={attendeeCount}
                onChange={(e) => setAttendeeCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-32 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          )}

          {/* Real-time Pre-Flight Collision Alert Card */}
          <div className="pt-2">
            {isCheckingConflict ? (
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-500 border border-slate-200 dark:bg-slate-800/50 dark:border-slate-700">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" />
                <span>Checking real-time resource availability...</span>
              </div>
            ) : conflictWarning ? (
              <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 p-3.5 text-xs text-amber-900 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Scheduling Conflict Detected</span>
                  <p className="mt-0.5">{conflictWarning}</p>
                </div>
              </div>
            ) : isSlotAvailable ? (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-medium text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Slot is available with zero conflicts!</span>
              </div>
            ) : null}
          </div>

          {/* Requester Info Bar */}
          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs text-slate-600 border border-slate-200 dark:bg-slate-800/40 dark:border-slate-800 dark:text-slate-400">
            <span>Booking as:</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-emerald-600" />
              {currentUser?.name} ({currentUser?.role})
            </span>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-xl px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || isSlotAvailable === false || !title.trim()}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-500/20 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Reserving...
                </>
              ) : resource.requiresApproval ? (
                "Request Approval"
              ) : (
                "Confirm Reservation"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
