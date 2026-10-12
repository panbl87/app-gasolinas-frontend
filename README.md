# 🔥 App Gasolinas Ecuador - Frontend

Frontend React para comparar precios de gasolinas en Ecuador.

## 📋 Requisitos previos

- Node.js 16+ instalado
- Backend corriendo en `http://127.0.0.1:3000` (ver instrucciones en app-gasolinas-backend)

## 🚀 Inicio rápido

### Paso 1: Instalar dependencias

```bash
cd app-gasolinas-frontend
npm install
```

### Paso 2: Ejecutar en desarrollo

```bash
npm run dev
```

La app se abrirá automáticamente en `http://localhost:5173`

### Paso 3: Verificar que funciona

- Deberías ver la lista de gasolineras
- Los filtros de búsqueda y tipo de combustible deben funcionar
- Los precios deben aparecer con sus fechas

## 🛠️ Tecnologías usadas

- **React 18** - Framework UI
- **Vite** - Build tool (más rápido que Webpack)
- **Tailwind CSS** - Estilos
- **Axios** - HTTP client

## 📁 Estructura

```
src/
├── App.jsx                  # Componente principal
├── main.jsx                 # Punto de entrada
├── styles/
│   └── index.css           # Estilos globales
└── components/
    ├── Header.jsx          # Encabezado
    ├── FilterBar.jsx       # Filtros y búsqueda
    └── GasolineraList.jsx  # Lista de gasolineras
```

## 🔌 Conectar con el Backend

El frontend se conecta automáticamente al backend en:
```
http://127.0.0.1:3000/api
```

Si el backend está en otro lugar, edita `src/App.jsx` línea 7:
```javascript
const API_URL = 'http://tu-url-aqui:3000/api'
```

## 📦 Build para producción

```bash
npm run build
```

Los archivos compilados estarán en la carpeta `dist/`

## 🆘 Troubleshooting

### Error: "Cannot find module 'react'"
```bash
npm install
```

### Error: "Cannot connect to backend"
- Verifica que el backend esté corriendo: `npm run dev` en app-gasolinas-backend
- Verifica que la URL sea correcta en App.jsx

### Error: "Port 5173 already in use"
```bash
npm run dev -- --port 5174
```

## 📈 Próximas mejoras

- Integrar Google Maps
- Sistema de autenticación
- Historial de precios
- Gamificación (badges, puntos)

---

**Última actualización:** Agosto 2026
