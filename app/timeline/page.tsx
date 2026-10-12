import { prisma } from "@/lib/prisma";
import DayTimeline from "@/components/timeline/DayTimeline";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Day Timeline | AssetFlow",
  description: "Visual time-block schedule and resource availability grid.",
};

export default async function TimelinePage() {
  const resources = await prisma.resource.findMany({
    include: {
      category: true,
      reservations: {
        where: {
          status: { notIn: ["CANCELLED", "REJECTED"] },
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
        orderBy: { startTime: "asc" },
      },
      maintenanceWindows: {
        orderBy: { startTime: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return <DayTimeline resources={resources} initialDateIso={new Date().toISOString()} />;
}
