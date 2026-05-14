/**
 * Calculate attendance timing (late/early) for a shift, supporting cross-midnight shifts.
 * Uses Jakarta timezone (UTC+7) for all time calculations regardless of server timezone.
 *
 * Cross-midnight shift example: 22:00 - 06:00
 * - MASUK at 02:00 → shift started at 22:00 PREVIOUS day → LATE (4h)
 * - MASUK at 22:30 → shift started at 22:00 SAME day → slightly late (30m)
 * - PULANG at 04:00 → shift ends at 06:00 SAME day → PULANG CEPAT (2h)
 * - PULANG at 23:00 → shift ends at 06:00 NEXT day → PULANG CEPAT (7h)
 */
import { getJakartaTime, JAKARTA_OFFSET_MS } from '@/lib/timezone'

export function calculateAttendanceTiming(
  startTime: string,     // e.g., "22:00" (Jakarta time)
  endTime: string,       // e.g., "06:00" (Jakarta time)
  lateTolerance: number, // e.g., 15 (minutes)
  attendanceTime: Date,  // UTC Date from the database
  type: 'MASUK' | 'PULANG'
): { isLate: boolean; lateMinutes: number; isEarly: boolean; earlyMinutes: number } {
  const [startH, startM] = startTime.split(':').map(Number)
  const [endH, endM] = endTime.split(':').map(Number)

  const startMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM
  const isCrossMidnight = startMinutes >= endMinutes

  // Get Jakarta time components from the attendance UTC Date
  const jakartaTime = getJakartaTime(attendanceTime)
  const attHourMin = jakartaTime.totalMinutes

  if (type === 'MASUK') {
    // Determine the shift start date in Jakarta time
    let shiftStartYear: number
    let shiftStartMonth: number
    let shiftStartDay: number

    if (isCrossMidnight) {
      // Cross-midnight shift: e.g., 22:00 - 06:00
      // If attendance is before the shift start time (e.g., 02:00 < 22:00),
      // the shift started on the PREVIOUS day in Jakarta time
      if (attHourMin < startMinutes) {
        // Previous day
        const prevDayMs = attendanceTime.getTime() + JAKARTA_OFFSET_MS - 86400000
        const prevDayDate = new Date(prevDayMs)
        shiftStartYear = prevDayDate.getUTCFullYear()
        shiftStartMonth = prevDayDate.getUTCMonth()
        shiftStartDay = prevDayDate.getUTCDate()
      } else {
        shiftStartYear = jakartaTime.year
        shiftStartMonth = jakartaTime.month
        shiftStartDay = jakartaTime.day
      }
    } else {
      // Regular shift: same day
      shiftStartYear = jakartaTime.year
      shiftStartMonth = jakartaTime.month
      shiftStartDay = jakartaTime.day
    }

    // Build the shift start and deadline as UTC timestamps
    // Shift start = startH:startM in Jakarta time on the determined date
    const shiftStartUtcMs = Date.UTC(shiftStartYear, shiftStartMonth, shiftStartDay, startH, startM, 0, 0) - JAKARTA_OFFSET_MS
    const deadlineUtcMs = shiftStartUtcMs + lateTolerance * 60 * 1000

    const diffMs = attendanceTime.getTime() - deadlineUtcMs
    const isLate = diffMs > 0
    const lateMinutes = isLate ? Math.ceil(diffMs / 60000) : 0

    return { isLate, lateMinutes, isEarly: false, earlyMinutes: 0 }
  }

  if (type === 'PULANG') {
    // Determine the shift end date in Jakarta time
    let shiftEndYear: number
    let shiftEndMonth: number
    let shiftEndDay: number

    if (isCrossMidnight) {
      // Cross-midnight shift: e.g., 22:00 - 06:00
      // If attendance is in the "evening" part (>= shift start time),
      // the shift ends on the NEXT day in Jakarta time
      if (attHourMin >= startMinutes) {
        // Next day
        const nextDayMs = attendanceTime.getTime() + JAKARTA_OFFSET_MS + 86400000
        const nextDayDate = new Date(nextDayMs)
        shiftEndYear = nextDayDate.getUTCFullYear()
        shiftEndMonth = nextDayDate.getUTCMonth()
        shiftEndDay = nextDayDate.getUTCDate()
      } else {
        shiftEndYear = jakartaTime.year
        shiftEndMonth = jakartaTime.month
        shiftEndDay = jakartaTime.day
      }
    } else {
      // Regular shift: same day
      shiftEndYear = jakartaTime.year
      shiftEndMonth = jakartaTime.month
      shiftEndDay = jakartaTime.day
    }

    // Build the shift end as UTC timestamp
    const shiftEndUtcMs = Date.UTC(shiftEndYear, shiftEndMonth, shiftEndDay, endH, endM, 0, 0) - JAKARTA_OFFSET_MS

    const diffMs = shiftEndUtcMs - attendanceTime.getTime()
    const isEarly = diffMs > 0
    const earlyMinutes = isEarly ? Math.ceil(diffMs / 60000) : 0

    return { isLate: false, lateMinutes: 0, isEarly, earlyMinutes }
  }

  return { isLate: false, lateMinutes: 0, isEarly: false, earlyMinutes: 0 }
}
