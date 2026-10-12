"use client";

import React, { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { format, differenceInMinutes } from "date-fns";
import { usePersona } from "@/context/PersonaContext";
import {
  checkInReservationAction,
  checkOutReservationAction,
  cancelReservationAction,
} from "@/lib/actions/reservations";
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  LogIn,
  LogOut,
  Ban,
  MapPin,
  Users,
  Search,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Loader2,
} from "lucide-react";

interface ReservationItem {
  id: string;
  title: string;
  purpose?: string | null;
  startTime: string | Date;
  endTime: string | Date;
  status: string;
  attendeeCount?: number | null;
  checkedInAt?: string | Date | null;
  checkedOutAt?: string | Date | null;
  rejectionReason?: string | null;
  createdAt: string | Date;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
    role: string;
  };
  resource: {
    id: string;
    name: string;
    code: string;
    location: string;
    imageUrl?: string | null;
    category?: {
      name: string;
    };
  };
}

interface ReservationsDashboardProps {
  initialReservations: ReservationItem[];
}

export default function ReservationsDashboard({
  initialReservations,
}: ReservationsDashboardProps) {
  const { currentUser } = usePersona();
  const [isPending, startTransition] = useTransition();

  // Filters
  const [filterScope, setFilterScope] = useState<"MY" | "ALL">("MY");
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Action status message
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Filtered reservations
  const filteredList = useMemo(() => {
    return initialReservations.filter((res) => {
      // Scope filter: My Bookings vs All
      if (filterScope === "MY" && currentUser && res.user.id !== currentUser.id) {
        return false;
      }

      // Tab filter
      if (activeTab === "UPCOMING" && res.status !== "CONFIRMED") return false;
      if (activeTab === "ACTIVE" && res.status !== "CHECKED_IN") return false;
      if (activeTab === "COMPLETED" && res.status !== "COMPLETED") return false;
      if (activeTab === "CANCELLED" && res.status !== "CANCELLED" && res.status !== "REJECTED") {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = res.title.toLowerCase().includes(q);
        const matchesResource = res.resource.name.toLowerCase().includes(q);
        const matchesCode = res.resource.code.toLowerCase().includes(q);
        const matchesUser = res.user.name.toLowerCase().includes(q);
        if (!matchesTitle && !matchesResource && !matchesCode && !matchesUser) {
          return false;
        }
      }

      return true;
    });
  }, [initialReservations, filterScope, currentUser, activeTab, searchQuery]);

  // Stats calculation
  const stats = useMemo(() => {
    const list = filterScope === "MY" && currentUser
      ? initialReservations.filter((r) => r.user.id === currentUser.id)
      : initialReservations;

    const upcoming = list.filter((r) => r.status === "CONFIRMED").length;
    const active = list.filter((r) => r.status === "CHECKED_IN").length;
    const completed = list.filter((r) => r.status === "COMPLETED").length;
    const cancelled = list.filter((r) => r.status === "CANCELLED" || r.status === "REJECTED").length;

    return { total: list.length, upcoming, active, completed, cancelled };
  }, [initialReservations, filterScope, currentUser]);

  // Handler: Check-in
  const handleCheckIn = (reservationId: string) => {
    if (!currentUser) return;
    setFeedback(null);
    startTransition(async () => {
      const res = await checkInReservationAction(reservationId, currentUser.id);
      if (res.success) {
        setFeedback({ type: "success", text: "Checked in successfully! Resource is now marked active." });
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setFeedback({ type: "error", text: res.error || "Check-in failed." });
      }
    });
  };

  // Handler: Check-out
  const handleCheckOut = (reservationId: string) => {
    if (!currentUser) return;
    setFeedback(null);
    startTransition(async () => {
      const res = await checkOutReservationAction(reservationId, currentUser.id);
      if (res.success) {
        setFeedback({ type: "success", text: "Checked out successfully. Resource is now freed!" });
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setFeedback({ type: "error", text: res.error || "Check-out failed." });
      }
    });
  };

  // Handler: Cancel
  const handleCancel = (reservationId: string) => {
    if (!currentUser) return;
    if (!confirm("Are you sure you want to cancel this reservation?")) return;
    setFeedback(null);
    startTransition(async () => {
      const res = await cancelReservationAction(reservationId, currentUser.id, "User requested cancellation");
      if (res.success) {
        setFeedback({ type: "success", text: "Reservation cancelled. The time slot is now available to others." });
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setFeedback({ type: "error", text: res.error || "Cancellation failed." });
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="h-6 w-6 text-emerald-600" />
            Reservation Management & Lifecycle
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track your bookings, perform on-site check-ins, or release resources early.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-500 transition"
        >
          <Sparkles className="h-4 w-4" />
          Book New Resource
        </Link>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`flex items-center gap-2.5 rounded-2xl p-4 text-xs font-semibold border ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/70 dark:border-emerald-800 dark:text-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/70 dark:border-rose-800 dark:text-rose-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-medium text-slate-500">Upcoming Confirmed</span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.upcoming}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-medium text-slate-500">Active (Checked-In)</span>
          <p className="text-2xl font-bold text-blue-600 mt-1">{stats.active}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-medium text-slate-500">Completed Sessions</span>
          <p className="text-2xl font-bold text-slate-700 dark:text-slate-300 mt-1">{stats.completed}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-medium text-slate-500">Cancelled / Released</span>
          <p className="text-2xl font-bold text-rose-600 mt-1">{stats.cancelled}</p>
        </div>
      </div>

      {/* Filter and Scope Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
        {/* Scope Pill Toggle */}
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            <button
              onClick={() => setFilterScope("MY")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                filterScope === "MY"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              My Bookings ({currentUser?.name || "Me"})
            </button>
            <button
              onClick={() => setFilterScope("ALL")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                filterScope === "ALL"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              All Company Bookings
            </button>
          </div>
        </div>

        {/* Tab pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "ALL", label: "All" },
            { id: "UPCOMING", label: "Upcoming" },
            { id: "ACTIVE", label: "Active" },
            { id: "COMPLETED", label: "Completed" },
            { id: "CANCELLED", label: "Cancelled" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
                activeTab === tab.id
                  ? "bg-slate-900 text-white dark:bg-emerald-600"
                  : "bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Filter reservations by meeting title, resource, code, or organizer..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
        />
      </div>

      {/* Reservation Cards List */}
      {filteredList.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-800">
          <Calendar className="h-10 w-10 text-slate-400" />
          <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
            No reservations found
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm">
            {filterScope === "MY"
              ? "You do not have any bookings matching this criteria. Click below to explore available facilities and assets."
              : "No organization reservations match this filter."}
          </p>
          <Link
            href="/"
            className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500"
          >
            Explore Resources
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredList.map((res) => {
            const start = new Date(res.startTime);
            const end = new Date(res.endTime);
            const durationMins = differenceInMinutes(end, start);
            const durationFormatted =
              durationMins >= 60
                ? `${Math.floor(durationMins / 60)}h ${durationMins % 60 > 0 ? `${durationMins % 60}m` : ""}`
                : `${durationMins}m`;

            const isConfirmed = res.status === "CONFIRMED";
            const isCheckedIn = res.status === "CHECKED_IN";
            const isCompleted = res.status === "COMPLETED";
            const isCancelled = res.status === "CANCELLED" || res.status === "REJECTED";

            return (
              <div
                key={res.id}
                className="group rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left Column: Resource & Meeting Identity */}
                  <div className="flex items-start gap-4">
                    {/* Thumbnail */}
                    <div className="relative h-16 w-20 rounded-xl overflow-hidden bg-slate-100 shrink-0 dark:bg-slate-800">
                      {res.resource.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={res.resource.imageUrl}
                          alt={res.resource.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-400">
                          <Layers className="h-6 w-6" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded dark:bg-emerald-950 dark:text-emerald-300">
                          {res.resource.code}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          {res.resource.name}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                        {res.title}
                      </h3>

                      {res.purpose && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                          {res.purpose}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {format(start, "EEE, MMM d")} • {format(start, "HH:mm")} - {format(end, "HH:mm")} ({durationFormatted})
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          {res.resource.location}
                        </span>
                        {res.attendeeCount && res.attendeeCount > 1 && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5 text-slate-400" />
                            {res.attendeeCount} people
                          </span>
                        )}
                        <span className="text-slate-400">
                          Organized by <strong>{res.user.name}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Status & Interactive Lifecycle Actions */}
                  <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-between gap-3 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800">
                    {/* Status Badge */}
                    <div>
                      {isConfirmed && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-300">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Confirmed
                        </span>
                      )}
                      {isCheckedIn && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:border-blue-800 dark:text-blue-300">
                          <span className="h-2 w-2 rounded-full bg-blue-600 animate-ping" />
                          Checked In (Active)
                        </span>
                      )}
                      {isCompleted && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">
                          Completed
                        </span>
                      )}
                      {isCancelled && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:border-rose-800 dark:text-rose-300">
                          <Ban className="h-3.5 w-3.5" />
                          {res.status}
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      {isConfirmed && (
                        <>
                          <button
                            onClick={() => handleCheckIn(res.id)}
                            disabled={isPending}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50 transition"
                          >
                            {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <LogIn className="h-3.5 w-3.5" />}
                            Check In
                          </button>
                          <button
                            onClick={() => handleCancel(res.id)}
                            disabled={isPending}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300 transition"
                          >
                            <Ban className="h-3 w-3" />
                            Cancel
                          </button>
                        </>
                      )}

                      {isCheckedIn && (
                        <button
                          onClick={() => handleCheckOut(res.id)}
                          disabled={isPending}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 transition"
                        >
                          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
                          Check Out / Return Early
                        </button>
                      )}

                      {isCompleted && res.checkedOutAt && (
                        <span className="text-[11px] text-slate-400">
                          Freed at {format(new Date(res.checkedOutAt), "HH:mm")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
