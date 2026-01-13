'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function AutoRefresh({ 
  isMyTurn, 
  isGameOver 
}: { 
  isMyTurn: boolean
  isGameOver: boolean 
}) {
  const router = useRouter()
  
  useEffect(() => {
    // Solo hacer polling si NO es mi turno y el juego NO terminó
    if (!isMyTurn && !isGameOver) {
      const interval = setInterval(() => {
        router.refresh()
      }, 3000) // Refrescar cada 3 segundos
      
      return () => clearInterval(interval)
    }
  }, [isMyTurn, isGameOver, router])
  
  return null // Este componente no renderiza nada
}
