// src/views/LoginView.jsx
import React, { useState } from 'react';
import { Ship, User, Key, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LoginView = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validación básica
    if (!email || !password) {
      setError('Por favor completa todos los campos.');
      setLoading(false);
      return;
    }

    const result = await login(email, password);
    
    if (!result.success) {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="p-8 w-full">
          {/* Logo */}
          <div className="flex items-center space-x-2 mb-8 justify-center">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Ship size={24} className="text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-800">AduanaSoft</span>
          </div>
          
          <h2 className="text-xl font-bold text-slate-800 mb-2 text-center">Bienvenido de nuevo</h2>
          <p className="text-sm text-slate-500 mb-6 text-center">Ingresa tus credenciales para continuar</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Correo electrónico
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 text-slate-400" size={18} />
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                  placeholder="tu@correo.com"
                  autoFocus 
                  disabled={loading}
                />
              </div>
            </div>
            
            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-2.5 text-slate-400" size={18} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="w-full pl-10 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                </button>
              </div>
            </div>
            
            {/* Error message */}
            {error && (
              <div className="bg-red-50 text-red-600 text-xs p-3 rounded flex items-center animate-fade-in">
                <AlertCircle size={14} className="mr-2 flex-shrink-0" />
                {error}
              </div>
            )}
            
            {/* Submit button */}
            <button 
              type="submit" 
              className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="mr-2 animate-spin" />
                  Ingresando...
                </>
              ) : (
                'Iniciar sesión'
              )}
            </button>
          </form>
          
          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-slate-400">
              AduanaSoft v2.3 Beta
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;