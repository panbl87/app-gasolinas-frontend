import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import AdminPage from './pages/AdminPage.jsx'
import './styles/index.css'

// Rutas: /admin → Panel Admin; cualquier otra → app principal
const esAdmin = window.location.pathname.replace(/\/+$/, '') === '/admin'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {esAdmin ? <AdminPage /> : <App />}
  </React.StrictMode>,
)
