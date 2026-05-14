# Task 2: Manual Attendance (Absensi Manual) Feature

**Agent**: manual-attendance-agent
**Date**: 2026-03-05

## Summary
Implemented the Manual Attendance feature allowing admins to create attendance records for employees who forgot to clock in/out or had technical issues.

## Changes Made

### 1. Database Schema (`prisma/schema.prisma`)
- Added `isManual` (Boolean, default: false) field to Attendance model
- Added `manualBy` (String, optional) field to Attendance model - stores admin user ID who created it
- Changed `latitude` and `longitude` to have `@default(0)` for manual entries
- Updated status comment to include `PULANG_CEPAT`
- Ran `bun run db:push` to apply changes

### 2. API Route (`src/app/api/attendance/manual/route.ts`)
- POST endpoint for creating manual attendance records
- Admin-only access (checks `authUser.role === 'ADMIN'`)
- Validates required fields: userId, type, date, time, status
- Validates type must be MASUK or PULANG
- Validates status against allowed values
- Verifies employee exists in database
- Creates Jakarta-timezone-aware timestamp from date+time inputs
- Checks for existing real attendance (non-manual) on same date/type to prevent duplicates
- Marks record with `isManual: true` and `manualBy: adminUserId`
- Bypasses GPS and face verification (latitude/longitude/confidence all 0)

### 3. Types (`src/types/index.ts`)
- Added `isManual: boolean` to Attendance interface
- Added `manualBy: string | null` to Attendance interface

### 4. Manual Attendance Dialog Component (`src/components/admin/manual-attendance-dialog.tsx`)
- Full dialog component with searchable employee selector
- Employee search with debounced API calls (300ms)
- Selected employee display with avatar and details
- Attendance type selector (MASUK/PULANG)
- Status selector (HADIR, TELAT, IZIN, CUTI, ALPHA, DINAS)
- Date picker (defaults to today)
- Time picker (defaults to 08:00)
- Optional note/reason field
- Info banner explaining manual entries bypass GPS/face verification
- Loading states and validation
- Toast notifications for success/error
- Form reset on dialog close
- `onSuccess` callback for refreshing parent data

### 5. Attendance Monitoring Page (`src/components/admin/attendance-monitoring.tsx`)
- Added "Absensi Manual" button with PenLine icon in header area
- Added ManualAttendanceDialog component
- Added "Manual" badge indicator to:
  - Attendance detail dialog title
  - Desktop table status column
  - Mobile card view
- Manual badge uses teal color scheme to distinguish from regular entries
- Dialog's `onSuccess` triggers `fetchAttendances` to refresh data

### 6. Admin Dashboard (`src/components/admin/admin-dashboard.tsx`)
- Added "Absensi Manual" as first quick action button with teal color scheme
- Updated grid from 4 columns to 5 columns (sm:grid-cols-5)
- Added ManualAttendanceDialog component
- Dialog's `onSuccess` triggers `fetchData` to refresh dashboard

## Visual Design
- Manual entries are distinctly marked with teal "Manual" badges
- Dialog follows existing blue/teal design system
- Consistent with shadcn/ui component styling
- Responsive design for mobile and desktop

## Verification
- Lint: Passed with no errors
- Build: Successful compilation, `/api/attendance/manual` route visible in build output
- Database: Schema pushed successfully with new fields
