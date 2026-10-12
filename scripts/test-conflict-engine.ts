import { prisma } from "../lib/prisma";
import {
  createReservation,
  checkResourceAvailability,
  checkInReservation,
  checkOutReservation,
  cancelReservation,
  ReservationConflictError,
} from "../lib/services/reservation.service";
import { ReservationStatus } from "@prisma/client";

async function runConflictTests() {
  console.log("🧪 ==================================================");
  console.log("🧪 ASSETFLOW CONFLICT ENGINE & LIFECYCLE TEST SUITE");
  console.log("🧪 ==================================================\n");

  // Fetch test resources and user
  const user = await prisma.user.findFirstOrThrow({ where: { email: "alex.rivera@primewave.com" } });
  const otherUser = await prisma.user.findFirstOrThrow({ where: { email: "elena.rostova@primewave.com" } });
  const resource = await prisma.resource.findFirstOrThrow({ where: { code: "ROOM-401" } }); // Boardroom Nexus

  console.log(`👤 Primary Test User: ${user.name} (${user.email})`);
  console.log(`🏢 Test Resource: ${resource.name} (${resource.code})\n`);

  // Define future test window (5 days from now to avoid seeded reservations)
  const testDate = new Date();
  testDate.setDate(testDate.getDate() + 5);
  testDate.setHours(14, 0, 0, 0);

  const slotStart = new Date(testDate);
  const slotEnd = new Date(testDate);
  slotEnd.setHours(15, 30, 0, 0); // 1.5 hour window

  // Clean any leftovers from past runs
  await prisma.reservation.deleteMany({
    where: {
      resourceId: resource.id,
      title: { contains: "[TEST-RUN]" },
    },
  });

  // TEST 1: Availability Check on empty slot
  console.log("TEST 1: Check availability for empty slot (14:00 - 15:30)...");
  const avail1 = await checkResourceAvailability(resource.id, slotStart, slotEnd);
  if (avail1.available) {
    console.log("  ✅ PASS: Slot is correctly reported as available.\n");
  } else {
    throw new Error(`  ❌ FAIL: Slot reported unavailable unexpectedly: ${avail1.conflictReason}`);
  }

  // TEST 2: Create primary reservation
  console.log("TEST 2: Create primary reservation for Alex Rivera...");
  const reservation1 = await createReservation({
    resourceId: resource.id,
    userId: user.id,
    title: "[TEST-RUN] Architecture Sync",
    purpose: "Testing conflict prevention mechanism",
    startTime: slotStart,
    endTime: slotEnd,
    attendeeCount: 5,
  });
  console.log(`  ✅ PASS: Primary reservation created successfully (ID: ${reservation1.id}).\n`);

  // TEST 3: Attempt EXACT OVERLAP booking by Elena Rostova
  console.log("TEST 3: Attempt duplicate booking for exact same time slot (14:00 - 15:30)...");
  try {
    await createReservation({
      resourceId: resource.id,
      userId: otherUser.id,
      title: "[TEST-RUN] Duplicate Meeting",
      purpose: "Should be blocked",
      startTime: slotStart,
      endTime: slotEnd,
      attendeeCount: 2,
    });
    throw new Error("  ❌ FAIL: Duplicate booking should have thrown an error but succeeded!");
  } catch (err: any) {
    if (err instanceof ReservationConflictError) {
      console.log(`  ✅ PASS: Correctly blocked with ReservationConflictError!`);
      console.log(`     Reason: "${err.message}"\n`);
    } else {
      throw err;
    }
  }

  // TEST 4: Attempt PARTIAL OVERLAP booking (Starts inside slot: 14:30 - 16:00)
  console.log("TEST 4: Attempt partial overlap booking (14:30 - 16:00)...");
  const overlapStart = new Date(testDate);
  overlapStart.setHours(14, 30, 0, 0);
  const overlapEnd = new Date(testDate);
  overlapEnd.setHours(16, 0, 0, 0);

  try {
    await createReservation({
      resourceId: resource.id,
      userId: otherUser.id,
      title: "[TEST-RUN] Partial Clash Meeting",
      purpose: "Testing overlap",
      startTime: overlapStart,
      endTime: overlapEnd,
      attendeeCount: 3,
    });
    throw new Error("  ❌ FAIL: Partial overlap should have been blocked!");
  } catch (err: any) {
    if (err instanceof ReservationConflictError) {
      console.log(`  ✅ PASS: Correctly blocked partial overlap!`);
      console.log(`     Reason: "${err.message}"\n`);
    } else {
      throw err;
    }
  }

  // TEST 5: Test Lifecycle Transitions (Check-in -> Check-out)
  console.log("TEST 5: Test Check-in and Check-out state machine...");
  const checkedIn = await checkInReservation(reservation1.id, user.id);
  if (checkedIn.status === ReservationStatus.CHECKED_IN && checkedIn.checkedInAt) {
    console.log("  ✅ PASS: Status transitioned to CHECKED_IN with timestamp.");
  } else {
    throw new Error("  ❌ FAIL: Check-in failed to transition status.");
  }

  const completed = await checkOutReservation(reservation1.id, user.id);
  if (completed.status === ReservationStatus.COMPLETED && completed.checkedOutAt) {
    console.log("  ✅ PASS: Status transitioned to COMPLETED with timestamp.\n");
  } else {
    throw new Error("  ❌ FAIL: Check-out failed to transition status.");
  }

  // TEST 6: Test Cancellation frees slot for new reservation
  console.log("TEST 6: Test Cancellation freeing slot for rebooking...");
  const testSlot2Start = new Date(testDate);
  testSlot2Start.setHours(17, 0, 0, 0);
  const testSlot2End = new Date(testDate);
  testSlot2End.setHours(18, 0, 0, 0);

  const resToCancel = await createReservation({
    resourceId: resource.id,
    userId: user.id,
    title: "[TEST-RUN] Temporary Hold",
    purpose: "Testing hold",
    startTime: testSlot2Start,
    endTime: testSlot2End,
    attendeeCount: 2,
  });

  await cancelReservation(resToCancel.id, user.id, "Meeting postponed");
  console.log("  Booking cancelled.");

  // Now rebooking the exact same slot should SUCCEED
  const rebooking = await createReservation({
    resourceId: resource.id,
    userId: otherUser.id,
    title: "[TEST-RUN] Re-booked by Elena",
    purpose: "Testing rebooking",
    startTime: testSlot2Start,
    endTime: testSlot2End,
    attendeeCount: 4,
  });

  if (rebooking.id) {
    console.log("  ✅ PASS: Slot successfully re-booked after cancellation.\n");
  }

  // Clean up test records
  await prisma.auditLog.deleteMany({
    where: { reservationId: { in: [reservation1.id, resToCancel.id, rebooking.id] } },
  });
  await prisma.reservation.deleteMany({
    where: { id: { in: [reservation1.id, resToCancel.id, rebooking.id] } },
  });

  console.log("🧹 Test records cleaned up.");
  console.log("🏆 ==================================================");
  console.log("🏆 ALL CONFLICT ENGINE TESTS PASSED WITH 100% SUCCESS!");
  console.log("🏆 ==================================================\n");
}

runConflictTests()
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
