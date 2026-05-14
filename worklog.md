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

---
Task ID: 1
Agent: full-stack-developer
Task: Add Jam Kerja selector to Employee Management

Work Log:
- Added `shiftId: string` field to `EmployeeFormData` interface and `emptyForm` default
- Imported `WorkShift` type from `@/types` and `Clock` icon from `lucide-react`
- Added `shifts` state (`WorkShift[]`) and `useEffect` to load shifts from `/api/shifts?includeUsers=true` when dialog opens
- Updated `handleOpenEdit` to set `shiftId` from `user.shiftId`
- Updated `handleSubmit` to include `shiftId` in both PUT (update) and POST (create) payloads, sending `null` if empty
- Added "Jam Kerja" column header between Jabatan and Role in desktop table
- Added "Jam Kerja" table cell with Badge display (violet theme with Clock icon) for shift name, or "-" if no shift assigned
- Updated colSpan from 10 to 11 for the empty-state table row
- Added shift name display in mobile EmployeeCard (violet Badge with Clock icon showing name + time range)
- Added "Jam Kerja" dropdown selector in Add/Edit dialog using shadcn/ui Select component, with "Tanpa Jam Kerja" (no shift) option and shift entries showing name + time range
- Updated API `/api/users` POST handler to accept `shiftId` and store it in the database
- Updated API `/api/users` PUT handler to accept `shiftId` and properly handle null/empty values
- Updated API PUT response to include `shiftId` and `shift` relation data in the select

Stage Summary:
- Employee Management now fully supports Jam Kerja (Work Shift) assignment
- Shift selector loads dynamically when dialog opens, pre-selects current shift on edit
- Shift name displayed in both desktop table and mobile card views
- API properly persists shiftId on both create and update operations
- Lint passes with no errors

---
Task ID: 2
Agent: duplicate-face-prevention
Task: Prevent same face from registering with different accounts

Work Log:
- Added `calculateEuclideanDistance` helper function and `MATCH_THRESHOLD` constant (0.6) to `/src/app/api/users/face/route.ts`
- Added duplicate face check in PUT handler: before saving a face descriptor, fetches all other users with face descriptors and computes Euclidean distance against the new descriptor
- If distance < 0.6, rejects registration with 400 error: "Wajah ini sudah terdaftar pada akun lain ({existingUser.nama}). Satu wajah hanya boleh didaftarkan pada satu akun."
- Verified frontend (`face-register.tsx`) already handles the 400 error response correctly: the `handleRegister` function checks `response.ok`, parses error message from JSON, and displays it via `setApiError` in the red Alert component
- Lint passes with no errors

Stage Summary:
- Backend now prevents the same face from being registered on multiple accounts using Euclidean distance comparison (threshold: 0.6)
- Error message clearly identifies which existing account already has the face registered
- No frontend changes needed — existing error handling displays the backend error message properly

---
Task IDs: 3, 4, 5, 6, 7
Agent: pagination-agent
Task: Add pagination to all modules that don't have it yet

Work Log:
- **Leave Management (Task 3)**:
  - Updated `/api/leaves` GET route to accept `page` and `limit` query params (default: page=1, limit=20), added skip/take pagination and count, returns `{ leaves, total, page, totalPages }`
  - Updated `leave-management.tsx`: added `page`, `totalPages`, `total` state; updated `fetchLeaves` to send page/limit params; added `useEffect` to reset page when `activeTab` changes; added `ChevronLeft`/`ChevronRight` imports; added pagination controls after the main tabs content (only shown when `totalPages > 1`)
- **Leave Type Management (Task 4)**:
  - Updated `/api/leave-types` GET route signature from `GET()` to `GET(request: NextRequest)`, added page/limit/skip/take pagination and count, returns `{ leaveTypes, total, page, totalPages }`
  - Updated `leave-type-management.tsx`: added `page`, `totalPages`, `total` state and `limit` constant; updated `fetchLeaveTypes` to send page/limit params and read pagination response; added `ChevronLeft`/`ChevronRight` imports; added pagination controls after mobile cards section
