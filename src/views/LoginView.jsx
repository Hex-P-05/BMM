// src/views/LoginView.jsx
import React, { useState } from 'react';
import api from '../api/axios';
import { Ship, User, Key, Eye, EyeOff, AlertCircle } from 'lucide-react';
// import api from '../api/axios'; // Descomenta cuando conectes el backend

const LoginView = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Petición real a Django
      const response = await api.post('/auth/login/', { 
        username: email, 
        password: password 
      });

      // Si Django responde OK, guardamos los tokens
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);

      // Llamamos a la función de App.jsx para entrar
      // NOTA: Si tu backend devuelve el rol, úsalo aquí. Si no, lo dejamos hardcodeado por ahora.
      onLogin('admin', email.split('@')[0].toUpperCase());

    } catch (err) {
      console.error("Error login:", err);
      // Manejo de errores más amigable
      if (err.response?.status === 401) {
        setError('Usuario o contraseña incorrectos.');
      } else {
        setError('Error de conexión con el servidor.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="p-8 w-full">
          <div className="flex items-center space-x-2 mb-8 justify-center">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center"><Ship size={24} className="text-white" /></div>
            <span className="text-2xl font-bold tracking-tight text-slate-800">AduanaSoft</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2 text-center">Bienvenido de nuevo</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Correo electrónico</label>
                <div className="relative">
                    <User className="absolute left-3 top-2.5 text-slate-400" size={18} />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" autoFocus />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
                <div className="relative">
                    <Key className="absolute left-3 top-2.5 text-slate-400" size={18} />
                    <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none">{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button>
                </div>
            </div>
            {error && (<div className="bg-red-50 text-red-600 text-xs p-3 rounded flex items-center"><AlertCircle size={14} className="mr-2" />{error}</div>)}
            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">Iniciar sesión</button>
          </form>
          <div className="mt-8 text-center text-xs text-slate-400">
             <p>Pruebas: joan@aduanasoft.com / ops</p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default LoginView;