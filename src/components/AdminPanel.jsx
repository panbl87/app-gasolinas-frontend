import { useState, useEffect, useCallback, useMemo } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.10.133:3000/api'

const AUTO_REFRESH_MS = 30000

// Mismo orden que el filtro de la página principal
const TIPOS_COMBUSTIBLE = ['Super', 'Extra', 'Ecopaís', 'Diesel']

// Deben coincidir con los rangos del backend (src/routes/admin.ts), si no el backend rechaza el precio
const RANGOS_PRECIO = {
  'Super': { min: 4.00, max: 5.50 },
  'Extra': { min: 2.50, max: 4.00 },
  'Ecopaís': { min: 3.50, max: 5.00 },
  'Diesel': { min: 2.50, max: 4.00 }
}

const ADMIN_USER_ID = '00000000-0000-0000-0000-000000000000'

const TABS = [
  { id: 'pendientes', label: 'Pendientes' },
  { id: 'validados', label: 'Validados' },
  { id: 'manual', label: 'Crear Manual' }
]

const mensajeError = (err, porDefecto) =>
  err.response?.data?.message || (err.request && !err.response ? 'No se pudo conectar con el servidor' : porDefecto)

const formatearFecha = (iso) =>
  iso
    ? new Date(iso).toLocaleString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '-'

const nombreReportante = (id) => {
  if (!id) return 'Anónimo'
  if (id === ADMIN_USER_ID) return 'Admin'
  return `Usuario ${id.slice(0, 8)}`
}

const formatearPrecio = (precio) => `$${Number(precio).toFixed(2)}`

export default function AdminPanel({ token, onUnauthorized }) {
  const [tab, setTab] = useState('pendientes')

  const api = useMemo(
    () => axios.create({ baseURL: `${API_URL}/admin`, headers: { 'x-admin-token': token } }),
    [token]
  )

  // Si el token deja de ser válido (p. ej. cambió en el servidor), cerrar sesión
  useEffect(() => {
    const id = api.interceptors.response.use(
      (res) => res,
      (err) => {
        if (err.response?.status === 401) onUnauthorized()
        return Promise.reject(err)
      }
    )
    return () => api.interceptors.response.eject(id)
  }, [api, onUnauthorized])

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 -mb-px border-b-2 font-semibold text-sm transition ${
              tab === t.id
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'pendientes' && <TabPendientes api={api} />}
      {tab === 'validados' && <TabValidados api={api} />}
      {tab === 'manual' && <TabCrearManual api={api} />}
    </div>
  )
}

// ===================== PENDIENTES =====================

