import { useState } from 'react'
import axios from 'axios'

const API_URL = 'http://192.168.10.133:3000/api'

export default function ReportarPrecio({ gasolineraId, gasolineranombre, onSuccess }) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    tipo_combustible: 'Extra',
    precio: ''
  })

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
      // Validaciones
      if (!formData.precio) {
        setError('Por favor ingresa un precio')
        setLoading(false)
        return
      }

      const precio = parseFloat(formData.precio)
      if (isNaN(precio) || precio < 1.50 || precio > 3.50) {
        setError('Precio debe estar entre $1.50 y $3.50')
        setLoading(false)
        return
      }

      const response = await axios.post(`${API_URL}/precios/reportar`, {
        gasolinera_id: gasolineraId,
        tipo_combustible: formData.tipo_combustible,
        precio: precio
      })

      if (response.data.success) {
        setSuccess(true)
        setFormData({ tipo_combustible: 'Extra', precio: '' })

        // Cerrar modal después de 2 segundos
        setTimeout(() => {
          setIsOpen(false)
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

  return (
    <>
      {/* Botón para abrir modal */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold text-sm"
      >
        📝 Reportar Precio
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Reportar Precio</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ✕
              </button>
            </div>

            {/* Nombre de gasolinera */}
            <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-sm text-gray-600">Gasolinera</p>
              <p className="font-semibold text-gray-900">{gasolineranombre}</p>
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
            {!success && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Tipo de Combustible */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tipo de Combustible
                  </label>
                  <select
                    name="tipo_combustible"
                    value={formData.tipo_combustible}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                  >
                    <option value="Extra">Extra</option>
                    <option value="Super">Super</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Ecopaís">Ecopaís</option>
                  </select>
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
                      placeholder="Ej: 2.45"
                      step="0.01"
                      min="1.50"
                      max="3.50"
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Rango válido: $1.50 - $3.50</p>
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
                    onClick={() => setIsOpen(false)}
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
          </div>
        </div>
      )}
    </>
  )
}
