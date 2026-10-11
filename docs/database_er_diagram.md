# AssetFlow - Entity Relationship (ER) Diagram & Data Architecture

## Overview
This document provides the complete Entity Relationship (ER) Diagram and schema specification for **AssetFlow**, a high-concurrency Resource Reservation Management System developed for PrimeWave Lab.

---

## 1. Visual Entity Relationship Diagram (Mermaid)

```mermaid
erDiagram
    DEPARTMENT ||--o{ USER : employs
    USER ||--o{ RESERVATION : creates
    USER ||--o{ AUDIT_LOG : triggers
    RESOURCE_CATEGORY ||--o{ RESOURCE : categorizes
    RESOURCE ||--o{ RESERVATION : booked_in
    RESOURCE ||--o{ MAINTENANCE_WINDOW : undergoes
    RESERVATION ||--o{ AUDIT_LOG : tracks

    DEPARTMENT {
        string id PK "cuid()"
        string name UK "Department name"
        string code UK "ENG, DES, QA, OPS"
        datetime createdAt
        datetime updatedAt
    }

    USER {
        string id PK "cuid()"
        string email UK "User email"
        string name "Full Name"
        enum role "ADMIN | MANAGER | MEMBER"
        string departmentId FK "Nullable"
        string avatarUrl
        datetime createdAt
        datetime updatedAt
    }

    RESOURCE_CATEGORY {
        string id PK "cuid()"
        string name UK "Meeting Rooms, Studios, Hardware, XR, Fleet"
        enum type "FACILITY | EQUIPMENT | VEHICLE"
        string icon "Lucide icon name"
        string description
        datetime createdAt
        datetime updatedAt
    }

    RESOURCE {
        string id PK "cuid()"
        string name "Resource Title"
        string code UK "ROOM-401, DEV-MAC-01, etc."
        string categoryId FK
        string location "Physical location or locker"
        int capacity "Seat count / passenger count"
        string description
        string imageUrl
        enum status "AVAILABLE | IN_USE | MAINTENANCE | RETIRED"
        jsonb attributes "Amenities, hardware specs, serial number"
        boolean requiresApproval "Default: false"
        int minBookingMinutes "Default: 15"
        int maxBookingMinutes "Default: 480"
        datetime createdAt
        datetime updatedAt
    }

    RESERVATION {
        string id PK "cuid()"
        string resourceId FK
        string userId FK
        string title "Reservation title"
        string purpose "Project/meeting purpose"
        datetime startTime "Scheduled start (UTC)"
        datetime endTime "Scheduled end (UTC)"
        enum status "PENDING | CONFIRMED | CHECKED_IN | COMPLETED | CANCELLED | REJECTED"
        int attendeeCount "Expected attendees"
        datetime checkedInAt "Actual check-in time"
        datetime checkedOutAt "Actual check-out/return time"
        string rejectionReason "Reason if rejected"
        datetime createdAt
        datetime updatedAt
    }

    MAINTENANCE_WINDOW {
        string id PK "cuid()"
        string resourceId FK
        string title "Maintenance task title"
        string description
        datetime startTime "Lockout start"
        datetime endTime "Lockout end"
        string performedBy "Technician / team"
        datetime createdAt
        datetime updatedAt
    }

    AUDIT_LOG {
        string id PK "cuid()"
        string reservationId FK "Nullable"
        string userId FK
        string action "RESERVATION_CREATED, CHECKED_IN, etc."
        jsonb details "Payload metadata, conflict traces"
        datetime createdAt
    }
```

---

## 2. Relational Integrity & Engineering Decisions

1. **Conflict Query Optimization:**
   - Compound B-Tree Index on `reservations(resourceId, startTime, endTime)` allows index-only range scans when evaluating the conflict condition:
     $$\text{Overlap: } (\text{NewStart} < \text{ExistingEnd}) \land (\text{NewEnd} > \text{ExistingStart})$$
   - Excludes terminal states (`CANCELLED`, `REJECTED`) from conflict evaluation.

2. **Maintenance Lockout Isolation:**
   - Compound index on `maintenance_windows(resourceId, startTime, endTime)` prevents scheduling during operational servicing.

3. **Lifecycle Tracking & Auditability:**
   - `checkedInAt` and `checkedOutAt` distinguish planned reservation duration from actual operational utilization.
   - Every status mutation is recorded in `audit_logs` for non-repudiation and enterprise governance.
