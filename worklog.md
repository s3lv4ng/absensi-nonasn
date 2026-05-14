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
