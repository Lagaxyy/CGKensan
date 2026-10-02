import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { pseudo, password } = await req.json()

    if (!pseudo || !password || password.length < 6) {
      return NextResponse.json(
        { error: 'Pseudo et mot de passe (6 caractères min) requis.' },
        { status: 400 }
      )
    }

    const existing = await prisma.user.findUnique({ where: { pseudo } })
    if (existing) {
      return NextResponse.json(
        { error: 'Ce pseudo est déjà utilisé.' },
        { status: 409 }
      )
    }

    const hashed = await bcrypt.hash(password, 12)
    await prisma.user.create({
      data: { pseudo, password: hashed },
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: 'Erreur serveur.' },
      { status: 500 }
    )
  }
}
