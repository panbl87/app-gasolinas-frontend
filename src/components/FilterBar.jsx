import FuelFilter from './FuelFilter'

export default function FilterBar({ selectedFuel, setSelectedFuel, searchTerm, setSearchTerm }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Búsqueda */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Buscar gasolinera
          </label>
          <input
            type="text"
            placeholder="Ej: PRIMAX, MASGAS..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Filtro de combustible */}
        <FuelFilter selectedFuel={selectedFuel} setSelectedFuel={setSelectedFuel} />
      </div>

      {/* Chips con filtros activos */}
      <div className="mt-4 flex gap-2 flex-wrap">
        {selectedFuel && (
          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
            Combustible: {selectedFuel}
            <button
              onClick={() => setSelectedFuel('')}
              className="ml-2 font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}
        {searchTerm && (
          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
            Búsqueda: {searchTerm}
            <button
              onClick={() => setSearchTerm('')}
              className="ml-2 font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
