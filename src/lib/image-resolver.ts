/**
 * Image path resolution utility.
 * Handles both blob store URLs ("/api/files/...") and base64 data URLs ("data:...").
 * Also handles legacy paths relative to the public directory.
 */

/**
 * Resolve an image path to a displayable URL.
 *
 * @param imagePath - The image path from the database (could be a blob URL, base64 data URL, or public path)
 * @returns A URL that can be used in <img src="...">
 */
export function resolveImagePath(imagePath: string | null | undefined): string | null {
  if (!imagePath) return null

  // Blob store URL — already a valid URL
  if (imagePath.startsWith('/api/files/')) return imagePath

  // Base64 data URL — already a valid src for <img>
  if (imagePath.startsWith('data:')) return imagePath

  // Absolute URL (http:// or https://)
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath

  // Legacy: path relative to public directory
  // These were stored as e.g., "uploads/logo.png" in the old system
  if (imagePath.startsWith('/')) return imagePath
  return `/${imagePath}`
}

/**
 * Check if an image path is stored in the blob store.
 */
export function isBlobStored(imagePath: string | null | undefined): boolean {
  if (!imagePath) return false
  return imagePath.startsWith('/api/files/')
}

/**
 * Check if an image path is a base64 data URL (stored in database).
 */
export function isBase64Stored(imagePath: string | null | undefined): boolean {
  if (!imagePath) return false
  return imagePath.startsWith('data:')
}
