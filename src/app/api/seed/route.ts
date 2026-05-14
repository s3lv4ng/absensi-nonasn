import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST() {
  try {
    // Check if admin already exists
    const existingAdmin = await db.user.findUnique({
      where: { email: 'admin@absensi.go.id' },
    })

    if (existingAdmin) {
      return NextResponse.json({ message: 'Data sudah ada', skipped: true })
    }

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12)
    const admin = await db.user.create({
      data: {
        nip: '000000001',
        nama: 'Administrator',
        email: 'admin@absensi.go.id',
        password: adminPassword,
        role: 'ADMIN',
        unitKerja: 'IT',
        jabatan: 'System Administrator',
        isActive: true,
      },
    })

    // Create sample employees
    const employeePassword = await bcrypt.hash('pegawai123', 12)
    const employees = [
      { nip: '2024001', nama: 'Ahmad Fauzi', email: 'ahmad@absensi.go.id', unitKerja: 'Keuangan', jabatan: 'Staff Keuangan' },
      { nip: '2024002', nama: 'Siti Nurhaliza', email: 'siti@absensi.go.id', unitKerja: 'SDM', jabatan: 'Staff SDM' },
      { nip: '2024003', nama: 'Budi Santoso', email: 'budi@absensi.go.id', unitKerja: 'IT', jabatan: 'Programmer' },
      { nip: '2024004', nama: 'Dewi Lestari', email: 'dewi@absensi.go.id', unitKerja: 'Keuangan', jabatan: 'Bendahara' },
      { nip: '2024005', nama: 'Rudi Hermawan', email: 'rudi@absensi.go.id', unitKerja: 'Umum', jabatan: 'Staff Umum' },
      { nip: '2024006', nama: 'Ani Wijaya', email: 'ani@absensi.go.id', unitKerja: 'IT', jabatan: 'Analis Sistem' },
      { nip: '2024007', nama: 'Eko Prasetyo', email: 'eko@absensi.go.id', unitKerja: 'Perencanaan', jabatan: 'Staff Perencanaan' },
      { nip: '2024008', nama: 'Fitri Handayani', email: 'fitri@absensi.go.id', unitKerja: 'SDM', jabatan: 'Kepala SDM' },
    ]

    for (const emp of employees) {
      await db.user.create({
        data: {
          ...emp,
          password: employeePassword,
          role: 'PEGAWAI',
          isActive: true,
        },
      })
    }

    // Create default office settings
    await db.officeSetting.create({
      data: {
        officeName: 'Kantor Pusat',
        latitude: -6.2088,
        longitude: 106.8456,
        radiusMeter: 100,
        startTime: '08:00',
        endTime: '17:00',
        lateTolerance: 15,
        workDays: '1,2,3,4,5',
      },
    })

    // Create default work shift
    const defaultShift = await db.workShift.create({
      data: {
        name: 'Reguler',
        startTime: '08:00',
        endTime: '17:00',
        lateTolerance: 15,
        workDays: '1,2,3,4,5',
        color: '#1e40af',
        isActive: true,
      },
    })

    // Assign shift to admin
    await db.user.update({
      where: { id: admin.id },
      data: { shiftId: defaultShift.id },
    })

    // Create sample holidays
    const holidays = [
      { name: 'Tahun Baru', date: new Date('2025-01-01'), type: 'NASIONAL' },
      { name: 'Hari Kemerdekaan', date: new Date('2025-08-17'), type: 'NASIONAL' },
      { name: 'Hari Buruh', date: new Date('2025-05-01'), type: 'NASIONAL' },
      { name: 'Hari Pendidikan Nasional', date: new Date('2025-05-02'), type: 'NASIONAL' },
      { name: 'Idul Fitri', date: new Date('2025-03-31'), type: 'KEAGAMAAN' },
    ]

    for (const h of holidays) {
      await db.holiday.create({ data: h })
    }

    // Create some sample attendance data for today
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 45, 0)
    const allEmployees = await db.user.findMany({
      where: { role: 'PEGAWAI' },
      take: 5,
    })

    for (const emp of allEmployees) {
      const clockInTime = new Date(today)
      clockInTime.setMinutes(45 + Math.floor(Math.random() * 30))
      const isLate = clockInTime.getHours() > 8 || (clockInTime.getHours() === 8 && clockInTime.getMinutes() > 15)

      await db.attendance.create({
        data: {
          userId: emp.id,
          type: 'MASUK',
          latitude: -6.2088 + (Math.random() - 0.5) * 0.001,
          longitude: 106.8456 + (Math.random() - 0.5) * 0.001,
          confidence: 0.85 + Math.random() * 0.15,
          status: isLate ? 'TELAT' : 'HADIR',
          createdAt: clockInTime,
        },
      })
    }

    return NextResponse.json({
      message: 'Data berhasil di-seed',
      admin: { email: 'admin@absensi.go.id', password: 'admin123' },
      employee: { email: 'ahmad@absensi.go.id', password: 'pegawai123' },
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
