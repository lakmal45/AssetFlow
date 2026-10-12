"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ResourceStatus, ReservationStatus } from "@prisma/client";
import { z } from "zod";

const createResourceSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  code: z.string().min(2, "Code must be at least 2 characters").toUpperCase(),
  categoryId: z.string().min(1, "Category is required"),
  location: z.string().min(2, "Location is required"),
  capacity: z.coerce.number().int().min(1).optional().default(1),
  description: z.string().min(5, "Description must be at least 5 characters"),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  requiresApproval: z.boolean().default(false),
  minBookingMinutes: z.coerce.number().int().min(15).optional().default(15),
  maxBookingMinutes: z.coerce.number().int().min(30).optional().default(480),
  amenities: z.string().optional(),
});

const createMaintenanceSchema = z.object({
  resourceId: z.string().min(1, "Resource is required"),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  performedBy: z.string().optional(),
}).refine((data) => data.endTime > data.startTime, {
  message: "End time must be after start time",
  path: ["endTime"],
});

export async function updateResourceStatusAction(
  resourceId: string,
  newStatus: ResourceStatus,
  adminUserId: string
) {
  try {
    const updated = await prisma.resource.update({
      where: { id: resourceId },
      data: { status: newStatus },
      include: { category: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: "RESOURCE_STATUS_UPDATED",
        details: {
          resourceId,
          resourceName: updated.name,
          newStatus,
        },
      },
    });

    revalidatePath("/");
    revalidatePath("/timeline");
    revalidatePath("/admin");
    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update status." };
  }
}

export async function createResourceAction(rawInput: z.infer<typeof createResourceSchema>) {
  try {
    const data = createResourceSchema.parse(rawInput);

    const amenitiesList = data.amenities
      ? data.amenities.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    const resource = await prisma.resource.create({
      data: {
        name: data.name,
        code: data.code,
        categoryId: data.categoryId,
        location: data.location,
        capacity: data.capacity,
        description: data.description,
        imageUrl: data.imageUrl || "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&auto=format&fit=crop&q=80",
        requiresApproval: data.requiresApproval,
        minBookingMinutes: data.minBookingMinutes,
        maxBookingMinutes: data.maxBookingMinutes,
        attributes: {
          amenities: amenitiesList,
        },
      },
      include: { category: true },
    });

    revalidatePath("/");
    revalidatePath("/timeline");
    revalidatePath("/admin");
    return { success: true, data: resource };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create resource." };
  }
}

export async function createMaintenanceWindowAction(
  rawInput: z.infer<typeof createMaintenanceSchema>,
  adminUserId: string
) {
  try {
    const data = createMaintenanceSchema.parse(rawInput);

    // Create window
    const window = await prisma.maintenanceWindow.create({
      data: {
        resourceId: data.resourceId,
        title: data.title,
        description: data.description,
        startTime: data.startTime,
        endTime: data.endTime,
        performedBy: data.performedBy || "Facilities Team",
      },
      include: { resource: true },
    });

    // Optionally set resource status to MAINTENANCE if currently starting
    await prisma.resource.update({
      where: { id: data.resourceId },
      data: { status: ResourceStatus.MAINTENANCE },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: "MAINTENANCE_SCHEDULED",
        details: {
          resourceId: data.resourceId,
          title: data.title,
          startTime: data.startTime.toISOString(),
          endTime: data.endTime.toISOString(),
        },
      },
    });

    revalidatePath("/");
    revalidatePath("/timeline");
    revalidatePath("/admin");
    return { success: true, data: window };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to schedule maintenance." };
  }
}

export async function approveReservationAction(reservationId: string, adminUserId: string) {
  try {
    const updated = await prisma.reservation.update({
      where: { id: reservationId },
      data: { status: ReservationStatus.CONFIRMED },
      include: { user: true, resource: true },
    });

    await prisma.auditLog.create({
      data: {
        reservationId,
        userId: adminUserId,
        action: "RESERVATION_APPROVED",
        details: { approvedBy: adminUserId },
      },
    });

    revalidatePath("/");
    revalidatePath("/reservations");
    revalidatePath("/admin");
    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to approve reservation." };
  }
}

export async function rejectReservationAction(
  reservationId: string,
  adminUserId: string,
  rejectionReason: string
) {
  try {
    const updated = await prisma.reservation.update({
      where: { id: reservationId },
      data: {
        status: ReservationStatus.REJECTED,
        rejectionReason,
      },
      include: { user: true, resource: true },
    });

    await prisma.auditLog.create({
      data: {
        reservationId,
        userId: adminUserId,
        action: "RESERVATION_REJECTED",
        details: { rejectedBy: adminUserId, reason: rejectionReason },
      },
    });

    revalidatePath("/");
    revalidatePath("/reservations");
    revalidatePath("/admin");
    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to reject reservation." };
  }
}
