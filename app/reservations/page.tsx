import { prisma } from "@/lib/prisma";
import ReservationsDashboard from "@/components/reservations/ReservationsDashboard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Reservations | AssetFlow",
  description: "View and manage active, upcoming, and past resource bookings.",
};

export default async function ReservationsPage() {
  const reservations = await prisma.reservation.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          role: true,
        },
      },
      resource: {
        select: {
          id: true,
          name: true,
          code: true,
          location: true,
          imageUrl: true,
          category: {
            select: { name: true },
          },
        },
      },
    },
    orderBy: { startTime: "desc" },
  });

  return <ReservationsDashboard initialReservations={reservations as any} />;
}
