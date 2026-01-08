export default function LobbyPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Battleship Lobby</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-900 font-medium">Usuario: Player1</span>
              <span className="text-sm text-gray-900 font-medium">Nivel: 1</span>
              <button className="text-sm text-red-600 hover:text-red-800">
                Cerrar Sesión
              </button>
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
              <button className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 font-medium">
                Crear Partida
              </button>
            </div>

            {/* Estadísticas del jugador */}
            <div className="bg-white rounded-lg shadow p-6 mt-6">
              <h2 className="text-xl font-bold mb-4 text-black">Estadísticas</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-800">Partidas jugadas:</span>
                  <span className="font-semibold text-black">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-800">Victorias:</span>
                  <span className="font-semibold text-green-700">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-800">Derrotas:</span>
                  <span className="font-semibold text-red-700">0</span>
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
                {/* Ejemplo de partida esperando */}
                <div className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-black">Partida #1</p>
                      <p className="text-sm text-gray-700">Esperando jugador...</p>
                      <p className="text-xs text-gray-700">Creada por: Player2</p>
                    </div>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                      Unirse
                    </button>
                  </div>
                </div>

                {/* Ejemplo de partida en curso */}
                <div className="px-6 py-4 bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-black">Partida #2</p>
                      <p className="text-sm text-green-700 font-medium">En curso</p>
                      <p className="text-xs text-gray-700">Player3 vs Player4</p>
                    </div>
                    <button className="bg-gray-400 text-white px-4 py-2 rounded-lg cursor-not-allowed" disabled>
                      En Juego
                    </button>
                  </div>
                </div>

                {/* Mensaje cuando no hay partidas */}
                <div className="px-6 py-8 text-center text-gray-700">
                  <p className="font-medium">No hay partidas disponibles</p>
                  <p className="text-sm mt-2">¡Crea una nueva partida para empezar!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
