/**
 * Face Recognition Utility Module
 * Uses @vladmandic/face-api for real face detection, landmark detection, and face recognition.
 *
 * IMPORTANT: This module uses dynamic imports because face-api.js
 * only works in browser environments (needs TextEncoder, WebGL, etc.).
 *
 * Face Matching Rules:
 * - Euclidean distance between two 128-dimensional face descriptors
 * - Distance < 0.40 → Sangat Cocok (Very Strong Match)
 * - Distance < 0.50 → Cocok (Good Match)
 * - Distance < 0.60 → Cukup Cocok (Fair Match, still acceptable)
 * - Distance >= 0.60 → Tidak Cocok (No Match / Rejected)
 *
 * The confidence score is derived from the distance:
 *   confidence = max(0, 1 - distance) → range [0, 1]
 */

const MODEL_URL = '/models'

// Threshold for face matching (Euclidean distance)
const MATCH_THRESHOLD = 0.6

// Track if models are loaded
let modelsLoaded = false
let modelsLoading: Promise<void> | null = null
let faceapiModule: typeof import('@vladmandic/face-api') | null = null

/**
 * Get the face-api module (client-side only, lazy loaded)
 */
async function getFaceApi() {
  if (faceapiModule) return faceapiModule
  faceapiModule = await import('@vladmandic/face-api')
  return faceapiModule
}

/**
 * Load all required face-api models.
 * Should be called once on app startup or before first use.
 */
export async function loadFaceModels(): Promise<void> {
  if (modelsLoaded) return

  if (modelsLoading) {
    await modelsLoading
    return
  }

  modelsLoading = (async () => {
    try {
      const faceapi = await getFaceApi()

      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ])
      modelsLoaded = true
      console.log('[FaceRecognition] Models loaded successfully')
    } catch (error) {
      console.error('[FaceRecognition] Failed to load models:', error)
      modelsLoading = null
      throw error
    }
  })()

  await modelsLoading
}

/**
 * Check if models are loaded
 */
export function areModelsLoaded(): boolean {
  return modelsLoaded
}

/**
 * Detect a single face in an image/video element and compute its descriptor.
 * Returns null if no face is detected.
 */
export async function detectFace(
  input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
): Promise<{
  descriptor: number[]
  detection: { score: number; box: { x: number; y: number; width: number; height: number } }
  landmarks: unknown
} | null> {
  if (!modelsLoaded) {
    await loadFaceModels()
  }

  try {
    const faceapi = await getFaceApi()

    // Detect face with landmarks and descriptor
    const detection = await faceapi
      .detectSingleFace(input, new faceapi.TinyFaceDetectorOptions({
        inputSize: 320,
        scoreThreshold: 0.5,
      }))
      .withFaceLandmarks()
      .withFaceDescriptor()

    if (!detection) {
      return null
    }

    return {
      descriptor: Array.from(detection.descriptor) as number[],
      detection: {
        score: detection.detection.score,
        box: {
          x: detection.detection.box.x,
          y: detection.detection.box.y,
          width: detection.detection.box.width,
          height: detection.detection.box.height,
        },
      },
      landmarks: detection.landmarks,
    }
  } catch (error) {
    console.error('[FaceRecognition] Face detection error:', error)
    return null
  }
}

/**
 * Calculate Euclidean distance between two face descriptors.
 */
export function calculateDistance(descriptor1: number[], descriptor2: number[]): number {
  if (descriptor1.length !== descriptor2.length) {
    console.error('[FaceRecognition] Descriptor length mismatch:', descriptor1.length, 'vs', descriptor2.length)
    return Infinity
  }

  let sum = 0
  for (let i = 0; i < descriptor1.length; i++) {
    const diff = descriptor1[i] - descriptor2[i]
    sum += diff * diff
  }
  return Math.sqrt(sum)
}

/**
 * Compare two face descriptors and return match result.
 *
 * Rules:
 * - distance < 0.40 → "SANGAT_COCOK" (Very Strong Match)
 * - distance < 0.50 → "COCOK" (Good Match)
 * - distance < 0.60 → "CUKUP_COCOK" (Fair Match, acceptable)
 * - distance >= 0.60 → "TIDAK_COCOK" (Rejected)
 */
