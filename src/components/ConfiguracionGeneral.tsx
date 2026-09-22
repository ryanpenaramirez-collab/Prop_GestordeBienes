import React, { useState } from 'react';
import {
  ArrowLeft,
  Settings,
  User,
  Sliders,
  Palette,
  Check,
  Shield,
  FileText,
  Building,
  Phone,
  MapPin,
  Briefcase,
  LogOut,
  Mail,
  Globe,
  ExternalLink,
  Link as LinkIcon,
  AlertCircle,
  Camera,
  Upload,
  Trash2,
  Image as ImageIcon,
} from 'lucide-react';
import { PerfilAbogado, AjustesApp } from '../types';

// Valida si un texto cumple el formato de una URL válida (o si está vacío/opcional)
export function esUrlValida(url?: string): boolean {
  if (!url || !url.trim()) return true;
  const texto = url.trim();
  // Requiere un dominio válido con o sin protocolo http/https
  const urlRegex = /^(https?:\/\/)?([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(\/.*)?$/i;
  return urlRegex.test(texto);
}

// Normaliza la URL anteponiendo https:// si no contiene protocolo
export function normalizarUrl(url?: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

interface BadgeTagProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
  id?: string;
}

const BadgeTag: React.FC<BadgeTagProps> = ({ children, icon, id }) => (
  <span
    id={id}
    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-900 border border-slate-300 shadow-2xs whitespace-nowrap select-none"
  >
    {icon}
    {children}
  </span>
);

interface ConfiguracionGeneralProps {
  perfil: PerfilAbogado;
  ajustes: AjustesApp;
  sesionActiva: boolean;
  onGuardarPerfil: (perfil: PerfilAbogado) => void;
  onGuardarAjustes: (ajustes: AjustesApp) => void;
  onCambiarEstadoSesion: (activa: boolean) => void;
  onVolver: () => void;
}

export const ConfiguracionGeneral: React.FC<ConfiguracionGeneralProps> = ({
  perfil: perfilInicial,
  ajustes: ajustesIniciales,
  sesionActiva,
  onGuardarPerfil,
  onGuardarAjustes,
  onCambiarEstadoSesion,
  onVolver,
}) => {
  const [tabActiva, setTabActiva] = useState<'perfil' | 'diseno'>('perfil');

  // Estado local para Perfil
  const [perfil, setPerfil] = useState<PerfilAbogado>({ ...perfilInicial });
  const [perfilGuardado, setPerfilGuardado] = useState<PerfilAbogado>({ ...perfilInicial });

  // Estado local para Ajustes (selección en formulario)
  const [ajustes, setAjustes] = useState<AjustesApp>({ ...ajustesIniciales });
  const [ajustesGuardados, setAjustesGuardados] = useState<AjustesApp>({ ...ajustesIniciales });

  // Error de validación de URL
  const [errorUrl, setErrorUrl] = useState<string | null>(null);

  // Feedback de guardado
  const [guardadoFeedback, setGuardadoFeedback] = useState<boolean>(false);

  const hayCambiosPerfil = JSON.stringify(perfil) !== JSON.stringify(perfilGuardado);
  const hayCambiosAjustes = JSON.stringify(ajustes) !== JSON.stringify(ajustesGuardados);
  const hayCambiosPendientes = hayCambiosPerfil || hayCambiosAjustes;

  const handleCerrarSesion = () => {
    onCambiarEstadoSesion(false);
  };

  // Selector de tema: solo actualiza la selección local dentro de la tarjeta, sin alterar el tema real de la pantalla
  const handleCambiarTema = (nuevoTema: 'blanco-corporativo' | 'gris-tecnico' | 'negro-ejecutivo') => {
    setAjustes((prev) => ({ ...prev, temaVisual: nuevoTema }));
  };

  // Selector de densidad: solo actualiza la selección local, sin alterar la densidad real de la pantalla
  const handleCambiarDensidad = (nuevaDensidad: 'comoda' | 'compacta' | 'amplia') => {
    setAjustes((prev) => ({ ...prev, densidadInterfaz: nuevaDensidad }));
  };

  const handleActualizarAjustes = (nuevos: Partial<AjustesApp>) => {
    setAjustes((prev) => ({ ...prev, ...nuevos }));
  };

  // Solo al presionar "Aplicar Cambios", los ajustes y perfil se aplican permanentemente
  const handleAplicarCambios = () => {
    if (perfil.sitioWeb && !esUrlValida(perfil.sitioWeb)) {
      setErrorUrl('Ingrese una dirección URL válida (ejemplo: https://despacho.legal o www.firma.com)');
      return;
    }
    setErrorUrl(null);
    onGuardarPerfil(perfil);
    setPerfilGuardado({ ...perfil });

    onGuardarAjustes(ajustes);
    setAjustesGuardados({ ...ajustes });

    setGuardadoFeedback(true);
    setTimeout(() => setGuardadoFeedback(false), 3000);
  };

  // Descartar cambios: revierte los controles al estado guardado
  const handleDescartarCambios = () => {
    setPerfil({ ...perfilGuardado });
    setAjustes({ ...ajustesGuardados });
    setErrorUrl(null);
  };

  // Volver: conserva la configuración activa confirmada y regresa sin modificar nada
  const handleVolver = () => {
    setPerfil({ ...perfilGuardado });
    setAjustes({ ...ajustesGuardados });
    onVolver();
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white w-full select-none">
      {/* Encabezado fijo superior */}
      <div className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shrink-0 shadow-2xs w-full">
        <div className="flex items-center gap-3">
          <button
            type="button"
            id="btn-volver-configuracion"
            onClick={handleVolver}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver</span>
          </button>
          <div className="h-4 w-px bg-slate-300 mx-1" />
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Settings className="w-5 h-5 text-slate-900" />
              Configuración General
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ajustes de diseño, preferencias de interfaz y perfil profesional del abogado.
            </p>
          </div>
        </div>

        {guardadoFeedback && (
          <div className="flex items-center gap-1.5 bg-slate-100 text-slate-900 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-400 animate-fadeIn">
            <Check className="w-4 h-4 text-slate-900" />
            <span>Configuración guardada correctamente</span>
          </div>
        )}
      </div>

      {/* Selector de Sub-Pestañas alineadas a la derecha */}
      <div className="bg-slate-50/70 border-b border-slate-200 px-6 py-2 flex items-center justify-end gap-2 text-xs">
        <button
          type="button"
          id="tab-config-perfil"
          onClick={() => setTabActiva('perfil')}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-semibold text-xs transition cursor-pointer border ${
            tabActiva === 'perfil'
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Perfil y Sesión del Abogado</span>
          {sesionActiva && <span className="w-1.5 h-1.5 rounded-full bg-white ml-0.5" />}
        </button>

        <button
          type="button"
          id="tab-config-diseno"
          onClick={() => setTabActiva('diseno')}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-semibold text-xs transition cursor-pointer border ${
            tabActiva === 'diseno'
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Diseño y Preferencias</span>
        </button>
      </div>

      {/* Contenido desplazable que ocupa todo el ancho disponible */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 bg-white w-full">
        <div className="w-full space-y-6">
          {/* TAB 1: PERFIL Y SESIÓN DEL ABOGADO */}
          {tabActiva === 'perfil' && (
            <div className="space-y-6">
              {/* Tarjeta de Estado de Sesión */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  {perfil.fotoPerfil ? (
                    <img
                      src={perfil.fotoPerfil}
                      alt={perfil.nombre || 'Foto del Abogado'}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-xl object-cover border border-slate-300 shadow-xs shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-serif text-lg font-bold shrink-0 shadow-xs">
                      {perfil.nombre ? perfil.nombre.charAt(0) : 'A'}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">
                        {perfil.nombre || 'Abogado Titular'}
                      </h3>
                      <BadgeTag icon={<Check className="w-3 h-3 text-slate-900" />}>
                        Sesión Activa
                      </BadgeTag>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {perfil.tarjetaProfesional ? `T.P. No. ${perfil.tarjetaProfesional}` : 'Tarjeta Profesional registrada'} • {perfil.despachoFirma || 'Despacho Independiente'}
                    </p>
                    {perfil.sitioWeb && esUrlValida(perfil.sitioWeb) && (
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-500 font-medium">Sitio Web:</span>
                        <a
                          id="link-sesion-abogado-web"
                          href={normalizarUrl(perfil.sitioWeb)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-900 hover:text-slate-600 underline transition cursor-pointer"
                          title="Abrir página web del despacho en una nueva pestaña"
                        >
                          <Globe className="w-3 h-3 text-slate-600 shrink-0" />
                          <span className="truncate max-w-[260px]">{perfil.sitioWeb}</span>
                          <ExternalLink className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  id="btn-cerrar-sesion"
                  onClick={handleCerrarSesion}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-300 transition-colors shadow-2xs cursor-pointer shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5 text-slate-700" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>

              {/* Apartado: Foto de Perfil */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-2xs space-y-4">
                <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Camera className="w-4 h-4 text-slate-900" />
                      Foto de Perfil
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Personalice la imagen oficial del titular del despacho. Los cambios quedarán pendientes hasta presionar "Aplicar Cambios".
                    </p>
                  </div>
                  {perfil.fotoPerfil !== perfilGuardado.fotoPerfil ? (
                    <BadgeTag icon={<span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block" />}>
                      Cambio pendiente
                    </BadgeTag>
                  ) : (
                    <BadgeTag>
                      {perfil.fotoPerfil ? 'Foto personalizada' : 'Ícono por defecto'}
                    </BadgeTag>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pt-1">
                  {/* Vista previa de la foto actual o ícono genérico */}
                  <div className="relative group shrink-0">
                    {perfil.fotoPerfil ? (
                      <div className="relative">
                        <img
                          src={perfil.fotoPerfil}
                          alt={perfil.nombre || 'Foto de perfil del abogado'}
                          referrerPolicy="no-referrer"
                          className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-slate-300 shadow-sm bg-slate-50"
                        />
                        <span className="absolute -bottom-1.5 -right-1.5 bg-emerald-700 text-white rounded-full p-1 shadow-xs" title="Foto cargada">
                          <Check className="w-3 h-3" />
                        </span>
                      </div>
                    ) : (
                      <div
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 text-slate-400 flex flex-col items-center justify-center gap-1 shadow-2xs"
                        title="Ícono genérico por defecto"
                      >
                        <User className="w-8 h-8 sm:w-9 sm:h-9 text-slate-400" />
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Por defecto</span>
                      </div>
                    )}
                  </div>

                  {/* Botones de acción para subir o eliminar foto */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <label
                        htmlFor="input-subir-foto-perfil"
                        className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition-colors shadow-2xs cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{perfil.fotoPerfil ? 'Cambiar Foto desde el Computador' : 'Subir Foto de Perfil'}</span>
                      </label>
                      <input
                        id="input-subir-foto-perfil"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              const base64 = ev.target?.result as string;
                              if (base64) {
                                setPerfil((prev) => ({ ...prev, fotoPerfil: base64 }));
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                          // Limpiar para permitir volver a seleccionar el mismo archivo si se desea
                          e.target.value = '';
                        }}
                      />

                      {perfil.fotoPerfil && (
                        <button
                          type="button"
                          id="btn-eliminar-foto-perfil"
                          onClick={() => setPerfil((prev) => ({ ...prev, fotoPerfil: undefined }))}
                          className="inline-flex items-center gap-1.5 bg-white hover:bg-red-50 text-red-700 hover:text-red-800 text-xs font-semibold px-3 py-2 rounded-lg transition-colors border border-red-200 cursor-pointer shadow-2xs"
                          title="Eliminar foto y volver al ícono genérico por defecto"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-600" />
                          <span>Eliminar Foto</span>
                        </button>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 leading-relaxed max-w-xl">
                      Formatos soportados: JPG, PNG, WEBP o SVG. Se redimensiona automáticamente. Si elimina la foto, se restablecerá el ícono genérico por defecto del sistema.
                    </p>
                  </div>
                </div>
              </div>

                  {/* Formulario de Información Profesional del Abogado */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-2xs space-y-5">
                    <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-slate-900" />
                          Información del Abogado y Despacho
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Estos datos se emplean en la carátula del expediente y en la sección de firmas del dictamen de partición.
                        </p>
                      </div>
                      <BadgeTag>Perfil Único</BadgeTag>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      {/* Nombre */}
                      <div className="space-y-1">
                        <label htmlFor="perfil-nombre" className="font-bold text-slate-700 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-700" />
                          <span>Nombre Completo del Abogado</span>
                        </label>
                        <input
                          id="perfil-nombre"
                          type="text"
                          value={perfil.nombre}
                          onChange={(e) => setPerfil({ ...perfil, nombre: e.target.value })}
                          placeholder="Dr. Alejandro Restrepo Salazar"
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-900"
                        />
                      </div>

                      {/* Tarjeta Profesional */}
                      <div className="space-y-1">
                        <label htmlFor="perfil-tp" className="font-bold text-slate-700 flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-slate-700" />
                          <span>Tarjeta Profesional (T.P. - C.S.J.)</span>
                        </label>
                        <input
                          id="perfil-tp"
                          type="text"
                          value={perfil.tarjetaProfesional}
                          onChange={(e) => setPerfil({ ...perfil, tarjetaProfesional: e.target.value })}
                          placeholder="248.910 del C.S.J."
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-medium text-slate-900 focus:outline-none focus:border-slate-900"
                        />
                      </div>

                      {/* Cédula de Ciudadanía */}
                      <div className="space-y-1">
                        <label htmlFor="perfil-doc" className="font-bold text-slate-700 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-slate-700" />
                          <span>Documento de Identidad (C.C.)</span>
                        </label>
                        <input
                          id="perfil-doc"
                          type="text"
                          value={perfil.documentoIdentidad}
                          onChange={(e) => setPerfil({ ...perfil, documentoIdentidad: e.target.value })}
                          placeholder="C.C. 1.020.456.789 de Bogotá D.C."
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-900"
                        />
                      </div>

                      {/* Despacho o Firma */}
                      <div className="space-y-1">
                        <label htmlFor="perfil-despacho" className="font-bold text-slate-700 flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-slate-700" />
                          <span>Firma o Despacho Jurídico</span>
                        </label>
                        <input
                          id="perfil-despacho"
                          type="text"
                          value={perfil.despachoFirma}
                          onChange={(e) => setPerfil({ ...perfil, despachoFirma: e.target.value })}
                          placeholder="Restrepo & Asociados - Consultores Patrimoniales"
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-900"
                        />
                      </div>

                      {/* Página Web / Enlace del Despacho */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label htmlFor="perfil-sitio-web" className="font-bold text-slate-700 flex items-center gap-1.5">
                            <LinkIcon className="w-3.5 h-3.5 text-slate-700" />
                            <span>Página Web / Enlace del Despacho</span>
                          </label>
                          <span className="text-[10px] text-slate-400 font-medium">(Opcional)</span>
                        </div>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                            <Globe className="w-3.5 h-3.5" />
                          </div>
                          <input
                            id="perfil-sitio-web"
                            type="text"
                            value={perfil.sitioWeb || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPerfil({ ...perfil, sitioWeb: val });
                              if (errorUrl && esUrlValida(val)) {
                                setErrorUrl(null);
                              }
                            }}
                            placeholder="https://www.restrepoabogados.com"
                            className={`w-full bg-white border ${
                              errorUrl
                                ? 'border-red-500 focus:border-red-600 ring-1 ring-red-100'
                                : 'border-slate-300 focus:border-slate-900'
                            } rounded-lg pl-9 pr-9 py-2 text-xs font-medium text-slate-900 focus:outline-none`}
                          />
                          {perfil.sitioWeb && esUrlValida(perfil.sitioWeb) && (
                            <a
                              id="btn-probar-url-web"
                              href={normalizarUrl(perfil.sitioWeb)}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Probar / abrir enlace en nueva pestaña"
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-900 transition cursor-pointer"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>

                        {errorUrl && (
                          <p className="text-[11px] text-red-600 font-medium flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            <span>{errorUrl}</span>
                          </p>
                        )}

                        {/* Si el campo tiene un valor guardado, se muestra como un enlace clicable que abre en nueva pestaña en lugar de texto plano */}
                        {perfilGuardado.sitioWeb && esUrlValida(perfilGuardado.sitioWeb) && (
                          <div className="mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-1.5 overflow-hidden">
                              <span className="text-[11px] text-slate-500 font-semibold shrink-0">Enlace guardado:</span>
                              <a
                                id="link-sitio-web-guardado"
                                href={normalizarUrl(perfilGuardado.sitioWeb)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs text-slate-900 font-bold underline hover:text-slate-600 transition truncate cursor-pointer"
                                title={`Abrir ${perfilGuardado.sitioWeb} en nueva pestaña`}
                              >
                                <Globe className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                                <span className="truncate max-w-[200px] sm:max-w-[260px]">{perfilGuardado.sitioWeb}</span>
                                <ExternalLink className="w-3 h-3 text-slate-500 shrink-0" />
                              </a>
                            </div>
                            <span className="text-[10px] text-slate-400 shrink-0 hidden sm:inline">Abre en pestaña nueva</span>
                          </div>
                        )}
                      </div>

                      {/* Correo Electrónico */}
                      <div className="space-y-1">
                        <label htmlFor="perfil-correo" className="font-bold text-slate-700 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-700" />
                          <span>Correo Electrónico de Contacto</span>
                        </label>
                        <input
                          id="perfil-correo"
                          type="email"
                          value={perfil.correo}
                          onChange={(e) => setPerfil({ ...perfil, correo: e.target.value })}
                          placeholder="alejandro.restrepo@gestordebienes.legal"
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-900"
                        />
                      </div>

                      {/* Teléfono */}
                      <div className="space-y-1">
                        <label htmlFor="perfil-telefono" className="font-bold text-slate-700 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-700" />
                          <span>Teléfono / Celular de Contacto</span>
                        </label>
                        <input
                          id="perfil-telefono"
                          type="text"
                          value={perfil.telefono}
                          onChange={(e) => setPerfil({ ...perfil, telefono: e.target.value })}
                          placeholder="+57 (601) 315-8900"
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-medium text-slate-900 focus:outline-none focus:border-slate-900"
                        />
                      </div>

                      {/* Ciudad */}
                      <div className="space-y-1">
                        <label htmlFor="perfil-ciudad" className="font-bold text-slate-700 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-700" />
                          <span>Ciudad / Sede Profesional</span>
                        </label>
                        <input
                          id="perfil-ciudad"
                          type="text"
                          value={perfil.ciudad}
                          onChange={(e) => setPerfil({ ...perfil, ciudad: e.target.value })}
                          placeholder="Bogotá D.C., Colombia"
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-900"
                        />
                      </div>

                      {/* Especialidad */}
                      <div className="space-y-1 sm:col-span-2">
                        <label htmlFor="perfil-especialidad" className="font-bold text-slate-700 flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-slate-700" />
                          <span>Área de Especialidad Jurídica</span>
                        </label>
                        <input
                          id="perfil-especialidad"
                          type="text"
                          value={perfil.especialidad}
                          onChange={(e) => setPerfil({ ...perfil, especialidad: e.target.value })}
                          placeholder="Derecho de Familia, Sucesiones y Liquidación Patrimonial"
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-900"
                        />
                      </div>
                    </div>

                    {/* Leyenda notarial en reportes PDF */}
                    <div className="space-y-1.5 pt-2">
                      <label htmlFor="perfil-leyenda" className="font-bold text-slate-700 flex items-center gap-1.5 text-xs">
                        <FileText className="w-3.5 h-3.5 text-slate-700" />
                        <span>Leyenda Notarial o Declaración Profesional en Reportes PDF</span>
                      </label>
                      <textarea
                        id="perfil-leyenda"
                        rows={2}
                        value={perfil.leyendaNotarial || ''}
                        onChange={(e) => setPerfil({ ...perfil, leyendaNotarial: e.target.value })}
                        placeholder="Liquidación patrimonial elaborada bajo las disposiciones del C.C. y C.G.P."
                        className="w-full bg-white border border-slate-300 rounded-lg p-3 text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-900 resize-none leading-relaxed"
                      />
                      <span className="text-[10px] text-slate-500">
                        Esta leyenda se insertará como fe pública al final de las liquidaciones de hijuelas y adjudicaciones exportadas.
                      </span>
                    </div>
                  </div>
              </div>
            )}

          {/* TAB 2: DISEÑO Y PREFERENCIAS DE INTERFAZ */}
          {tabActiva === 'diseno' && (
            <div className="space-y-6">
              {/* Tema Visual de la Aplicación */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
                <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Palette className="w-4 h-4 text-slate-900" />
                      1. Tema Visual y Paleta Monocromática
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Seleccione una opción para marcarla. Los cambios se aplicarán a toda la aplicación al presionar "Aplicar Cambios".
                    </p>
                  </div>
                  {ajustes.temaVisual !== ajustesGuardados.temaVisual ? (
                    <BadgeTag id="tag-estado-previsualizacion" icon={<span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block" />}>
                      Cambio pendiente
                    </BadgeTag>
                  ) : (
                    <BadgeTag id="tag-estado-previsualizacion">Tema actual activo</BadgeTag>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {/* Opción 1: Blanco Corporativo */}
                  <button
                    type="button"
                    id="btn-tema-blanco-corporativo"
                    onClick={() => handleCambiarTema('blanco-corporativo')}
                    className={`p-4 rounded-xl text-left transition flex flex-col gap-2.5 cursor-pointer border ${
                      ajustes.temaVisual === 'blanco-corporativo'
                        ? 'border-2 border-slate-900 bg-white shadow-xs ring-2 ring-slate-900/10'
                        : 'border border-slate-200 bg-white hover:border-slate-400 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 rounded-full border border-slate-300 bg-white shadow-2xs inline-block" />
                        <span className="text-xs font-bold text-slate-900">Blanco Corporativo</span>
                      </div>
                      {ajustes.temaVisual === 'blanco-corporativo' ? (
                        ajustes.temaVisual === ajustesGuardados.temaVisual ? (
                          <BadgeTag id="badge-tema-blanco-activo">Activo</BadgeTag>
                        ) : (
                          <BadgeTag id="badge-tema-blanco-preview" icon={<span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block" />}>
                            Seleccionado
                          </BadgeTag>
                        )
                      ) : (
                        ajustesGuardados.temaVisual === 'blanco-corporativo' && (
                          <span className="text-[10px] text-slate-500 font-medium bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            Activo actual
                          </span>
                        )
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Estilo formal estándar, alto contraste, óptimo para impresión y lectura prolongada en pantalla.
                    </p>
                    <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-100 text-[10px] text-slate-400">
                      <span className="font-medium">Predominante:</span>
                      <span className="px-1.5 py-0.5 rounded font-semibold bg-white border border-slate-300 text-slate-800">
                        Blanco Puro (#FFF)
                      </span>
                    </div>
                  </button>

                  {/* Opción 2: Gris Técnico */}
                  <button
                    type="button"
                    id="btn-tema-gris-tecnico"
                    onClick={() => handleCambiarTema('gris-tecnico')}
                    className={`p-4 rounded-xl text-left transition flex flex-col gap-2.5 cursor-pointer border ${
                      ajustes.temaVisual === 'gris-tecnico'
                        ? 'border-2 border-slate-900 bg-slate-100 shadow-xs ring-2 ring-slate-900/10'
                        : 'border border-slate-200 bg-white hover:border-slate-400 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 rounded-full border border-slate-400 bg-slate-400 shadow-2xs inline-block" />
                        <span className="text-xs font-bold text-slate-900">Gris Técnico</span>
                      </div>
                      {ajustes.temaVisual === 'gris-tecnico' ? (
                        ajustes.temaVisual === ajustesGuardados.temaVisual ? (
                          <BadgeTag id="badge-tema-gris-activo">Activo</BadgeTag>
                        ) : (
                          <BadgeTag id="badge-tema-gris-preview" icon={<span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block" />}>
                            Seleccionado
                          </BadgeTag>
                        )
                      ) : (
                        ajustesGuardados.temaVisual === 'gris-tecnico' && (
                          <span className="text-[10px] text-slate-500 font-medium bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            Activo actual
                          </span>
                        )
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Escala de grises neutros (rango tonal medio, sin saturación), reduce la fatiga visual en sesiones prolongadas y equilibra el contraste entre fondo y contenido sin los extremos del blanco o negro puro.
                    </p>
                    <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-100 text-[10px] text-slate-400">
                      <span className="font-medium">Predominante:</span>
                      <span className="px-1.5 py-0.5 rounded font-semibold bg-slate-300 border border-slate-400 text-slate-900">
                        Gris Medio Neutro
                      </span>
                    </div>
                  </button>

                  {/* Opción 3: Negro Ejecutivo */}
                  <button
                    type="button"
                    id="btn-tema-negro-ejecutivo"
                    onClick={() => handleCambiarTema('negro-ejecutivo')}
                    className={`p-4 rounded-xl text-left transition flex flex-col gap-2.5 cursor-pointer border ${
                      ajustes.temaVisual === 'negro-ejecutivo'
                        ? 'border-2 border-slate-900 bg-slate-100 shadow-xs ring-2 ring-slate-900/10'
                        : 'border border-slate-200 bg-white hover:border-slate-400 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 rounded-full border border-slate-700 bg-slate-950 shadow-2xs inline-block" />
                        <span className="text-xs font-bold text-slate-900">Negro Ejecutivo</span>
                      </div>
                      {ajustes.temaVisual === 'negro-ejecutivo' ? (
                        ajustes.temaVisual === ajustesGuardados.temaVisual ? (
                          <BadgeTag id="badge-tema-negro-activo">Activo</BadgeTag>
                        ) : (
                          <BadgeTag id="badge-tema-negro-preview" icon={<span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block" />}>
                            Seleccionado
                          </BadgeTag>
                        )
                      ) : (
                        ajustesGuardados.temaVisual === 'negro-ejecutivo' && (
                          <span className="text-[10px] text-slate-500 font-medium bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            Activo actual
                          </span>
                        )
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Fondo predominantemente negro o gris muy oscuro en toda la aplicación, con texto en blanco o gris claro, y el mismo color de acento único para botones y elementos activos.
                    </p>
                    <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-100 text-[10px] text-slate-400">
                      <span className="font-medium">Predominante:</span>
                      <span className="px-1.5 py-0.5 rounded font-semibold bg-black text-white border border-slate-800">
                        Negro Carbón (#09090B)
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Densidad de la Interfaz */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
                <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-slate-900" />
                      2. Densidad y Espaciado de Tablas
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Ajuste la cantidad de información visible por pantalla en las listas de bienes, herederos y liquidaciones.
                    </p>
                  </div>
                  {ajustes.densidadInterfaz !== ajustesGuardados.densidadInterfaz ? (
                    <BadgeTag id="tag-densidad-previsualizacion" icon={<span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block" />}>
                      Cambio pendiente
                    </BadgeTag>
                  ) : (
                    <BadgeTag id="tag-densidad-previsualizacion">Densidad actual activa</BadgeTag>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    id="btn-densidad-comoda"
                    onClick={() => handleCambiarDensidad('comoda')}
                    className={`px-3 py-2.5 rounded-lg text-xs font-semibold text-center transition cursor-pointer border ${
                      ajustes.densidadInterfaz === 'comoda'
                        ? 'bg-slate-900 text-white border-2 border-slate-900 shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span>Cómoda (Recomendada)</span>
                    {ajustes.densidadInterfaz === 'comoda' && ajustes.densidadInterfaz !== ajustesGuardados.densidadInterfaz && (
                      <span className="block text-[10px] text-blue-200 font-normal mt-0.5">Seleccionada</span>
                    )}
                  </button>
                  <button
                    type="button"
                    id="btn-densidad-compacta"
                    onClick={() => handleCambiarDensidad('compacta')}
                    className={`px-3 py-2.5 rounded-lg text-xs font-semibold text-center transition cursor-pointer border ${
                      ajustes.densidadInterfaz === 'compacta'
                        ? 'bg-slate-900 text-white border-2 border-slate-900 shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span>Compacta (Alta Densidad)</span>
                    {ajustes.densidadInterfaz === 'compacta' && ajustes.densidadInterfaz !== ajustesGuardados.densidadInterfaz && (
                      <span className="block text-[10px] text-blue-200 font-normal mt-0.5">Seleccionada</span>
                    )}
                  </button>
                  <button
                    type="button"
                    id="btn-densidad-amplia"
                    onClick={() => handleCambiarDensidad('amplia')}
                    className={`px-3 py-2.5 rounded-lg text-xs font-semibold text-center transition cursor-pointer border ${
                      ajustes.densidadInterfaz === 'amplia'
                        ? 'bg-slate-900 text-white border-2 border-slate-900 shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span>Amplia (Lectura Aumentada)</span>
                    {ajustes.densidadInterfaz === 'amplia' && ajustes.densidadInterfaz !== ajustesGuardados.densidadInterfaz && (
                      <span className="block text-[10px] text-blue-200 font-normal mt-0.5">Seleccionada</span>
                    )}
                  </button>
                </div>

                {/* Muestra previa fija del espaciado de tablas seleccionado */}
                <div className="mt-3 p-3 rounded-lg border border-slate-200 bg-slate-50/60">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-slate-700">
                      Demostración de filas con opción seleccionada ({ajustes.densidadInterfaz}):
                    </span>
                    {ajustes.densidadInterfaz !== ajustesGuardados.densidadInterfaz && (
                      <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-medium border border-blue-200">
                        Pendiente de aplicar
                      </span>
                    )}
                  </div>
                  <div className="overflow-x-auto rounded border border-slate-200 bg-white">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                        <tr>
                          <th className={`font-semibold ${ajustes.densidadInterfaz === 'compacta' ? 'py-1 px-2.5' : ajustes.densidadInterfaz === 'amplia' ? 'py-3.5 px-5' : 'py-2 px-3.5'}`}>Bien Inventariado</th>
                          <th className={`font-semibold ${ajustes.densidadInterfaz === 'compacta' ? 'py-1 px-2.5' : ajustes.densidadInterfaz === 'amplia' ? 'py-3.5 px-5' : 'py-2 px-3.5'}`}>Naturaleza</th>
                          <th className={`text-right font-semibold ${ajustes.densidadInterfaz === 'compacta' ? 'py-1 px-2.5' : ajustes.densidadInterfaz === 'amplia' ? 'py-3.5 px-5' : 'py-2 px-3.5'}`}>Avalúo Comercial</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-800">
                        <tr>
                          <td className={`${ajustes.densidadInterfaz === 'compacta' ? 'py-1 px-2.5' : ajustes.densidadInterfaz === 'amplia' ? 'py-3 px-5' : 'py-2 px-3.5'}`}>Apartamento Residencial 402</td>
                          <td className={`${ajustes.densidadInterfaz === 'compacta' ? 'py-1 px-2.5' : ajustes.densidadInterfaz === 'amplia' ? 'py-3 px-5' : 'py-2 px-3.5'}`}>Inmueble Urbano</td>
                          <td className={`text-right font-mono ${ajustes.densidadInterfaz === 'compacta' ? 'py-1 px-2.5' : ajustes.densidadInterfaz === 'amplia' ? 'py-3 px-5' : 'py-2 px-3.5'}`}>$ 450.000.000</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Formato Monetario y Cifras */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
                <div className="border-b border-slate-200 pb-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    3. Formato Monetario y Cifras (Pesos Colombianos - COP)
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Reglas de formateo numérico para sumas dinerarias e hijuelas de partición.
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50/70 transition cursor-pointer">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-slate-900">Separador de Miles con Punto (.)</span>
                      <span className="text-[11px] text-slate-500">
                        Presenta los montos como $ 450.000.000 conforme al estándar notarial colombiano.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={ajustes.mostrarSeparadorMiles}
                      onChange={(e) => handleActualizarAjustes({ mostrarSeparadorMiles: e.target.checked })}
                      className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 w-4 h-4"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50/70 transition cursor-pointer">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-slate-900">Ocultar Centavos / Decimales</span>
                      <span className="text-[11px] text-slate-500">
                        Redondea al peso entero más próximo sin fracciones de centavos, estándar en sucesiones.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={!ajustes.formatoMonedaConDecimales}
                      onChange={(e) => handleActualizarAjustes({ formatoMonedaConDecimales: !e.target.checked })}
                      className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 w-4 h-4"
                    />
                  </label>
                </div>
              </div>

              {/* Preferencias de Exportación PDF */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
                <div className="border-b border-slate-200 pb-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    4. Preferencias de Documentos y Exportación PDF
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Configuración de los reportes oficiales generados para notaría o juzgado.
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50/70 transition cursor-pointer">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-slate-900">Incluir Datos del Abogado y Despacho en PDF</span>
                      <span className="text-[11px] text-slate-500">
                        Inserta el nombre, T.P. y firma del abogado en el encabezado y pie de página del reporte.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={ajustes.incluirEncabezadoAbogadoEnPDF}
                      onChange={(e) => handleActualizarAjustes({ incluirEncabezadoAbogadoEnPDF: e.target.checked })}
                      className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 w-4 h-4"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50/70 transition cursor-pointer">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-slate-900">Confirmar Eliminación de Expedientes</span>
                      <span className="text-[11px] text-slate-500">
                        Solicita confirmación antes de descartar o borrar cualquier borrador de partición.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={ajustes.confirmarEliminacionBorradores}
                      onChange={(e) => handleActualizarAjustes({ confirmarEliminacionBorradores: e.target.checked })}
                      className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 w-4 h-4"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50/70 transition cursor-pointer">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-slate-900">Autoguardado Local Continuo</span>
                      <span className="text-[11px] text-slate-500">
                        Guarda inmediatamente cada cambio en el almacenamiento local seguro del navegador.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={ajustes.autoGuardadoLocal}
                      onChange={(e) => handleActualizarAjustes({ autoGuardadoLocal: e.target.checked })}
                      className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 w-4 h-4"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Barra inferior fija siempre visible sin importar el scroll */}
      <div className="bg-white border-t border-slate-200 px-6 py-3.5 shrink-0 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 z-20 w-full">
        <div className="flex items-center gap-2">
          {hayCambiosPendientes ? (
            <div className="flex items-center gap-2 text-xs text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
              <span>
                {hayCambiosAjustes && !hayCambiosPerfil
                  ? 'Opciones seleccionadas • Presione "Aplicar Cambios" para activar el nuevo tema/densidad en el sistema'
                  : 'Hay modificaciones seleccionadas sin aplicar • Presione "Aplicar Cambios" para confirmarlas'}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-slate-500 px-2 py-1">
              <Check className="w-3.5 h-3.5 text-slate-900 shrink-0" />
              <span>Configuración activa y confirmada • Sin cambios pendientes</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {hayCambiosPendientes && (
            <button
              type="button"
              id="btn-descartar-cambios-config"
              onClick={handleDescartarCambios}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Descartar Cambios
            </button>
          )}

          <button
            type="button"
            id="btn-aplicar-cambios-config"
            disabled={!hayCambiosPendientes}
            onClick={handleAplicarCambios}
            className={`inline-flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-xs font-bold transition-all ${
              hayCambiosPendientes
                ? 'bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white cursor-pointer shadow-sm hover:shadow'
                : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed shadow-none'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>Aplicar Cambios</span>
          </button>
        </div>
      </div>
    </div>
  );
};