function TabPendientes({ api }) {
  const [reportes, setReportes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [aviso, setAviso] = useState(null)
  const [ultimaCarga, setUltimaCarga] = useState(null)
  const [rechazando, setRechazando] = useState(null)

  const cargar = useCallback(async () => {
    try {
      const res = await api.get('/reportes/pendientes')
      setReportes(res.data.data || [])
      setError(null)
      setUltimaCarga(new Date())
    } catch (err) {
      setError(mensajeError(err, 'Error al cargar reportes pendientes'))
    } finally {
      setLoading(false)
    }
  }, [api])

  useEffect(() => {
    cargar()
    const intervalo = setInterval(cargar, AUTO_REFRESH_MS)
    return () => clearInterval(intervalo)
  }, [cargar])

  const mostrarAviso = (texto) => {
    setAviso(texto)
    setTimeout(() => setAviso(null), 3000)
  }

  const validar = async (reporte) => {
    // Quitar de la lista de inmediato; si falla, se restaura
    setReportes(prev => prev.filter(r => r.id !== reporte.id))
    try {
      await api.post(`/reportes/${reporte.id}/validar`)
      mostrarAviso(`✅ Reporte validado: ${reporte.gasolineras?.nombre || ''} ${reporte.tipo_combustible} ${formatearPrecio(reporte.precio)}`)
    } catch (err) {
      setReportes(prev => [reporte, ...prev])
      setError(mensajeError(err, 'Error al validar reporte'))
    }
  }

  const confirmarRechazo = async (razon) => {
    const reporte = rechazando
    await api.post(`/reportes/${reporte.id}/rechazar`, { razon })
    setReportes(prev => prev.filter(r => r.id !== reporte.id))
    setRechazando(null)
    mostrarAviso('❌ Reporte rechazado')
  }

  const acciones = (reporte) => (
    <div className="flex gap-2">
      <button
        onClick={() => validar(reporte)}
        className="flex-1 md:flex-none px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition"
      >
        ✅ Validar
      </button>
      <button
        onClick={() => setRechazando(reporte)}
        className="flex-1 md:flex-none px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition"
      >
        ❌ Rechazar
      </button>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center text-sm text-gray-500">
        <span>
          {reportes.length} pendiente{reportes.length === 1 ? '' : 's'} · se actualiza cada 30 s
          {ultimaCarga && ` · última: ${ultimaCarga.toLocaleTimeString('es-EC')}`}
        </span>
        <button onClick={cargar} className="text-purple-600 hover:text-purple-800 font-semibold">
          ↻ Actualizar
        </button>
      </div>

      {aviso && <Mensaje tipo="exito">{aviso}</Mensaje>}
      {error && <Mensaje tipo="error">{error}</Mensaje>}

      {loading ? (
        <Cargando texto="Cargando reportes pendientes..." />
      ) : reportes.length === 0 ? (
        <Vacio texto="No hay reportes pendientes 🎉" />
      ) : (
        <TablaReportes reportes={reportes} columnaFecha="Fecha" campoFecha="created_at" acciones={acciones} />
      )}

      {rechazando && (
        <ModalRechazo
          reporte={rechazando}
          onCancel={() => setRechazando(null)}
          onConfirm={confirmarRechazo}
        />
      )}
    </div>
  )
}

function ModalRechazo({ reporte, onCancel, onConfirm }) {
  const [razon, setRazon] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(null)

  const enviar = async (e) => {
    e.preventDefault()
    if (!razon.trim()) {
      setError('Escribe la razón del rechazo')
      return
    }
    setEnviando(true)
    setError(null)
    try {
      await onConfirm(razon.trim())
    } catch (err) {
      setError(mensajeError(err, 'Error al rechazar reporte'))
      setEnviando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <form onSubmit={enviar} className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Rechazar reporte</h2>
          <button type="button" onClick={onCancel} className="text-gray-500 hover:text-gray-700 text-2xl font-bold">
            ✕
          </button>
        </div>

        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm">
          <p className="font-semibold text-gray-900">{reporte.gasolineras?.nombre || 'Gasolinera desconocida'}</p>
          <p className="text-gray-600">
            {reporte.tipo_combustible} · {formatearPrecio(reporte.precio)} · {formatearFecha(reporte.created_at)}
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Razón del rechazo</label>
          <textarea
            value={razon}
            onChange={(e) => setRazon(e.target.value)}
            rows={3}
            autoFocus
            placeholder="Ej: Precio fuera de lo real, gasolinera equivocada..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <p className="text-xs text-gray-500 mt-1">El reporte se eliminará.</p>
        </div>

        {error && <Mensaje tipo="error">{error}</Mensaje>}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-semibold"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={enviando}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition font-semibold"
          >
            {enviando ? 'Rechazando...' : '❌ Rechazar'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ===================== VALIDADOS =====================

function TabValidados({ api }) {
  const [reportes, setReportes] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/reportes', { params: { estado: 'VALIDADO' } })
      setReportes(res.data.data || [])
      setStats(res.data.stats || null)
      setError(null)
    } catch (err) {
      setError(mensajeError(err, 'Error al cargar reportes validados'))
    } finally {
      setLoading(false)
    }
  }, [api])

  useEffect(() => {
    cargar()
  }, [cargar])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Estadistica titulo="Validados hoy" valor={stats?.hoy} />
        <Estadistica titulo="Validados esta semana" valor={stats?.semana} />
      </div>

      <div className="flex justify-between items-center text-sm text-gray-500">
        <span>Últimos {reportes.length} validados</span>
        <button onClick={cargar} className="text-purple-600 hover:text-purple-800 font-semibold">
          ↻ Actualizar
        </button>
      </div>

      {error && <Mensaje tipo="error">{error}</Mensaje>}

      {loading ? (
        <Cargando texto="Cargando reportes validados..." />
      ) : reportes.length === 0 ? (
        <Vacio texto="Todavía no hay reportes validados" />
      ) : (
        <TablaReportes reportes={reportes} columnaFecha="Validado" campoFecha="updated_at" />
      )}
    </div>
  )
}

function Estadistica({ titulo, valor }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-purple-600">
      <p className="text-sm text-gray-500">{titulo}</p>
      <p className="text-3xl font-bold text-gray-900">{valor ?? '-'}</p>
    </div>
  )
}

