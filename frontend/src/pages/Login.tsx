import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export const Login: React.FC = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);

    try {
      if (isRegistering) {
        const result = await register(email, nombre, password);
        if (result.requiresEmailConfirmation) {
          setNotice('Revisa tu correo para confirmar la cuenta antes de iniciar sesión.');
          setIsRegistering(false);
          setPassword('');
          return;
        }
      } else {
        await login(email, password);
      }
      navigate('/dashboard');
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error ||
        err.message ||
        (isRegistering ? 'Error al registrar usuario' : 'Error al iniciar sesión');
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <div className="bg-white p-6 rounded shadow border">
        <h2 className="text-2xl font-bold mb-2">
          {isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}{' '}
          <span className="text-sm font-normal text-gray-500">
            {supabase ? '(Producción)' : '(Modo Dev)'}
          </span>
        </h2>

        <p className="text-sm text-gray-600 mb-4">
          {!supabase && (
            isRegistering
              ? 'Registra tu usuario en la base de datos local (rol turista automático).'
              : 'Ingresa con un email previamente registrado en la base de datos local.'
          )}
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        {notice && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4 text-sm">
            {notice}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <div>
              <label className="block mb-1 text-sm font-medium">Nombre completo</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej. Hermelinda Rojas"
                required
              />
            </div>
          )}

          <div>
            <label className="block mb-1 text-sm font-medium">Correo Electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="tu@correo.com"
              required
            />
          </div>

          {supabase && (
            <div>
              <label className="block mb-1 text-sm font-medium">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium p-2.5 rounded transition duration-150 disabled:opacity-50"
          >
            {loading ? 'Procesando...' : isRegistering ? 'Registrarse' : 'Ingresar'}
          </button>
        </form>

        <div className="mt-4 pt-4 border-t text-center text-sm">
          {isRegistering ? (
            <p>
              ¿Ya tienes una cuenta?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(false);
                  setError('');
                }}
                className="text-blue-600 font-semibold hover:underline"
              >
                Inicia sesión aquí
              </button>
            </p>
          ) : (
            <p>
              ¿No estás registrado todavía?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(true);
                  setError('');
                }}
                className="text-blue-600 font-semibold hover:underline"
              >
                Crea una cuenta aquí
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
