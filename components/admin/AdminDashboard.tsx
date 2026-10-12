"use client";

import React, { useState, useTransition, useMemo } from "react";
import { usePersona } from "@/context/PersonaContext";
import {
  updateResourceStatusAction,
  approveReservationAction,
  rejectReservationAction,
} from "@/lib/actions/admin";
import AddResourceModal from "./AddResourceModal";
import ScheduleMaintenanceModal from "./ScheduleMaintenanceModal";
import {
  Shield,
  Layers,
  Wrench,
  CheckCircle2,
  Clock,
  Plus,
  Users,
  MapPin,
  Calendar,
  AlertTriangle,
  History,
  TrendingUp,
  UserCheck,
  Check,
  X,
  Loader2,
  Lock,
} from "lucide-react";
import { format } from "date-fns";

interface AdminDashboardProps {
  resources: any[];
  categories: any[];
  maintenanceWindows: any[];
  auditLogs: any[];
  reservations: any[];
}

export default function AdminDashboard({
  resources,
  categories,
  maintenanceWindows,
  auditLogs,
  reservations,
}: AdminDashboardProps) {
  const { currentUser, switchPersona, allUsers } = usePersona();
  const [isPending, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState<
    "RESOURCES" | "MAINTENANCE" | "APPROVALS" | "AUDIT" | "ANALYTICS"
  >("RESOURCES");

  // Modals
  const [isAddResourceOpen, setIsAddResourceOpen] = useState(false);
  const [isScheduleMaintOpen, setIsScheduleMaintOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const isAdminOrManager = currentUser?.role === "ADMIN" || currentUser?.role === "MANAGER";

  // Pending approval reservations
  const pendingReservations = useMemo(() => {
    return reservations.filter((r) => r.status === "PENDING");
  }, [reservations]);

  // Analytics: Calculate hours booked per category
  const categoryUtilization = useMemo(() => {
    const map: Record<string, { name: string; hours: number; count: number }> = {};
    categories.forEach((cat) => {
      map[cat.id] = { name: cat.name, hours: 0, count: 0 };
    });

    reservations.forEach((res) => {
      if (res.status === "CANCELLED" || res.status === "REJECTED") return;
      const catId = res.resource.categoryId;
      const durationHours = (new Date(res.endTime).getTime() - new Date(res.startTime).getTime()) / (1000 * 3600);
      if (map[catId]) {
        map[catId].hours += durationHours;
        map[catId].count += 1;
      }
    });

    return Object.values(map);
  }, [categories, reservations]);

  // Handler: Update Resource Status
  const handleStatusChange = (resourceId: string, newStatus: any) => {
    if (!currentUser) return;
    setFeedback(null);
    startTransition(async () => {
      const res = await updateResourceStatusAction(resourceId, newStatus, currentUser.id);
      if (res.success) {
        setFeedback("Resource operational status updated successfully.");
        setTimeout(() => window.location.reload(), 800);
      }
    });
  };

  // Handler: Approve reservation
  const handleApprove = (reservationId: string) => {
    if (!currentUser) return;
    startTransition(async () => {
      const res = await approveReservationAction(reservationId, currentUser.id);
      if (res.success) {
        setFeedback("Reservation approved.");
        setTimeout(() => window.location.reload(), 800);
      }
    });
  };

  // Handler: Reject reservation
  const handleReject = (reservationId: string) => {
    if (!currentUser) return;
    const reason = prompt("Please enter a reason for rejecting this booking:") || "Declined by admin";
    startTransition(async () => {
      const res = await rejectReservationAction(reservationId, currentUser.id, reason);
      if (res.success) {
        setFeedback("Reservation rejected.");
        setTimeout(() => window.location.reload(), 800);
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-indigo-100 p-1.5 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              <Shield className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Admin Governance & Operations
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage shared resources, schedule servicing lockouts, review approvals, and monitor audit trails.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsScheduleMaintOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-200 transition"
          >
            <Wrench className="h-4 w-4" />
            Schedule Lockout
          </button>
          <button
            onClick={() => setIsAddResourceOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-md hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 transition"
          >
            <Plus className="h-4 w-4" />
            Add Resource
          </button>
        </div>
      </div>

      {/* Role Alert / Fast Switcher for Evaluator */}
      {!isAdminOrManager && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl bg-amber-50 border border-amber-200 p-4 dark:bg-amber-950/60 dark:border-amber-800">
          <div className="flex items-center gap-3">
            <Lock className="h-5 w-5 text-amber-600 shrink-0" />
            <div className="text-xs text-amber-900 dark:text-amber-200">
              <strong>Admin Mode Preview:</strong> You are currently viewing as{" "}
              <span className="font-semibold">{currentUser?.name} ({currentUser?.role})</span>.
              Switch to an administrator persona to execute privileged modifications.
            </div>
          </div>
          <button
            onClick={() => {
              const admin = allUsers.find((u) => u.role === "ADMIN");
              if (admin) switchPersona(admin.id);
            }}
            className="rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-500 transition shrink-0"
          >
            Switch to Sarah Chen (Admin)
          </button>
        </div>
      )}

      {/* Feedback banner */}
      {feedback && (
        <div className="rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 border border-emerald-200 dark:bg-emerald-950/70 dark:border-emerald-800 dark:text-emerald-200">
          {feedback}
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-medium text-slate-500">Tracked Resources</span>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{resources.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-medium text-slate-500">Under Maintenance</span>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            {resources.filter((r) => r.status === "MAINTENANCE").length}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-medium text-slate-500">Pending Approvals</span>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{pendingReservations.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-medium text-slate-500">Audit Events Recorded</span>
          <p className="text-2xl font-bold text-slate-700 dark:text-slate-300 mt-1">{auditLogs.length}</p>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 dark:border-slate-800">
        {[
          { id: "RESOURCES", label: "Resource Directory", icon: Layers },
          { id: "MAINTENANCE", label: "Maintenance Windows", icon: Wrench },
          { id: "APPROVALS", label: `Approvals Queue (${pendingReservations.length})`, icon: UserCheck },
          { id: "AUDIT", label: "Audit Trail", icon: History },
          { id: "ANALYTICS", label: "Utilization Analytics", icon: TrendingUp },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 rounded-t-xl px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition border-b-2 ${
                isSelected
                  ? "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: Resource Directory Table */}
      {activeTab === "RESOURCES" && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/60">
              <tr>
                <th className="px-4 py-3">Resource / Asset</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Capacity</th>
                <th className="px-4 py-3">Approval Policy</th>
                <th className="px-4 py-3">Operational Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {resources.map((res) => (
                <tr key={res.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg overflow-hidden bg-slate-100 shrink-0 dark:bg-slate-800">
                        {res.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={res.imageUrl} alt={res.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-400">
                            <Layers className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{res.name}</p>
                        <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold">
                          {res.code}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {res.category?.name}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-slate-400" />
                      {res.location}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {res.capacity ? `${res.capacity} people` : "1 unit"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                        res.requiresApproval
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      {res.requiresApproval ? "Approval Required" : "Instant"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={res.status}
                      disabled={isPending}
                      onChange={(e) => handleStatusChange(res.id, e.target.value)}
                      className={`rounded-xl border px-2.5 py-1 text-xs font-semibold focus:outline-none ${
                        res.status === "AVAILABLE"
                          ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-200"
                          : res.status === "MAINTENANCE"
                          ? "border-rose-300 bg-rose-50 text-rose-800 dark:bg-rose-950 dark:border-rose-800 dark:text-rose-200"
                          : "border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-200"
                      }`}
                    >
                      <option value="AVAILABLE">Available</option>
                      <option value="IN_USE">In Use</option>
                      <option value="MAINTENANCE">Maintenance</option>
                      <option value="RETIRED">Retired</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: Maintenance Windows */}
      {activeTab === "MAINTENANCE" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Scheduled Lockouts & Servicing Windows
            </h3>
            <button
              onClick={() => setIsScheduleMaintOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-500 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Lockout Window
            </button>
          </div>

          {maintenanceWindows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400 dark:border-slate-800">
              No active or upcoming maintenance windows scheduled.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {maintenanceWindows.map((m) => (
                <div
                  key={m.id}
                  className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/60 dark:bg-amber-950/20"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded dark:bg-amber-900 dark:text-amber-200">
                        {m.resource.code}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                        {m.title}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                        {m.resource.name}
                      </p>
                    </div>
                    <Wrench className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t border-amber-200/60 pt-2 dark:border-amber-900/60">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {format(new Date(m.startTime), "MMM d, HH:mm")} - {format(new Date(m.endTime), "HH:mm")}
                    </span>
                    <span>By: {m.performedBy || "Facilities Team"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Approval Queue */}
      {activeTab === "APPROVALS" && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Pending Reservation Requests Requiring Approval
          </h3>

          {pendingReservations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400 dark:border-slate-800">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
              All reservation requests have been processed. Zero pending items.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingReservations.map((res) => (
                <div
                  key={res.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-sm"
                >
                  <div>
                    <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded dark:bg-indigo-950 dark:text-indigo-300">
                      {res.resource.code} • {res.resource.name}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                      {res.title}
                    </h4>
                    <p className="text-xs text-slate-500">
                      Requested by <strong>{res.user.name}</strong> •{" "}
                      {format(new Date(res.startTime), "MMM d, HH:mm")} - {format(new Date(res.endTime), "HH:mm")}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApprove(res.id)}
                      disabled={isPending}
                      className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(res.id)}
                      disabled={isPending}
                      className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                    >
                      <X className="h-3.5 w-3.5" />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Audit Trail */}
      {activeTab === "AUDIT" && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/60">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Actor / User</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-[11px]">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-2.5 text-slate-500">
                    {format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss")}
                  </td>
                  <td className="px-4 py-2.5 font-sans font-medium text-slate-800 dark:text-slate-200">
                    {log.user.name} ({log.user.role})
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-500 max-w-xs truncate">
                    {JSON.stringify(log.details)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 5: Utilization Analytics */}
      {activeTab === "ANALYTICS" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              Hours Booked by Resource Category
            </h3>
            <div className="space-y-3">
              {categoryUtilization.map((cat, i) => {
                const maxHours = Math.max(1, ...categoryUtilization.map((c) => c.hours));
                const percentage = Math.round((cat.hours / maxHours) * 100);
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{cat.name}</span>
                      <span className="text-slate-500 font-mono">
                        {cat.hours.toFixed(1)} hrs ({cat.count} bookings)
                      </span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden dark:bg-slate-800">
                      <div
                        style={{ width: `${Math.max(5, percentage)}%` }}
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Add Resource Modal */}
      <AddResourceModal
        isOpen={isAddResourceOpen}
        onClose={() => setIsAddResourceOpen(false)}
        categories={categories}
        onSuccess={() => window.location.reload()}
      />

      {/* Schedule Maintenance Modal */}
      <ScheduleMaintenanceModal
        isOpen={isScheduleMaintOpen}
        onClose={() => setIsScheduleMaintOpen(false)}
        resources={resources}
        onSuccess={() => window.location.reload()}
      />
    </div>
  );
}
