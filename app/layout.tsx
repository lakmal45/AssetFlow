import type { Metadata } from "next";
import "./globals.css";
import { prisma } from "@/lib/prisma";
import { PersonaProvider } from "@/context/PersonaContext";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "AssetFlow | Resource Reservation Management System",
  description:
    "Next.js & PostgreSQL Resource Reservation Management System developed for PrimeWave Lab Technical Assessment.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch users for persona switcher
  const users = await prisma.user.findMany({
    include: {
      department: {
        select: { name: true, code: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-50">
        <PersonaProvider initialUsers={users}>
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <footer className="border-t border-slate-200/80 bg-white py-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p>
                <strong>AssetFlow</strong> • Resource Reservation Management System for{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  PrimeWave Lab (Pvt) Ltd
                </span>
              </p>
              <p className="text-[11px]">
                Built with Next.js 16 (App Router), TypeScript, PostgreSQL & Prisma
              </p>
            </div>
          </footer>
        </PersonaProvider>
      </body>
    </html>
  );
}
