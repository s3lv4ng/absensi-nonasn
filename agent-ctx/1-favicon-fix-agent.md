# Task 1 - Favicon Fix Agent

## Summary
Fixed the favicon not updating after uploading a new one in the Pengaturan (Settings) tab.

## Root Cause
The favicon update logic had multiple issues:
1. No cache-busting — browsers cached the old favicon and wouldn't refetch
2. No MIME type detection — the `type` attribute wasn't set based on file extension
3. No apple-touch-icon support — iOS devices weren't covered
4. Public pages (login, register) never updated favicon — only `AppLayout` had the update logic

## Changes Made

### 1. Created `/src/lib/favicon.ts` (NEW FILE)
- Shared `updateFavicon()` utility function
- Adds cache-busting query parameter (`?v=${Date.now()}`) to force browser refetch
- Detects MIME type from file extension (svg, ico, png, jpg, jpeg, webp)
- Updates or creates both `favicon` and `apple-touch-icon` `<link>` elements
- Creates elements dynamically if they don't exist in the DOM

### 2. Modified `/src/app/layout.tsx`
- Added `apple: "/logo.svg"` to metadata `icons` object
- Added `<link rel="apple-touch-icon" href="/logo.svg" id="apple-touch-icon-link" />` in `<head>`
- Added `<meta name="theme-color" content="#1e40af" />` in `<head>`

### 3. Modified `/src/components/layout/app-layout.tsx`
- Added import for `updateFavicon` from `@/lib/favicon`
- Replaced inline favicon update logic with call to `updateFavicon(appIdentity.faviconPath, appIdentity.logoPath)`

### 4. Modified `/src/app/page.tsx`
- Added import for `updateFavicon` from `@/lib/favicon`
- Added `appIdentity` to the `useAppStore` destructuring
- Added new `useEffect` to update favicon and title on public pages (login, register)

## Verification
- `bun run lint` passes with no errors
- All files confirmed correct after editing
