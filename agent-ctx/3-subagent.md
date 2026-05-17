---
Task ID: 3
Agent: Subagent
Task: Update shift management admin component to add employee assignment functionality

Work Log:
- Updated types/index.ts: Added `users?: User[]` field to `WorkShift` interface (included when `includeUsers=true` query param is passed)
- Updated /api/shifts GET route: Added `role`, `shiftId`, `createdAt`, `updatedAt` fields to the users select when `includeUsers=true` is passed, so the returned user objects match the full `User` type
- Created /api/shifts/[id]/users/route.ts: New GET endpoint that returns all users assigned to a specific shift, with admin-only access, using Next.js 16 async params pattern
- Confirmed /api/shifts/assign/route.ts already existed with POST (assign) and DELETE (unassign) endpoints working correctly
- Confirmed /api/users GET already includes `shiftId` and `shift` relation in response
- Rewrote shift-management.tsx with the following changes:
  - Added new imports: `UserPlus`, `UserMinus`, `Search`, `X` from lucide-react; `User` type from types
  - Updated `ShiftCard` component: Added `onManageEmployees` prop and a green "Pegawai" button with UserPlus icon next to the existing Edit and Delete buttons
  - Created `EmployeeAssignmentDialog` component with:
    - Two-tab interface: "Ditugaskan" (assigned) and "Tambah Pegawai" (add employees)
    - Assigned tab: Shows list of currently assigned employees with avatar (shift color initial), name, NIP, unit; hover reveals remove button (UserMinus icon)
    - Available tab: Search bar to find unassigned PEGAWAI employees; shows list with assign button; indicates if employee is already on another shift
    - Fetches from GET /api/shifts/[id]/users for assigned users
    - Fetches from GET /api/users?role=PEGAWAI&search=... for available users
    - Assigns via POST /api/shifts/assign with { shiftId, userIds: [id] }
    - Unassigns via DELETE /api/shifts/assign with { userIds: [id] }
    - Loading skeletons, empty states, animated tab transitions with framer-motion
    - Footer shows shift name/color/times and "Selesai" button
  - Updated `ShiftManagement` main component: Added employee dialog state, `handleManageEmployees` handler, passes `onManageEmployees` to ShiftCard, renders EmployeeAssignmentDialog
  - Updated `fetchShifts` to pass `includeUsers=true` query param
- All linting passes clean

Stage Summary:
- Employee assignment functionality fully implemented in shift management
- 1 new API route created (shifts/[id]/users)
- 1 existing API route updated (shifts GET - added more fields to users select)
- 1 type updated (WorkShift - added users field)
- 1 component significantly enhanced (shift-management.tsx)
- UI follows existing design patterns: glassmorphism, blue color scheme, framer-motion animations, Indonesian labels, mobile responsive