- **Office Management (Task 5)**:
  - Updated `/api/offices` GET route signature from `GET()` to `GET(request: NextRequest)`, added page/limit/skip/take pagination and count, returns `{ offices, total, page, totalPages }`
  - Updated `office-management.tsx`: added `page`, `totalPages`, `total` state and `limit` constant; updated `fetchOffices` to send page/limit params; added `ChevronLeft`/`ChevronRight` imports; added pagination controls after mobile cards section
- **Shift Management (Task 6)**:
  - Updated `/api/shifts` GET route to accept page/limit params, added skip/take pagination with `Promise.all([findMany, count])`, returns `{ shifts, total, page, totalPages }`
  - Updated `shift-management.tsx`: added `page`, `totalPages`, `total` state and `limit` constant; updated `fetchShifts` to build params with includeUsers, page, limit; added `ChevronLeft`/`ChevronRight` imports; added pagination controls after shift cards grid
- **Employee Monitoring (Task 7)**:
  - Updated `/api/attendance/monitor` GET route signature from `GET()` to `GET(request: NextRequest)`, added page/limit/skip to the employee query with `Promise.all([findMany, count])`, updated summary.total to use empTotal (all employees count), returns `{ employees, date, summary, page, totalPages, total }`
  - Updated `employee-monitoring.tsx`: added `page`, `totalPages`, `total` state and `limit` constant; updated `fetchData` to send page/limit params and read pagination response; added `ChevronLeft`/`ChevronRight` imports; added pagination controls before the total indicator card; updated total indicator to use `total` state instead of `summary.total`

Stage Summary:
- All 5 modules now have server-side pagination with consistent UI pattern (Halaman X dari Y (Z data) + Sebelumnya/Selanjutnya buttons)
- All API routes preserve backward compatibility (page/limit default to 1/20, existing data key names preserved)
- Pagination controls only appear when totalPages > 1
- Lint passes with no errors

---
Task ID: 1
Agent: fix-monitor-date-map-dialog
Task: Fix Invalid Date on Pegawai Monitor + Add latitude/longitude to API + Add clickable card with Map dialog

Work Log:
- Fixed Monitor API `formatTime` function to return ISO date strings (`date.toISOString()`) instead of HH:MM:SS time-only strings, which caused "Invalid Date" on the frontend when parsed with `new Date()`
- Added `latitude` and `longitude` fields to the attendance query select in the monitor API
- Updated `attendanceByUser` Map type to include `latitude: number; longitude: number` alongside `createdAt` and `status`
- Added `masukLat`, `masukLng`, `pulangLat`, `pulangLng` fields to the employee response object
- Updated `EmployeeMonitorEntry` TypeScript interface with `masukLat`, `masukLng`, `pulangLat`, `pulangLng` (all `number | null`)
- Updated `employee-monitoring.tsx`:
  - Added `MapPin`, `Navigation` to lucide-react imports
  - Added `Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription` imports from `@/components/ui/dialog`
  - Added `selectedEmployee` state (`useState<EmployeeMonitorEntry | null>(null)`)
  - Made `EmployeeCard` accept `onClick` prop, added `cursor-pointer` class and `onClick` handler
  - Made desktop table rows clickable with `cursor-pointer` class and `onClick={() => setSelectedEmployee(emp)}`
  - Added Dialog component showing employee details with:
    - Employee info (avatar, name, NIP, status badge)
    - Absen Masuk section with time, coordinates, and Google Maps link
    - Absen Pulang section with time, coordinates, and Google Maps link
    - OpenStreetMap embedded iframe preview of the latest location
- Fixed generic type parsing issue: `Map<string, Map<string, { ... }>>()` → `Map<string, Map<string, { ... }> >()` to avoid `>>` being parsed as right-shift operator
- Fixed missing closing brace in mobile cards map: `))` → `))}`
- All lint checks pass with no errors
- Dev server compiles and runs without errors

