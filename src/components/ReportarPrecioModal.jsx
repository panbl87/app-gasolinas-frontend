import { useState } from 'react'
import axios from 'axios'
import CrearGasolineraForm from './CrearGasolineraForm'
import { FUEL_TYPES, DEFAULT_FUEL } from './FuelFilter'

const API_URL = 'http://192.168.10.133:3000/api'

// Rangos de precios por tipo de combustible (Ecuador)
const RANGOS_PRECIO = {
  'Extra': { min: 2.50, max: 4.00 },
  'Super': { min: 4.00, max: 5.50 },
  'Diesel': { min: 2.50, max: 4.00 },
  'Ecopaís': { min: 3.50, max: 5.00 }
}

export default function ReportarPrecioModal({
  isOpen,
  onClose,
  gasolineras = [],
  gasolineraIdPrefijada = null,
  gasolineranombrePrefijada = null,
  onSuccess
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [modoCrearGasolinera, setModoCrearGasolinera] = useState(false)
  const [gasolineraRecienCreada, setGasolineraRecienCreada] = useState(null)

  const [formData, setFormData] = useState({
    gasolinera_id: gasolineraIdPrefijada || (gasolineras.length > 0 ? gasolineras[0].id : ''),
    tipo_combustible: DEFAULT_FUEL,
    precio: ''
  })

  const gasolineraSeleccionada = gasolineraIdPrefijada
    ? { id: gasolineraIdPrefijada, nombre: gasolineranombrePrefijada }
    : gasolineras.find(g => g.id === formData.gasolinera_id)

  const rangoActual = RANGOS_PRECIO[formData.tipo_combustible]

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'precio' ? (value === '' ? '' : parseFloat(value)) : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      if (!formData.gasolinera_id) {
        setError('Por favor selecciona una gasolinera')
        setLoading(false)
        return
      }

      if (!formData.precio) {
        setError('Por favor ingresa un precio')
        setLoading(false)
        return
      }

      const precio = parseFloat(formData.precio)
      if (isNaN(precio) || precio < rangoActual.min || precio > rangoActual.max) {
        setError(`Precio de ${formData.tipo_combustible} debe estar entre $${rangoActual.min} y $${rangoActual.max}`)
        setLoading(false)
        return
      }

      const response = await axios.post(`${API_URL}/precios/reportar`, {
        gasolinera_id: formData.gasolinera_id,
        tipo_combustible: formData.tipo_combustible,
        precio: precio
      })

      if (response.data.success) {
        setSuccess(true)
        setFormData({
          gasolinera_id: gasolineraIdPrefijada || (gasolineras.length > 0 ? gasolineras[0].id : ''),
          tipo_combustible: DEFAULT_FUEL,
          precio: ''
        })

        setTimeout(() => {
          onClose()
          if (onSuccess) {
            onSuccess()
          }
        }, 2000)
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Error reportando precio'
      setError(errorMsg)
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Reportar Precio</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ✕
          </button>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            <p className="font-semibold">✅ ¡Éxito!</p>
            <p className="text-sm">Precio reportado exitosamente. Gracias por contribuir.</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            <p className="font-semibold">❌ Error</p>
            <p>{error}</p>
          </div>
        )}

        {/* Form */}
        {!success && !modoCrearGasolinera && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Gasolinera - Solo si no está prefijada */}
            {!gasolineraIdPrefijada && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Gasolinera
                </label>
                <select
                  name="gasolinera_id"
                  value={formData.gasolinera_id}
                  onChange={(e) => {
                    if (e.target.value === 'NUEVA') {
                      setModoCrearGasolinera(true)
                    } else {
                      handleChange(e)
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                >
                  <option value="">-- Selecciona una gasolinera --</option>
                  {gasolineras.map(gasolinera => (
                    <option key={gasolinera.id} value={gasolinera.id}>
                      {gasolinera.nombre} ({gasolinera.ciudad})
                    </option>
                  ))}
                  <option value="NUEVA" style={{ color: '#16a34a', fontWeight: 'bold' }}>
                    ➕ Crear nueva gasolinera
                  </option>
                </select>
              </div>
            )}

            {/* Gasolinera Prefijada */}
            {gasolineraIdPrefijada && gasolineraSeleccionada && (
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-sm text-gray-600">Gasolinera</p>
                <p className="font-semibold text-gray-900">{gasolineraSeleccionada.nombre}</p>
              </div>
            )}

            {/* Tipo de Combustible */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tipo de Combustible
              </label>
              <div className="grid grid-cols-4 gap-2">
                {FUEL_TYPES.map(fuel => (
                  <button
                    key={fuel}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, tipo_combustible: fuel }))}
                    className={`px-2 py-1.5 rounded-lg border text-sm font-semibold transition-all ${
                      formData.tipo_combustible === fuel
                        ? 'bg-green-600 border-green-600 text-white'
                        : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {fuel}
                  </button>
                ))}
              </div>
            </div>

            {/* Precio */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Precio ($)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-600 font-semibold">$</span>
                <input
                  type="number"
                  name="precio"
                  value={formData.precio}
                  onChange={handleChange}
                  placeholder={`Ej: ${rangoActual.min}`}
                  step="0.01"
                  min={rangoActual.min}
                  max={rangoActual.max}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Rango válido: ${rangoActual.min} - ${rangoActual.max}
              </p>
            </div>

            {/* Info */}
            <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-700 border border-blue-200">
              <p className="font-semibold mb-1">💡 Tip</p>
              <p>Tu reporte es anónimo. Múltiples reportes con el mismo precio aumentan la confiabilidad.</p>
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition font-semibold"
              >
                {loading ? 'Enviando...' : 'Reportar'}
              </button>
            </div>
          </form>
        )}

        {/* Crear Gasolinera */}
        {!success && modoCrearGasolinera && (
          <CrearGasolineraForm
            onCancel={() => {
              setModoCrearGasolinera(false)
              setFormData(prev => ({ ...prev, gasolinera_id: '' }))
            }}
            onSuccess={() => {
              setModoCrearGasolinera(false)
              if (gasolineraRecienCreada) {
                setFormData(prev => ({
                  ...prev,
                  gasolinera_id: gasolineraRecienCreada.id
                }))
              }
            }}
            onGasolineraCreada={(gasolinera) => {
              setGasolineraRecienCreada(gasolinera)
            }}
          />
        )}
      </div>
    </div>
  )
}
