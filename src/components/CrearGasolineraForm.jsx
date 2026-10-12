import { useState, useRef, useEffect } from 'react'
import { GoogleMap, Marker } from '@react-google-maps/api'
import axios from 'axios'

const API_URL = 'http://192.168.10.133:3000/api'

const containerStyle = {
  width: '100%',
  height: '300px',
  borderRadius: '8px',
  marginBottom: '16px',
}

const defaultCenter = {
  lat: -0.2173,
  lng: -78.5089,
}

export default function CrearGasolineraForm({
  onSuccess,
  onCancel,
  onGasolineraCreada
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searchingAddress, setSearchingAddress] = useState(false)
  const mapRef = useRef(null)
  const [markerPosition, setMarkerPosition] = useState(defaultCenter)

  const [formData, setFormData] = useState({
    nombre: '',
    marca: 'Primax',
    ciudad: 'Quito',
    direccion: '',
    ubicacion_gps: {
      latitud: defaultCenter.lat,
      longitud: defaultCenter.lng
    }
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleMapLoad = (map) => {
    mapRef.current = map
  }

  const handleMapClick = (e) => {
    const lat = e.latLng.lat()
    const lng = e.latLng.lng()

    setMarkerPosition({ lat, lng })
    setFormData(prev => ({
      ...prev,
      ubicacion_gps: {
        latitud: lat,
        longitud: lng
      }
    }))
  }

  const handleSearchAddress = async () => {
    if (!formData.direccion.trim()) {
      setError('Por favor ingresa una dirección')
      return
    }

    setSearchingAddress(true)
    setError(null)

    try {
      // Llamar al backend para hacer geocoding
      const response = await axios.post(`${API_URL}/geocoding/search`, {
        direccion: formData.direccion,
        ciudad: formData.ciudad
      })

      if (response.data.success && response.data.data) {
        const { latitud, longitud } = response.data.data

        // Actualizar posición del marker
        setMarkerPosition({ lat: latitud, lng: longitud })

        // Centrar mapa en la ubicación encontrada
        if (mapRef.current) {
          mapRef.current.panTo({ lat: latitud, lng: longitud })
          mapRef.current.setZoom(16)
        }

        // Actualizar coordenadas en el formulario
        setFormData(prev => ({
          ...prev,
          ubicacion_gps: {
            latitud: latitud,
            longitud: longitud
          }
        }))
      } else {
        setError('No se encontró la dirección. Intenta ser más específico.')
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || 'No se pudo buscar la dirección. Intenta hacer click en el mapa manualmente.'
      setError(errorMsg)
      console.error('Geocoding error:', err)
    } finally {
      setSearchingAddress(false)
    }
  }

  const handleAddressKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearchAddress()
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validaciones
      if (!formData.nombre.trim()) {
        setError('Por favor ingresa el nombre de la gasolinera')
        setLoading(false)
        return
      }

      if (!formData.direccion.trim()) {
        setError('Por favor ingresa la dirección')
        setLoading(false)
        return
      }

      // Crear gasolinera
      const response = await axios.post(`${API_URL}/gasolineras/crear-pendiente`, {
        nombre: formData.nombre.trim(),
        marca: formData.marca,
        ciudad: formData.ciudad,
        direccion: formData.direccion.trim(),
        ubicacion_gps: formData.ubicacion_gps
      })

      if (response.data.success) {
        // Notificar al componente padre que se creó la gasolinera
        onGasolineraCreada(response.data.data)

        // Mostrar mensaje de éxito
        setTimeout(() => {
          onSuccess()
        }, 1500)
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Error al crear gasolinera'
      setError(errorMsg)
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-900">Crear Nueva Gasolinera</h3>

      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
          <p className="font-semibold">❌ Error</p>
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Nombre */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Nombre de Gasolinera *
          </label>
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            placeholder="Ej: Primax La Vicentina"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        {/* Marca */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Marca *
          </label>
          <select
            name="marca"
            value={formData.marca}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="Primax">Primax</option>
            <option value="Masgas">Masgas</option>
            <option value="Petrocomercial">Petrocomercial</option>
            <option value="Otra">Otra</option>
          </select>
        </div>

        {/* Ciudad */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Ciudad *
          </label>
          <select
            name="ciudad"
            value={formData.ciudad}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="Quito">Quito</option>
            <option value="Guayaquil">Guayaquil</option>
            <option value="Cuenca">Cuenca</option>
            <option value="Otra">Otra</option>
          </select>
        </div>

        {/* Dirección */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Dirección *
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              onKeyPress={handleAddressKeyPress}
              placeholder="Ej: Av. Amazonas y Naciones Unidas"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <button
              type="button"
              onClick={handleSearchAddress}
              disabled={searchingAddress}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition font-semibold"
              title="Buscar en mapa (o presiona Enter)"
            >
              {searchingAddress ? '🔍...' : '🔍'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">Presiona Enter o click en 🔍 para buscar</p>
        </div>

        {/* Mapa Interactivo */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Ubicación en Mapa *
          </label>
          <p className="text-xs text-gray-500 mb-2">Busca la dirección arriba o haz click en el mapa para marcar</p>
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={markerPosition}
            zoom={13}
            onLoad={handleMapLoad}
            onClick={handleMapClick}
          >
            <Marker position={markerPosition} />
          </GoogleMap>
          <p className="text-xs text-gray-500 mt-2">
            Lat: {markerPosition.lat.toFixed(4)}, Lng: {markerPosition.lng.toFixed(4)}
          </p>
        </div>

        {/* Info */}
        <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-700 border border-blue-200">
          <p className="font-semibold mb-1">ℹ️ Nota</p>
          <p className="mb-2">La gasolinera será creada en estado "Pendiente de Verificación". Un administrador la revisará antes de que sea visible en la app.</p>
          <p className="font-semibold text-green-700">✓ No te preocupes: igual podrás reportar el precio de la gasolina ahora mismo. Tu reporte se procesará una vez se verifique la gasolinera.</p>
        </div>

        {/* Botones */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-semibold"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition font-semibold"
          >
            {loading ? 'Creando...' : '➕ Crear Gasolinera'}
          </button>
        </div>
      </form>
    </div>
  )
}
