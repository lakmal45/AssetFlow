"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePersona } from "@/context/PersonaContext";
import {
  Layers,
  Calendar,
  Clock,
  Shield,
  ChevronDown,
  UserCheck,
  Menu,
  X,
  Sparkles,
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const { currentUser, allUsers, switchPersona } = usePersona();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navLinks = [
    { href: "/", label: "Explore Resources", icon: Layers },
    { href: "/timeline", label: "Day Timeline", icon: Clock },
    { href: "/reservations", label: "My Bookings", icon: Calendar },
    ...(currentUser?.role === "ADMIN" || currentUser?.role === "MANAGER"
      ? [{ href: "/admin", label: "Admin Console", icon: Shield, badge: "Admin" }]
      : []),
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand / Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="group flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 shadow-md shadow-emerald-500/20 transition-transform group-hover:scale-105">
              <Layers className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                  Asset<span className="text-emerald-600 dark:text-emerald-400">Flow</span>
                </span>
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/60 dark:text-emerald-300">
                  PrimeWave
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Resource Reservation</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex md:items-center md:gap-1 pl-4 border-l border-slate-200 dark:border-slate-800">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-slate-100 text-emerald-700 dark:bg-slate-800 dark:text-emerald-400"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-white"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`} />
                  {link.label}
                  {link.badge && (
                    <span className="rounded bg-indigo-50 px-1.5 py-0.2 text-[10px] font-medium text-indigo-600 ring-1 ring-inset ring-indigo-500/20 dark:bg-indigo-950 dark:text-indigo-400">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right side: Persona Switcher */}
        <div className="flex items-center gap-3">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-slate-50/80 p-1.5 pr-3 text-left transition hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
              title="Switch demo persona for testing"
            >
              {currentUser?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="h-7 w-7 rounded-full object-cover ring-2 ring-emerald-500/30"
                />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-semibold text-white">
                  {currentUser?.name?.charAt(0) || "U"}
                </div>
              )}
              <div className="hidden sm:block text-xs leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {currentUser?.name || "Loading..."}
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider ${
                      currentUser?.role === "ADMIN"
                        ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                        : currentUser?.role === "MANAGER"
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                    }`}
                  >
                    {currentUser?.role}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  {currentUser?.department?.name || "Staff"}
                </span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {/* Persona Switcher Dropdown */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl ring-1 ring-black/5 dark:border-slate-800 dark:bg-slate-900">
                <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Switch Active Persona
                </div>
                <div className="space-y-1">
                  {allUsers.map((user) => {
                    const isSelected = user.id === currentUser?.id;
                    return (
                      <button
                        key={user.id}
                        onClick={() => {
                          switchPersona(user.id);
                          setDropdownOpen(false);
                        }}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition ${
                          isSelected
                            ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
                        }`}
                      >
                        {user.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={user.avatarUrl}
                            alt={user.name}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                            {user.name.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">
                              {user.name}
                            </p>
                            <span
                              className={`rounded px-1.5 py-0.2 text-[9px] font-bold uppercase ${
                                user.role === "ADMIN"
                                  ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                                  : user.role === "MANAGER"
                                  ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                                  : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                              }`}
                            >
                              {user.role}
                            </span>
                          </div>
                          <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                            {user.email}
                          </p>
                        </div>
                        {isSelected && <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-2 border-t border-slate-100 px-3 pt-2 text-[11px] text-slate-400 dark:border-slate-800">
                  <span className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-amber-500" />
                    Quickly evaluate role permissions
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium ${
                    isActive
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                      : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
