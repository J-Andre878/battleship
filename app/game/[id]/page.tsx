import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { GameBoard } from './GameBoard'
import { AutoRefresh } from './AutoRefresh'

async function abandonGame(gameId: number, playerId: number) {
  'use server'
  
  const game = await prisma.game.findUnique({
    where: { id: gameId }
  })
  
  if (!game) return
  const winnerId = game.player1Id === playerId ? game.player2Id : game.player1Id
  
  await prisma.game.update({
    where: { id: gameId },
    data: {
      status: 'finished',
      winnerId: winnerId,
      finishedAt: new Date()
    }
  })
  
  redirect('/lobby')
}
async function initializeShips(gameId: number, playerId: number) {
  'use server'
  
  // Verificar si ya tiene barcos
  const existingShips = await prisma.ship.count({
    where: { gameId, playerId }
  })
  
  if (existingShips > 0) return // Ya tiene barcos
  
  // Definir barcos: [nombre, tamaño] - ordenados del más grande al más pequeño
  const ships = [
    { type: 'Portaaviones', size: 5 },
    { type: 'Acorazado', size: 4 },
    { type: 'Crucero', size: 3 },
    { type: 'Submarino', size: 3 },
    { type: 'Destructor', size: 2 }
  ]
  
  let occupiedCells = new Set<string>()
  let allShipsPlaced = false
  let globalAttempts = 0
  
  // Intentar colocar todos los barcos, si falla reiniciar
  while (!allShipsPlaced && globalAttempts < 50) {
    globalAttempts++
    occupiedCells.clear() // Limpiar y empezar de nuevo
    let shipsPlacedCount = 0
    
    for (const ship of ships) {
      let placed = false
      let attempts = 0
      
      while (!placed && attempts < 200) {
        attempts++
        
        // Intentar horizontal o vertical
        const isHorizontal = Math.random() > 0.5
        let row, col
        
        if (isHorizontal) {
          row = Math.floor(Math.random() * 10)
          col = Math.floor(Math.random() * (11 - ship.size))
        } else {
          row = Math.floor(Math.random() * (11 - ship.size))
          col = Math.floor(Math.random() * 10)
        }
        
        // Verificar si las posiciones están libres
        const positions = []
        let canPlace = true
        
        for (let i = 0; i < ship.size; i++) {
          const r = isHorizontal ? row : row + i
          const c = isHorizontal ? col + i : col
          const key = `${r},${c}`
          
          if (occupiedCells.has(key)) {
            canPlace = false
            break
          }
          positions.push({ row: r, col: c })
        }
        
        if (canPlace) {
          // Marcar celdas como ocupadas
          positions.forEach(pos => {
            occupiedCells.add(`${pos.row},${pos.col}`)
          })
          
          placed = true
          shipsPlacedCount++
        }
      }
      
      // Si no se pudo colocar este barco, reiniciar todo
      if (!placed) {
        break
      }
    }
    
    // Si se colocaron todos los barcos exitosamente
    if (shipsPlacedCount === ships.length) {
      allShipsPlaced = true
    }
  }
  
  // Ahora guardar todos los barcos en la BD
  if (allShipsPlaced) {
    occupiedCells.clear()
    
    for (const ship of ships) {
      let placed = false
      
      while (!placed) {
        const isHorizontal = Math.random() > 0.5
        let row, col
        
        if (isHorizontal) {
          row = Math.floor(Math.random() * 10)
          col = Math.floor(Math.random() * (11 - ship.size))
        } else {
          row = Math.floor(Math.random() * (11 - ship.size))
          col = Math.floor(Math.random() * 10)
        }
        
        const positions = []
        let canPlace = true
        
        for (let i = 0; i < ship.size; i++) {
          const r = isHorizontal ? row : row + i
          const c = isHorizontal ? col + i : col
          const key = `${r},${c}`
          
          if (occupiedCells.has(key)) {
            canPlace = false
            break
          }
          positions.push({ row: r, col: c })
        }
        
        if (canPlace) {
          positions.forEach(pos => {
            occupiedCells.add(`${pos.row},${pos.col}`)
          })
          
          await prisma.ship.create({
            data: {
              gameId,
              playerId,
              shipType: ship.type,
              positions: positions
            }
          })
          
          placed = true
        }
      }
    }
  }
}

