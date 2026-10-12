"use client";

import React, { useState, useMemo } from "react";
import ResourceCard from "./ResourceCard";
import BookingModal, { BookingModalResource } from "@/components/booking/BookingModal";
import ResourceDetailModal, { ResourceDetailItem } from "./ResourceDetailModal";
import {
  Search,
  SlidersHorizontal,
  X,
  Layers,
  CheckCircle2,
  Clock,
  Wrench,
  Sparkles,
  CalendarDays,
} from "lucide-react";
import Link from "next/link";

interface ResourceCatalogProps {
  initialResources: any[];
  categories: any[];
}

export default function ResourceCatalog({
  initialResources,
  categories,
}: ResourceCatalogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedCapacity, setSelectedCapacity] = useState<string>("ALL");

  // Modals state
  const [bookingModalResource, setBookingModalResource] = useState<BookingModalResource | null>(null);
  const [detailModalResource, setDetailModalResource] = useState<ResourceDetailItem | null>(null);

  // Compute stats
  const stats = useMemo(() => {
    const total = initialResources.length;
    const available = initialResources.filter((r) => r.status === "AVAILABLE").length;
    const maintenance = initialResources.filter((r) => r.status === "MAINTENANCE").length;
    const inUse = initialResources.filter((r) => r.status === "IN_USE").length;
    return { total, available, maintenance, inUse };
  }, [initialResources]);

  // Filtered resources
  const filteredResources = useMemo(() => {
    return initialResources.filter((resource) => {
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = resource.name.toLowerCase().includes(query);
        const matchesCode = resource.code.toLowerCase().includes(query);
        const matchesLocation = resource.location.toLowerCase().includes(query);
        const matchesDesc = resource.description.toLowerCase().includes(query);
        if (!matchesName && !matchesCode && !matchesLocation && !matchesDesc) {
          return false;
        }
      }

      // Category filter
      if (selectedCategory !== "ALL" && resource.categoryId !== selectedCategory) {
        return false;
      }

      // Status filter
      if (selectedStatus !== "ALL" && resource.status !== selectedStatus) {
        return false;
      }

      // Capacity filter
      if (selectedCapacity !== "ALL") {
        const cap = resource.capacity || 1;
        if (selectedCapacity === "SMALL" && cap > 4) return false;
        if (selectedCapacity === "MEDIUM" && (cap < 5 || cap > 8)) return false;
        if (selectedCapacity === "LARGE" && cap < 9) return false;
      }

      return true;
    });
  }, [initialResources, searchQuery, selectedCategory, selectedStatus, selectedCapacity]);

  return (
    <div className="space-y-8">
      {/* Hero / Banner Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 p-8 sm:p-10 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-inset ring-emerald-500/30 mb-4 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Centralized Resource Management
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Reserve Facilities, Hardware & Fleet with Zero Conflicts
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
            Instant booking for meeting spaces, high-performance dev workstations, audio bays, and testing devices with atomic collision prevention.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/timeline"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20"
            >
              <CalendarDays className="h-4 w-4" />
              View Day Timeline
            </Link>
            <span className="text-xs text-slate-400">
              Select any resource below to explore specifications or book a slot.
            </span>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-slate-700/60 pt-6">
          <div className="rounded-xl bg-white/5 p-3.5 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <Layers className="h-4 w-4 text-emerald-400" />
              Total Assets
            </div>
            <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
          </div>
          <div className="rounded-xl bg-white/5 p-3.5 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-emerald-400 text-xs">
              <CheckCircle2 className="h-4 w-4" />
              Available Now
            </div>
            <p className="text-2xl font-bold text-emerald-300 mt-1">{stats.available}</p>
          </div>
          <div className="rounded-xl bg-white/5 p-3.5 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-amber-400 text-xs">
              <Clock className="h-4 w-4" />
              In Active Use
            </div>
            <p className="text-2xl font-bold text-amber-300 mt-1">{stats.inUse}</p>
          </div>
          <div className="rounded-xl bg-white/5 p-3.5 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-rose-400 text-xs">
              <Wrench className="h-4 w-4" />
              Maintenance
            </div>
            <p className="text-2xl font-bold text-rose-300 mt-1">{stats.maintenance}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="space-y-4">
        {/* Category Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === "ALL"
                ? "bg-slate-900 text-white shadow dark:bg-emerald-600"
                : "bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            All Resources ({initialResources.length})
          </button>
          {categories.map((cat) => {
            const count = initialResources.filter((r) => r.categoryId === cat.id).length;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap transition ${
                  isSelected
                    ? "bg-slate-900 text-white shadow dark:bg-emerald-600"
                    : "bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Search & Secondary Filter Dropdowns */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, asset code, location, or equipment specs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-9 py-2.5 text-xs sm:text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-700 focus:border-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="ALL">All Statuses</option>
              <option value="AVAILABLE">Available Only</option>
              <option value="IN_USE">Currently In Use</option>
              <option value="MAINTENANCE">Maintenance</option>
            </select>

            {/* Capacity filter */}
            <select
              value={selectedCapacity}
              onChange={(e) => setSelectedCapacity(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-700 focus:border-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="ALL">Any Capacity</option>
              <option value="SMALL">1 - 4 People</option>
              <option value="MEDIUM">5 - 8 People</option>
              <option value="LARGE">9+ People</option>
            </select>
          </div>
        </div>
      </div>

      {/* Resources Cards Grid */}
      {filteredResources.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-800">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-slate-800">
            <Search className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-white">
            No resources found
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Try adjusting your search query, category, or status filters.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("ALL");
              setSelectedStatus("ALL");
              setSelectedCapacity("ALL");
            }}
            className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white dark:bg-emerald-600"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredResources.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              onReserve={(res) => setBookingModalResource(res)}
              onViewDetails={(res) => setDetailModalResource(res)}
            />
          ))}
        </div>
      )}

      {/* Booking Modal */}
      <BookingModal
        isOpen={Boolean(bookingModalResource)}
        onClose={() => setBookingModalResource(null)}
        resource={bookingModalResource}
        onSuccess={() => {
          // Re-trigger page refresh
          window.location.reload();
        }}
      />

      {/* Details & Specs Modal */}
      <ResourceDetailModal
        isOpen={Boolean(detailModalResource)}
        onClose={() => setDetailModalResource(null)}
        resource={detailModalResource}
        onBookNow={(res) => {
          setDetailModalResource(null);
          setBookingModalResource(res as unknown as BookingModalResource);
        }}
      />
    </div>
  );
}