export function compareFaces(
  storedDescriptor: number[],
  capturedDescriptor: number[]
): {
  isMatch: boolean
  distance: number
  confidence: number
  label: string
  labelId: string
} {
  const distance = calculateDistance(storedDescriptor, capturedDescriptor)
  const confidence = Math.max(0, 1 - distance)
  const isMatch = distance < MATCH_THRESHOLD

  let label: string
  let labelId: string

  if (distance < 0.40) {
    label = 'Sangat Cocok'
    labelId = 'SANGAT_COCOK'
  } else if (distance < 0.50) {
    label = 'Cocok'
    labelId = 'COCOK'
  } else if (distance < 0.60) {
    label = 'Cukup Cocok'
    labelId = 'CUKUP_COCOK'
  } else {
    label = 'Tidak Cocok'
    labelId = 'TIDAK_COCOK'
  }

  return { isMatch, distance, confidence, label, labelId }
}

/**
 * Parse a stored face descriptor from JSON string.
 */
export function parseDescriptor(jsonString: string): number[] | null {
  try {
    const parsed = JSON.parse(jsonString)
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as number[]
    }
    return null
  } catch {
    return null
  }
}

/**
 * Verify a captured photo against a stored face descriptor.
 * This is the main function to call during attendance.
 *
 * @param capturedImage - HTML image/canvas/video element with the captured face
 * @param storedDescriptorJson - JSON string of the stored face descriptor
 * @returns Verification result
 */
export async function verifyFace(
  capturedImage: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
  storedDescriptorJson: string
): Promise<{
  isVerified: boolean
  confidence: number
  distance: number
  label: string
  labelId: string
  faceDetected: boolean
  error?: string
}> {
  // Parse stored descriptor
  const storedDescriptor = parseDescriptor(storedDescriptorJson)
  if (!storedDescriptor) {
    return {
      isVerified: false,
      confidence: 0,
      distance: Infinity,
      label: 'Data wajah tidak valid',
      labelId: 'INVALID_DESCRIPTOR',
      faceDetected: false,
      error: 'Data wajah tersimpan tidak valid. Silakan daftarkan ulang wajah Anda.',
    }
  }

  // Detect face in captured image
  const faceResult = await detectFace(capturedImage)

  if (!faceResult) {
    return {
      isVerified: false,
      confidence: 0,
      distance: Infinity,
      label: 'Wajah tidak terdeteksi',
      labelId: 'NO_FACE',
      faceDetected: false,
      error: 'Wajah tidak terdeteksi dalam foto. Pastikan wajah terlihat jelas dan pencahayaan cukup.',
    }
  }

  // Compare descriptors
  const comparison = compareFaces(storedDescriptor, faceResult.descriptor)

  return {
    isVerified: comparison.isMatch,
    confidence: comparison.confidence,
    distance: comparison.distance,
    label: comparison.label,
    labelId: comparison.labelId,
    faceDetected: true,
    error: comparison.isMatch ? undefined : 'Wajah tidak cocok dengan data yang terdaftar. Verifikasi gagal.',
  }
}

/**
 * Generate a face descriptor from a captured photo.
 * Used during face registration.
 *
 * @param imageElement - HTML image/canvas/video element with the face
 * @returns Face descriptor as number array, or null if no face detected
 */
export async function generateFaceDescriptor(
  imageElement: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
): Promise<{
  descriptor: number[]
  detection: { score: number; box: { x: number; y: number; width: number; height: number } }
} | null> {
  const result = await detectFace(imageElement)

  if (!result) {
    return null
  }

  return {
    descriptor: result.descriptor,
    detection: result.detection,
  }
}

/**
 * Check if a face is detected in a video stream (for live preview).
 * Lightweight check that only uses detection, not full descriptor computation.
 */
export async function checkFaceDetected(
  input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
): Promise<{
  detected: boolean
  score: number
  box?: { x: number; y: number; width: number; height: number }
}> {
  if (!modelsLoaded) {
    await loadFaceModels()
  }

  try {
    const faceapi = await getFaceApi()

    const detection = await faceapi.detectSingleFace(
      input,
      new faceapi.TinyFaceDetectorOptions({
        inputSize: 224,
        scoreThreshold: 0.5,
      })
    )

    if (!detection) {
      return { detected: false, score: 0 }
    }

    return {
      detected: true,
      score: detection.score,
      box: {
        x: detection.box.x,
        y: detection.box.y,
        width: detection.box.width,
        height: detection.box.height,
      },
    }
  } catch {
    return { detected: false, score: 0 }
  }
}
