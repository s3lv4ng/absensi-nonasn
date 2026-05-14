---
Task ID: 1
Agent: Main
Task: Fix face recognition - implement real face detection and matching with proper rules

Work Log:
- Analyzed current face recognition code - found ALL face matching was fake (random descriptors, random confidence 0.85-0.99)
- Installed `@vladmandic/face-api` (maintained fork of face-api.js)
- Copied AI model files to `public/models/` directory (tiny_face_detector, face_landmark_68, face_recognition)
- Created `src/lib/face-recognition.ts` - comprehensive face recognition utility with:
  - Dynamic imports for face-api.js (client-side only, avoids SSR TextEncoder errors)
  - Model loading with singleton pattern
  - `detectFace()` - detects single face and computes 128-dim descriptor
  - `checkFaceDetected()` - lightweight face detection for live camera preview
  - `generateFaceDescriptor()` - for face registration
  - `verifyFace()` - compares captured face against stored descriptor
  - `compareFaces()` - Euclidean distance comparison with thresholds
  - Face matching rules:
    * distance < 0.40 → Sangat Cocok (Very Strong Match)
    * distance < 0.50 → Cocok (Good Match)
    * distance < 0.60 → Cukup Cocok (Fair Match, still accepted)
    * distance >= 0.60 → Tidak Cocok (REJECTED)
  - Confidence = max(0, 1 - distance)
- Fixed camera black screen issue in `useCamera` hook:
  - Added `isReady` state tracking when video is actually playing
  - Fixed stream attachment race conditions
  - Added proper muted/playsInline attributes before play()
  - Added video event listeners (canplay, playing)
- Updated `face-register.tsx`:
  - Replaced random descriptor generation with real `generateFaceDescriptor()` using face-api.js
  - Added live face detection in camera preview (oval turns green when face detected)
  - Ambil Foto button disabled until face is detected
  - Shows model loading progress bar
- Updated `camera-view.tsx`:
  - Replaced random confidence with real `verifyFace()` matching
  - New verification flow: capture → verify → match/reject
  - Shows AI Match badge when stored descriptor is available
  - Green verified / Red rejected states with distance and confidence
  - Face must match stored descriptor (distance < 0.6) to pass
  - If no stored descriptor, only checks face is present (moderate confidence)
- Updated `employee-dashboard.tsx`:
  - Fetches user's stored face descriptor on mount
  - Passes `storedFaceDescriptor` to CameraView
  - `faceVerified` flag required for submission
  - Shows warning if user has not registered face data
  - Checklist shows face verification status (verified/failed)
- Added GET endpoint to `/api/users/face` for fetching user's face descriptor
- Updated attendance API to check `faceVerified` flag
- All lint checks pass
- Dev server compiles and returns 200

Stage Summary:
- Face recognition is now REAL using face-api.js with AI-powered face descriptors
- Camera black screen fixed with proper video element handling
- Face matching rules properly implemented with distance thresholds
- Faces that do not match are REJECTED (distance >= 0.6)
- Only matching faces (distance < 0.6) can submit attendance
