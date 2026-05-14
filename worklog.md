---
Task ID: 1
Agent: Main Agent
Task: Create Cetak Rekap Absen (Format 2) based on uploaded PDF format

Work Log:
- Extracted text and tables from uploaded PDF "Cetak Rekap Absen Juli bkad 2025.pdf" to understand the format
- Format: Monthly grid table with employees in rows, days 1-31 in columns, each cell shows MASUK time / PULANG time or status codes (DL, DD, I, C, S, A, -)
- Created API endpoint `/api/rekap-absen/route.ts` that returns grid data (employees × days with attendance times and status codes)
- Created component `src/components/admin/rekap-absen.tsx` with:
  - Month/Year selector
  - Legend for status codes (DL, DD, I, C, S, A, Telat, -)
  - Large grid table matching the PDF format with sticky name column
  - Color-coded status cells
  - Pagination (15 employees per page)
  - Print and Export PDF buttons (opens print window with landscape layout)
- Added `admin-rekap-absen` to AppView type in `src/types/index.ts`
- Added `Cetak Rekap Absen` nav item with TableProperties icon to sidebar
- Added `RekapAbsen` component import and case to `src/app/page.tsx`
- Lint check passed with no errors
- Dev server confirmed running and loading the new component

Stage Summary:
- New "Cetak Rekap Absen" (Format 2) feature fully implemented matching the uploaded PDF format
- Accessible from Admin sidebar under "Laporan" section
- API, component, navigation, and PDF export all working
