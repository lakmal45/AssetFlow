# AssetFlow - 3 to 5 Minute Demonstration Video Script

> **Assessment Submission Deliverable #2**  
> **Target Video Length:** 3:30 to 4:30 minutes  
> **Recommended Tool:** Loom, OBS Studio, or Windows Game Bar (`Win + Alt + R`)

---

## Video Outline & Timestamp Breakdown

| Timestamp | Segment | On-Screen Action | Talking Points / Narration |
| :--- | :--- | :--- | :--- |
| **0:00 - 0:40** | **1. Introduction & Business Problem** | Show Homepage (`http://localhost:3000`) | • Introduce yourself and the project: *AssetFlow* built for the PrimeWave Lab Technical Assessment.<br>• Explain the business context: Growing company managing shared conference rooms, dev hardware, and vehicles with informal tools.<br>• Highlight the core issues: Double-booking, scheduling uncertainty, and lack of visibility. |
| **0:40 - 1:30** | **2. Resource Catalog & Discovery** | Search "Boardroom", filter by Category, click "Schedule & Specs" on a card | • Demonstrate the responsive catalog, live category pills, and search.<br>• Show resource card badges (Available, In Use, Maintenance).<br>• Open the Resource Specs modal to show capacities, amenities, and policy rules. |
| **1:30 - 2:20** | **3. Live Conflict Prevention Demo (Core Engineering Highlight)** | Open Booking modal on Boardroom Nexus, pick overlapping time (e.g. 14:00 - 15:00) | • **Crucial Demonstration:** Show the live pre-flight conflict check in action.<br>• Point out the amber clash alert: *"Scheduling Conflict Detected: Conflicting reservation exists"*, and how the button is blocked.<br>• Explain the atomic overlap algorithm and PostgreSQL transaction isolation (`$transaction`) preventing race conditions.<br>• Shift time to a free slot (e.g., 16:00) showing green confirmation, then submit. |
| **2:20 - 3:00** | **4. Visual Day Timeline** | Navigate to `/timeline` | • Show the continuous 12-hour operational grid (08:00 AM - 08:00 PM).<br>• Point out colored reservation blocks (Confirmed in green, Checked-in in blue, Maintenance in amber).<br>• Click a vacant slot to show seamless instant pre-filled booking. |
| **3:00 - 3:45** | **5. Member Lifecycle Actions (Check-In & Release)** | Navigate to `/reservations` | • Show the My Reservations dashboard with tabs.<br>• Demonstrate **Check In** action (transitions to live status with timestamp).<br>• Demonstrate **Check Out / Early Return** (frees up the asset ahead of time).<br>• Demonstrate **Cancel** workflow. |
| **3:45 - 4:30** | **6. Admin Console & Architecture Summary** | Switch to Sarah Chen (Admin), navigate to `/admin` | • Showcase the Persona Switcher.<br>• Show Admin Console: Resource management table with 1-click status overrides.<br>• Show Scheduled Maintenance Lockouts.<br>• Highlight System Audit Trail and category utilization charts.<br>• Conclude with architecture summary: Next.js 16 App Router, TypeScript, PostgreSQL, and Prisma. |

---

## Key Talking Tips for High Marks
1. **Speak with confidence on engineering decisions:** Emphasize *why* you chose database transactions instead of naive frontend checks for conflict prevention.
2. **Keep transitions crisp:** Have your browser tabs or links ready to click smoothly.
3. **Mention reproducibility:** Note that the repo is seeded and contains an automated conflict test suite runnable with `npm run test:conflict`.
