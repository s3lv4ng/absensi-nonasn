# Task: Admin Components for Attendance App

## Summary

Created two production-quality admin components with full CRUD, glassmorphism design, framer-motion animations, and sonner toast notifications.

## Files Created/Updated

### 1. `/home/z/my-project/src/components/admin/leave-management.tsx`
- **Title**: "Manajemen Izin / Cuti / Dinas" with ClipboardCheck icon
- **Tambah Manual Dialog**: Full form with Pegawai select (fetched from `/api/users?role=PEGAWAI`), Tipe (IZIN|CUTI|SAKIT|DINAS), Tanggal Mulai/Selesai, Alasan textarea, auto-APPROVED status
- **Leave Table**: Shows all leaves with DINAS purple badge, "Manual" badge for `isManualEntry=true`, Edit (Pencil) and Delete (Trash) buttons for all entries
- **Edit Dialog**: PUT `/api/leaves` with { id, type, startDate, endDate, reason } — shows employee info (read-only), editable type/dates/reason
- **Delete Confirmation**: DELETE `/api/leaves?id=xxx` with AlertDialog confirmation
- **Existing features preserved**: Tabs (Menunggu/Disetujui/Ditolak/Semua), Detail dialog, Approve/Reject for PENDING entries
- **API integration**: POST /api/leaves (manual add), PUT /api/leaves (approve/reject/edit), DELETE /api/leaves

### 2. `/home/z/my-project/src/components/admin/employee-report.tsx`
- **Title**: "Laporan Pegawai" with UserCheck icon
- **Employee Selector**: Select dropdown fetched from `/api/users?role=PEGAWAI`
- **Month/Year Selector**: Same style as AdminReports component
- **"Tampilkan" Button**: Fetches from GET `/api/employee-report?userId=xxx&month=xx&year=xxxx`
- **Employee Info Card**: Shows Nama, NIP, Unit Kerja, Jabatan, Shift
- **Summary Stat Cards**: Hadir (green), Telat (amber), Izin (blue), Cuti (emerald), Sakit (red), Alpha (red), Libur (gray)
- **Daily Table (tgl 1-31)**: Columns for Tanggal, Hari, Absen Masuk, Absen Pulang, Status
- **Status badges**: HADIR=green, TELAT=amber, IZIN=blue, CUTI=emerald, SAKIT=red, ALPHA=red, DINAS=purple, LIBUR=gray
- **Weekend rows**: Visually different (lighter bg, italic text)
- **Empty state**: Shown when no employee selected yet
- **Loading states**: Skeleton for initial load, spinner for report fetch

## Design
- Blue color scheme (#1e40af, #2563eb)
- Glassmorphism cards (backdrop-blur, semi-transparent backgrounds)
- Framer-motion animations (container stagger, item spring, table row slide)
- Sonner toast notifications
- shadcn/ui components throughout
- Responsive layout (mobile-first)

## Lint & Dev Server
- ESLint passes cleanly
- Dev server compiles without errors
