"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  MapPin,
  Users,
  CheckCircle,
  AlertCircle,
  Calendar,
  Clock,
  Sparkles,
  Layers,
} from "lucide-react";
import { format } from "date-fns";

export interface ResourceDetailItem {
  id: string;
  name: string;
  code: string;
  location: string;
  capacity?: number | null;
  description: string;
  imageUrl?: string | null;
  status: string;
  attributes?: any;
  requiresApproval: boolean;
  minBookingMinutes: number;
  maxBookingMinutes: number;
  category?: {
    name: string;
    type: string;
  };
  reservations?: Array<{
    id: string;
    title: string;
    startTime: string | Date;
    endTime: string | Date;
    status: string;
    user: { name: string; avatarUrl?: string | null };
  }>;
  maintenanceWindows?: Array<{
    id: string;
    title: string;
    startTime: string | Date;
    endTime: string | Date;
  }>;
}

interface ResourceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: ResourceDetailItem | null;
  onBookNow: (resource: ResourceDetailItem) => void;
}

export default function ResourceDetailModal({
  isOpen,
  onClose,
  resource,
  onBookNow,
}: ResourceDetailModalProps) {
  if (!isOpen || !resource) return null;

  const attributes = (typeof resource.attributes === "object" && resource.attributes) ? resource.attributes : {};
  const amenities: string[] = Array.isArray(attributes.amenities) ? attributes.amenities : [];
  const specs = attributes.specs || null;
  const serialNumber = attributes.serialNumber || null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl ring-1 ring-black/10 dark:bg-slate-900 dark:ring-white/10 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Cover Image / Header */}
        <div className="relative h-48 w-full bg-slate-800 overflow-hidden shrink-0">
          {resource.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resource.imageUrl}
              alt={resource.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-800 text-slate-500">
              <Layers className="h-12 w-12" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full bg-slate-900/60 p-1.5 text-white backdrop-blur hover:bg-slate-900"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Floating badge */}
          <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
            <div>
              <span className="rounded-md bg-emerald-500/90 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur">
                {resource.category?.name || "Resource"}
              </span>
              <h2 className="text-xl font-bold text-white mt-1">{resource.name}</h2>
              <div className="flex items-center gap-2 text-xs text-slate-200 mt-0.5">
                <span className="font-mono bg-black/40 px-1.5 py-0.5 rounded text-emerald-300">
                  {resource.code}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {resource.location}
                </span>
              </div>
            </div>

            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                resource.status === "AVAILABLE"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : resource.status === "MAINTENANCE"
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                  : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
              }`}
            >
              {resource.status}
            </span>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Overview
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {resource.description}
            </p>
          </div>

          {/* Key Specs & Amenities */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {resource.capacity && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                <span className="text-[11px] text-slate-400 font-medium">Capacity</span>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                  <Users className="h-4 w-4 text-emerald-600" />
                  {resource.capacity} People
                </p>
              </div>
            )}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/40">
              <span className="text-[11px] text-slate-400 font-medium">Approval Policy</span>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                {resource.requiresApproval ? "Approval Required" : "Instant Confirmation"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/40">
              <span className="text-[11px] text-slate-400 font-medium">Max Duration</span>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                {Math.round(resource.maxBookingMinutes / 60)} Hours
              </p>
            </div>
          </div>

          {/* Amenities Chips */}
          {amenities.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Amenities & Features
              </h3>
              <div className="flex flex-wrap gap-2">
                {amenities.map((item, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                  >
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Specs / Hardware Details if equipment */}
          {specs && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Technical Specifications
              </h3>
              <div className="rounded-xl bg-slate-100 p-3 text-xs font-mono text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                <p><strong>Hardware:</strong> {specs}</p>
                {serialNumber && <p className="mt-1"><strong>S/N:</strong> {serialNumber}</p>}
              </div>
            </div>
          )}

          {/* Active Schedule Preview */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Upcoming Scheduled Bookings
            </h3>
            {(!resource.reservations || resource.reservations.length === 0) ? (
              <p className="text-xs text-slate-500 italic">No upcoming bookings scheduled for today.</p>
            ) : (
              <div className="space-y-2">
                {resource.reservations.map((res) => (
                  <div
                    key={res.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs dark:border-slate-800 dark:bg-slate-800/40"
                  >
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{res.title}</p>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                        Organized by {res.user.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded dark:bg-emerald-950 dark:text-emerald-300">
                        {format(new Date(res.startTime), "HH:mm")} - {format(new Date(res.endTime), "HH:mm")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 p-4 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Close
          </button>
          <button
            onClick={() => {
              onClose();
              onBookNow(resource);
            }}
            disabled={resource.status === "MAINTENANCE" || resource.status === "RETIRED"}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Sparkles className="h-4 w-4" />
            Book This Resource
          </button>
        </div>
      </div>
    </div>
  );
}
