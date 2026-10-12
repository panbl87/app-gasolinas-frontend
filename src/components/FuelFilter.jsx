// Super primero: es el combustible de autos híbridos/turbo (precio variable)
export const FUEL_TYPES = ['Super', 'Extra', 'Ecopaís', 'Diesel']
export const DEFAULT_FUEL = 'Super'

export default function FuelFilter({ selectedFuel, setSelectedFuel }) {
  const opciones = [...FUEL_TYPES, '']

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Tipo de combustible
      </label>
      <div className="flex flex-wrap gap-2">
        {opciones.map(fuel => {
          const activo = selectedFuel === fuel
          const esSuper = fuel === 'Super'

          let clases = 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          if (activo) {
            clases = 'bg-green-600 text-white border-green-600 shadow-md'
          } else if (esSuper) {
            clases = 'bg-green-50 text-green-700 border-green-400 hover:bg-green-100'
          }

          return (
            <button
              key={fuel || 'todos'}
              type="button"
              onClick={() => setSelectedFuel(fuel)}
              className={`px-4 py-2 rounded-full border text-sm font-semibold transition-all ${clases}`}
            >
              {esSuper && '⛽ '}
              {fuel || 'Todos'}
            </button>
          )
        })}
      </div>
      {selectedFuel === 'Super' && (
        <p className="text-xs text-green-700 mt-2">
          Recomendado para autos híbridos y turbo · precio variable, compara antes de cargar
        </p>
      )}
    </div>
  )
}