// ===================== CREAR MANUAL =====================

function TabCrearManual({ api }) {
  const [gasolineras, setGasolineras] = useState([])
  const [cargandoGasolineras, setCargandoGasolineras] = useState(true)
  const [form, setForm] = useState({ gasolinera_id: '', tipo_combustible: 'Super', precio: '' })
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(null)
  const [exito, setExito] = useState(null)

  useEffect(() => {
    axios
      .get(`${API_URL}/gasolineras`)
      .then(res => setGasolineras(res.data.data || []))
      .catch(err => setError(mensajeError(err, 'Error al cargar gasolineras')))
      .finally(() => setCargandoGasolineras(false))
  }, [])

  const rango = RANGOS_PRECIO[form.tipo_combustible]
  const precioNum = form.precio === '' ? null : parseFloat(form.precio)

  let advertencia = null
  if (precioNum !== null) {
    if (isNaN(precioNum)) advertencia = 'Ingresa un precio válido'
    else if (precioNum <= 0) advertencia = 'El precio debe ser mayor que $0'
    else if (precioNum < rango.min || precioNum > rango.max)
      advertencia = `⚠️ Fuera de rango: ${form.tipo_combustible} debe estar entre $${rango.min.toFixed(2)} y $${rango.max.toFixed(2)}`
  }

  const puedeEnviar = form.gasolinera_id && precioNum !== null && !advertencia && !enviando

  const actualizar = (campo, valor) => {
    setForm(prev => ({ ...prev, [campo]: valor }))
    setExito(null)
    setError(null)
  }

  const enviar = async (e) => {
    e.preventDefault()
    if (!form.gasolinera_id) {
      setError('Selecciona una gasolinera')
      return
    }
    if (!puedeEnviar) return

    setEnviando(true)
    setError(null)
    setExito(null)
    try {
      await api.post('/reportes/crear-manual', {
        gasolinera_id: form.gasolinera_id,
        tipo_combustible: form.tipo_combustible,
        precio: precioNum
      })
      const gasolinera = gasolineras.find(g => g.id === form.gasolinera_id)
      setExito(`Reporte creado: ${gasolinera?.nombre || ''} · ${form.tipo_combustible} · ${formatearPrecio(precioNum)}`)
      setForm(prev => ({ ...prev, precio: '' }))
    } catch (err) {
      setError(mensajeError(err, 'Error al crear reporte'))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={enviar} className="bg-white rounded-lg shadow-md p-6 max-w-lg space-y-5">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Gasolinera</label>
        <select
          value={form.gasolinera_id}
          onChange={(e) => actualizar('gasolinera_id', e.target.value)}
          disabled={cargandoGasolineras}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
        >
          <option value="">
            {cargandoGasolineras ? 'Cargando gasolineras...' : '-- Selecciona una gasolinera --'}
          </option>
          {gasolineras.map(g => (
            <option key={g.id} value={g.id}>
              {g.nombre} ({g.ciudad})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de combustible</label>
        <div className="grid grid-cols-4 gap-2">
          {TIPOS_COMBUSTIBLE.map(fuel => (
            <button
              key={fuel}
              type="button"
              onClick={() => actualizar('tipo_combustible', fuel)}
              className={`px-2 py-1.5 rounded-lg border text-sm font-semibold uppercase transition-all ${
                form.tipo_combustible === fuel
                  ? 'bg-purple-600 border-purple-600 text-white'
                  : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {fuel}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Precio ($)</label>
        <div className="relative">
          <span className="absolute left-3 top-2 text-gray-600 font-semibold">$</span>
          <input
            type="number"
            value={form.precio}
            onChange={(e) => actualizar('precio', e.target.value)}
            placeholder={rango.min.toFixed(2)}
            step="0.01"
            min="0"
            className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              advertencia ? 'border-amber-400 focus:ring-amber-400' : 'border-gray-300 focus:ring-purple-500'
            }`}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Rango válido {form.tipo_combustible}: ${rango.min.toFixed(2)} - ${rango.max.toFixed(2)}
        </p>
        {advertencia && <p className="text-sm text-amber-700 mt-1">{advertencia}</p>}
      </div>

      {exito && <Mensaje tipo="exito">✅ {exito}</Mensaje>}
      {error && <Mensaje tipo="error">{error}</Mensaje>}

      <button
        type="submit"
        disabled={!puedeEnviar}
        className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition font-semibold"
      >
        {enviando ? 'Creando...' : 'Crear Reporte'}
      </button>
    </form>
  )
}

// ===================== COMPONENTES COMUNES =====================

function TablaReportes({ reportes, columnaFecha, campoFecha, acciones }) {
  return (
    <>
      {/* Desktop: tabla */}
      <div className="hidden md:block bg-white rounded-lg shadow-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-purple-600 to-purple-800 text-white text-sm">
            <tr>
              <th className="px-4 py-3 text-left">Gasolinera</th>
              <th className="px-4 py-3 text-left">Tipo Combustible</th>
              <th className="px-4 py-3 text-right">Precio</th>
              <th className="px-4 py-3 text-left">Reportado Por</th>
              <th className="px-4 py-3 text-left">{columnaFecha}</th>
              {acciones && <th className="px-4 py-3 text-center">Acción</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {reportes.map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-semibold text-gray-900">{r.gasolineras?.nombre || 'Desconocida'}</p>
                  {r.gasolineras?.ciudad && <p className="text-xs text-gray-500">{r.gasolineras.ciudad}</p>}
                </td>
                <td className="px-4 py-3 text-gray-700">{r.tipo_combustible}</td>
                <td className="px-4 py-3 text-right font-bold text-gray-900">{formatearPrecio(r.precio)}</td>
                <td className="px-4 py-3 text-gray-700 text-sm">{nombreReportante(r.reportado_por)}</td>
                <td className="px-4 py-3 text-gray-700 text-sm">{formatearFecha(r[campoFecha])}</td>
                {acciones && <td className="px-4 py-3">{acciones(r)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Móvil: cards */}
      <div className="md:hidden space-y-3">
        {reportes.map(r => (
          <div key={r.id} className="bg-white rounded-lg shadow-md p-4 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-gray-900">{r.gasolineras?.nombre || 'Desconocida'}</p>
                <p className="text-sm text-gray-600">{r.tipo_combustible}</p>
              </div>
              <p className="text-xl font-bold text-gray-900">{formatearPrecio(r.precio)}</p>
            </div>
            <p className="text-xs text-gray-500">
              {nombreReportante(r.reportado_por)} · {formatearFecha(r[campoFecha])}
            </p>
            {acciones && <div className="pt-2">{acciones(r)}</div>}
          </div>
        ))}
      </div>
    </>
  )
}

function Mensaje({ tipo, children }) {
  const estilos = tipo === 'exito'
    ? 'bg-green-100 border-green-400 text-green-700'
    : 'bg-red-100 border-red-400 text-red-700'
  return <div className={`p-3 border rounded-lg text-sm ${estilos}`}>{children}</div>
}

function Cargando({ texto }) {
  return <p className="text-center py-12 text-gray-500">{texto}</p>
}

function Vacio({ texto }) {
  return <p className="text-center py-12 text-gray-500 bg-white rounded-lg shadow-md">{texto}</p>
}
