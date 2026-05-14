---
Task ID: 2
Agent: Main Agent
Task: Add 4 new admin features: CRUD Dinas/Cuti/Izin Manual, CRUD Lokasi Kantor, CRUD Jam Kerja (Security/Jaga Malam/Driver/CS), Laporan Pegawai per-individu tgl 1-31

Work Log:
- Updated Prisma schema: added Office model (multiple office locations), WorkShift model (shift types), added shiftId to User and Attendance, added DINAS type + isManualEntry to LeaveRequest
- Created /api/offices route (GET/POST/PUT/DELETE) for CRUD lokasi kantor
- Created /api/shifts route (GET/POST/PUT/DELETE) for CRUD jam kerja with _count.users
- Updated /api/leaves route: added DINAS type, manual entry by admin (auto-APPROVED), edit/delete support
- Created /api/employee-report route: individual attendance recap tgl 1-31 with MASUK+PULANG times, leave integration, summary stats
- Updated types/index.ts: added Office, WorkShift, EmployeeDailyRecord, EmployeeReportData types; updated LeaveType with DINAS; added new AppViews
- Updated sidebar: added Lokasi Kantor, Jam Kerja, Laporan Pegawai menu items with icons
- Updated header: added view titles for new pages
- Updated page.tsx: added routing for admin-offices, admin-shifts, admin-employee-report
- Created OfficeManagement component: full CRUD with SVG map preview, responsive table/cards
- Created ShiftManagement component: card-based layout, shift templates (Reguler/Security/Jaga Malam/Driver/CS), color presets, day toggles
- Updated LeaveManagement component: added manual entry dialog, DINAS type, edit/delete, "Manual" badge
- Created EmployeeReport component: employee selector, month/year, daily table 1-31 with MASUK+PULANG, summary stats, weekend styling
- Seeded database: 5 work shifts, 2 office locations
- All linting passes clean

Stage Summary:
- 4 new features fully implemented for admin role
- Database schema extended with Office, WorkShift models
- 5 new API routes created, 1 updated
- 4 new/updated UI components
- Data seeded: Reguler/Security/Jaga Malam/Driver/CS shifts, 2 office locations
