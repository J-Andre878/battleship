
import { auth , signOut } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

async function createGame(playerId: number) {
  'use server'
  
  const newGame = await prisma.game.create({
    data: {
      player1Id: playerId,
      status: 'waiting'
    }
  })
  
  redirect(`/game/${newGame.id}`)
}

async function joinGame(gameId: number, playerId: number) {
  'use server'
  
  await prisma.game.update({
    where: { id: gameId },
    data: {
      player2Id: playerId,
      status: 'in_progress'
    }
  })
  
  redirect(`/game/${gameId}`)
}

async function handleSignOut() {
  'use server'
  await signOut()
}

export default async function LobbyPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }
  const player = await prisma.player.findUnique({
    where: { id: parseInt(session.user.id) }
  })
  if (!player) {
    redirect('/login')
  }
  const totalGames = await prisma.game.count({
    where: {
      OR: [
        { player1Id: player.id },
        { player2Id: player.id }
      ],
      status: { not: 'waiting' }
    }
  })
  const wins = await prisma.game.count({
    where: {
      winnerId: player.id
    }
  })
  const losses = totalGames - wins

  const availableGames = await prisma.game.findMany({
    where: {
      status: 'waiting',
      player1Id: { not: player.id }
    },
    include: {
      player1: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Battleship Lobby</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-900 font-medium">Usuario: {player.username}</span>
              <span className="text-sm text-gray-900 font-medium">Nivel: {player.level}</span>
              <form action={handleSignOut}>
                <button type ="submit" className="text-sm text-red-600 hover:text-red-800">
                  Cerrar Sesión
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Crear nueva partida */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4 text-black">Nueva Partida</h2>
              <form action={createGame.bind(null, player.id)}>
                <button type="submit" className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 font-medium">
                  Crear Partida
                </button>
              </form>
            </div>

            {/* Estadísticas del jugador */}
            <div className="bg-white rounded-lg shadow p-6 mt-6">
              <h2 className="text-xl font-bold mb-4 text-black">Estadísticas</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-800">Partidas jugadas:</span>
                  <span className="font-semibold text-black">{totalGames}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-800">Victorias:</span>
                  <span className="font-semibold text-green-700">{wins}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-800">Derrotas:</span>
                  <span className="font-semibold text-red-700">{losses}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de partidas disponibles */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-black">Partidas Disponibles</h2>
              </div>
              
              <div className="divide-y divide-gray-200">
                {availableGames.length === 0 ? (
                  <div className="px-6 py-8 text-center text-gray-700">
                    <p className="font-medium">No hay partidas disponibles</p>
                    <p className="text-sm mt-2">¡Crea una nueva partida para empezar!</p>
                  </div>
                ) : (
                  availableGames.map((game) => (
                    <div key={game.id} className="px-6 py-4 hover:bg-gray-50">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-black">Partida #{game.id}</p>
                          <p className="text-sm text-gray-700">Esperando jugador...</p>
                          <p className="text-xs text-gray-700">Creada por: {game.player1?.username}</p>
                        </div>
                        <form action={joinGame.bind(null, game.id, player.id)}>
                          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                            Unirse
                          </button>
                        </form>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
