export type Role = 'ADMIN' | 'PEGAWAI'

export type AttendanceType = 'MASUK' | 'PULANG'

export type AttendanceStatus = 'HADIR' | 'TELAT' | 'IZIN' | 'CUTI' | 'ALPHA' | 'DINAS'

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export type LeaveType = 'IZIN' | 'CUTI' | 'SAKIT' | 'DINAS' // Default types, can be extended with LeaveTypeCategory

export type HolidayType = 'NASIONAL' | 'KEAGAMAAN' | 'KHUSUS'

export type AppView =
  | 'landing'
  | 'login'
  | 'register'
  | 'employee-dashboard'
  | 'employee-history'
  | 'employee-profile'
  | 'employee-leaves'
  | 'employee-monitoring'
  | 'admin-dashboard'
  | 'admin-employees'
  | 'admin-attendance'
  | 'admin-settings'
  | 'admin-reports'
  | 'admin-leaves'
  | 'admin-offices'
  | 'admin-shifts'
  | 'admin-employee-report'
  | 'admin-leave-types'

export interface User {
  id: string
  nip: string
  nama: string
  email: string
  role: Role
  photo: string | null
  faceDescriptor: string | null
  faceRegisteredAt: string | null
  unitKerja: string | null
  jabatan: string | null
  shiftId: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  shift?: WorkShift
}

export interface Attendance {
  id: string
  userId: string
  type: AttendanceType
  latitude: number
  longitude: number
  photo: string | null
  confidence: number
  status: AttendanceStatus
  note: string | null
  shiftId: string | null
  createdAt: string
  user?: User
  shift?: WorkShift
}

export interface Office {
  id: string
  name: string
  address: string | null
  latitude: number
  longitude: number
  radiusMeter: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface WorkShift {
  id: string
  name: string
  startTime: string
  endTime: string
  lateTolerance: number
  workDays: string
  color: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count?: { users: number }
  users?: User[] // included when includeUsers=true
}

export interface OfficeSetting {
  id: string
  officeName: string
  latitude: number
  longitude: number
  radiusMeter: number
  startTime: string
  endTime: string
  lateTolerance: number
  workDays: string
  createdAt: string
  updatedAt: string
}

export interface Holiday {
  id: string
  name: string
  date: string
  type: HolidayType
  createdAt: string
  updatedAt: string
}

export interface LeaveRequest {
  id: string
  userId: string
  type: LeaveType
  startDate: string
  endDate: string
  reason: string
  attachment: string | null
  status: LeaveStatus
  approvedBy: string | null
  approvedAt: string | null
  isManualEntry: boolean
  createdAt: string
  updatedAt: string
  user?: User
}

export interface DashboardStats {
  totalEmployees: number
  presentToday: number
  absentToday: number
  lateToday: number
  onLeave: number
}

export interface AttendanceChart {
  name: string
  hadir: number
  telat: number
  izin: number
  alpha: number
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

export interface LocationData {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
}

export interface GPSValidationResult {
  isValid: boolean
  distance: number
  maxRadius: number
  message: string
}

export interface EmployeeDailyRecord {
  day: number
  date: string
  dayName: string
  isWeekend: boolean
  masukTime: string | null
  pulangTime: string | null
  status: string
  leaveType: string | null
  masukId: string | null
  pulangId: string | null
}

export interface EmployeeReportData {
  employee: {
    id: string
    nip: string
    nama: string
    email: string
    unitKerja: string | null
    jabatan: string | null
    shift: WorkShift | null
  }
  dailyRecords: EmployeeDailyRecord[]
  summary: {
    totalDays: number
    hadir: number
    telat: number
    izin: number
    cuti: number
    sakit: number
    alpha: number
    libur: number
  }
  month: number
  year: number
}

export interface LeaveTypeCategory {
  id: string
  name: string
  code: string
  description: string | null
  color: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface EmployeeMonitorEntry {
  userId: string
  nama: string
  nip: string
  photo: string | null
  unitKerja: string | null
  jabatan: string | null
  status: 'HADIR' | 'TELAT' | 'IZIN' | 'CUTI' | 'SAKIT' | 'DINAS' | 'ALPHA' | 'BELUM_ABSEN'
  masukTime: string | null
  pulangTime: string | null
  leaveType: string | null
  leaveStatus: string | null
}
