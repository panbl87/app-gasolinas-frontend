import { useState } from 'react'
import React from 'react'
import ReportarPrecio from './ReportarPrecio'

export default function GasolineraList({ gasolineras }) {
  const [sortConfig, setSortConfig] = useState({ key: 'nombre', direction: 'asc' })
  const [expandedId, setExpandedId] = useState(null)

  const getColorByFuel = (fuel) => {
    const colors = {
      'Extra': 'bg-blue-50',
      'Super': 'bg-green-50',
      'Diesel': 'bg-yellow-50',
      'Ecopaís': 'bg-emerald-50'
    }
    return colors[fuel] || 'bg-gray-50'
  }

  const getPriceColor = (price) => {
    if (price < 2.00) return 'text-green-600 font-bold'
    if (price < 2.50) return 'text-blue-600 font-bold'
    return 'text-red-600 font-bold'
  }

  const getPromedioPrecio = (precios, tipo) => {
    if (!precios || precios.length === 0) return '-'
    const filtered = precios.filter(p => p.tipo_combustible === tipo)
    if (filtered.length === 0) return '-'
    const suma = filtered.reduce((acc, p) => acc + p.precio, 0)
    return (suma / filtered.length).toFixed(2)
  }

  const sortedGasolineras = [...gasolineras].sort((a, b) => {
    let aValue, bValue

    if (sortConfig.key === 'nombre') {
      aValue = a.nombre.toLowerCase()
      bValue = b.nombre.toLowerCase()
    } else if (sortConfig.key === 'ciudad') {
      aValue = a.ciudad.toLowerCase()
      bValue = b.ciudad.toLowerCase()
    } else if (sortConfig.key === 'marca') {
      aValue = a.marca.toLowerCase()
      bValue = b.marca.toLowerCase()
    }

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
    return 0
  })

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) return <span className="text-gray-400 text-xs">⇅</span>
    return <span className="text-purple-600 font-bold">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
  }

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id)
  }

  return (
    <div className="space-y-4">
      {/* Tabla - Vista Desktop */}
      <div className="hidden md:block bg-white rounded-lg shadow-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-purple-600 to-purple-800 text-white">
            <tr>
              <th className="px-6 py-4 text-left">
                <button
                  onClick={() => handleSort('nombre')}
                  className="font-semibold flex items-center gap-2 hover:opacity-80"
                >
                  Gasolinera <SortIcon column="nombre" />
                </button>
              </th>
              <th className="px-6 py-4 text-left">
                <button
                  onClick={() => handleSort('marca')}
                  className="font-semibold flex items-center gap-2 hover:opacity-80"
                >
                  Marca <SortIcon column="marca" />
                </button>
              </th>
              <th className="px-6 py-4 text-left">
                <button
                  onClick={() => handleSort('ciudad')}
                  className="font-semibold flex items-center gap-2 hover:opacity-80"
                >
                  Ciudad <SortIcon column="ciudad" />
                </button>
              </th>
              <th className="px-6 py-4 text-center">Extra</th>
              <th className="px-6 py-4 text-center">Super</th>
              <th className="px-6 py-4 text-center">Diesel</th>
              <th className="px-6 py-4 text-center">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedGasolineras.map(gasolinera => (
              <React.Fragment key={gasolinera.id}>
                <tr className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-semibold text-gray-900">{gasolinera.nombre}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                      {gasolinera.marca}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{gasolinera.ciudad}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={getPriceColor(parseFloat(getPromedioPrecio(gasolinera.precios, 'Extra')))}>
                      ${getPromedioPrecio(gasolinera.precios, 'Extra')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={getPriceColor(parseFloat(getPromedioPrecio(gasolinera.precios, 'Super')))}>
                      ${getPromedioPrecio(gasolinera.precios, 'Super')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={getPriceColor(parseFloat(getPromedioPrecio(gasolinera.precios, 'Diesel')))}>
                      ${getPromedioPrecio(gasolinera.precios, 'Diesel')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => toggleExpand(gasolinera.id)}
                      className="text-purple-600 hover:text-purple-800 font-semibold text-sm"
                    >
                      {expandedId === gasolinera.id ? 'Ocultar ▲' : 'Detalles ▼'}
                    </button>
                  </td>
                </tr>

                {/* Fila expandida - Detalles inmediatamente debajo */}
                {expandedId === gasolinera.id && (
                  <tr className="bg-gray-50 border-t-2 border-purple-200">
                    <td colSpan="7" className="px-6 py-6">
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <h3 className="text-xs font-semibold text-gray-600 uppercase">Nombre</h3>
                            <p className="text-sm font-bold text-gray-900">{gasolinera.nombre}</p>
                          </div>
                          <div>
                            <h3 className="text-xs font-semibold text-gray-600 uppercase">Marca</h3>
                            <p className="text-sm font-bold text-gray-900">{gasolinera.marca}</p>
                          </div>
                          <div>
                            <h3 className="text-xs font-semibold text-gray-600 uppercase">Ciudad</h3>
                            <p className="text-sm font-bold text-gray-900">{gasolinera.ciudad}</p>
                          </div>
                          <div>
                            <h3 className="text-xs font-semibold text-gray-600 uppercase">Dirección</h3>
                            <p className="text-sm font-bold text-gray-900">{gasolinera.direccion || 'No disponible'}</p>
                          </div>
                        </div>

                        <div className="border-t pt-4">
                          <h3 className="text-sm font-semibold text-gray-600 mb-3">📊 Historial de Precios</h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {gasolinera.precios && gasolinera.precios.length > 0 ? (
                              gasolinera.precios.map((precio, idx) => (
                                <div key={idx} className={`p-3 rounded ${getColorByFuel(precio.tipo_combustible)}`}>
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="font-semibold text-gray-800">{precio.tipo_combustible}</span>
                                    <span className={getPriceColor(precio.precio)}>
                                      ${precio.precio.toFixed(2)}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-500">
                                    {new Date(precio.created_at).toLocaleDateString('es-EC')} {new Date(precio.created_at).toLocaleTimeString('es-EC', {hour: '2-digit', minute: '2-digit'})}
                                  </p>
                                </div>
                              ))
                            ) : (
                              <p className="text-gray-500 text-sm">No hay precios registrados</p>
                            )}
                          </div>
                        </div>

                        {/* Reportar Precio */}
                        <div className="border-t pt-4">
                          <ReportarPrecio
                            gasolineraId={gasolinera.id}
                            gasolineranombre={gasolinera.nombre}
                            onSuccess={() => {
                              // Aquí puedes recargar datos si lo deseas
                              // Por ahora, solo cerramos el formulario
                            }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vista Móvil - Cards */}
      <div className="md:hidden space-y-4">
        {sortedGasolineras.map(gasolinera => (
          <div key={gasolinera.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-bold">{gasolinera.nombre}</h3>
                  <p className="text-purple-100 text-sm">{gasolinera.ciudad}</p>
                </div>
                <span className="px-2 py-1 bg-purple-400 rounded text-sm font-semibold">
                  {gasolinera.marca}
                </span>
              </div>
            </div>

            {/* Precios Resumen */}
            <div className="p-4 grid grid-cols-3 gap-2">
              <div className="text-center p-2 bg-blue-50 rounded">
                <p className="text-xs text-gray-600">Extra</p>
                <p className={getPriceColor(parseFloat(getPromedioPrecio(gasolinera.precios, 'Extra')))}>
                  ${getPromedioPrecio(gasolinera.precios, 'Extra')}
                </p>
              </div>
              <div className="text-center p-2 bg-green-50 rounded">
                <p className="text-xs text-gray-600">Super</p>
                <p className={getPriceColor(parseFloat(getPromedioPrecio(gasolinera.precios, 'Super')))}>
                  ${getPromedioPrecio(gasolinera.precios, 'Super')}
                </p>
              </div>
              <div className="text-center p-2 bg-yellow-50 rounded">
                <p className="text-xs text-gray-600">Diesel</p>
                <p className={getPriceColor(parseFloat(getPromedioPrecio(gasolinera.precios, 'Diesel')))}>
                  ${getPromedioPrecio(gasolinera.precios, 'Diesel')}
                </p>
              </div>
            </div>

            {/* Botón Expandir */}
            <div className="px-4 pb-4">
              <button
                onClick={() => toggleExpand(gasolinera.id)}
                className="w-full bg-purple-600 text-white py-2 rounded font-semibold hover:bg-purple-700 transition"
              >
                {expandedId === gasolinera.id ? 'Ocultar Detalles' : 'Ver Detalles'}
              </button>
            </div>

            {/* Detalles expandidos en móvil */}
            {expandedId === gasolinera.id && (
              <div className="px-4 pb-4 border-t pt-4 space-y-3">
                <div>
                  <p className="text-xs text-gray-600">Dirección</p>
                  <p className="font-semibold">{gasolinera.direccion || 'No disponible'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-2">Historial de Precios</p>
                  <div className="space-y-2">
                    {gasolinera.precios && gasolinera.precios.length > 0 ? (
                      gasolinera.precios.map((precio, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="font-semibold">{precio.tipo_combustible}</span>
                          <span className={getPriceColor(precio.precio)}>
                            ${precio.precio.toFixed(2)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">No hay precios</p>
                    )}
                  </div>
                </div>

                {/* Reportar Precio en móvil */}
                <div className="pt-3 border-t">
                  <ReportarPrecio
                    gasolineraId={gasolinera.id}
                    gasolineranombre={gasolinera.nombre}
                    onSuccess={() => {
                      // Aquí puedes recargar datos si lo deseas
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
