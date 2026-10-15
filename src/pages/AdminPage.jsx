import { useState, useCallback } from 'react'
import axios from 'axios'
import AdminPanel from '../components/AdminPanel'

import { API_URL } from '../config'
const STORAGE_KEY = 'adminToken'

const leerToken = () => {
  try {
    return sessionStorage.getItem(STORAGE_KEY) || ''
  } catch {
    return ''
  }
}

const guardarToken = (token) => {
  try {
    if (token) sessionStorage.setItem(STORAGE_KEY, token)
    else sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // sessionStorage no disponible (modo privado): la sesión dura hasta recargar
  }
}

export default function AdminPage() {
  const [token, setToken] = useState(leerToken)
  const [input, setInput] = useState('')
  const [verificando, setVerificando] = useState(false)
  const [error, setError] = useState(null)

  // El token se valida contra el backend: así no queda escrito en el código del frontend
  const ingresar = async (e) => {
    e.preventDefault()
    const candidato = input.trim()
    if (!candidato) {
      setError('Ingresa el token')
      return
    }

    setVerificando(true)
    setError(null)
    try {
      await axios.get(`${API_URL}/admin/reportes/pendientes`, {
        headers: { 'x-admin-token': candidato },
        params: { limit: 1 }
      })
      guardarToken(candidato)
      setToken(candidato)
      setInput('')
    } catch (err) {
      if (err.response?.status === 401) setError('Token incorrecto')
      else if (err.response) setError(err.response.data?.message || 'Error del servidor')
      else setError('No se pudo conectar con el servidor')
    } finally {
      setVerificando(false)
    }
  }

  const cerrarSesion = useCallback(() => {
    guardarToken('')
    setToken('')
  }, [])

  const sesionExpirada = useCallback(() => {
    cerrarSesion()
    setError('La sesión expiró o el token cambió. Ingresa de nuevo.')
  }, [cerrarSesion])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-purple-600 to-purple-800 text-white">
        <div className="max-w-6xl mx-auto px-4 py-6 flex justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Panel Admin</h1>
            <p className="text-purple-100 text-sm">App Gasolinas Ecuador</p>
          </div>
          <div className="flex items-center gap-3">
            <a href="/" className="text-purple-100 hover:text-white text-sm font-semibold">
              ← Volver a la app
            </a>
            {token && (
              <button
                onClick={cerrarSesion}
                className="px-4 py-2 bg-white text-purple-700 hover:bg-purple-50 rounded-lg text-sm font-semibold transition"
              >
                Cerrar sesión
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {token ? (
          <AdminPanel token={token} onUnauthorized={sesionExpirada} />
        ) : (
          <form onSubmit={ingresar} className="bg-white rounded-lg shadow-md p-6 max-w-sm mx-auto space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Ingresar</h2>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Token de administrador</label>
              <input
                type="password"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                autoFocus
                autoComplete="current-password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            {error && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">{error}</div>
            )}
            <button
              type="submit"
              disabled={verificando}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition font-semibold"
            >
              {verificando ? 'Verificando...' : 'Ingresar'}
            </button>
          </form>
        )}
      </main>
    </div>
  )
}
