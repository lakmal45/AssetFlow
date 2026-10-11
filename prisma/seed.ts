import { PrismaClient, UserRole, CategoryType, ResourceStatus, ReservationStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting AssetFlow database seeding...");

  // 1. Clean up existing data in reverse dependency order
  await prisma.auditLog.deleteMany();
  await prisma.maintenanceWindow.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.resourceCategory.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  console.log("🧹 Existing database records purged.");

  // 2. Create Departments
  const deptEng = await prisma.department.create({
    data: { name: "Software Engineering", code: "ENG" },
  });
  const deptDesign = await prisma.department.create({
    data: { name: "Product & Design", code: "DES" },
  });
  const deptQA = await prisma.department.create({
    data: { name: "QA & Device Lab", code: "QA" },
  });
  const deptOps = await prisma.department.create({
    data: { name: "Operations & Facilities", code: "OPS" },
  });

  // 3. Create Users / Demo Personas
  const adminSarah = await prisma.user.create({
    data: {
      email: "sarah.chen@primewave.com",
      name: "Sarah Chen",
      role: UserRole.ADMIN,
      departmentId: deptOps.id,
      avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    },
  });

  const memberAlex = await prisma.user.create({
    data: {
      email: "alex.rivera@primewave.com",
      name: "Alex Rivera",
      role: UserRole.MEMBER,
      departmentId: deptEng.id,
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
  });

  const memberElena = await prisma.user.create({
    data: {
      email: "elena.rostova@primewave.com",
      name: "Elena Rostova",
      role: UserRole.MEMBER,
      departmentId: deptDesign.id,
      avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    },
  });

  const managerMarcus = await prisma.user.create({
    data: {
      email: "marcus.vance@primewave.com",
      name: "Marcus Vance",
      role: UserRole.MANAGER,
      departmentId: deptEng.id,
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    },
  });

  console.log("👥 4 Demo Personas created (Admin, Manager, 2 Members).");

  // 4. Create Categories
  const catMeetingRooms = await prisma.resourceCategory.create({
    data: {
      name: "Meeting & Conference Rooms",
      type: CategoryType.FACILITY,
      icon: "DoorOpen",
      description: "Dedicated spaces for sprint planning, executive meetings, and team huddles.",
    },
  });

  const catLabsStudios = await prisma.resourceCategory.create({
    data: {
      name: "Studios & Collaborative Labs",
      type: CategoryType.FACILITY,
      icon: "Mic",
      description: "Sound-treated recording studios, ideation rooms, and user testing suites.",
    },
  });

  const catHardware = await prisma.resourceCategory.create({
    data: {
      name: "Dev Workstations & Hardware",
      type: CategoryType.EQUIPMENT,
      icon: "Laptop",
      description: "High-spec test machines, GPU compute nodes, and specialized developer laptops.",
    },
  });

  const catXR = await prisma.resourceCategory.create({
    data: {
      name: "XR & Mobile Testing Kits",
      type: CategoryType.EQUIPMENT,
      icon: "Glasses",
      description: "Next-gen spatial computing headsets, multi-OS phones, and tablet suites.",
    },
  });

  const catFleet = await prisma.resourceCategory.create({
    data: {
      name: "Company Fleet & Transport",
      type: CategoryType.VEHICLE,
      icon: "Car",
      description: "Shared corporate electric vehicles for client on-sites and team shuttles.",
    },
  });

  // 5. Create Resources
  const roomBoardroom = await prisma.resource.create({
    data: {
      name: "Boardroom Nexus",
      code: "ROOM-401",
      categoryId: catMeetingRooms.id,
      location: "Floor 4, East Wing",
      capacity: 14,
      description: "Executive conference room equipped with 85'' 4K HDR display, 4K Polycom camera bar, and dual smart whiteboards.",
      imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&auto=format&fit=crop&q=80",
      status: ResourceStatus.AVAILABLE,
      attributes: {
        amenities: ["85-inch 4K Display", "Polycom Video Bar", "Conference Phone", "Whiteboard", "Ergonomic Chairs"],
        floor: "4",
        network: "10GbE Wired + Wi-Fi 6E",
      },
      requiresApproval: false,
      minBookingMinutes: 30,
      maxBookingMinutes: 480,
    },
  });

  const roomDesignLab = await prisma.resource.create({
    data: {
      name: "Design Sprint Lab",
      code: "LAB-204",
      categoryId: catLabsStudios.id,
      location: "Floor 2, Creative Commons",
      capacity: 8,
      description: "Creative brainstorm zone featuring four magnetic writable walls, workshop supplies, and mobile collaboration monitors.",
      imageUrl: "https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=600&auto=format&fit=crop&q=80",
      status: ResourceStatus.AVAILABLE,
      attributes: {
        amenities: ["Magnetic Glassboards", "Sticky Note Supplies", "Movable High-Desks", "Touch Display"],
        floor: "2",
      },
      requiresApproval: false,
      minBookingMinutes: 30,
      maxBookingMinutes: 480,
    },
  });

  const roomPodcastBay = await prisma.resource.create({
    data: {
      name: "Podcast & Media Bay A",
      code: "STU-01",
      categoryId: catLabsStudios.id,
      location: "Basement 1, Media Suite",
      capacity: 4,
      description: "Acoustically isolated broadcasting studio outfitted with 4x Shure SM7B mics, Rodecaster Pro II mixer, and dual Sony 4K PTZ cameras.",
      imageUrl: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&auto=format&fit=crop&q=80",
      status: ResourceStatus.AVAILABLE,
      attributes: {
        amenities: ["4x Shure SM7B Mics", "Rodecaster Pro II", "Acoustic Baffles", "Blackmagic ATEM Mini Pro", "Studio Lighting"],
        floor: "B1",
      },
      requiresApproval: false,
      minBookingMinutes: 30,
      maxBookingMinutes: 240,
    },
  });

  const roomFocusPod = await prisma.resource.create({
    data: {
      name: "Quiet Focus Pod Alpha",
      code: "POD-302",
      categoryId: catMeetingRooms.id,
      location: "Floor 3, Quiet Wing",
      capacity: 1,
      description: "Soundproof individual pod for high-focus deep work, customer escalations, or remote 1-on-1 interviews.",
      imageUrl: "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?w=600&auto=format&fit=crop&q=80",
      status: ResourceStatus.AVAILABLE,
      attributes: {
        amenities: ["Motorized Standing Desk", "34-inch Ultrawide Monitor", "USB-C Hub", "Active Ventilation"],
        floor: "3",
      },
      requiresApproval: false,
      minBookingMinutes: 15,
      maxBookingMinutes: 180,
    },
  });

  const eqMacBook = await prisma.resource.create({
    data: {
      name: 'MacBook Pro 16" M3 Max (Dev-01)',
      code: "DEV-MAC-01",
      categoryId: catHardware.id,
      location: "IT Service Locker Bay 3",
      capacity: 1,
      description: "High-spec mobile workstation (16-core CPU, 40-core GPU, 64GB RAM, 1TB SSD) for heavy compilation and localized LLM tests.",
      imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80",
      status: ResourceStatus.AVAILABLE,
      attributes: {
        serialNumber: "C02PQ893MD6R",
        specs: "Apple M3 Max, 64GB Unified RAM, 1TB NVMe",
        os: "macOS Sequoia 15.3",
      },
      requiresApproval: true,
      minBookingMinutes: 60,
      maxBookingMinutes: 1440,
    },
  });

  const eqVisionPro = await prisma.resource.create({
    data: {
      name: "Apple Vision Pro Spatial Kit",
      code: "XR-KIT-01",
      categoryId: catXR.id,
      location: "QA Lab Safe #2",
      capacity: 1,
      description: "512GB spatial computing headset with developer strap, Zeiss optical inserts, and dual battery packs for visionOS app validation.",
      imageUrl: "https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=600&auto=format&fit=crop&q=80",
      status: ResourceStatus.AVAILABLE,
      attributes: {
        serialNumber: "AVP-DEV-5542",
        specs: "Apple M2 + R1 Chip, 512GB Storage, visionOS 2.0",
        accessories: ["Developer Strap", "2x Battery Packs", "Hard Travel Case"],
      },
      requiresApproval: true,
      minBookingMinutes: 60,
      maxBookingMinutes: 480,
    },
  });

  const eqCinemaRig = await prisma.resource.create({
    data: {
      name: "Sony FX3 4K Cinema Rig",
      code: "MEDIA-FX3",
      categoryId: catLabsStudios.id,
      location: "Media Studio Cabinet A",
      capacity: 1,
      description: "Full-frame cinema camera with 24-70mm f/2.8 GM II lens, DJI RS3 Pro gimbal, and dual wireless lavalier transmitters.",
      imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&auto=format&fit=crop&q=80",
      status: ResourceStatus.MAINTENANCE,
      attributes: {
        serialNumber: "SN-FX3-99812",
        specs: "Full-Frame 4K 120p, 10-bit 4:2:2, Dual Base ISO",
        accessories: ["DJI RS3 Gimbal", "Rode Wireless PRO", "3x NP-FZ100 Batteries"],
      },
      requiresApproval: false,
      minBookingMinutes: 60,
      maxBookingMinutes: 720,
    },
  });

  const vehTransit = await prisma.resource.create({
    data: {
      name: "PrimeWave Electric Shuttle Van",
      code: "VAN-EV-01",
      categoryId: catFleet.id,
      location: "Basement Parking Bay P-12",
      capacity: 7,
      description: "All-electric 7-passenger van with 320km range for team offsites, client pickups, and event material transport.",
      imageUrl: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600&auto=format&fit=crop&q=80",
      status: ResourceStatus.AVAILABLE,
      attributes: {
        licensePlate: "WP CAD-7721",
        type: "Electric MPV",
        rangeKm: "320 km",
        chargingPort: "Type 2 / CCS2 Fast Charge",
      },
      requiresApproval: true,
      minBookingMinutes: 60,
      maxBookingMinutes: 720,
    },
  });

  console.log("🏢 8 Comprehensive Resources created with specs, locations, and capacities.");

  // 6. Schedule Maintenance Window for the Cinema Rig & Boardroom
  const now = new Date();
  const todayMaintStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 17, 0, 0);
  const todayMaintEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 19, 0, 0);

  await prisma.maintenanceWindow.create({
    data: {
      resourceId: eqCinemaRig.id,
      title: "Sensor Calibration & Firmware Update",
      description: "Routine sensor cleaning and firmware update to v4.0.0 conducted by IT Media team.",
      startTime: todayMaintStart,
      endTime: todayMaintEnd,
      performedBy: "IT Media Service Dept",
    },
  });

  // 7. Create Dynamic Sample Reservations (Relative to Today)
  // Reservation 1: Today morning (Completed) in Boardroom Nexus
  const res1Start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0);
  const res1End = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 30, 0);
  const res1 = await prisma.reservation.create({
    data: {
      resourceId: roomBoardroom.id,
      userId: managerMarcus.id,
      title: "Weekly Engineering All-Hands",
      purpose: "Cross-functional roadmap alignment and sprint demo review.",
      startTime: res1Start,
      endTime: res1End,
      status: ReservationStatus.COMPLETED,
      attendeeCount: 12,
      checkedInAt: res1Start,
      checkedOutAt: res1End,
    },
  });

  await prisma.auditLog.create({
    data: {
      reservationId: res1.id,
      userId: managerMarcus.id,
      action: "RESERVATION_COMPLETED",
      details: { note: "Meeting concluded on schedule without issues." },
    },
  });

  // Reservation 2: Today afternoon (Confirmed / Active) in Boardroom Nexus
  const res2Start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 13, 30, 0);
  const res2End = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 15, 0, 0);
  const res2 = await prisma.reservation.create({
    data: {
      resourceId: roomBoardroom.id,
      userId: memberAlex.id,
      title: "Architecture Spike: AssetFlow V1",
      purpose: "Technical architecture discussion on PostgreSQL transaction boundaries.",
      startTime: res2Start,
      endTime: res2End,
      status: ReservationStatus.CONFIRMED,
      attendeeCount: 6,
    },
  });

  await prisma.auditLog.create({
    data: {
      reservationId: res2.id,
      userId: memberAlex.id,
      action: "RESERVATION_CREATED",
      details: { automatedCheck: "No conflicts detected." },
    },
  });

  // Reservation 3: Today in Design Lab (Checked In / In-Progress)
  const res3Start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 0, 0);
  const res3End = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 13, 0, 0);
  const res3 = await prisma.reservation.create({
    data: {
      resourceId: roomDesignLab.id,
      userId: memberElena.id,
      title: "Design System Tokens & Micro-interactions",
      purpose: "Interactive user flows review and design tokens consolidation.",
      startTime: res3Start,
      endTime: res3End,
      status: ReservationStatus.CHECKED_IN,
      attendeeCount: 4,
      checkedInAt: res3Start,
    },
  });

  await prisma.auditLog.create({
    data: {
      reservationId: res3.id,
      userId: memberElena.id,
      action: "CHECKED_IN",
      details: { method: "User self check-in" },
    },
  });

  // Reservation 4: Tomorrow for Vision Pro Kit
  const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 10, 0, 0);
  const tomorrowEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 12, 30, 0);
  await prisma.reservation.create({
    data: {
      resourceId: eqVisionPro.id,
      userId: memberAlex.id,
      title: "spatialOS Spatial Anchor Benchmarks",
      purpose: "Testing frame rates and spatial audio latency in the lab environment.",
      startTime: tomorrowStart,
      endTime: tomorrowEnd,
      status: ReservationStatus.CONFIRMED,
      attendeeCount: 1,
    },
  });

  console.log("📅 Sample reservations and audit logs successfully generated.");
  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
