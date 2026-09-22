import React, { useState, useEffect } from 'react';
import {
  ProcesoParticion,
  Ley,
  HonorariosConfig,
  PerfilAbogado,
  AjustesApp,
} from './types';
import {
  obtenerProcesosPendientes,
  guardarProceso,
  eliminarProceso,
  finalizarProcesoEnStorage,
  obtenerLeyesGenerales,
  guardarLeyesGenerales,
  obtenerHonorariosGenerales,
  guardarHonorariosGenerales,
  obtenerPerfilAbogado,
  guardarPerfilAbogado,
  obtenerAjustesApp,
  guardarAjustesApp,
  obtenerEstadoSesion,
  guardarEstadoSesion,
} from './utils/storage';
import { HomeScreen } from './components/HomeScreen';
import { WizardProceso } from './components/WizardProceso';
import { ConfigLeyes } from './components/ConfigLeyes';
import { ConfigHonorarios } from './components/ConfigHonorarios';
import { ConfiguracionGeneral } from './components/ConfiguracionGeneral';
import { LoginScreen } from './components/LoginScreen';
import { HeaderPrincipal } from './components/HeaderPrincipal';
import { Scale } from 'lucide-react';

export default function App() {
  const [vista, setVista] = useState<'home' | 'wizard' | 'config-leyes' | 'config-honorarios' | 'config-general'>('home');
  const [procesos, setProcesos] = useState<ProcesoParticion[]>([]);
  const [procesoActivo, setProcesoActivo] = useState<ProcesoParticion | null>(null);
  const [leyesGenerales, setLeyesGenerales] = useState<Ley[]>([]);
  const [honorariosGenerales, setHonorariosGenerales] = useState<HonorariosConfig>(obtenerHonorariosGenerales());
  const [perfilAbogado, setPerfilAbogado] = useState<PerfilAbogado>(obtenerPerfilAbogado());
  const [ajustesApp, setAjustesApp] = useState<AjustesApp>(obtenerAjustesApp());
  // Siempre iniciar con sesión inactiva (false) al cargar la aplicación desde cualquier enlace o ruta
  const [sesionActiva, setSesionActiva] = useState<boolean>(false);
  const [notificacion, setNotificacion] = useState<string | null>(null);

  // Sincronizar tema visual y densidad activa confirmada con el documento raíz y body
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', ajustesApp.temaVisual);
    document.body.setAttribute('data-theme', ajustesApp.temaVisual);
    document.documentElement.setAttribute('data-density', ajustesApp.densidadInterfaz);
    document.body.setAttribute('data-density', ajustesApp.densidadInterfaz);
  }, [ajustesApp.temaVisual, ajustesApp.densidadInterfaz]);

  const navegarA = (nuevaVista: 'home' | 'wizard' | 'config-leyes' | 'config-honorarios' | 'config-general') => {
    setVista(nuevaVista);
  };

  // Cargar datos locales al montar: siempre forzar inicio en LoginScreen
  useEffect(() => {
    // Al abrir la aplicación o acceder desde cualquier enlace, limpiar cualquier sesión previa activa
    guardarEstadoSesion(false);
    setSesionActiva(false);

    const listProcesos = obtenerProcesosPendientes();
    setProcesos(listProcesos);
    setLeyesGenerales(obtenerLeyesGenerales());
    setHonorariosGenerales(obtenerHonorariosGenerales());
    setPerfilAbogado(obtenerPerfilAbogado());
    setAjustesApp(obtenerAjustesApp());
  }, []);

  const mostrarMensajeNotificacion = (texto: string) => {
    setNotificacion(texto);
    setTimeout(() => {
      setNotificacion(null);
    }, 4000);
  };

  // 1. Iniciar nuevo proceso
  const handleNuevoProceso = () => {
    const leyesActuales = obtenerLeyesGenerales();
    const honorariosActuales = obtenerHonorariosGenerales();

    const nuevo: ProcesoParticion = {
      id: `proc-${Date.now()}`,
      nombreCaso: 'Nuevo Expediente de Partición',
      tipoProceso: 'Partición Notarial / Judicial',
      fechaCreacion: new Date().toISOString(),
      fechaUltimaEdicion: new Date().toISOString(),
      finalizado: false,
      pasoActual: 1,
      regimenSucesoral: 'testado',
      bienes: [],
      leyes: leyesActuales.map((l) => ({ ...l })),
      personas: [],
      honorarios: { ...honorariosActuales },
    };

    guardarProceso(nuevo);
    setProcesos((prev) => [nuevo, ...prev.filter((p) => p.id !== nuevo.id)]);
    setProcesoActivo(nuevo);
    setVista('wizard');
  };

  // 2. Retomar proceso existente
  const handleRetomarProceso = (proceso: ProcesoParticion) => {
    setProcesoActivo(proceso);
    setVista('wizard');
  };

  // 3. Eliminar borrador
  const handleEliminarProceso = (id: string) => {
    eliminarProceso(id);
    setProcesos((prev) => prev.filter((p) => p.id !== id));
    mostrarMensajeNotificacion('Borrador de partición eliminado');
  };

  // 4. Actualizar proceso en curso
  const handleActualizarProceso = (actualizado: ProcesoParticion) => {
    setProcesoActivo(actualizado);
    guardarProceso(actualizado);
    setProcesos((prev) => prev.map((p) => (p.id === actualizado.id ? actualizado : p)));
  };

  // 5. Finalizar proceso e imprimir (lo saca de pendientes)
  const handleFinalizarProceso = () => {
    if (!procesoActivo) return;

    finalizarProcesoEnStorage(procesoActivo.id);
    const restantes = obtenerProcesosPendientes();
    setProcesos(restantes);
    setProcesoActivo(null);
    setVista('home');
    mostrarMensajeNotificacion('Proceso finalizado.');
  };

  // 6. Guardar leyes generales
  const handleGuardarLeyesGenerales = (leyes: Ley[]) => {
    setLeyesGenerales(leyes);
    guardarLeyesGenerales(leyes);
  };

  // 7. Guardar honorarios generales
  const handleGuardarHonorariosGenerales = (config: HonorariosConfig) => {
    setHonorariosGenerales(config);
    guardarHonorariosGenerales(config);
  };

  // Si no hay sesión activa, mostrar únicamente la pantalla de login independiente
  if (!sesionActiva) {
    return (
      <div id="app-root-container" data-theme={ajustesApp.temaVisual} data-density={ajustesApp.densidadInterfaz} className="h-screen w-screen flex flex-col font-sans overflow-hidden select-none">
        <LoginScreen
          perfil={perfilAbogado}
          onIniciarSesion={() => {
            setSesionActiva(true);
            guardarEstadoSesion(true);
            setVista('home');
            mostrarMensajeNotificacion('Sesión profesional iniciada.');
          }}
        />
      </div>
    );
  }

  return (
    <div id="app-root-container" data-theme={ajustesApp.temaVisual} data-density={ajustesApp.densidadInterfaz} className="h-screen w-screen flex flex-col bg-slate-100 text-slate-800 font-sans overflow-hidden select-none">
      {/* Componente único de Encabezado Principal compartido en toda la aplicación */}
      <HeaderPrincipal
        vistaActual={vista}
        onNavegar={navegarA}
        perfilAbogado={perfilAbogado}
        sesionActiva={sesionActiva}
        notificacion={notificacion}
      />

      {/* Vistas dinámicas sin ventanas emergentes ni modales */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {vista === 'home' && (
          <HomeScreen
            procesos={procesos}
            onNuevoProceso={handleNuevoProceso}
            onRetomarProceso={handleRetomarProceso}
            onEliminarProceso={handleEliminarProceso}
          />
        )}

        {vista === 'wizard' && procesoActivo && (
          <WizardProceso
            proceso={procesoActivo}
            onActualizarProceso={handleActualizarProceso}
            onSalirAlInicio={() => {
              setProcesos(obtenerProcesosPendientes());
              navegarA('home');
            }}
            onFinalizarProceso={handleFinalizarProceso}
          />
        )}

        {vista === 'config-leyes' && (
          <ConfigLeyes
            leyes={leyesGenerales}
            onGuardarLeyes={handleGuardarLeyesGenerales}
            onVolver={() => navegarA('home')}
          />
        )}

        {vista === 'config-honorarios' && (
          <ConfigHonorarios
            honorarios={honorariosGenerales}
            onGuardarHonorarios={(config) => {
              handleGuardarHonorariosGenerales(config);
              mostrarMensajeNotificacion('Honorarios y Agencias actualizados.');
            }}
            onVolver={() => navegarA('home')}
            procesos={procesos}
            procesoActual={procesoActivo || (procesos.length > 0 ? procesos[0] : undefined)}
          />
        )}

        {vista === 'config-general' && (
          <ConfiguracionGeneral
            perfil={perfilAbogado}
            ajustes={ajustesApp}
            sesionActiva={sesionActiva}
            onGuardarPerfil={(nuevoPerfil) => {
              setPerfilAbogado(nuevoPerfil);
              guardarPerfilAbogado(nuevoPerfil);
              mostrarMensajeNotificacion('Perfil de abogado actualizado.');
            }}
            onGuardarAjustes={(nuevosAjustes) => {
              setAjustesApp(nuevosAjustes);
              guardarAjustesApp(nuevosAjustes);
              mostrarMensajeNotificacion('Ajustes de la aplicación actualizados.');
            }}
            onCambiarEstadoSesion={(activa) => {
              setSesionActiva(activa);
              guardarEstadoSesion(activa);
              mostrarMensajeNotificacion(activa ? 'Sesión profesional activa.' : 'Sesión cerrada.');
            }}
            onVolver={() => setVista('home')}
          />
        )}
      </main>
    </div>
  );
}
