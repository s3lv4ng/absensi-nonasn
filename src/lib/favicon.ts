/**
 * Dynamically update the browser favicon, apple-touch-icon, manifest, and app meta tags.
 * Uses aggressive cache-busting by removing and re-adding link elements.
 * All icon paths now go through /api/favicon and /api/pwa-icon/* API routes
 * which serve the correct icon from the database (Application Identity settings).
 */

/**
 * Update the browser favicon and apple-touch-icon with aggressive cache-busting.
 * Uses the dynamic API routes which always serve the current DB value.
 */
export function updateFavicon(_faviconPath: string | null, _logoPath: string | null) {
  // Use cache-busting parameter to force browsers to re-fetch the dynamic favicon
  const cacheBust = Date.now()

  // Remove existing favicon link and create new one
  const existingFavicon = document.getElementById('favicon-link')
  if (existingFavicon) {
    existingFavicon.remove()
  }
  const faviconLink = document.createElement('link')
  faviconLink.id = 'favicon-link'
  faviconLink.rel = 'icon'
  faviconLink.href = `/api/favicon?v=${cacheBust}`
  faviconLink.type = 'image/png' // API route determines actual type
  document.head.appendChild(faviconLink)

  // Remove existing apple-touch-icon and create new one
  const existingApple = document.getElementById('apple-touch-icon-link')
  if (existingApple) {
    existingApple.remove()
  }
  const appleTouchIcon = document.createElement('link')
  appleTouchIcon.id = 'apple-touch-icon-link'
  appleTouchIcon.rel = 'apple-touch-icon'
  appleTouchIcon.href = `/api/pwa-icon/192?v=${cacheBust}`
  document.head.appendChild(appleTouchIcon)

  // Also update the manifest link with cache-busting so browser refetches dynamic manifest
  updateManifestLink()
}

/**
 * Update the <link rel="manifest"> href with cache-busting
 * so the browser refetches the dynamic manifest from /api/manifest
 */
export function updateManifestLink() {
  const manifestCacheBusted = `/api/manifest?v=${Date.now()}`

  // Remove existing manifest link and create new one
  const existingManifest = document.querySelector('link[rel="manifest"]')
  if (existingManifest) {
    existingManifest.remove()
  }
  const manifestLink = document.createElement('link')
  manifestLink.rel = 'manifest'
  manifestLink.href = manifestCacheBusted
  document.head.appendChild(manifestLink)
}

/**
 * Update app meta tags: document.title, apple-mobile-web-app-title, and application-name.
 * Call this when the app name changes to keep all meta tags in sync.
 */
export function updateAppMeta(appName: string) {
  if (!appName) return

  // Update document title
  document.title = appName

  // Update apple-mobile-web-app-title meta tag
  let appleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]') as HTMLMetaElement | null
  if (!appleMeta) {
    appleMeta = document.createElement('meta')
    appleMeta.name = 'apple-mobile-web-app-title'
    document.head.appendChild(appleMeta)
  }
  appleMeta.content = appName

  // Update application-name meta tag
  let appMeta = document.querySelector('meta[name="application-name"]') as HTMLMetaElement | null
  if (!appMeta) {
    appMeta = document.createElement('meta')
    appMeta.name = 'application-name'
    document.head.appendChild(appMeta)
  }
  appMeta.content = appName
}

/**
 * Force-refresh all icons (favicon, PWA icons, manifest) after an identity change.
 * This clears service worker caches and forces browsers to re-fetch.
 */
export async function forceRefreshIcons() {
  const cacheBust = Date.now()

  // Update favicon
  updateFavicon(null, null)

  // Update manifest
  updateManifestLink()

  // Pre-warm the API caches by fetching the new values
  try {
    await Promise.all([
      fetch(`/api/favicon?v=${cacheBust}`),
      fetch(`/api/pwa-icon/192?v=${cacheBust}`),
      fetch(`/api/pwa-icon/512?v=${cacheBust}`),
      fetch(`/api/manifest?v=${cacheBust}`),
    ])
  } catch {
    // Ignore errors - the important thing is the link elements were updated
  }

  // Tell service worker to clear its caches so it fetches fresh icons next time
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHES' })
  }
}
