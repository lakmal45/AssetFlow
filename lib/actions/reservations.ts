"use server";

import { revalidatePath } from "next/cache";
import {
  createReservation,
  checkInReservation,
  checkOutReservation,
  cancelReservation,
  checkResourceAvailability,
  ReservationConflictError,
} from "@/lib/services/reservation.service";
import {
  createReservationSchema,
  CreateReservationInput,
  reservationActionSchema,
} from "@/lib/validations/reservation";

export type ActionResult<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  conflictDetails?: any;
};

/**
 * Server Action: Instant pre-flight availability check for real-time UI feedback.
 */
export async function checkAvailabilityAction(
  resourceId: string,
  startTimeIso: string,
  endTimeIso: string
): Promise<ActionResult> {
  try {
    const startTime = new Date(startTimeIso);
    const endTime = new Date(endTimeIso);

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      return { success: false, error: "Invalid date timestamps provided." };
    }

    if (endTime <= startTime) {
      return { success: false, error: "End time must be after start time." };
    }

    const result = await checkResourceAvailability(resourceId, startTime, endTime);
    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to check availability.",
    };
  }
}

/**
 * Server Action: Create a new reservation with transaction-backed conflict protection.
 */
export async function createReservationAction(
  rawInput: CreateReservationInput
): Promise<ActionResult> {
  try {
    const validated = createReservationSchema.parse(rawInput);
    const reservation = await createReservation(validated);

    revalidatePath("/");
    revalidatePath("/resources");
    revalidatePath("/reservations");
    revalidatePath("/admin");

    return {
      success: true,
      data: reservation,
    };
  } catch (error: any) {
    if (error instanceof ReservationConflictError) {
      return {
        success: false,
        error: error.message,
        conflictDetails: error.conflictDetails,
      };
    }
    return {
      success: false,
      error: error.message || "Unable to complete reservation.",
    };
  }
}

/**
 * Server Action: Check-in to an active reservation.
 */
export async function checkInReservationAction(
  reservationId: string,
  userId: string
): Promise<ActionResult> {
  try {
    const validated = reservationActionSchema.parse({ reservationId, userId });
    const updated = await checkInReservation(validated.reservationId, validated.userId);

    revalidatePath("/");
    revalidatePath("/reservations");
    revalidatePath("/admin");

    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to check in." };
  }
}

/**
 * Server Action: Complete/Check-out of a reservation early.
 */
export async function checkOutReservationAction(
  reservationId: string,
  userId: string
): Promise<ActionResult> {
  try {
    const validated = reservationActionSchema.parse({ reservationId, userId });
    const updated = await checkOutReservation(validated.reservationId, validated.userId);

    revalidatePath("/");
    revalidatePath("/reservations");
    revalidatePath("/admin");

    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to complete reservation." };
  }
}

/**
 * Server Action: Cancel an upcoming reservation.
 */
export async function cancelReservationAction(
  reservationId: string,
  userId: string,
  reason?: string
): Promise<ActionResult> {
  try {
    const validated = reservationActionSchema.parse({ reservationId, userId, reason });
    const updated = await cancelReservation(
      validated.reservationId,
      validated.userId,
      validated.reason
    );

    revalidatePath("/");
    revalidatePath("/reservations");
    revalidatePath("/admin");

    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to cancel reservation." };
  }
}
