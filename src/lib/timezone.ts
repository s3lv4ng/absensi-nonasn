/**
 * Timezone utilities for consistent time handling.
 *
 * The application is designed for use in Indonesia (Asia/Jakarta, WIB = UTC+7).
 * Since the server may run in UTC, all time calculations and displays must
 * explicitly convert to Jakarta timezone.
 */

/** Jakarta timezone offset in hours (WIB = UTC+7) */
export const JAKARTA_OFFSET_HOURS = 7

/** Jakarta timezone offset in minutes */
export const JAKARTA_OFFSET_MINUTES = JAKARTA_OFFSET_HOURS * 60

/** Jakarta timezone offset in milliseconds */
export const JAKARTA_OFFSET_MS = JAKARTA_OFFSET_HOURS * 60 * 60 * 1000

/**
 * Get Jakarta-time components from a UTC Date object.
 * Works regardless of the server's timezone setting.
 */
export function getJakartaTime(date: Date): {
  year: number
  month: number      // 0-11 (JavaScript convention)
  day: number        // 1-31
  hours: number      // 0-23
  minutes: number    // 0-59
  seconds: number    // 0-59
  totalMinutes: number  // hours * 60 + minutes
} {
  // Create a new Date adjusted by the Jakarta offset
  const jakartaMs = date.getTime() + JAKARTA_OFFSET_MS
  const jakartaDate = new Date(jakartaMs)

  // Use getUTC* methods on the adjusted date to get Jakarta values
  const hours = jakartaDate.getUTCHours()
  const minutes = jakartaDate.getUTCMinutes()

  return {
    year: jakartaDate.getUTCFullYear(),
    month: jakartaDate.getUTCMonth(),
    day: jakartaDate.getUTCDate(),
    hours,
    minutes,
    seconds: jakartaDate.getUTCSeconds(),
    totalMinutes: hours * 60 + minutes,
  }
}

/**
 * Format a Date to HH:mm in Jakarta timezone.
 */
export function formatJakartaTime(date: Date): string {
  const { hours, minutes } = getJakartaTime(date)
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

/**
 * Format a Date to a date string (YYYY-MM-DD) in Jakarta timezone.
 */
export function formatJakartaDate(date: Date): string {
  const { year, month, day } = getJakartaTime(date)
  return `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
}

/**
 * Get the day of the month in Jakarta timezone (1-31).
 */
export function getJakartaDay(date: Date): number {
  return getJakartaTime(date).day
}

/**
 * Get the day of the week in Jakarta timezone (0=Sunday, 1=Monday, ..., 6=Saturday).
 */
export function getJakartaDayOfWeek(date: Date): number {
  const jakartaMs = date.getTime() + JAKARTA_OFFSET_MS
  const jakartaDate = new Date(jakartaMs)
  return jakartaDate.getUTCDay()
}

/**
 * Create a Date object representing the start of a specific day in Jakarta timezone.
 * Returns a UTC Date that corresponds to 00:00 Jakarta time on that day.
 */
export function createJakartaDate(year: number, month: number, day: number, hours = 0, minutes = 0): Date {
  // Create a date in UTC that, when adjusted to Jakarta, gives the desired values
  const utcDate = new Date(Date.UTC(year, month, day, hours - JAKARTA_OFFSET_HOURS, minutes, 0, 0))
  return utcDate
}

/**
 * Get the current time as Jakarta time components.
 */
export function nowJakarta(): {
  year: number
  month: number
  day: number
  hours: number
  minutes: number
  seconds: number
  totalMinutes: number
  date: Date
} {
  const now = new Date()
  const jakarta = getJakartaTime(now)
  return { ...jakarta, date: now }
}

/**
 * Determine the effective shift date for an attendance record.
 * For cross-midnight shifts (e.g., 22:00-06:00), if the attendance is in the
 * early morning hours (after midnight but before shift end), the shift started
 * the previous calendar day in Jakarta timezone.
 *
 * @param attendanceTime The UTC Date of the attendance record
 * @param shiftStartTime Shift start time in HH:mm format (Jakarta time)
 * @param shiftEndTime Shift end time in HH:mm format (Jakarta time)
 * @returns The Jakarta date components of the shift start day
 */
export function getShiftDate(
  attendanceTime: Date,
  shiftStartTime: string,
  shiftEndTime: string
): { year: number; month: number; day: number } {
  const [startH, startM] = shiftStartTime.split(':').map(Number)
  const [endH, endM] = shiftEndTime.split(':').map(Number)
  const startMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM
  const isCrossMidnight = startMinutes >= endMinutes

  const jakartaTime = getJakartaTime(attendanceTime)
  const attMinutes = jakartaTime.totalMinutes

  if (isCrossMidnight) {
    // Cross-midnight shift: e.g., 22:00 - 06:00
    // If attendance is before the shift start time (e.g., 02:00 < 22:00),
    // the shift started on the PREVIOUS day
    if (attMinutes < startMinutes) {
      // Previous day in Jakarta time
      const prevDayMs = attendanceTime.getTime() + JAKARTA_OFFSET_MS - 86400000
      const prevDayDate = new Date(prevDayMs)
      return {
        year: prevDayDate.getUTCFullYear(),
        month: prevDayDate.getUTCMonth(),
        day: prevDayDate.getUTCDate(),
      }
    }
  }

  return {
    year: jakartaTime.year,
    month: jakartaTime.month,
    day: jakartaTime.day,
  }
}
