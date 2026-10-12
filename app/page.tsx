import { prisma } from "@/lib/prisma";
import ResourceCatalog from "@/components/resources/ResourceCatalog";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [resources, categories] = await Promise.all([
    prisma.resource.findMany({
      include: {
        category: true,
        reservations: {
          where: {
            status: { notIn: ["CANCELLED", "REJECTED"] },
          },
          include: {
            user: {
              select: { name: true, avatarUrl: true },
            },
          },
          orderBy: { startTime: "asc" },
        },
        maintenanceWindows: {
          orderBy: { startTime: "asc" },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.resourceCategory.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  return <ResourceCatalog initialResources={resources} categories={categories} />;
}
