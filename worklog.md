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
