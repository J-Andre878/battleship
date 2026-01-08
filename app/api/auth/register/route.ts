import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const { username, email, password } = await request.json()

    // Validaciones
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username y password son requeridos' },
        { status: 400 }
      )
    }

    // Verificar si el usuario ya existe
    const existingPlayer = await prisma.player.findFirst({
      where: {
        OR: [
          { username },
          ...(email ? [{ email }] : [])
        ]
      }
    })

    if (existingPlayer) {
      return NextResponse.json(
        { error: 'El usuario ya existe' },
        { status: 400 }
      )
    }

    // Hashear la contraseña
    const passwordHash = await bcrypt.hash(password, 10)

    // Crear el jugador
    const player = await prisma.player.create({
      data: {
        username,
        email: email || null,
        passwordHash,
      }
    })

    return NextResponse.json({
      message: 'Usuario creado exitosamente',
      player: {
        id: player.id,
        username: player.username,
        level: player.level
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error en registro:', error)
    return NextResponse.json(
      { error: 'Error al crear el usuario' },
      { status: 500 }
    )
  }
}
