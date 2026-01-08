export default function GamePage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header del juego */}
      <header className="bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold">Partida #{params.id}</h1>
              <p className="text-sm text-gray-400">Turno: Jugador 1</p>
            </div>
            <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
              Abandonar
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Tablero del jugador */}
          <div>
            <h2 className="text-xl font-bold mb-4">Tu Tablero</h2>
            <div className="bg-gray-800 rounded-lg p-4">
              {/* Grid 10x10 */}
              <div className="grid grid-cols-10 gap-1">
                {Array.from({ length: 100 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-square bg-blue-900 border border-blue-700 hover:bg-blue-800 cursor-pointer rounded"
                  />
                ))}
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <p className="text-sm text-gray-400">Barcos restantes: 5</p>
              <div className="flex gap-2 flex-wrap">
                <span className="bg-gray-700 px-3 py-1 rounded text-sm">Portaaviones (5)</span>
                <span className="bg-gray-700 px-3 py-1 rounded text-sm">Acorazado (4)</span>
                <span className="bg-gray-700 px-3 py-1 rounded text-sm">Crucero (3)</span>
                <span className="bg-gray-700 px-3 py-1 rounded text-sm">Submarino (3)</span>
                <span className="bg-gray-700 px-3 py-1 rounded text-sm">Destructor (2)</span>
              </div>
            </div>
          </div>

          {/* Tablero del oponente */}
          <div>
            <h2 className="text-xl font-bold mb-4">Tablero Enemigo</h2>
            <div className="bg-gray-800 rounded-lg p-4">
              {/* Grid 10x10 */}
              <div className="grid grid-cols-10 gap-1">
                {Array.from({ length: 100 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-square bg-gray-700 border border-gray-600 hover:bg-gray-600 cursor-pointer rounded"
                  />
                ))}
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <p className="text-sm text-gray-400">Barcos enemigos hundidos: 0/5</p>
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
