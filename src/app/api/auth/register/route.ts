import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { createToken, COOKIE_NAME } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nip, nama, email, password, unitKerja, jabatan } = body

    if (!nip || !nama || !email || !password) {
      return NextResponse.json(
        { error: 'NIP, nama, email, dan password wajib diisi' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingEmail = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    })
    if (existingEmail) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar' },
        { status: 409 }
      )
    }

    // Check if NIP already exists
    const existingNip = await db.user.findUnique({
      where: { nip },
    })
    if (existingNip) {
      return NextResponse.json(
        { error: 'NIP sudah terdaftar' },
        { status: 409 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await db.user.create({
      data: {
        nip,
        nama,
        email: email.toLowerCase(),
        password: hashedPassword,
        unitKerja: unitKerja || null,
        jabatan: jabatan || null,
        role: 'PEGAWAI',
      },
    })

    const token = await createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      nip: user.nip,
      nama: user.nama,
    })

    const response = NextResponse.json({
      message: 'Registrasi berhasil',
      user: {
        id: user.id,
        nip: user.nip,
        nama: user.nama,
        email: user.email,
        role: user.role,
        photo: user.photo,
        unitKerja: user.unitKerja,
        jabatan: user.jabatan,
        faceDescriptor: user.faceDescriptor,
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
    console.error('Register error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
