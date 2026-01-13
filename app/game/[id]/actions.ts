'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function fireShot(gameId: number, playerId: number, x: number, y: number) {
  // Obtener el juego primero
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: {
      player1Id: true,
      player2Id: true,
      status: true,
      shots: {
        orderBy: {
          createdAt: 'desc'
        },
        take: 1
      },
      ships: {
        where: {
          playerId: {
            not: playerId
          }
        },
        select: {
          positions: true
        }
      }
    }
  })
  
  if (!game) return { success: false, message: 'Partida no encontrada' }
  
  // Verificar de quién es el turno
  const lastShot = game.shots[0]
  if (lastShot) {
    // Si el último disparo falló (hit: false), el turno cambió al otro jugador
    // Si acertó (hit: true), el mismo jugador sigue
    const shouldBeThisPlayersTurn = lastShot.hit 
      ? lastShot.playerId === playerId  // Si acertó, sigue el mismo
      : lastShot.playerId !== playerId  // Si falló, cambia de jugador
    
    if (!shouldBeThisPlayersTurn) {
      return { success: false, message: 'No es tu turno' }
    }
  } else {
    // Primer disparo del juego - debe ser player1
    if (playerId !== game.player1Id) {
      return { success: false, message: 'Player 1 empieza' }
    }
  }
  
  // Verificar si ya se disparó en esta posición
  const existingShot = await prisma.shot.findUnique({
    where: {
      gameId_playerId_x_y: {
        gameId,
        playerId,
        x,
        y
      }
    }
  })
  
  if (existingShot) {
    return { success: false, message: 'Ya disparaste aquí' }
  }
  
  // Verificar si el disparo acertó
  let hit = false
  
  for (const ship of game.ships) {
    const positions = ship.positions as Array<{row: number, col: number}>
    if (positions.some(pos => pos.row === x && pos.col === y)) {
      hit = true
      break
    }
  }
  
  // Guardar el disparo
  await prisma.shot.create({
    data: {
      gameId,
      playerId,
      x,
      y,
      hit
    }
  })
  
  // Si acertó, verificar si el juego terminó
  if (hit) {
    // Obtener todos los disparos del atacante que acertaron
    const allHits = await prisma.shot.findMany({
      where: {
        gameId,
        playerId,
        hit: true
      },
      select: {
        x: true,
        y: true
      }
    })
    
    // Verificar si todos los barcos enemigos fueron hundidos
    let allShipsSunk = true
    
    for (const ship of game.ships) {
      const positions = ship.positions as Array<{row: number, col: number}>
      
      // Verificar si todas las posiciones del barco fueron impactadas
      const shipSunk = positions.every(pos => 
        allHits.some(hit => hit.x === pos.row && hit.y === pos.col)
      )
      
      if (!shipSunk) {
        allShipsSunk = false
        break
      }
    }
    
    // Si todos los barcos fueron hundidos, terminar el juego
    if (allShipsSunk) {
      await prisma.game.update({
        where: { id: gameId },
        data: {
          status: 'finished',
          winnerId: playerId,
          finishedAt: new Date()
        }
      })
      
      return { success: true, hit, gameOver: true }
    }
  }
  
  // Revalidar la página para mostrar el nuevo disparo
  revalidatePath(`/game/${gameId}`)
  
  return { success: true, hit }
}
