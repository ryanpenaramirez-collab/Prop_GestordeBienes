import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, Sparkles, Info, Shield } from 'lucide-react';
import { PerfilAbogado } from '../types';

interface LoginScreenProps {
  perfil: PerfilAbogado;
  onIniciarSesion: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  perfil,
  onIniciarSesion,
}) => {
  const [emailLogin, setEmailLogin] = useState<string>(
    perfil.correo || 'alejandro.restrepo@gestordebienes.legal'
  );
  const [pinLogin, setPinLogin] = useState<string>('');
  const [mostrarPin, setMostrarPin] = useState<boolean>(false);
  const [recordarSesion, setRecordarSesion] = useState<boolean>(true);
  const [errorLogin, setErrorLogin] = useState<string | null>(null);

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    // Filtrar para aceptar estrictamente dígitos numéricos y limitar a 6 dígitos
    const digitsOnly = rawVal.replace(/\D/g, '').slice(0, 6);
    setPinLogin(digitsOnly);
    if (errorLogin) setErrorLogin(null);
  };

  const handlePinKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Permitir teclas de navegación, control y edición estándar
    const allowedKeys = [
      'Backspace',
      'Delete',
      'ArrowLeft',
      'ArrowRight',
      'Tab',
      'Enter',
      'Home',
      'End',
    ];
    if (allowedKeys.includes(e.key) || e.ctrlKey || e.metaKey) {
      return;
    }
    // Bloquear inmediatamente si no es un dígito
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
      return;
    }
    // Bloquear si ya tiene 6 dígitos y no hay selección de texto para reemplazar
    const input = e.currentTarget;
    const hasSelection = (input.selectionEnd ?? 0) - (input.selectionStart ?? 0) > 0;
    if (pinLogin.length >= 6 && !hasSelection) {
      e.preventDefault();
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!emailLogin.trim()) {
      setErrorLogin('Por favor ingrese su correo electrónico profesional o nombre de usuario.');
      return;
    }
    if (!pinLogin) {
      setErrorLogin('Por favor ingrese el PIN de seguridad.');
      return;
    }
    setErrorLogin(null);
    onIniciarSesion();
  };

  const handleAccesoRapido = () => {
    setEmailLogin(perfil.correo || 'alejandro.restrepo@gestordebienes.legal');
    setPinLogin('123456');
    setErrorLogin(null);
    onIniciarSesion();
  };

  return (
    <div className="min-h-screen w-screen bg-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 select-none font-sans">
      <div className="w-full max-w-md space-y-6">
        {/* Logo y Nombre de la Aplicación */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-900 text-white font-serif font-bold text-2xl shadow-sm">
            §
          </div>
          <h1 className="text-xl font-bold tracking-wider uppercase font-serif text-slate-900">
            Gestor de Bienes
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Sistema Notarial y Judicial de Partición Patrimonial
          </p>
        </div>

        {/* Tarjeta de Inicio de Sesión Profesional */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="text-center space-y-2 border-b border-slate-100 pb-4 flex flex-col items-center">
            {perfil.fotoPerfil ? (
              <img
                src={perfil.fotoPerfil}
                alt={perfil.nombre || 'Foto del Abogado'}
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-200 shadow-2xs mb-1"
              />
            ) : null}
            <h2 className="text-base font-bold text-slate-900 font-serif">
              Inicio de Sesión Profesional
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
              Ingrese las credenciales del abogado para gestionar expedientes patrimoniales y firmar liquidaciones oficiales.
            </p>
          </div>

          {errorLogin && (
            <div className="p-3 bg-slate-50 border border-slate-400 rounded-lg text-xs text-slate-900 flex items-start gap-2">
              <Info className="w-4 h-4 text-slate-900 shrink-0 mt-0.5" />
              <span>{errorLogin}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="login-standalone-email"
                className="text-xs font-bold text-slate-700 flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5 text-slate-700" />
                <span>Correo Electrónico o Usuario</span>
              </label>
              <input
                id="login-standalone-email"
                type="text"
                value={emailLogin}
                onChange={(e) => setEmailLogin(e.target.value)}
                placeholder="abogado@despacho.legal"
                className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-900 shadow-2xs"
                required
              />
            </div>

            {/* PIN de Seguridad (6 dígitos) */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-standalone-pin"
                className="text-xs font-bold text-slate-700 flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5 text-slate-700" />
                <span>PIN de Seguridad (6 dígitos)</span>
              </label>
              <div className="relative">
                <input
                  id="login-standalone-pin"
                  type={mostrarPin ? 'text' : 'password'}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={pinLogin}
                  onChange={handlePinChange}
                  onKeyDown={handlePinKeyDown}
                  placeholder="••••••"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3.5 pr-20 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-900 shadow-2xs tracking-widest"
                  autoComplete="off"
                  required
                />
                <button
                  type="button"
                  onClick={() => setMostrarPin(!mostrarPin)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-900 cursor-pointer transition-colors select-none"
                  title={mostrarPin ? 'Ocultar PIN' : 'Mostrar PIN'}
                >
                  {mostrarPin ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Ocultar</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>Mostrar</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600 pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={recordarSesion}
                  onChange={(e) => setRecordarSesion(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <span>Recordar sesión en este equipo</span>
              </label>
            </div>

            <div className="pt-2 flex flex-col gap-2.5">
              <button
                type="submit"
                id="btn-iniciar-sesion"
                className="w-full bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-bold py-2.5 px-4 rounded-lg text-xs transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-2"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Iniciar Sesión</span>
              </button>

              <button
                type="button"
                id="btn-acceso-rapido"
                onClick={handleAccesoRapido}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold py-2 px-4 rounded-lg text-xs transition-colors border border-slate-300 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-slate-700" />
                <span>Acceso Rápido como {perfil.nombre || 'Abogado Titular'}</span>
              </button>
            </div>
          </form>

          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 text-center leading-relaxed">
            Almacenamiento local seguro en el navegador. La información del abogado se incorpora automáticamente en la carátula y el pie de firma de los reportes PDF.
          </div>
        </div>

        {/* Footer institucional discreto */}
        <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-2">
          <Shield className="w-3.5 h-3.5 text-slate-400" />
          <span>Acceso restringido a profesionales del derecho • C.C. y C.G.P.</span>
        </div>
      </div>
    </div>
  );
};

