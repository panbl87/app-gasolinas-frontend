import { useState, useEffect } from 'react'
import axios from 'axios'
import { useLoadScript } from '@react-google-maps/api'
import Header from './components/Header'
import FilterBar from './components/FilterBar'
import { DEFAULT_FUEL } from './components/FuelFilter'
import GasolineraList from './components/GasolineraList'
import Map from './components/Map'
import ReportarPrecioModal from './components/ReportarPrecioModal'

const API_URL = 'http://192.168.10.133:3000/api'
const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

function App() {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: apiKey || '',
  })

  const [gasolineras, setGasolineras] = useState([])
  const [precios, setPrecios] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const [selectedFuel, setSelectedFuel] = useState(DEFAULT_FUEL)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showMap, setShowMap] = useState(false)
  const [reportarPrecioOpen, setReportarPrecioOpen] = useState(false)

  // Cargar gasolineras y precios al iniciar
  useEffect(() => {
    cargarDatos()
  }, [])

  // Filtrar cuando cambia el combustible, búsqueda, gasolineras o precios
  useEffect(() => {
    filtrarDatos()
  }, [selectedFuel, searchTerm, precios, gasolineras])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      // Obtener gasolineras
      const gasRes = await axios.get(`${API_URL}/gasolineras`)

      if (gasRes.data.success) {
        const gas = gasRes.data.data || []
        setGasolineras(gas)

        // Obtener precios de cada gasolinera
        const todosPreciosData = []
        for (const g of gas) {
          try {
            const precioRes = await axios.get(`${API_URL}/precios/gasolinera/${g.id}`)
            if (precioRes.data.success && precioRes.data.data) {
              todosPreciosData.push(...precioRes.data.data)
            }
          } catch (err) {
            console.error(`Error cargando precios de ${g.nombre}:`, err)
          }
        }
        setPrecios(todosPreciosData)
      }
    } catch (err) {
      console.error('Error cargando datos:', err)
      setError('Error al cargar los datos. Verifica que el servidor esté corriendo.')
    } finally {
      setLoading(false)
    }
  }

  const filtrarDatos = () => {
    let resultado = gasolineras.map(gas => ({
      ...gas,
      precios: precios.filter(p => p.gasolinera_id === gas.id)
    }))

    // Filtrar por tipo de combustible
    if (selectedFuel) {
      resultado = resultado.map(gas => ({
        ...gas,
        precios: gas.precios.filter(p => p.tipo_combustible === selectedFuel)
      })).filter(gas => gas.precios.length > 0)
    }

    // Filtrar por búsqueda (nombre de gasolinera)
    if (searchTerm) {
      resultado = resultado.filter(gas =>
        gas.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredData(resultado)
  }

  if (!apiKey) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            ⚠️ Error: API key de Google Maps no configurada en .env
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Botones de vista */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setShowMap(false)}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              !showMap
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            📋 Lista
          </button>
          <button
            onClick={() => setShowMap(true)}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              showMap
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            🗺️ Mapa
          </button>
        </div>

        <FilterBar
          selectedFuel={selectedFuel}
          setSelectedFuel={setSelectedFuel}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />

        {loading && (
          <div className="text-center py-12">
            <p className="text-gray-500">Cargando datos...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {showMap ? (
              // Vista de mapa
              isLoaded ? (
                <div className="bg-white rounded-lg shadow-lg p-4 mb-8">
                  <Map gasolineras={filteredData} />
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">Cargando mapa...</p>
                </div>
              )
            ) : (
              // Vista de lista
              <>
                {filteredData.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No hay resultados con los filtros seleccionados</p>
                  </div>
                )}

                {filteredData.length > 0 && (
                  <GasolineraList gasolineras={filteredData} />
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Botón Flotante Global (FAB) - Reportar Precio */}
      <button
        onClick={() => setReportarPrecioOpen(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg flex items-center justify-center font-bold text-xl transition-all hover:scale-110 z-40"
        title="Reportar precio"
      >
        📝
      </button>

      {/* Modal de Reportar Precio */}
      <ReportarPrecioModal
        isOpen={reportarPrecioOpen}
        onClose={() => setReportarPrecioOpen(false)}
        gasolineras={gasolineras}
        onSuccess={() => {
          cargarDatos()
        }}
      />
    </div>
  )
}

export default App