async function fireShot(gameId: number, playerId: number, x: number, y: number) {
  'use server'
  
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
  
  // Obtener el ID del oponente
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: { ships: true }
  })
  
  if (!game) return { success: false, message: 'Partida no encontrada' }
  
  const opponentId = game.player1Id === playerId ? game.player2Id : game.player1Id
  const enemyShips = game.ships.filter(ship => ship.playerId === opponentId)
  let hit = false
  
  for (const ship of enemyShips) {
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
  
  return { success: true, hit }
}

export default async function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }
  
  const resolvedParams = await params
  const gameId = parseInt(resolvedParams.id)
  const playerId = parseInt(session.user.id)
  
  // Obtener la partida
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      player1: true,
      player2: true,
      ships: true,
      shots: true
    }
  })
  
  if (!game) {
    redirect('/lobby')
  }
  
  // Verificar que el jugador pertenece a esta partida
  if (game.player1Id !== playerId && game.player2Id !== playerId) {
    redirect('/lobby')
  }

  // Inicializar barcos si no existen
  await initializeShips(gameId, playerId)
  
  // Volver a obtener la partida con los barcos actualizados
  const updatedGame = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      ships: true,
      shots: true
    }
  })
  
  // Filtrar barcos y disparos
  const myShips = updatedGame?.ships.filter(ship => ship.playerId === playerId) || []
  const enemyShips = updatedGame?.ships.filter(ship => ship.playerId !== playerId) || []
  const myShots = updatedGame?.shots.filter(shot => shot.playerId === playerId) || []
  const enemyShots = updatedGame?.shots.filter(shot => shot.playerId !== playerId) || []
  
  // Función para verificar si un barco está hundido
  function isShipSunk(ship: any, shots: any[]) {
    const positions = ship.positions as Array<{row: number, col: number}>
    return positions.every(pos => 
      shots.some(shot => shot.x === pos.row && shot.y === pos.col && shot.hit)
    )
  }
  
  // Calcular estado de barcos propios
  const myShipsStatus = myShips.map(ship => ({
    type: ship.shipType,
    sunk: isShipSunk(ship, enemyShots)
  }))
  
  // Calcular estado de barcos enemigos
  const enemyShipsStatus = enemyShips.map(ship => ({
    type: ship.shipType,
    sunk: isShipSunk(ship, myShots)
  }))
  
  const myShipsAlive = myShipsStatus.filter(s => !s.sunk).length
  const enemyShipsSunk = enemyShipsStatus.filter(s => s.sunk).length
  
  // Verificar si el juego terminó
  const isGameOver = game.status === 'finished'
  
  // Calcular de quién es el turno
  const lastShot = game.shots.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
  let isMyTurn = false
  
  if (!lastShot) {
    // Primer turno - es de player1
    isMyTurn = playerId === game.player1Id
  } else {
    // Si el último disparo acertó, sigue el mismo jugador
    // Si falló, cambia de turno
    isMyTurn = lastShot.hit 
      ? lastShot.playerId === playerId 
      : lastShot.playerId !== playerId
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Auto-refresh cuando no es tu turno */}
      <AutoRefresh isMyTurn={isMyTurn} isGameOver={isGameOver} />
      
      {/* Mensaje de juego terminado */}
      {isGameOver && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-8 rounded-lg shadow-2xl text-center">
            <h2 className="text-4xl font-bold mb-4">
              {game.winnerId === playerId ? '¡GANASTE! 🎉' : 'Perdiste 😢'}
            </h2>
            <p className="text-xl mb-6">
              {game.winnerId === playerId 
                ? 'Hundiste todos los barcos enemigos' 
                : 'Tus barcos fueron hundidos'}
            </p>
            <a 
              href="/lobby" 
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 inline-block"
            >
              Volver al Lobby
            </a>
          </div>
        </div>
      )}
      
      {/* Header del juego */}
      <header className="bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold">Partida #{resolvedParams.id}</h1>
              <p className={`text-sm font-semibold ${isMyTurn ? 'text-green-400' : 'text-red-400'}`}>
                {isMyTurn ? '¡Tu turno! 🎯' : 'Turno del oponente ⏳'}
              </p>
            </div>
            <form action={abandonGame.bind(null, gameId, playerId)}>
              <button type="submit" className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
                Abandonar
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Tablero del jugador */}
          <div>
            <h2 className="text-xl font-bold mb-4">Tu Tablero</h2>
            <div className="bg-gray-800 rounded-lg p-4">
              <GameBoard isEnemy={false} gameId={gameId} playerId={playerId} ships={myShips} shots={enemyShots} isMyTurn={false} />
            </div>
            <div className="mt-4 space-y-2">
              <p className="text-sm text-gray-400">Barcos restantes: {myShipsAlive}/5</p>
              <div className="flex gap-2 flex-wrap">
                {myShipsStatus.map((ship, idx) => {
                  const sizes: {[key: string]: number} = {
                    'Portaaviones': 5,
                    'Acorazado': 4,
                    'Crucero': 3,
                    'Submarino': 3,
                    'Destructor': 2
                  }

                  const colors: {[key: string]: string} = {
                    'Portaaviones': 'bg-purple-600 text-purple-100',
                    'Acorazado': 'bg-fuchsia-600 text-fuchsia-100', 
                    'Crucero': 'bg-emerald-600 text-emerald-100',
                    'Submarino': 'bg-amber-600 text-amber-100',
                    'Destructor': 'bg-pink-600 text-pink-100'  
                  }

                  return (
                    <span 
                      key={idx}
                      className={`px-6 py-3 rounded-lg text-base font-semibold shadow-lg ${
                        ship.sunk 
                          ? 'bg-red-900 text-red-300 line-through' 
                          : colors[ship.type]
                      }`}
                    >
                      {ship.type} ({sizes[ship.type]})
                    </span>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Tablero del oponente */}
          <div>
            <h2 className="text-xl font-bold mb-4">Tablero Enemigo</h2>
            <div className="bg-gray-800 rounded-lg p-4">
              <GameBoard isEnemy={true} gameId={gameId} playerId={playerId} ships={[]} shots={myShots} isMyTurn={isMyTurn} />
            </div>
            <div className="mt-4 space-y-2">
              <p className="text-sm text-gray-400">Barcos enemigos hundidos: {enemyShipsSunk}/5</p>
              <div className="flex gap-2 flex-wrap mb-3">
                {enemyShipsStatus.map((ship, idx) => {
                  const sizes: {[key: string]: number} = {
                    'Portaaviones': 5,
                    'Acorazado': 4,
                    'Crucero': 3,
                    'Submarino': 3,
                    'Destructor': 2
                  }
                  return (
                    <span 
                      key={idx}
                      className={`px-3 py-1 rounded text-sm ${
                        ship.sunk 
                          ? 'bg-red-900 text-red-300' 
                          : 'bg-gray-700 opacity-50'
                      }`}
                    >
                      {ship.sunk ? '💥 ' : '❓ '}{ship.type} ({sizes[ship.type]})
                    </span>
                  )
                })}
              </div>
              <div className="flex gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-600 rounded"></div>
                  <span className="text-sm">Impacto</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-500 rounded"></div>
                  <span className="text-sm">Agua</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Log de acciones */}
        <div className="mt-8 bg-gray-800 rounded-lg p-4">
          <h3 className="font-bold mb-2">Historial</h3>
          <div className="space-y-1 text-sm text-gray-400 max-h-40 overflow-y-auto">
            <p>Esperando al oponente...</p>
          </div>
        </div>
      </main>
    </div>
  );
}
