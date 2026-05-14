# Worklog - Attendance Application

---
Task ID: 1
Agent: Main
Task: Fix camera not displaying (black screen) in Pegawai attendance

Work Log:
- Identified root cause: `<video>` element was conditionally rendered based on `isActive` state, but `startCamera()` tried to set `srcObject` and call `play()` before `isActive` was set to `true`, so `videoRef.current` was `null`
- Fixed `useCamera` hook: Added `pendingStreamRef` to store stream, added useEffect to attach stream when `isActive` changes, added better error handling for NotAllowedError/NotFoundError, added cleanup of existing streams before starting new one
- Fixed `CameraView` component: Changed from conditional rendering to always-render-with-visibility-control (using `hidden` class instead of `{isActive && ...}`), added `autoPlay` attribute to video element

Stage Summary:
- Camera should now display properly because the video element is always in the DOM when the component mounts
- Stream is attached either immediately (if video element exists) or via useEffect when `isActive` changes

---
Task ID: 2
Agent: Subagent (full-stack-developer)
Task: Add API endpoints for employee shift assignment

Work Log:
- Updated `GET /api/shifts` to support `includeUsers=true` query param
- Created `POST/DELETE /api/shifts/assign` for assigning/unassigning employees to shifts
- Created `GET /api/shifts/[id]/users` for getting users assigned to a specific shift
- Updated `GET /api/users` to include `shiftId` and `shift` relation

Stage Summary:
- All shift employee assignment APIs are functional
- Admin-only access required for all endpoints

---
Task ID: 3
Agent: Subagent (full-stack-developer)
Task: Add employee assignment UI to shift management

Work Log:
- Added `users?: User[]` to WorkShift type
- Added "Pegawai" button on each ShiftCard with UserPlus icon
- Created EmployeeAssignmentDialog component with two-tab interface
- Updated fetchShifts to pass `includeUsers=true`

Stage Summary:
- Admin can now manage employee assignments to shifts via dialog
- Two-tab UI: "Ditugaskan" (assigned) and "Tambah Pegawai" (add)
- Search functionality for finding available employees

---
Task ID: 4
Agent: Main
Task: Update employee dashboard with auto-validate GPS and auto-select office

Work Log:
- Updated LocationValidator component: Added `autoValidate` prop that triggers GPS validation on mount
- Updated EmployeeDashboard: Single office auto-selects with "Otomatis" badge, multiple offices show dropdown
- When office selection changes, LocationValidator remounts with new key for auto-validation
- Updated attendance API to use user's assigned WorkShift for late determination instead of OfficeSetting

Stage Summary:
- When only 1 office exists: auto-selects, auto-validates GPS
- When multiple offices: dropdown selector, GPS validates after selection
- Attendance now respects user's assigned shift for late tolerance and start time
