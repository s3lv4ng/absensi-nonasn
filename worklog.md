---
Task ID: 1
Agent: Main Agent
Task: Add features to Admin Monitoring Absensi: Date range filter, Name filter, Edit/Delete with bukti dukung upload, Admin penanda markers

Work Log:
- Updated Prisma schema: added `buktiDukung`, `editedBy`, `editedAt`, `editReason`, `isDeleted`, `deletedBy`, `deletedAt` fields to Attendance model
- Ran `db:push` to apply schema changes successfully
- Updated TypeScript types in `src/types/index.ts` with new Attendance fields + `editedByUser`, `deletedByUser`, `manualByUser` relations
- Created `src/app/api/attendance/[id]/route.ts` with PATCH (edit with bukti dukung), DELETE (soft delete), and GET (single detail with admin names)
- Updated `src/app/api/attendance/route.ts` GET handler: added `searchName` filter, `showDeleted` toggle, `isDeleted: false` default filter, admin name resolution
- Completely rewrote `src/components/admin/attendance-monitoring.tsx` with:
  - Date range filter (startDate to endDate, default current month 1-31)
  - Employee name search filter
  - Edit dialog with bukti dukung upload, edit reason (required), status/type/note editing
  - Delete confirmation dialog (soft delete with admin tracking)
  - Admin marker badges: "Manual by [name]", "Diedit by [name]", "Dihapus by [name]", "Bukti"
  - Show/Hide deleted records toggle
  - Updated table with "Penanda" column and "Aksi" column (edit/delete buttons)
- Updated `src/components/admin/manual-attendance-dialog.tsx`: added bukti dukung upload with preview
- Updated `src/app/api/attendance/manual/route.ts`: added buktiDukung support with image compression
- All images (bukti dukung) are compressed before storing using compressBase64Image (640x480, quality 60)
- Lint passes cleanly, dev server running

Stage Summary:
- Complete feature set implemented for Monitoring Absensi admin role
- Date range filter: default current month (1-31), customizable
- Name filter: search by employee name with clear button
- Edit: change status/type/note with required edit reason + optional bukti dukung upload
- Delete: soft delete with admin tracking, can be toggled visible/hidden
- Admin markers: visible badges showing who edited/deleted/added attendance, with bukti dukung indicator
- All images compressed for database efficiency
