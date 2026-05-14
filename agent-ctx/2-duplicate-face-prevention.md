# Task 2: Prevent same face from registering with different accounts

## Agent: duplicate-face-prevention

## Work Summary

Added duplicate face detection to the face registration backend API. When a user tries to register their face, the system now checks all other existing face descriptors using Euclidean distance comparison. If a match is found (distance < 0.6), the registration is rejected with a clear error message identifying the existing account holder.

## Changes Made

### `/src/app/api/users/face/route.ts`
- Added `MATCH_THRESHOLD` constant (0.6) at the top of the file
- Added `calculateEuclideanDistance` helper function that computes Euclidean distance between two 128-dimension face descriptor arrays
- Added duplicate face check block in the PUT handler, after the existing "already registered" check and before saving:
  1. Parses the incoming `faceDescriptor` JSON string into a number array
  2. Fetches all users with existing face descriptors (excluding the current user)
  3. Iterates through each existing user, parsing their descriptor and computing distance
  4. If distance < 0.6, returns 400 with error message including the existing user's name

### `/src/components/face-recognition/face-register.tsx`
- No changes needed — the existing error handling already properly catches 400 responses and displays the error message via `setApiError` in an Alert component

## Testing
- Lint passes with no errors
- Dev server running successfully on port 3000
