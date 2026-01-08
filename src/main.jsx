// src/main.jsx (o src/index.js)
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css' // O tus estilos globales
import { BrowserRouter } from 'react-router-dom' // <--- 1. IMPORTANTE

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 2. ENVUELVE TU APP AQUÍ */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)