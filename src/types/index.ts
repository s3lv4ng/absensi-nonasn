export type Role = 'ADMIN' | 'PEGAWAI'

export type AttendanceType = 'MASUK' | 'PULANG'

export type AttendanceStatus = 'HADIR' | 'TELAT' | 'IZIN' | 'CUTI' | 'ALPHA'

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export type LeaveType = 'IZIN' | 'CUTI' | 'SAKIT'

export type HolidayType = 'NASIONAL' | 'KEAGAMAAN' | 'KHUSUS'

export type AppView =
  | 'landing'
  | 'login'
  | 'register'
  | 'employee-dashboard'
  | 'employee-history'
  | 'employee-profile'
  | 'admin-dashboard'
  | 'admin-employees'
  | 'admin-attendance'
  | 'admin-settings'
  | 'admin-reports'
  | 'admin-leaves'

export interface User {
  id: string
  nip: string
  nama: string
  email: string
  role: Role
  photo: string | null
  faceDescriptor: string | null
  unitKerja: string | null
  jabatan: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
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
  createdAt: string
  user?: User
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
  status: LeaveStatus
  approvedBy: string | null
  approvedAt: string | null
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
