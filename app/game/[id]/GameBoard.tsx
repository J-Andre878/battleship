'use client'

import { fireShot } from './actions'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Ship = {
  positions: any
  shipType: string
}

type Shot = {
  x: number
  y: number
  hit: boolean
}

export function GameBoard({ 
  isEnemy, 
  gameId, 
  playerId,
  ships,
  shots,
  isMyTurn
}: { 
  isEnemy: boolean
  gameId: number
  playerId: number
  ships: Ship[]
  shots: Shot[]
  isMyTurn: boolean
}) {
  const router = useRouter()
  const [firingAt, setFiringAt] = useState<{x: number, y: number} | null>(null)
  
  const handleCellClick = async (index: number) => {
    if (!isEnemy) return // Solo puedes disparar al tablero enemigo
    if (!isMyTurn) return // Solo puedes disparar en tu turno
    
    const row = Math.floor(index / 10)
    const col = index % 10
    
    // Verificar si ya se disparó aquí
    const alreadyShot = shots.find(shot => shot.x === row && shot.y === col)
    if (alreadyShot) {
      return
    }
    
    // Verificar si ya estamos disparando
    if (firingAt) return
    
    // Marcar que estamos disparando aquí
    setFiringAt({ x: row, y: col })
    
    try {
      // Disparar en el servidor
      const result = await fireShot(gameId, playerId, row, col)
      
      if (result.success) {
        // Refrescar para obtener el estado real del servidor
        router.refresh()
        
        // Si el juego terminó, mostrar mensaje y redirigir
        if (result.gameOver) {
          alert('¡Ganaste! Hundiste todos los barcos enemigos')
          setTimeout(() => {
            router.push('/lobby')
          }, 2000)
        }
      }
    } finally {
      setFiringAt(null)
    }
  }

  // Función para verificar si una celda tiene un barco y devolver su tipo
  const getShipTypeAt = (row: number, col: number): string | null => {
    const ship = ships.find(ship => {
      const positions = ship.positions as Array<{row: number, col: number}>
      return positions.some(pos => pos.row === row && pos.col === col)
    })
    return ship ? ship.shipType : null
  }

  // Función para verificar si una celda fue disparada
  const getShotAt = (row: number, col: number) => {
    return shots.find(shot => shot.x === row && shot.y === col)
  }

  // Mapa de colores por tipo de barco
  const shipColors: {[key: string]: string} = {
    'Portaaviones': 'bg-purple-600',
    'Acorazado': 'bg-fuchsia-600',
    'Crucero': 'bg-emerald-600',
    'Submarino': 'bg-amber-600',
    'Destructor': 'bg-pink-600'
  }

  return (
    <div className="grid grid-cols-10 gap-1">
      {Array.from({ length: 100 }).map((_, i) => {
        const row = Math.floor(i / 10)
        const col = i % 10
        const shipType = getShipTypeAt(row, col)
        const shot = getShotAt(row, col)
        const isFiring = firingAt && firingAt.x === row && firingAt.y === col
        
        // Determinar el color de fondo
        let bgColor = isEnemy ? 'bg-gray-700' : 'bg-blue-900'
        
        if (!isEnemy && shipType && !shot) {
          bgColor = shipColors[shipType] || 'bg-green-700'
        }
        
        if (isFiring) {
          bgColor = 'bg-yellow-500 animate-pulse' // Disparando...
        }
        
        if (shot) {
          if (shot.hit) {
            bgColor = 'bg-red-600' // Impacto
          } else {
            bgColor = 'bg-cyan-400' // Agua
          }
        }
        
        return (
          <div
            key={i}
            onClick={() => handleCellClick(i)}
            className={`
              aspect-square rounded border transition-all duration-200
              ${bgColor}
              ${isEnemy 
                ? `border-gray-600 ${isMyTurn ? 'hover:border-gray-400 cursor-pointer' : 'cursor-not-allowed opacity-50'}` 
                : 'border-blue-700'
              }
            `}
          />
        )
      })}
    </div>
  )
}