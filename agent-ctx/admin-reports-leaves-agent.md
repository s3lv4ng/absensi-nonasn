# Admin Reports & Leave Management Components

## Task Summary
Created two production-quality admin components for the attendance app:

### 1. Reports Component (`src/components/admin/reports.tsx`)
- **Month/Year selector** with Select dropdowns
- **Overview stats cards**: Total working days, Average attendance rate, Most late employees
- **Line chart** using Recharts showing daily attendance rate over the selected month with custom tooltip
- **Employee Attendance Table** with sortable columns (No, NIP, Nama, Unit Kerja, Hadir, Telat, Izin, Cuti, Alpha, Persentase)
- **Color-coded percentages**: Green >90%, Yellow >75%, Red <75%
- **Export buttons** (PDF & Excel) with simulated toast messages
- Full loading skeleton, error state, and refresh capability

### 2. Leave Management Component (`src/components/admin/leave-management.tsx`)
- **Tabs**: Pending, Approved, Rejected, All with custom colored tab triggers
- **Leave Request Table** with type badges (IZIN=blue, CUTI=green, SAKIT=red) and status badges (PENDING=yellow, APPROVED=green, REJECTED=red)
- **Actions** for PENDING leaves: Setujui/Tolak buttons with AlertDialog confirmation
- **Detail Dialog** showing full leave request info with employee details, dates, reason, and approval status
- Fetches from `GET /api/leaves` with status filter, updates via `PUT /api/leaves`

### 3. Updated Reports API (`src/app/api/reports/route.ts`)
- Added `totalWorkingDays` calculation (respects work days and holidays)
- Added `averageAttendanceRate` across all employees
- Added `mostLateEmployees` (top 3)
- Added `dailyRates` for line chart
- Added `employeeSummaries` with per-employee monthly breakdown
- Maintains backward compatibility with existing dashboard data

### 4. Updated Page Router (`src/app/page.tsx`)
- Removed local AdminDashboard function (uses imported component)
- Added routing for `admin-reports` → `AdminReports`
- Added routing for `admin-leaves` → `LeaveManagement`

## Design Patterns
- Blue color scheme (#1e40af, #2563eb) matching existing admin dashboard
- Framer Motion animations for staggered entrance effects
- Consistent shadcn/ui component usage
- Toast notifications via sonner for all user actions
- Full loading/error states with retry buttons
