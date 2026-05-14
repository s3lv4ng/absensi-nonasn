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

---
Task ID: 3
Agent: Main Agent
Task: Add Employee Leave Submission (Pengajuan Dinas/Cuti/Izin) for Pegawai role + Mobile Bottom Navbar for Smartphone/Android

Work Log:
- Added 'employee-leaves' to AppView type in types/index.ts
- Created LeaveSubmission component (src/components/employee/leave-submission.tsx): full form for IZIN/CUTI/SAKIT/DINAS with type selection cards, date range picker, reason textarea, stats cards, filter by status, expandable leave cards, cancel PENDING requests
- Created MobileNavbar component (src/components/layout/mobile-navbar.tsx): bottom navigation bar with 5 items (Home, Absensi, Pengajuan, Riwayat, Profil for Pegawai; Dashboard, Pegawai, Izin/Cuti, Laporan, Setting for Admin), glassmorphism design, active indicator, safe-area support for iPhone notch
- Updated sidebar: added "Pengajuan Izin/Cuti" menu item for Pegawai role
- Updated page.tsx: added employee-leaves routing with LeaveSubmission component
- Updated app-layout.tsx: integrated MobileNavbar, added bottom padding (pb-20) for mobile to avoid content hidden behind navbar, hidden desktop footer on mobile
- Updated header.tsx: added 'Pengajuan Izin/Cuti' view title for employee-leaves
- Updated /api/leaves DELETE handler: employees can now cancel their own PENDING requests (previously admin-only)
- All linting passes clean

Stage Summary:
- Employee role now has full leave submission capability (Dinas/Cuti/Izin/Sakit)
- Mobile bottom navbar added with responsive design (hidden on md+ screens)
- Leave API updated for employee self-service cancellation
- 2 new components created, 5 existing files updated

---
Task ID: 4
Agent: Main Agent
Task: Fix camera not showing + Add office location selector for employee attendance

Work Log:
- Fixed useCamera hook: replaced `stream` useState with `streamRef` useRef to avoid stale closure issue. `stopCamera` no longer depends on state, preventing the effect cleanup from immediately stopping the camera after startCamera
- Fixed CameraView cleanup useEffect: changed dependency from [stopCamera] to [] (unmount-only) to prevent camera from being stopped on re-render
- Updated EmployeeDashboard: replaced single OfficeSetting with multiple Office locations from /api/offices
- Added office location selector (Select component) in attendance dialog with office name, address, radius info
- Added step-0 in validation checklist: "Pilih Lokasi Kantor" before face/GPS verification
- LocationValidator only renders after office is selected (shows placeholder otherwise)
- Attendance POST API updated: accepts optional `officeId`, validates GPS against selected office, falls back to OfficeSetting if no officeId
- Updated /api/offices GET: admin sees all offices, employees see only active ones
- All linting passes clean

Stage Summary:
- Camera bug fixed (useRef for stream, unmount-only cleanup)
- Employee can now choose which office location to validate against
- Attendance API validates against selected office
- 5 files modified: useCamera hook, CameraView, EmployeeDashboard, attendance API, offices API
