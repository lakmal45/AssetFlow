import { prisma } from "@/lib/prisma";
import AdminDashboard from "@/components/admin/AdminDashboard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Governance | AssetFlow",
  description: "Administrative console for managing resources, servicing, and audit logs.",
};

export default async function AdminPage() {
  const [resources, categories, maintenanceWindows, auditLogs, reservations] = await Promise.all([
    prisma.resource.findMany({
      include: { category: true },
      orderBy: { name: "asc" },
    }),
    prisma.resourceCategory.findMany({
      orderBy: { name: "asc" },
    }),
    prisma.maintenanceWindow.findMany({
      include: { resource: true },
      orderBy: { startTime: "asc" },
    }),
    prisma.auditLog.findMany({
      include: {
        user: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.reservation.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        resource: { select: { id: true, name: true, code: true, categoryId: true } },
      },
      orderBy: { startTime: "desc" },
    }),
  ]);

  return (
    <AdminDashboard
      resources={resources}
      categories={categories}
      maintenanceWindows={maintenanceWindows}
      auditLogs={auditLogs}
      reservations={reservations}
    />
  );
}
