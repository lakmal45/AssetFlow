import { prisma } from "@/lib/prisma";
import { ReservationStatus, ResourceStatus, Prisma } from "@prisma/client";
import { CreateReservationInput } from "@/lib/validations/reservation";

export interface AvailabilityResult {
  available: boolean;
  conflictType?: "RESERVATION" | "MAINTENANCE" | "RESOURCE_STATUS";
  conflictReason?: string;
  conflictingItem?: {
    id: string;
    title: string;
    startTime: Date;
    endTime: Date;
    userOrHost?: string;
  };
}

export class ReservationConflictError extends Error {
  public conflictDetails: AvailabilityResult;

  constructor(message: string, conflictDetails: AvailabilityResult) {
    super(message);
    this.name = "ReservationConflictError";
    this.conflictDetails = conflictDetails;
  }
}

/**
 * Checks whether a given resource is available for the requested time interval.
 * Returns availability status and conflict details if occupied.
 */
export async function checkResourceAvailability(
  resourceId: string,
  startTime: Date,
  endTime: Date,
  excludeReservationId?: string,
  txClient: Prisma.TransactionClient | typeof prisma = prisma
): Promise<AvailabilityResult> {
  // 1. Check resource operational status
  const resource = await txClient.resource.findUnique({
    where: { id: resourceId },
    select: { id: true, name: true, status: true, maxBookingMinutes: true },
  });

  if (!resource) {
    return {
      available: false,
      conflictType: "RESOURCE_STATUS",
      conflictReason: "The specified resource does not exist.",
    };
  }

  if (resource.status === ResourceStatus.RETIRED) {
    return {
      available: false,
      conflictType: "RESOURCE_STATUS",
      conflictReason: `Resource "${resource.name}" has been retired from active service.`,
    };
  }

  // Check maximum booking limit
  const requestedDurationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
  if (requestedDurationMinutes > resource.maxBookingMinutes) {
    return {
      available: false,
      conflictType: "RESOURCE_STATUS",
      conflictReason: `Requested duration (${Math.round(requestedDurationMinutes / 60)}h) exceeds the maximum allowed limit of ${Math.round(resource.maxBookingMinutes / 60)}h for this resource.`,
    };
  }

  // 2. Check for overlapping Maintenance Windows
  // Overlap: (StartTime < Window.EndTime) AND (EndTime > Window.StartTime)
  const maintenanceConflict = await txClient.maintenanceWindow.findFirst({
    where: {
      resourceId,
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
    select: {
      id: true,
      title: true,
      startTime: true,
      endTime: true,
      performedBy: true,
    },
  });

  if (maintenanceConflict) {
    return {
      available: false,
      conflictType: "MAINTENANCE",
      conflictReason: `Resource is scheduled for maintenance: "${maintenanceConflict.title}" (${maintenanceConflict.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${maintenanceConflict.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}).`,
      conflictingItem: {
        id: maintenanceConflict.id,
        title: maintenanceConflict.title,
        startTime: maintenanceConflict.startTime,
        endTime: maintenanceConflict.endTime,
        userOrHost: maintenanceConflict.performedBy ?? "Maintenance Team",
      },
    };
  }

  // 3. Check for overlapping active Reservations
  // Exclude CANCELLED and REJECTED states
  const reservationConflict = await txClient.reservation.findFirst({
    where: {
      resourceId,
      status: {
        notIn: [ReservationStatus.CANCELLED, ReservationStatus.REJECTED],
      },
      ...(excludeReservationId ? { id: { not: excludeReservationId } } : {}),
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
    include: {
      user: {
        select: { name: true, email: true },
      },
    },
  });

  if (reservationConflict) {
    return {
      available: false,
      conflictType: "RESERVATION",
      conflictReason: `Conflicting reservation already exists: "${reservationConflict.title}" booked by ${reservationConflict.user.name} (${reservationConflict.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${reservationConflict.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}).`,
      conflictingItem: {
        id: reservationConflict.id,
        title: reservationConflict.title,
        startTime: reservationConflict.startTime,
        endTime: reservationConflict.endTime,
        userOrHost: reservationConflict.user.name,
      },
    };
  }

  return { available: true };
}

/**
 * Creates a reservation atomically using a transaction to guarantee zero double bookings.
 */
export async function createReservation(input: CreateReservationInput) {
  return await prisma.$transaction(async (tx) => {
    // 1. Re-validate availability within transaction isolation
    const availability = await checkResourceAvailability(
      input.resourceId,
      input.startTime,
      input.endTime,
      undefined,
      tx
    );

    if (!availability.available) {
      throw new ReservationConflictError(
        availability.conflictReason || "Scheduling collision detected.",
        availability
      );
    }

    // 2. Fetch resource to determine approval requirement
    const resource = await tx.resource.findUniqueOrThrow({
      where: { id: input.resourceId },
    });

    const initialStatus = resource.requiresApproval
      ? ReservationStatus.PENDING
      : ReservationStatus.CONFIRMED;

    // 3. Create Reservation
    const reservation = await tx.reservation.create({
      data: {
        resourceId: input.resourceId,
        userId: input.userId,
        title: input.title,
        purpose: input.purpose,
        startTime: input.startTime,
        endTime: input.endTime,
        attendeeCount: input.attendeeCount,
        status: initialStatus,
      },
      include: {
        resource: {
          include: { category: true },
        },
        user: true,
      },
    });

    // 4. Record Audit Log
    await tx.auditLog.create({
      data: {
        reservationId: reservation.id,
        userId: input.userId,
        action: "RESERVATION_CREATED",
        details: {
          title: reservation.title,
          status: reservation.status,
          resource: resource.name,
          startTime: reservation.startTime.toISOString(),
          endTime: reservation.endTime.toISOString(),
        },
      },
    });

    return reservation;
  });
}

/**
 * Check-in workflow when a user arrives to claim the reserved resource.
 */
export async function checkInReservation(reservationId: string, userId: string) {
  return await prisma.$transaction(async (tx) => {
    const reservation = await tx.reservation.findUniqueOrThrow({
      where: { id: reservationId },
      include: { user: true, resource: true },
    });

    if (reservation.status !== ReservationStatus.CONFIRMED) {
      throw new Error(`Cannot check in: reservation is currently in ${reservation.status} status.`);
    }

    const updated = await tx.reservation.update({
      where: { id: reservationId },
      data: {
        status: ReservationStatus.CHECKED_IN,
        checkedInAt: new Date(),
      },
      include: { resource: true, user: true },
    });

    await tx.auditLog.create({
      data: {
        reservationId,
        userId,
        action: "CHECKED_IN",
        details: { checkedInAt: new Date().toISOString() },
      },
    });

    return updated;
  });
}

/**
 * Check-out or complete a reservation, freeing the resource immediately.
 */
export async function checkOutReservation(reservationId: string, userId: string) {
  return await prisma.$transaction(async (tx) => {
    const reservation = await tx.reservation.findUniqueOrThrow({
      where: { id: reservationId },
    });

    if (
      reservation.status !== ReservationStatus.CHECKED_IN &&
      reservation.status !== ReservationStatus.CONFIRMED
    ) {
      throw new Error(`Cannot complete reservation with status: ${reservation.status}`);
    }

    const updated = await tx.reservation.update({
      where: { id: reservationId },
      data: {
        status: ReservationStatus.COMPLETED,
        checkedOutAt: new Date(),
      },
      include: { resource: true, user: true },
    });

    await tx.auditLog.create({
      data: {
        reservationId,
        userId,
        action: "RESERVATION_COMPLETED",
        details: { checkedOutAt: new Date().toISOString() },
      },
    });

    return updated;
  });
}

/**
 * Cancel a reservation with audit tracking.
 */
export async function cancelReservation(reservationId: string, userId: string, reason?: string) {
  return await prisma.$transaction(async (tx) => {
    const reservation = await tx.reservation.findUniqueOrThrow({
      where: { id: reservationId },
    });

    if (
      reservation.status === ReservationStatus.COMPLETED ||
      reservation.status === ReservationStatus.CANCELLED
    ) {
      throw new Error(`Cannot cancel a reservation that is already ${reservation.status}.`);
    }

    const updated = await tx.reservation.update({
      where: { id: reservationId },
      data: {
        status: ReservationStatus.CANCELLED,
      },
      include: { resource: true, user: true },
    });

    await tx.auditLog.create({
      data: {
        reservationId,
        userId,
        action: "RESERVATION_CANCELLED",
        details: { reason: reason || "User cancelled booking" },
      },
    });

    return updated;
  });
}

/**
 * Retrieves the day schedule and time slots for a resource to display on visual timelines.
 */
export async function getResourceDayTimeline(resourceId: string, date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const [resource, reservations, maintenance] = await Promise.all([
    prisma.resource.findUniqueOrThrow({
      where: { id: resourceId },
      include: { category: true },
    }),
    prisma.reservation.findMany({
      where: {
        resourceId,
        status: { notIn: [ReservationStatus.CANCELLED, ReservationStatus.REJECTED] },
        startTime: { lte: endOfDay },
        endTime: { gte: startOfDay },
      },
      include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
      orderBy: { startTime: "asc" },
    }),
    prisma.maintenanceWindow.findMany({
      where: {
        resourceId,
        startTime: { lte: endOfDay },
        endTime: { gte: startOfDay },
      },
      orderBy: { startTime: "asc" },
    }),
  ]);

  return {
    resource,
    date,
    reservations,
    maintenance,
  };
}
