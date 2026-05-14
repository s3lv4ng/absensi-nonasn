---
Task ID: 1
Agent: Main
Task: Add Tipe Cuti/Izin, Employee Monitoring, and Face Registration Once-Only

Work Log:
- Updated Prisma schema: added LeaveTypeCategory model (name, code, description, color, isActive) and faceRegisteredAt field to User
- Ran `bun run db:push` to sync database
- Created `/api/leave-types` API route with full CRUD (GET, POST, PUT, DELETE) for LeaveTypeCategory
- Created `/api/attendance/monitor` API route that returns today's attendance/leave status for ALL employees
- Updated `/api/users/face` PUT endpoint to enforce once-only face registration (non-admin gets 400 if already registered)
- Updated `/api/users/face` DELETE endpoint to also clear faceRegisteredAt on admin reset
- Updated TypeScript types: added LeaveTypeCategory, EmployeeMonitorEntry interfaces, added 'employee-monitoring' and 'admin-leave-types' to AppView, added faceRegisteredAt to User
- Created LeaveTypeManagement admin component with full CRUD for custom leave types
- Created EmployeeMonitoring employee component showing all colleagues' attendance/leave status with auto-refresh
- Updated LeaveSubmission employee component to support dynamic leave types from API (default + custom)
- Updated LeaveManagement admin component to use string-based type functions for custom type support
- Updated Profile component: if face already registered, shows info message that admin must reset; only shows "Daftarkan Wajah" button if not registered
- Updated ViewRenderer in page.tsx to include new views
- Updated sidebar with 'Tipe Cuti/Izin' (admin) and 'Monitor Kehadiran' (employee) nav items
- Updated mobile navbar with 'Monitor' item for employees
- All code passes lint check and compiles successfully

Stage Summary:
- 3 major features implemented: (1) Custom Leave Type CRUD, (2) Employee Monitoring of colleagues, (3) Once-only face registration with admin reset
- Key files created: leave-type-management.tsx, employee-monitoring.tsx, /api/leave-types/route.ts, /api/attendance/monitor/route.ts
- Key files modified: schema.prisma, face/route.ts, profile.tsx, leave-submission.tsx, leave-management.tsx, page.tsx, sidebar.tsx, mobile-navbar.tsx, types/index.ts

---
Task ID: 5
Agent: fix-employee-monitor-sorting
Task: Fix employee monitor sorting to show earliest attendance first, belum absen last

Work Log:
- Read employee-monitoring.tsx
- Added sorting logic after filter: HADIR/TELAT by time asc → leave types → BELUM_ABSEN by name
- Replaced filteredEmployees with sortedEmployees in desktop table and mobile cards

Stage Summary:
- Employee monitor now sorts by attendance time instead of alphabetically
- Earliest attendees shown at top, belum absen at bottom

---
Task ID: 6
Agent: add-employee-leave-upload
Task: Add file upload (bukti dukung) to employee leave submission

Work Log:
- Read leave-submission.tsx
- Added file upload state variables (formAttachment, formAttachmentName)
- Added handleFileSelect with file size (5MB) and type validation (JPG, PNG, PDF, DOC/DOCX)
- Added removeAttachment function to clear attachment
- Added uploadFile function to POST file to /api/upload and return URL
- Modified handleSubmit to upload file before submitting leave request, include attachment URL in request body
- Added file upload UI in new leave dialog (after Reason textarea, before info note) with styled upload area and remove button
- Added attachment display in expanded leave card with Paperclip icon and "Lihat Bukti Dukung" link
- Reset attachment state on form reset after successful submission
- Added Upload, Paperclip, X to lucide-react imports
- Lint passes with no errors

Stage Summary:
- Employees can now upload supporting documents when submitting leave requests
- Attachments are displayed in the expanded leave card details
- File validation enforces 5MB max size and supported formats

---
Task ID: 7
Agent: main
Task: Fix Admin leave Tipe dropdown, integrate Tipe Cuti/Izin tab, add upload bukti dukung, fix employee monitor sorting

Work Log:
- Added `attachment` field to LeaveRequest Prisma schema
- Created `/api/upload` route for file uploads (supports JPG, PNG, PDF, DOC/DOCX, max 5MB)
- Created `/public/uploads/leaves` directory
- Updated leaves API to handle attachment field in POST and PUT
- Updated LeaveRequest type in types/index.ts to include attachment field
- Fixed Admin AddManualDialog: now fetches leave types from /api/leave-types and shows custom types in dropdown
- Fixed Admin EditDialog: now fetches leave types from /api/leave-types and shows custom types in dropdown
- Added upload bukti dukung to both AddManualDialog and EditDialog in admin
- Added attachment display in LeaveDetailDialog
- Integrated LeaveTypeManagement as a tab inside LeaveManagement (Pengajuan | Tipe Cuti/Izin tabs)
- Employee Monitor: sorted by attendance time (HADIR/TELAT first by time asc, leave types middle, BELUM_ABSEN bottom)
- Employee Leave Submission: added upload bukti dukung and attachment display
- All lint checks pass

Stage Summary:
- Admin Manajemen Cuti Tipe dropdown now fetches from /api/leave-types API (shows default + custom types)
- Tipe Cuti/Izin module integrated as tab inside Manajemen Izin/Cuti/Dinas
- Upload bukti dukung available in admin (Add Manual & Edit) and employee (Pengajuan) dialogs
- Employee monitor sorts by attendance time (earliest top, belum absen bottom)
