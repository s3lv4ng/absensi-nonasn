# Task 1: Fix Attendance Counting Logic

## Agent: attendance-logic-fix

## Summary
Implemented the rule: **Both Absen Masuk (check-in) AND Absen Pulang (check-out) must be recorded to count as 1 day hadir. If only masuk without pulang (or vice versa), it's NOT counted as hadir, UNLESS the admin entered it manually.**

## Files Modified

### 1. `/home/z/my-project/src/app/api/rekap-absen/route.ts`
- Added `isManual` to MASUK and PULANG attendance query selects
- Extended `AttendanceInfo` type with `isManualMasuk` and `isManualPulang` fields
- Updated attendance map building to track isManual flags
- Added TIDAK_LENGKAP status logic in employee row building:
  - Both masuk+pulang → HADIR/TELAT (as before)
  - Only masuk, not manual → TIDAK_LENGKAP
  - Only masuk, manual → HADIR/TELAT (admin override)
  - Only pulang, not manual → TIDAK_LENGKAP
  - Only pulang, manual → HADIR (admin override)
- Added `isManualMasuk?` and `isManualPulang?` to day data output

### 2. `/home/z/my-project/src/app/api/reports/route.ts`
- Added `isManual` and `shiftId` to MASUK attendance query select
- Added `isManual` to PULANG attendance query select
- Added `getShiftDate` import from timezone utils
- Built `pulangDayMap` (userId_day → isManualPulang) from PULANG attendances using getShiftDate
- Changed hadir counting logic: only increments hadir when both MASUK and PULANG exist for the same day, OR when MASUK is manual
- If only MASUK exists (non-manual), it's NOT counted as hadir (will be alpha via deficit calculation)

### 3. `/home/z/my-project/src/components/admin/rekap-absen.tsx`
- Added `isManualMasuk?` and `isManualPulang?` to `DayData` interface
- Added TIDAK_LENGKAP handling in `StatusCell` component with orange styling and "½" symbol
- Added TIDAK_LENGKAP entry to statusDisplay map (fallback)
- Added legend entry: "½ = Tidak Lengkap (Tidak Hadir)"
- Updated print handler: added `.status-tl` CSS class, TIDAK_LENGKAP cell rendering, and print legend entry
- Made DL, DD, Sakit columns always visible on mobile (removed `hidden sm:table-cell` / `hidden md:table-cell`)

## What Was NOT Changed
- Monitor API (`/api/attendance/monitor/route.ts`) was intentionally not modified - real-time view still shows HADIR/TELAT for people who clocked in but haven't clocked out yet
