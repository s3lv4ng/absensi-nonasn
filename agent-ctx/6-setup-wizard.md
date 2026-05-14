# Task 6 - Setup Wizard Component

## Agent: setup-wizard

## Task
Create a Setup Wizard component for the Next.js 16 employee attendance app - multi-step wizard that appears on first-time app launch.

## Work Completed

### 1. Created `/src/components/auth/setup-wizard.tsx`
- Multi-step setup wizard with 5 steps:
  - **Step 1 (Welcome)**: Beautiful welcome page with Building2 icon, "Selamat Datang" title, feature preview list with animated icons, "Mulai Setup" button
  - **Step 2 (Admin Account)**: Form with NIP, Nama Lengkap, Email, Password (show/hide toggle), Konfirmasi Password (show/hide toggle), client-side validation (required, email format, password min 6 chars, passwords match)
  - **Step 3 (Office Location)**: Nama Kantor, Latitude/Longitude number inputs, Radius slider (10-500m) with visual label, "Deteksi Lokasi Saat Ini" button using navigator.geolocation API with error handling (permission denied, unavailable, timeout), coordinate preview card with radius description
  - **Step 4 (Work Hours)**: Nama Shift, Jam Masuk/Pulang time inputs, Toleransi Keterlambatan slider (0-60 min), Hari Kerja interactive checkboxes for each day (Senin-Minggu) with visual toggle circles
  - **Step 5 (App Identity & Complete)**: Nama Aplikasi input, summary section with 3 cards showing all configured data (Admin, Lokasi Kantor, Jam Kerja), "Selesai & Masuk" button with loading state
- Step indicator at top showing progress with filled/unfilled circles connected by lines
- Framer Motion AnimatePresence with slide transitions between steps
- Glassmorphism style matching login form (bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl)
- Same gradient background (from-blue-50 via-white to-blue-50)
- Form state persists when navigating between steps
- Client-side validation before each step transition
- Responsive design (mobile-first)

### 2. Created `/src/app/api/setup/route.ts`
- POST endpoint for setup wizard submission
- Validates all required fields (admin, office, shift)
- Prevents re-setup if admin user already exists (409)
- Creates admin user with bcrypt hashed password
- Creates Office record
- Creates WorkShift record and assigns to admin user
- Creates or updates OfficeSetting record
- Creates JWT token and sets auth cookie for auto-login
- Returns user data on success

### 3. Updated `/src/types/index.ts`
- Added 'setup' to AppView union type

### 4. Updated `/src/app/page.tsx`
- Imported SetupWizard component
- Added 'setup' case to ViewRenderer switch
- Added 'setup' to publicViews array

## Files Changed
- `/src/components/auth/setup-wizard.tsx` (NEW)
- `/src/app/api/setup/route.ts` (NEW)
- `/src/types/index.ts` (MODIFIED)
- `/src/app/page.tsx` (MODIFIED)

## Verification
- ESLint passed clean
- Dev server compiles without errors
