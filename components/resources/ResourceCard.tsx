"use client";

import React from "react";
import {
  MapPin,
  Users,
  CalendarPlus,
  Info,
  CheckCircle,
  Wrench,
  Clock,
  Laptop,
  DoorOpen,
  Car,
  Mic,
  Glasses,
} from "lucide-react";
import { BookingModalResource } from "@/components/booking/BookingModal";
import { ResourceDetailItem } from "@/components/resources/ResourceDetailModal";

interface ResourceCardProps {
  resource: any;
  onReserve: (resource: BookingModalResource) => void;
  onViewDetails: (resource: ResourceDetailItem) => void;
}

export default function ResourceCard({
  resource,
  onReserve,
  onViewDetails,
}: ResourceCardProps) {
  const attributes = typeof resource.attributes === "object" && resource.attributes ? resource.attributes : {};
  const amenities: string[] = Array.isArray(attributes.amenities)
    ? attributes.amenities
    : attributes.specs
    ? [attributes.specs]
    : [];

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

  const CategoryIcon = getCategoryIcon(resource.category?.icon);

  const isAvailable = resource.status === "AVAILABLE";
  const isMaintenance = resource.status === "MAINTENANCE";

  return (
    <div className="group relative flex flex-col rounded-2xl border border-slate-200/90 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:hover:shadow-black/60 overflow-hidden">
      {/* Thumbnail Area */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        {resource.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resource.imageUrl}
            alt={resource.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-400">
            <CategoryIcon className="h-12 w-12" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Category Pill */}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center gap-1 rounded-lg bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
            <CategoryIcon className="h-3 w-3 text-emerald-400" />
            {resource.category?.name || "General"}
          </span>
        </div>

        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          {isAvailable ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/90 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              Available
            </span>
          ) : isMaintenance ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-600/90 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm backdrop-blur-md">
              <Wrench className="h-3 w-3" />
              Maintenance
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/90 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm backdrop-blur-md">
              <Clock className="h-3 w-3" />
              In Use
            </span>
          )}
        </div>

        {/* Code & Location tag over image footer */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs text-white/90">
          <span className="font-mono text-[11px] font-semibold bg-black/40 px-2 py-0.5 rounded backdrop-blur">
            {resource.code}
          </span>
          <span className="flex items-center gap-1 text-[11px] drop-shadow">
            <MapPin className="h-3 w-3 text-emerald-400" />
            {resource.location}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-emerald-600 transition-colors">
            {resource.name}
          </h3>
          {resource.capacity && (
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300 shrink-0">
              <Users className="h-3 w-3 text-emerald-600" />
              {resource.capacity}
            </span>
          )}
        </div>

        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
          {resource.description}
        </p>

        {/* Amenities / Specs badges */}
        {amenities.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {amenities.slice(0, 3).map((amenity, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600 border border-slate-200/60 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700"
              >
                <CheckCircle className="h-2.5 w-2.5 text-emerald-500" />
                {amenity}
              </span>
            ))}
            {amenities.length > 3 && (
              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500 dark:bg-slate-800">
                +{amenities.length - 3} more
              </span>
            )}
          </div>
        )}

        <div className="mt-auto pt-4 flex items-center gap-2 border-t border-slate-100 dark:border-slate-800/80">
          <button
            onClick={() => onViewDetails(resource)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition"
          >
            <Info className="h-3.5 w-3.5 text-slate-400" />
            Schedule
          </button>
          <button
            onClick={() => onReserve(resource)}
            disabled={!isAvailable}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm shadow-emerald-600/20 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <CalendarPlus className="h-3.5 w-3.5" />
            Reserve
          </button>
        </div>
      </div>
    </div>
  );
}