Stage Summary:
- Invalid Date issue fixed by returning ISO strings from API instead of time-only strings
- Latitude/longitude data now exposed in monitor API response and TypeScript types
- Employee cards and table rows are clickable, opening a Dialog with attendance location details
- Dialog shows Google Maps links and embedded OpenStreetMap preview
- Lint passes with no errors

---
Task ID: 2
Agent: ui-cleanup-agent
Task: Clean up sidebar, add scrollbar styling, fix Laporan Pegawai, and general UI cleanup

Work Log:
- Reorganized admin sidebar navigation into 4 logical groups with SidebarGroup/SidebarGroupLabel and SidebarSeparator: "Utama" (Dashboard), "Manajemen" (Kelola Pegawai, Monitoring Absensi, Izin/Cuti/Dinas, Tipe Cuti/Izin), "Laporan" (Laporan, Laporan Pegawai), "Pengaturan" (Lokasi Kantor, Jam Kerja, Pengaturan)
- Removed "Baru" badge from "Izin / Cuti / Dinas" sidebar item
- Removed `border-r-0` className from Sidebar component to restore visual border separator
- Added `ScrollArea` wrapper inside `SidebarContent` for overflow handling when many nav items exist
- Extracted `NavItemRenderer` component to reduce duplication in sidebar rendering
- Employee sidebar kept as single group "Menu Pegawai" (no changes needed)
- Added CSS rules to globals.css: smooth scrolling (`html { scroll-behavior: smooth }`), dark mode scrollbar styling (`.dark ::-webkit-scrollbar-thumb`), Firefox thin scrollbar (`scrollbar-width: thin`, `scrollbar-color`)
- Fixed Laporan Pegawai API date comparison: replaced `aDate >= date && aDate < nextDate` with `aDate.getFullYear() === year && aDate.getMonth() === month - 1 && aDate.getDate() === day` to avoid UTC/local timezone mismatch
- Fixed leave date comparison: created `dateToCheck = new Date(year, month - 1, day)` consistently for both `onLeave` check and `leave.find` to avoid using the `date` variable which was also used for dayName/isWeekend
- Removed unused `nextDate` variable from the employee report route
- Fixed time formatting: replaced `toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })` with consistent `HH:MM` format using `d.getHours()` and `d.getMinutes()` with padStart, avoiding locale-dependent output
- Verified all admin module ScrollArea components have consistent max-height and overflow handling
- Lint passes with no errors, dev server compiles without errors

Stage Summary:
- Sidebar now has organized groups (Utama/Manajemen/Laporan/Pengaturan) with separators and ScrollArea
- Scrollbar styling works consistently across light/dark modes and browsers (Chrome + Firefox)
- Laporan Pegawai API now correctly handles timezone-safe date comparisons and consistent time formatting
- No visual regressions; all existing ScrollArea components verified as consistent

---
Task ID: 3
Agent: Main
Task: Fix Invalid Date, Add Map Dialog, Clean up Sidebar, Fix Reports, Add Scrollbar Styling

Work Log:
- Fixed Invalid Date on Pegawai Monitor by changing API formatTime to return ISO strings instead of HH:MM:SS
- Added latitude/longitude fields to monitor API response (masukLat, masukLng, pulangLat, pulangLng)
- Updated EmployeeMonitorEntry TypeScript type with lat/lng fields
- Added clickable employee cards/table rows on Pegawai Monitor
- Added Map Dialog with OpenStreetMap iframe preview and Google Maps links for both Masuk and Pulang locations
- Reorganized sidebar into 4 logical groups: Utama, Manajemen, Laporan, Pengaturan
- Removed "Baru" badge from sidebar, removed border-r-0, added ScrollArea for overflow
- Added smooth scrolling, dark mode scrollbar, and Firefox scrollbar support to globals.css
- Fixed Laporan Pegawai API date comparison using getFullYear/getMonth/getDate instead of UTC-unsafe comparison
- Fixed time formatting in employee report to use consistent HH:MM format
- All changes pass lint with no errors

Stage Summary:
- Invalid Date issue fixed - API now returns ISO date strings that parse correctly
- Map dialog works on employee monitor with OpenStreetMap iframe + Google Maps links
- Sidebar is now organized with logical groupings
- Scrollbar styling improved for all browsers
- Employee report date handling is timezone-safe

