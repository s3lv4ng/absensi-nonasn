import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const [adminUser, officeSetting, workShift] = await Promise.all([
      db.user.findFirst({ where: { role: 'ADMIN' } }),
      db.officeSetting.findFirst(),
      db.workShift.findFirst(),
    ])

    const hasAdmin = !!adminUser
    const hasOffice = !!officeSetting
    const hasShift = !!workShift
    const needsSetup = !hasAdmin || !hasOffice || !hasShift

    return NextResponse.json({
      needsSetup,
      hasAdmin,
      hasOffice,
      hasShift,
    })
  } catch (error) {
    console.error('Setup status error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
