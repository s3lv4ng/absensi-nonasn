# Task 6-7: Add Logo and Favicon Upload to Setup Wizard

## Summary
Added logo and favicon upload capabilities to the Setup Wizard, and updated the Setup API to handle logo/favicon paths.

## Changes Made

### 1. `/api/upload/route.ts`
- Added `db` import from `@/lib/db`
- Modified auth check to allow unauthenticated logo/favicon uploads during setup (when no admin exists)
- Non-auth users can only upload logo/favicon type, and only when no admin user exists in the system

### 2. `src/components/auth/setup-wizard.tsx`
- **Imports**: Added `useRef`, `Image as ImageIcon`, `Upload`
- **AppIdentityData**: Added `logoPath: string | null` and `faviconPath: string | null`
- **STEPS**: Expanded from 5 to 6 steps (added Identitas step)
- **appData state**: Now includes `logoPath: null, faviconPath: null`
- **Step rendering**: Step 4 → StepIdentity, Step 5 → StepComplete
- **Navigation**: `currentStep < 4` → `currentStep < 5`
- **Submit handler**: Includes logoPath/faviconPath in appIdentity payload
- **New StepIdentity component**: Full logo/favicon upload UI with previews, loading states, error handling
- **Updated StepComplete**: Summary-only view with app identity card showing logo/favicon previews

### 3. `src/app/api/setup/route.ts`
- Added `logoPath` and `faviconPath` to both OfficeSetting update and create data objects

### 4. `public/uploads/`
- Created directory for uploaded files

## Lint Result
Passes cleanly with no errors.
