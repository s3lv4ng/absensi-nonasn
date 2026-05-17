import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { createToken, COOKIE_NAME } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { admin, office, shift, appIdentity } = body

    // Validate required fields
    if (!admin?.nip || !admin?.nama || !admin?.email || !admin?.password) {
      return NextResponse.json(
        { error: 'Data administrator tidak lengkap' },
        { status: 400 }
      )
    }

    if (!office?.name || office?.latitude === undefined || office?.longitude === undefined) {
      return NextResponse.json(
        { error: 'Data lokasi kantor tidak lengkap' },
        { status: 400 }
      )
    }

    if (!shift?.name || !shift?.startTime || !shift?.endTime) {
      return NextResponse.json(
        { error: 'Data jam kerja tidak lengkap' },
        { status: 400 }
      )
    }

    // Check if any admin already exists (prevent re-setup)
    const existingAdmin = await db.user.findFirst({
      where: { role: 'ADMIN' },
    })
    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Setup sudah pernah dilakukan. Silakan login.' },
        { status: 409 }
      )
    }

    // Check if email already exists
    const existingEmail = await db.user.findUnique({
      where: { email: admin.email.toLowerCase() },
    })
    if (existingEmail) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar' },
        { status: 409 }
      )
    }

    // Check if NIP already exists
    const existingNip = await db.user.findUnique({
      where: { nip: admin.nip },
    })
    if (existingNip) {
      return NextResponse.json(
        { error: 'NIP sudah terdaftar' },
        { status: 409 }
      )
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash(admin.password, 12)
    const user = await db.user.create({
      data: {
        nip: admin.nip,
        nama: admin.nama,
        email: admin.email.toLowerCase(),
        password: hashedPassword,
        role: 'ADMIN',
      },
    })

    // Create office
    await db.office.create({
      data: {
        name: office.name,
        latitude: parseFloat(office.latitude),
        longitude: parseFloat(office.longitude),
        radiusMeter: parseInt(office.radiusMeter) || 100,
        isActive: true,
      },
    })

    // Create work shift
    const workShift = await db.workShift.create({
      data: {
        name: shift.name,
        startTime: shift.startTime,
        endTime: shift.endTime,
        lateTolerance: parseInt(shift.lateTolerance) || 15,
        workDays: shift.workDays || '1,2,3,4,5',
        color: '#1e40af',
        isActive: true,
      },
    })

    // Assign shift to admin user
    await db.user.update({
      where: { id: user.id },
      data: { shiftId: workShift.id },
    })

    // Create or update office settings
    const existingSettings = await db.officeSetting.findFirst()
    if (existingSettings) {
      await db.officeSetting.update({
        where: { id: existingSettings.id },
        data: {
          officeName: office.name,
          latitude: parseFloat(office.latitude),
          longitude: parseFloat(office.longitude),
          radiusMeter: parseInt(office.radiusMeter) || 100,
          startTime: shift.startTime,
          endTime: shift.endTime,
          lateTolerance: parseInt(shift.lateTolerance) || 15,
          workDays: shift.workDays || '1,2,3,4,5',
          appName: appIdentity?.appName || 'Sistem Absensi Pegawai',
          logoPath: appIdentity?.logoPath || null,
          faviconPath: appIdentity?.faviconPath || null,
        },
      })
    } else {
      await db.officeSetting.create({
        data: {
          officeName: office.name,
          latitude: parseFloat(office.latitude),
          longitude: parseFloat(office.longitude),
          radiusMeter: parseInt(office.radiusMeter) || 100,
          startTime: shift.startTime,
          endTime: shift.endTime,
          lateTolerance: parseInt(shift.lateTolerance) || 15,
          workDays: shift.workDays || '1,2,3,4,5',
          appName: appIdentity?.appName || 'Sistem Absensi Pegawai',
          logoPath: appIdentity?.logoPath || null,
          faviconPath: appIdentity?.faviconPath || null,
        },
      })
    }

    // Create auth token
    const token = await createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      nip: user.nip,
      nama: user.nama,
    })

    const response = NextResponse.json({
      message: 'Setup berhasil',
      user: {
        id: user.id,
        nip: user.nip,
        nama: user.nama,
        email: user.email,
        role: user.role,
        photo: user.photo,
        faceDescriptor: user.faceDescriptor,
        faceRegisteredAt: user.faceRegisteredAt,
        unitKerja: user.unitKerja,
        jabatan: user.jabatan,
        unitKerjaId: user.unitKerjaId,
        jabatanId: user.jabatanId,
        shiftId: user.shiftId,
        mulaiBekerja: user.mulaiBekerja,
        tanggalSelesai: user.tanggalSelesai,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    })

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 86400,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
