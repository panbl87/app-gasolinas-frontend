import { GoogleMap } from '@react-google-maps/api'
import { useState, useRef, useEffect } from 'react'
import ReportarPrecioModal from './ReportarPrecioModal'

const containerStyle = {
  width: '100%',
  height: '500px',
  borderRadius: '8px',
  backgroundColor: '#e5e5e5'
}

const defaultCenter = {
  lat: -0.2173,
  lng: -78.5089,
}

export default function Map({ gasolineras }) {
  const [selectedMarker, setSelectedMarker] = useState(null)
  const [reportarPrecioOpen, setReportarPrecioOpen] = useState(false)
  const [gasolineraSeleccionada, setGasolineraSeleccionada] = useState(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const infoWindowRef = useRef(null)

  const handleMapLoad = (map) => {
    mapRef.current = map
    console.log('Mapa cargado, agregando marcadores...')
    addMarkers()
  }

  const getMarkerIcon = (marca) => {
    // Colores pasteles personalizados por marca
    const colorMap = {
      'Primax': '#FFB399',      // Naranja pastel
      'Masgas': '#99E699',       // Verde pastel
      'Petrocomercial': '#99CCFF', // Azul pastel
      'Otra': '#E8B4D9',        // Morado pastel (fallback)
    }
    const color = colorMap[marca] || '#E8B4D9'

    // Crear ícono SVG personalizado
    const svgIcon = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 50" width="40" height="50">
        <path d="M20 0C8.95 0 0 8.95 0 20c0 11.05 20 30 20 30s20-18.95 20-30c0-11.05-8.95-20-20-20z"
              fill="${color}" stroke="white" stroke-width="1.5"/>
        <circle cx="20" cy="20" r="8" fill="white"/>
      </svg>
    `

    return {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svgIcon),
      scaledSize: new window.google.maps.Size(35, 45),
      origin: new window.google.maps.Point(0, 0),
      anchor: new window.google.maps.Point(17.5, 45),
    }
  }

  const addMarkers = () => {
    if (!mapRef.current || !gasolineras) return

    // Limpiar marcadores anteriores
    markersRef.current.forEach(marker => marker.setMap(null))
    markersRef.current = []

    // Crear nuevos marcadores
    gasolineras.forEach(gasolinera => {
      const marker = new window.google.maps.Marker({
        position: {
          lat: gasolinera.ubicacion_gps?.latitud || -0.2173,
          lng: gasolinera.ubicacion_gps?.longitud || -78.5089,
        },
        map: mapRef.current,
        title: gasolinera.nombre,
        icon: getMarkerIcon(gasolinera.marca),
      })

      // Efecto hover
      marker.addListener('mouseover', () => {
        marker.setZIndex(window.google.maps.Marker.MAX_ZINDEX + 1)
      })

      marker.addListener('mouseout', () => {
        marker.setZIndex(0)
      })

      marker.addListener('click', () => {
        if (infoWindowRef.current) {
          infoWindowRef.current.close()
        }

        const preciosHTML = gasolinera.precios && gasolinera.precios.length > 0
          ? `<div style="margin-top: 10px; font-size: 12px;"><strong>Precios:</strong><br/>${gasolinera.precios.map(p => `${p.tipo_combustible}: $${p.precio.toFixed(2)}`).join('<br/>')}</div>`
          : '<div style="margin-top: 10px; color: #999;">Sin precios disponibles</div>'

        infoWindowRef.current = new window.google.maps.InfoWindow({
          content: `
            <div style="width: 240px; padding: 10px;">
              <h3 style="margin: 0 0 5px 0; font-size: 14px; font-weight: bold;">${gasolinera.nombre}</h3>
              <p style="margin: 0 0 3px 0; color: #666; font-size: 12px;"><strong>Ciudad:</strong> ${gasolinera.ciudad}</p>
              <p style="margin: 0 0 3px 0; color: #666; font-size: 12px;"><strong>Marca:</strong> ${gasolinera.marca}</p>
              <p style="margin: 0 0 3px 0; color: #666; font-size: 11px;"><strong>Dirección:</strong> ${gasolinera.direccion || 'No disponible'}</p>
              ${preciosHTML}
              <button id="btn-reportar-${gasolinera.id}" style="margin-top: 10px; width: 100%; padding: 6px; background-color: #16a34a; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 12px;">📝 Reportar Precio</button>
            </div>
          `,
        })

        infoWindowRef.current.open(mapRef.current, marker)

        // Agregar listener al botón de reportar precio
        setTimeout(() => {
          const btnReportar = document.getElementById(`btn-reportar-${gasolinera.id}`)
          if (btnReportar) {
            btnReportar.addEventListener('click', () => {
              setGasolineraSeleccionada(gasolinera)
              setReportarPrecioOpen(true)
            })
          }
        }, 0)
      })

      markersRef.current.push(marker)
    })

    console.log(`Se agregaron ${markersRef.current.length} marcadores`)
  }

  useEffect(() => {
    if (mapRef.current && gasolineras) {
      addMarkers()
    }
  }, [gasolineras])

  return (
    <>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={defaultCenter}
        zoom={12}
        onLoad={handleMapLoad}
      />

      {/* Modal de Reportar Precio - Desde el Mapa */}
      {gasolineraSeleccionada && (
        <ReportarPrecioModal
          isOpen={reportarPrecioOpen}
          onClose={() => {
            setReportarPrecioOpen(false)
            setGasolineraSeleccionada(null)
          }}
          gasolineras={gasolineras}
          gasolineraIdPrefijada={gasolineraSeleccionada.id}
          gasolineranombrePrefijada={gasolineraSeleccionada.nombre}
          onSuccess={() => {
            // Aquí podría ir lógica para refrescar los datos
          }}
        />
      )}
    </>
  )
}