---
Task ID: 1
Agent: Main
Task: Fix face recognition attendance bug - unregistered face can check in, Fix Monitor Total position, Add Admin Pagination

Work Log:
- **Face Recognition Fix (Critical Bug)**:
  - Root cause: CameraView component auto-verified any detected face when no `storedFaceDescriptor` existed (lines 211-231), setting `isVerified: true` with 0.75 confidence
  - Fixed CameraView: When no `storedFaceDescriptor`, immediately rejects with "Data wajah belum terdaftar" error instead of auto-verifying
  - Updated CameraView header subtitle: Shows "⚠️ Daftarkan wajah Anda di Profil terlebih dahulu" when no descriptor
  - Fixed server-side `/api/attendance` POST: Changed `faceVerified === false` check to `faceVerified !== true` (strict equality) - now requires explicit `true`
  - Added server-side validation: If `faceVerified === true` but user has no `faceDescriptor`, request is rejected with 400 error
  - Updated EmployeeDashboard: Attendance buttons (Masuk/Pulang) now disabled when face not registered, showing "Daftarkan Wajah Dahulu" text
  - Added toast error when trying to open attendance dialog without face registration
- **Monitor Kehadiran Total Position**:
  - Changed Total Pegawai card from static to `sticky bottom-0 z-10`
  - Upgraded card style: `bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl` with top shadow for visual separation
  - Now stays at bottom of viewport while scrolling through employee list
- **Admin Pagination**:
  - Leave Management: Added server-side pagination with page/limit params, tab-aware status filtering, Previous/Next buttons
  - Reports: Added client-side pagination (reportPage, reportLimit=20) with paginatedSummaries slice, Previous/Next buttons, auto-reset on sort/filter change

Stage Summary:
- Face recognition now correctly rejects unregistered faces both client-side and server-side
- Attendance buttons disabled until face is registered, with clear visual feedback
- Monitor Total indicator now sticky at bottom of viewport
- Admin Leave Management and Reports both have pagination (20 items per page)
- All lint checks pass, dev server compiles without errors
---
Task ID: 1
Agent: Main
Task: Add pagination to Admin Kelola Pegawai, Admin Monitoring Absensi, and fix Pegawai Monitor Total Pegawai positioning

Work Log:
- Created reusable DataPagination component at `/src/components/shared/data-pagination.tsx` with page numbers, per-page selector (10/20/50/100), first/last page buttons, and compact mode
- Updated Admin Kelola Pegawai (`employee-management.tsx`): replaced basic prev/next pagination with DataPagination component, changed limit from constant 20 to state 10 with per-page selector, added limit to fetchUsers callback dependencies
- Updated Admin Monitoring Absensi (`attendance-monitoring.tsx`): replaced basic prev/next pagination with DataPagination component, changed limit from constant 20 to state 10 with per-page selector, added limit to fetchAttendances callback dependencies
- Fixed Pegawai Monitor (`employee-monitoring.tsx`):
  - Changed Total Pegawai from `sticky bottom-0` to `fixed bottom-14 md:bottom-0` so it's always at the absolute bottom of the viewport (above mobile navbar on mobile)
  - Added proper padding (pb-16 md:pb-14) to main content area so content doesn't get hidden behind the fixed bar
  - Replaced basic pagination with DataPagination component (compact mode)
  - Changed limit from constant 20 to state 10 with per-page selector
  - Added limit to fetchData callback dependencies
  - Made Izin/Cuti indicator hidden on very small screens (hidden sm:flex) to prevent overflow
  - Increased card opacity to bg-white/95 for better readability over content

Stage Summary:
- All three modules now have professional pagination with page number buttons, per-page selector, and first/last page navigation
- Pegawai Monitor Total Pegawai bar is now fixed at the bottom of the viewport, not floating in the middle of the list
- Default items per page changed from 20 to 10 for better usability
- All lint checks pass, dev server compiles without errors
