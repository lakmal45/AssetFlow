import { z } from "zod";

export const createReservationSchema = z
  .object({
    resourceId: z.string().min(1, "Resource ID is required"),
    userId: z.string().min(1, "User ID is required"),
    title: z
      .string()
      .min(3, "Title must be at least 3 characters")
      .max(100, "Title must not exceed 100 characters"),
    purpose: z.string().max(500, "Purpose must not exceed 500 characters").optional(),
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
    attendeeCount: z.coerce.number().int().min(1, "At least 1 attendee required").default(1),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "End time must be strictly after start time",
    path: ["endTime"],
  })
  .refine(
    (data) => {
      const durationMinutes = (data.endTime.getTime() - data.startTime.getTime()) / (1000 * 60);
      return durationMinutes >= 15;
    },
    {
      message: "Minimum reservation duration is 15 minutes",
      path: ["endTime"],
    }
  );

export type CreateReservationInput = z.infer<typeof createReservationSchema>;

export const reservationActionSchema = z.object({
  reservationId: z.string().min(1, "Reservation ID is required"),
  userId: z.string().min(1, "User ID is required"),
  reason: z.string().max(300).optional(),
});

export type ReservationActionInput = z.infer<typeof reservationActionSchema>;
