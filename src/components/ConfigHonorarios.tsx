import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  ReceiptText,
  Route,
  Sliders,
  Briefcase,
  Gavel,
  FileText,
  ArrowUpRight,
  ArrowDownLeft,
  Check,
  AlertTriangle,
  Clock,
  Lock,
  FolderOpen,
  Users,
  X,
  Info,
} from 'lucide-react';
import { HonorariosConfig, ProcesoParticion, ViaProceso, EstadoAgencias } from '../types';
import { InputPorcentaje } from './InputPorcentaje';
import { InputMoneda } from './InputMoneda';
import { formatearMoneda } from '../utils/calculator';

// Componente visual unificado para todas las etiquetas / badges
const BadgeTag: React.FC<{
  children: React.ReactNode;
  icon?: React.ReactNode;
  id?: string;
  className?: string;
}> = ({ children, icon, id, className = '' }) => (
  <span
    id={id}
    className={`inline-flex items-center gap-1 bg-slate-50 border border-slate-800/40 text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded tracking-wide uppercase select-none ${className}`}
  >
    {icon}
    <span>{children}</span>
  </span>
);

interface ConfigHonorariosProps {
  honorarios: HonorariosConfig;
  onGuardarHonorarios: (honorarios: HonorariosConfig) => void;
  onVolver: () => void;
  procesos?: ProcesoParticion[];
  procesoActual?: ProcesoParticion;
  onSeleccionarProceso?: (proc: ProcesoParticion) => void;
}

export const ConfigHonorarios: React.FC<ConfigHonorariosProps> = ({
  honorarios: initialHonorarios,
  onGuardarHonorarios,
  onVolver,
  procesos = [],
  procesoActual,
  onSeleccionarProceso,
}) => {
  // Caso actual activo seleccionado para alimentar la lista de personas
  const [casoSeleccionadoId, setCasoSeleccionadoId] = useState<string>(() => {
    return procesoActual?.id || (procesos.length > 0 ? procesos[0].id : '');
  });

  const casoActivo = useMemo(() => {
    return (
      procesos.find((p) => p.id === casoSeleccionadoId) ||
      procesoActual ||
      (procesos.length > 0 ? procesos[0] : null)
    );
  }, [procesos, casoSeleccionadoId, procesoActual]);

  // Lista de personas registradas en el caso actual (las mismas del paso 'Personas y Leyes')
  const personasCaso = useMemo(() => {
    if (!casoActivo || !casoActivo.personas) return [];
    return casoActivo.personas.map((p) => {
      const relacion = p.tipoRelacion === 'Familiar' ? p.parentesco : 'Socio / Tercero';
      return {
        id: p.id,
        nombre: p.nombre,
        tipoRelacion: p.tipoRelacion,
        parentesco: p.parentesco,
        rol: `${p.nombre} (${relacion})`,
      };
    });
  }, [casoActivo]);

  // Normalizar configuración inicial
  const normalizarConfig = (h: HonorariosConfig): HonorariosConfig => {
    const quienesPaganIds =
      h.quienesPaganIds && Array.isArray(h.quienesPaganIds)
        ? [...h.quienesPaganIds]
        : h.quienPagaId
        ? [h.quienPagaId]
        : [];

    const quienesRecibenIds =
      h.quienesRecibenIds && Array.isArray(h.quienesRecibenIds)
        ? [...h.quienesRecibenIds]
        : h.quienRecibeId
        ? [h.quienRecibeId]
        : [];

    return {
      viaProceso: h.viaProceso ?? 'judicial',
      abogadoPorcentaje: h.abogadoPorcentaje ?? 10,
      agenciasDerechoPorcentaje: h.agenciasDerechoPorcentaje ?? h.juezCostasPorcentaje ?? 15,
      juezCostasPorcentaje: h.agenciasDerechoPorcentaje ?? h.juezCostasPorcentaje ?? 15,
      abogadoFijoCOP: h.abogadoFijoCOP ?? 0,
      agenciasDerechoFijoCOP: h.agenciasDerechoFijoCOP ?? h.juezCostasFijoCOP ?? 0,
      juezCostasFijoCOP: h.agenciasDerechoFijoCOP ?? h.juezCostasFijoCOP ?? 0,
      modalidad: h.modalidad ?? 'porcentaje',
      quienesPaganIds,
      quienesPaganNombres: h.quienesPaganNombres ?? (h.quienPagaNombre ? [h.quienPagaNombre] : []),
      quienesRecibenIds,
      quienesRecibenNombres: h.quienesRecibenNombres ?? (h.quienRecibeNombre ? [h.quienRecibeNombre] : []),
      quienPagaId: quienesPaganIds[0] ?? h.quienPagaId ?? '',
      quienPagaNombre: h.quienPagaNombre ?? '',
      quienRecibeId: quienesRecibenIds[0] ?? h.quienRecibeId ?? '',
      quienRecibeNombre: h.quienRecibeNombre ?? '',
      estadoAgencias: h.estadoAgencias ?? 'estimado',
    };
  };

  // Estado base guardado (para detectar cambios pendientes)
  const [configGuardada, setConfigGuardada] = useState<HonorariosConfig>(() =>
    normalizarConfig(initialHonorarios)
  );

  // Estado editable en borrador
  const [config, setConfig] = useState<HonorariosConfig>(() =>
    normalizarConfig(initialHonorarios)
  );

  const [guardadoFeedback, setGuardadoFeedback] = useState(false);

  // Sincronizar si cambian las props externamente
  useEffect(() => {
    const normalizada = normalizarConfig(initialHonorarios);
    setConfig(normalizada);
    setConfigGuardada(normalizada);
  }, [initialHonorarios]);

  // Comparación de arrays para detectar cambios en selección múltiple
  const arraysIguales = (a: string[] = [], b: string[] = []) =>
    a.length === b.length && a.every((val, idx) => val === b[idx]);

  // Validación: Impedir seleccionar la misma persona en Quién Paga y Quién Recibe
  const personasEnConflicto = useMemo(() => {
    const pagan = config.quienesPaganIds || [];
    const reciben = config.quienesRecibenIds || [];
    return pagan.filter((id) => reciben.includes(id));
  }, [config.quienesPaganIds, config.quienesRecibenIds]);

  const hayConflicto = personasEnConflicto.length > 0;

  // Detección de cambios pendientes respecto a lo guardado
  const hayCambiosPendientes =
    config.viaProceso !== configGuardada.viaProceso ||
    config.modalidad !== configGuardada.modalidad ||
    Number(config.abogadoPorcentaje) !== Number(configGuardada.abogadoPorcentaje) ||
    Number(config.abogadoFijoCOP || 0) !== Number(configGuardada.abogadoFijoCOP || 0) ||
    Number(config.agenciasDerechoPorcentaje ?? 15) !==
      Number(configGuardada.agenciasDerechoPorcentaje ?? 15) ||
    Number(config.agenciasDerechoFijoCOP || 0) !== Number(configGuardada.agenciasDerechoFijoCOP || 0) ||
    !arraysIguales(config.quienesPaganIds, configGuardada.quienesPaganIds) ||
    !arraysIguales(config.quienesRecibenIds, configGuardada.quienesRecibenIds) ||
    config.estadoAgencias !== configGuardada.estadoAgencias;

  const puedeGuardar = hayCambiosPendientes && !hayConflicto;

  const handleCambiarViaProceso = (nuevaVia: ViaProceso) => {
    setConfig((prev) => ({
      ...prev,
      viaProceso: nuevaVia,
    }));
  };

  const handleCambiarModalidad = (nuevaModalidad: 'porcentaje' | 'fijo') => {
    setConfig((prev) => ({
      ...prev,
      modalidad: nuevaModalidad,
    }));
  };

  const handleCambiarEstadoAgencias = (nuevoEstado: EstadoAgencias) => {
    setConfig((prev) => ({
      ...prev,
      estadoAgencias: nuevoEstado,
    }));
  };

  // Manejadores para multi-selección de Quién Paga
  const handleAgregarQuienPaga = (personaId: string) => {
    if (!personaId) return;
    const actuales = config.quienesPaganIds || [];
    if (actuales.includes(personaId)) return;
    const nuevos = [...actuales, personaId];
    const nuevosNombres = nuevos.map((id) => {
      const p = personasCaso.find((pers) => pers.id === id);
      return p ? p.nombre : id;
    });

    setConfig((prev) => ({
      ...prev,
      quienesPaganIds: nuevos,
      quienesPaganNombres: nuevosNombres,
      quienPagaId: nuevos[0] || '',
      quienPagaNombre: nuevosNombres.join(', '),
    }));
  };

  const handleQuitarQuienPaga = (personaId: string) => {
    const actuales = config.quienesPaganIds || [];
    const nuevos = actuales.filter((id) => id !== personaId);
    const nuevosNombres = nuevos.map((id) => {
      const p = personasCaso.find((pers) => pers.id === id);
      return p ? p.nombre : id;
    });

    setConfig((prev) => ({
      ...prev,
      quienesPaganIds: nuevos,
      quienesPaganNombres: nuevosNombres,
      quienPagaId: nuevos[0] || '',
      quienPagaNombre: nuevosNombres.join(', '),
    }));
  };

  // Manejadores para multi-selección de Quién Recibe
  const handleAgregarQuienRecibe = (personaId: string) => {
    if (!personaId) return;
    const actuales = config.quienesRecibenIds || [];
    if (actuales.includes(personaId)) return;
    const nuevos = [...actuales, personaId];
    const nuevosNombres = nuevos.map((id) => {
      const p = personasCaso.find((pers) => pers.id === id);
      return p ? p.nombre : id;
    });

    setConfig((prev) => ({
      ...prev,
      quienesRecibenIds: nuevos,
      quienesRecibenNombres: nuevosNombres,
      quienRecibeId: nuevos[0] || '',
      quienRecibeNombre: nuevosNombres.join(', '),
    }));
  };

  const handleQuitarQuienRecibe = (personaId: string) => {
    const actuales = config.quienesRecibenIds || [];
    const nuevos = actuales.filter((id) => id !== personaId);
    const nuevosNombres = nuevos.map((id) => {
      const p = personasCaso.find((pers) => pers.id === id);
      return p ? p.nombre : id;
    });

    setConfig((prev) => ({
      ...prev,
      quienesRecibenIds: nuevos,
      quienesRecibenNombres: nuevosNombres,
      quienRecibeId: nuevos[0] || '',
      quienRecibeNombre: nuevosNombres.join(', '),
    }));
  };

  const handleAplicarCambios = () => {
    if (!puedeGuardar) return;
    onGuardarHonorarios(config);
    setConfigGuardada(config);
    setGuardadoFeedback(true);
    setTimeout(() => setGuardadoFeedback(false), 2500);
  };

  const handleDescartarCambios = () => {
    setConfig(configGuardada);
  };

  const esNotarial = config.viaProceso === 'notarial';
  const esJudicial = config.viaProceso === 'judicial';
  const estaConfirmado = config.estadoAgencias === 'confirmado';

  const agenciasVal = config.agenciasDerechoPorcentaje ?? config.juezCostasPorcentaje ?? 15;
  const agenciasFueraRango =
    esJudicial && config.modalidad === 'porcentaje' && (agenciasVal < 10 || agenciasVal > 20);

  // Estimación referencial del monto de agencias para el desglose de división
  const patrimonioReferencialCOP = useMemo(() => {
    if (casoActivo && casoActivo.bienes.length > 0) {
      return casoActivo.bienes.reduce((acc, b) => acc + (b.valorCOP || 0), 0);
    }
    return 100000000; // Valor ilustrativo de $100M si no hay bienes registrados
  }, [casoActivo]);

  const agenciasTotalReferencialCOP = useMemo(() => {
    if (config.modalidad === 'fijo') {
      return config.agenciasDerechoFijoCOP || 0;
    }
    return Math.round(patrimonioReferencialCOP * (agenciasVal / 100));
  }, [config.modalidad, config.agenciasDerechoFijoCOP, patrimonioReferencialCOP, agenciasVal]);

  const numPagan = config.quienesPaganIds?.length || 0;
  const numReciben = config.quienesRecibenIds?.length || 0;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white w-full">
      {/* Encabezado fijo superior */}
      <div className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shrink-0 shadow-2xs w-full">
        <div className="flex items-center gap-3">
          <button
            type="button"
            id="btn-volver-config-honorarios"
            onClick={onVolver}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver</span>
          </button>
          <div className="h-4 w-px bg-slate-300 mx-1" />
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ReceiptText className="w-5 h-5 text-slate-900" />
              Configuración: Honorarios y Agencias en Derecho
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Configura las reglas procesales, honorarios profesionales y liquidación de costas y agencias en derecho.
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

      {/* Selector de Caso Activo si hay expedientes */}
      {procesos.length > 0 && (
        <div className="bg-slate-50/70 border-b border-slate-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <FolderOpen className="w-4 h-4 text-slate-600 shrink-0" />
            <span className="font-bold text-slate-900">Caso actual para selección de partes:</span>
            <span className="text-slate-500">
              Las opciones de &quot;Quién Paga&quot; y &quot;Quién Recibe&quot; se cargan de las personas registradas en este expediente.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <select
              id="select-caso-activo"
              value={casoActivo?.id || ''}
              onChange={(e) => {
                const id = e.target.value;
                setCasoSeleccionadoId(id);
                const sel = procesos.find((p) => p.id === id);
                if (sel && onSeleccionarProceso) {
                  onSeleccionarProceso(sel);
                }
              }}
              className="bg-white border border-slate-300 text-slate-900 font-semibold px-3 py-1 rounded-lg text-xs focus:outline-none focus:border-slate-900 cursor-pointer"
            >
              {procesos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombreCaso || 'Expediente sin nombre'} ({p.personas.length} personas)
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Contenido desplazable que ocupa todo el ancho disponible */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 bg-white w-full">
        <div className="w-full space-y-6">
          {/* CONFIGURACIÓN PRINCIPAL: VIA DEL PROCESO */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Route className="w-4 h-4 text-slate-900" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  1. Vía del Proceso (Selector Obligatorio)
                </h3>
                <BadgeTag>Obligatorio</BadgeTag>
              </div>
              <p className="text-xs text-slate-500">
                Seleccione el cauce procedimental del trámite. La vía determina si se habilitan las Agencias en Derecho.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Opción Notarial */}
              <button
                type="button"
                id="btn-via-notarial"
                onClick={() => handleCambiarViaProceso('notarial')}
                className={`p-4 rounded-xl text-left transition flex items-start gap-3.5 cursor-pointer ${
                  esNotarial
                    ? 'border-2 border-slate-900 bg-slate-100/90 shadow-xs ring-1 ring-slate-900/10'
                    : 'border border-slate-200 bg-white hover:border-slate-400 text-slate-600'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                  esNotarial ? 'border-slate-900 bg-slate-900' : 'border-slate-300 bg-white'
                }`}>
                  {esNotarial && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>

                <div className="mt-0.5">
                  <FileText
                    className={`w-5 h-5 ${esNotarial ? 'text-slate-900' : 'text-slate-400'}`}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      Notarial (Mutuo Acuerdo)
                    </span>
                    {esNotarial && <BadgeTag>Seleccionada</BadgeTag>}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Trámite consensual ante notario público. <strong>No existe litigio</strong> ni condena judicial, por lo que la sección de Agencias en Derecho queda inactiva. Solo aplican honorarios profesionales.
                  </p>
                </div>
              </button>

              {/* Opción Judicial */}
              <button
                type="button"
                id="btn-via-judicial"
                onClick={() => handleCambiarViaProceso('judicial')}
                className={`p-4 rounded-xl text-left transition flex items-start gap-3.5 cursor-pointer ${
                  esJudicial
                    ? 'border-2 border-slate-900 bg-slate-100/90 shadow-xs ring-1 ring-slate-900/10'
                    : 'border border-slate-200 bg-white hover:border-slate-400 text-slate-600'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                  esJudicial ? 'border-slate-900 bg-slate-900' : 'border-slate-300 bg-white'
                }`}>
                  {esJudicial && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>

                <div className="mt-0.5">
                  <Gavel
                    className={`w-5 h-5 ${esJudicial ? 'text-slate-900' : 'text-slate-400'}`}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      Judicial (Litigio)
                    </span>
                    {esJudicial && <BadgeTag>Seleccionada</BadgeTag>}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Proceso contencioso ante juez de familia o civil. <strong>Habilita la sección de Agencias en Derecho</strong> para fijar y transferir las costas procesales de la parte vencida a la vencedora.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* MODALIDAD DE COSTOS: PORCENTUAL VS FIJO */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sliders className="w-4 h-4 text-slate-900" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  2. Modalidad de Liquidación
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                Elija si los honorarios y costas se liquidan como un porcentaje de la masa o como montos fijos en COP.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 max-w-sm">
              <button
                type="button"
                id="btn-modalidad-porcentaje"
                onClick={() => handleCambiarModalidad('porcentaje')}
                className={`px-3 py-2 rounded-lg text-xs transition cursor-pointer border ${
                  config.modalidad === 'porcentaje'
                    ? 'bg-slate-900 text-white border-2 border-slate-900 font-bold shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:text-slate-900 font-medium'
                }`}
              >
                <span>Porcentaje (%)</span>
              </button>

              <button
                type="button"
                id="btn-modalidad-fijo"
                onClick={() => handleCambiarModalidad('fijo')}
                className={`px-3 py-2 rounded-lg text-xs transition cursor-pointer border ${
                  config.modalidad === 'fijo'
                    ? 'bg-slate-900 text-white border-2 border-slate-900 font-bold shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:text-slate-900 font-medium'
                }`}
              >
                <span>Monto Fijo (COP)</span>
              </button>
            </div>
          </div>

          {/* SECCIÓN: HONORARIOS DE ABOGADO (APLICA SIEMPRE) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-slate-900" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Honorarios de Abogado (Aplica en Toda Vía)
                </h4>
              </div>
              <BadgeTag>Aplica en toda vía procesal</BadgeTag>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {config.modalidad === 'porcentaje' ? (
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="config-abogado-pct" className="text-[11px] font-bold text-slate-700">
                    Porcentaje de Honorarios de Abogado
                  </label>
                  <div className="flex items-center gap-2.5">
                    <div className="relative w-36">
                      <InputPorcentaje
                        id="config-abogado-pct"
                        value={config.abogadoPorcentaje}
                        onChange={(val) => {
                          setConfig((prev) => ({
                            ...prev,
                            abogadoPorcentaje: val,
                          }));
                        }}
                        min={0}
                        max={100}
                        step="0.5"
                        valorPorDefectoEnBlur={0}
                        className="w-full bg-white border border-slate-300 rounded-lg pl-3 pr-7 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-slate-900"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono select-none">
                        %
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Habitual: 10% - 15%
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Pactado libremente. Se resta de la masa común total antes de partición.
                  </span>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="config-abogado-fijo" className="text-[11px] font-bold text-slate-700">
                    Monto Fijo de Honorarios (COP)
                  </label>
                  <div className="relative w-full max-w-xs">
                    <InputMoneda
                      id="config-abogado-fijo"
                      value={config.abogadoFijoCOP ?? 0}
                      onChange={(val) => {
                        setConfig((prev) => ({
                          ...prev,
                          abogadoFijoCOP: val,
                        }));
                      }}
                      placeholder="$0"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-slate-900"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SECCIÓN: AGENCIAS EN DERECHO (CONDICIONAL A VÍA JUDICIAL) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Gavel className="w-4 h-4 text-slate-900" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Agencias en Derecho (Costas Procesales Judiciales)
                </h4>
              </div>
              <BadgeTag>
                {esJudicial ? 'Habilitado (Vía Judicial)' : 'Inactivo (Vía Notarial)'}
              </BadgeTag>
            </div>

            {esNotarial ? (
              /* Sección inactiva en Vía Notarial con explicación jurídica */
              <div
                id="seccion-agencias-inactiva-notarial"
                className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-4 flex items-start gap-3 text-slate-600"
              >
                <div className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 shrink-0">
                  <Gavel className="w-4 h-4" />
                </div>
                <div className="flex-1 text-xs">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-slate-800">
                      Sección Deshabilitada: Agencias en Derecho
                    </span>
                    <BadgeTag>No aplica en Vía Notarial</BadgeTag>
                  </div>
                  <p className="text-slate-500 leading-relaxed">
                    Las <strong>Agencias en Derecho</strong> solo existen cuando hay un litigio con sentencia judicial contenciosa (Código General del Proceso, Art. 365). Al haber seleccionado la <strong>Vía Notarial (Mutuo Acuerdo)</strong>, esta sección queda deshabilitada y no genera condena en costas entre las partes.
                  </p>
                </div>
              </div>
            ) : (
              /* Sección ACTIVA en Vía Judicial */
              <div
                id="seccion-agencias-activa-judicial"
                className="flex flex-col gap-5 bg-slate-50/70 border border-slate-200 rounded-xl p-4 sm:p-5"
              >
                {/* Estado Procesal */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-xs font-bold text-slate-900">
                      Estado de Fijación Judicial de las Agencias
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Indica si el monto está en litigio estimativo o ya fue fijado en providencia judicial.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {estaConfirmado ? (
                      <BadgeTag
                        id="badge-estado-confirmado"
                        icon={<Lock className="w-3 h-3 text-slate-900" />}
                      >
                        Confirmado por Sentencia
                      </BadgeTag>
                    ) : (
                      <BadgeTag
                        id="badge-estado-estimado"
                        icon={<Clock className="w-3 h-3 text-slate-900" />}
                      >
                        Estimado (En Litigio)
                      </BadgeTag>
                    )}
                  </div>
                </div>

                {/* Regla de Liquidación y Aviso Legal */}
                <div className="text-[11px] text-slate-700 bg-white border border-slate-300 rounded-lg p-3 flex items-start gap-2">
                  <Info className="w-4 h-4 text-slate-800 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>Regla de Liquidación Procesal:</strong> Las agencias en derecho <em>no</em> se restan del patrimonio común de la herencia o disolución societaria. Constituyen una <strong>transferencia directa entre patrimonios</strong>: se deducen de la cuota de la(s) parte(s) vencida(s) y se acreditan a favor de la(s) parte(s) vencedora(s).
                  </p>
                </div>

                {/* Cuantía o Porcentaje de Agencias + Botones de Estado */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Selector de Porcentaje / Fijo */}
                  {config.modalidad === 'porcentaje' ? (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor="config-agencias-pct"
                          className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5"
                        >
                          {estaConfirmado && <Lock className="w-3.5 h-3.5 text-slate-700" />}
                          <span>Porcentaje de Agencias en Derecho</span>
                        </label>
                        {estaConfirmado && (
                          <BadgeTag icon={<Lock className="w-2.5 h-2.5 text-slate-900" />}>
                            Bloqueado
                          </BadgeTag>
                        )}
                      </div>

                      <div className="flex items-center gap-2.5">
                        <div className="relative w-36">
                          <InputPorcentaje
                            id="config-agencias-pct"
                            value={agenciasVal}
                            onChange={(val) => {
                              if (estaConfirmado) return;
                              setConfig((prev) => ({
                                ...prev,
                                agenciasDerechoPorcentaje: val,
                                juezCostasPorcentaje: val,
                              }));
                            }}
                            min={0}
                            max={100}
                            step="0.5"
                            disabled={estaConfirmado}
                            valorPorDefectoEnBlur={0}
                            className={`w-full border rounded-lg pl-3 pr-7 py-2 text-xs font-mono font-bold focus:outline-none ${
                              estaConfirmado
                                ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-300 select-none'
                                : 'bg-white border-slate-300 text-slate-900 focus:border-slate-900'
                            }`}
                          />
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono select-none">
                            %
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono">
                          Rango legal: 10% - 20%
                        </span>
                      </div>

                      {/* Advertencia de bloqueo por estado confirmado */}
                      {estaConfirmado ? (
                        <div
                          id="aviso-agencias-bloqueado"
                          className="flex items-center gap-1.5 text-[11px] text-slate-900 bg-slate-100 border border-slate-300 px-2.5 py-1.5 rounded-lg mt-1"
                        >
                          <Lock className="w-3.5 h-3.5 text-slate-800 shrink-0" />
                          <span>
                            Bloqueado por fijación judicial definitiva. Para modificar el porcentaje, cambie el estado de vuelta a <strong>&quot;Estimado&quot;</strong>.
                          </span>
                        </div>
                      ) : (
                        agenciasFueraRango && (
                          <div className="flex items-center gap-2 text-[11px] text-slate-800 bg-slate-100 border border-slate-300 px-2.5 py-1.5 rounded-lg mt-1">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-slate-800" />
                            <span>Fuera del rango sugerido (10% - 20%) del Acuerdo CSJ PCAA16-10554.</span>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor="config-agencias-fijo"
                          className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5"
                        >
                          {estaConfirmado && <Lock className="w-3.5 h-3.5 text-slate-700" />}
                          <span>Monto Fijo de Agencias (COP)</span>
                        </label>
                        {estaConfirmado && (
                          <BadgeTag icon={<Lock className="w-2.5 h-2.5 text-slate-900" />}>
                            Bloqueado
                          </BadgeTag>
                        )}
                      </div>

                      <div className="relative w-full max-w-xs">
                        <InputMoneda
                          id="config-agencias-fijo"
                          value={config.agenciasDerechoFijoCOP ?? 0}
                          onChange={(val) => {
                            if (estaConfirmado) return;
                            setConfig((prev) => ({
                              ...prev,
                              agenciasDerechoFijoCOP: val,
                              juezCostasFijoCOP: val,
                            }));
                          }}
                          disabled={estaConfirmado}
                          placeholder="$0"
                          className={`w-full border rounded-lg px-3 py-2 text-xs font-mono font-bold focus:outline-none ${
                            estaConfirmado
                              ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-300'
                              : 'bg-white border-slate-300 text-slate-900 focus:border-slate-900'
                          }`}
                        />
                      </div>
                      {estaConfirmado && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-900 bg-slate-100 border border-slate-300 px-2.5 py-1.5 rounded-lg mt-1">
                          <Lock className="w-3.5 h-3.5 text-slate-800 shrink-0" />
                          <span>
                            Bloqueado por fijación judicial. Cambie el estado a <strong>&quot;Estimado&quot;</strong> para editar.
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Selector de Estado Procesal */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-slate-700">
                      Estado de Fijación Judicial
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        id="btn-estado-estimado"
                        onClick={() => handleCambiarEstadoAgencias('estimado')}
                        className={`px-3 py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 transition cursor-pointer border ${
                          !estaConfirmado
                            ? 'bg-slate-900 text-white border-2 border-slate-900 font-bold shadow-xs'
                            : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:text-slate-900 font-medium'
                        }`}
                      >
                        <Clock className={`w-3.5 h-3.5 ${!estaConfirmado ? 'text-white' : 'text-slate-600'}`} />
                        <span>Estimado</span>
                      </button>

                      <button
                        type="button"
                        id="btn-estado-confirmado"
                        onClick={() => handleCambiarEstadoAgencias('confirmado')}
                        className={`px-3 py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 transition cursor-pointer border ${
                          estaConfirmado
                            ? 'bg-slate-900 text-white border-2 border-slate-900 font-bold shadow-xs'
                            : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:text-slate-900 font-medium'
                        }`}
                      >
                        <Check className={`w-3.5 h-3.5 ${estaConfirmado ? 'text-white' : 'text-slate-600'}`} />
                        <span>Confirmado</span>
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {estaConfirmado
                        ? 'Fijado oficialmente en sentencia. El campo de porcentaje queda bloqueado.'
                        : 'Litigio en curso. El porcentaje puede ajustarse libremente según la estimación.'}
                    </span>
                  </div>
                </div>

                {/* BANNER DE ERROR EN CASO DE CONFLICTO LEGAL ENTRE PARTES */}
                {hayConflicto && (
                  <div
                    id="banner-conflicto-agencias"
                    className="p-4 bg-slate-50 border-2 border-slate-900 rounded-xl flex items-start gap-3 text-slate-900 shadow-xs"
                  >
                    <AlertTriangle className="w-5 h-5 text-slate-900 shrink-0 mt-0.5" />
                    <div className="flex-1 text-xs">
                      <div className="font-bold text-sm text-slate-900 mb-1 flex items-center gap-2">
                        <span>Conflicto Legal de Partes en el Litigio</span>
                        <BadgeTag>Guardado bloqueado</BadgeTag>
                      </div>
                      <p className="text-slate-700 leading-relaxed">
                        No es posible seleccionar a la misma persona simultáneamente en <strong>&quot;Quién Paga&quot;</strong> y en <strong>&quot;Quién Recibe&quot;</strong>. En la legislación procesal civil (Art. 365 C.G.P.), una misma parte no puede ser a la vez deudora y acreedora de las costas procesales.
                      </p>
                      <div className="flex flex-wrap gap-2 my-2.5">
                        {personasEnConflicto.map((id) => {
                          const p = personasCaso.find((pers) => pers.id === id);
                          const nombre = p ? `${p.nombre} (${p.rol})` : id;
                          return (
                            <span
                              key={id}
                              className="inline-flex items-center gap-2 bg-white border border-slate-800 text-slate-900 font-bold px-2.5 py-1 rounded-lg text-xs shadow-2xs"
                            >
                              <span>{nombre}</span>
                              <div className="flex items-center gap-1 ml-1">
                                <button
                                  type="button"
                                  onClick={() => handleQuitarQuienPaga(id)}
                                  className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold px-2 py-0.5 rounded border border-slate-300 transition cursor-pointer"
                                  title="Quitar de Quién Paga"
                                >
                                  Quitar de Paga
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleQuitarQuienRecibe(id)}
                                  className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold px-2 py-0.5 rounded border border-slate-300 transition cursor-pointer"
                                  title="Quitar de Recibe"
                                >
                                  Quitar de Recibe
                                </button>
                              </div>
                            </span>
                          );
                        })}
                      </div>
                      <p className="text-[11px] text-slate-600 leading-normal">
                        Retire a la persona de uno de los dos lados para resolver el conflicto y habilitar el guardado de la configuración.
                      </p>
                    </div>
                  </div>
                )}

                {/* SELECTORES DESPLEGABLES MULTI-SELECCIÓN: QUIÉN PAGA Y QUIÉN RECIBE */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-3 border-t border-slate-200">
                  {/* SECTOR 1: QUIÉN PAGA (PARTE VENCIDA) */}
                  <div className="flex flex-col gap-2 bg-white border border-slate-200 rounded-xl p-3.5">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="select-quien-paga"
                        className="text-xs font-bold text-slate-900 flex items-center gap-1.5"
                      >
                        <ArrowUpRight className="w-4 h-4 text-slate-900" />
                        <span>Quién Paga (Parte Vencida en Litigio)</span>
                      </label>
                      <BadgeTag>
                        {numPagan} seleccionada{numPagan === 1 ? '' : 's'}
                      </BadgeTag>
                    </div>

                    <p className="text-[11px] text-slate-500">
                      Seleccione una o más personas a quienes se les deducirá la condena judicial.
                    </p>

                    {/* Selector desplegable alimentado directamente de Personas del caso */}
                    {personasCaso.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        <select
                          id="select-quien-paga"
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              handleAgregarQuienPaga(e.target.value);
                            }
                          }}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-900 cursor-pointer"
                        >
                          <option value="">+ Seleccionar persona para agregar a Quién Paga...</option>
                          {personasCaso.map((p) => {
                            const yaSeleccionado = config.quienesPaganIds?.includes(p.id);
                            const enElOtroLado = config.quienesRecibenIds?.includes(p.id);
                            return (
                              <option
                                key={`opt-paga-${p.id}`}
                                value={p.id}
                                disabled={yaSeleccionado}
                              >
                                {yaSeleccionado
                                  ? `✓ ${p.rol} (Ya agregada)`
                                  : enElOtroLado
                                  ? `⚠️ ${p.rol} (Está en Quién Recibe)`
                                  : `+ ${p.rol}`}
                              </option>
                            );
                          })}
                        </select>

                        {/* Chips con personas seleccionadas */}
                        {numPagan > 0 ? (
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {config.quienesPaganIds?.map((id) => {
                              const p = personasCaso.find((pers) => pers.id === id);
                              const esConflicto = personasEnConflicto.includes(id);
                              return (
                                <span
                                  key={`chip-paga-${id}`}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border shadow-2xs transition ${
                                    esConflicto
                                      ? 'bg-slate-100 text-slate-900 border-2 border-slate-900 font-bold'
                                      : 'bg-slate-50 text-slate-900 border-slate-300'
                                  }`}
                                >
                                  <span>{p ? p.nombre : id}</span>
                                  <span className="text-[10px] text-slate-500 font-normal">
                                    ({p ? (p.tipoRelacion === 'Familiar' ? p.parentesco : 'Socio / Tercero') : 'Parte'})
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleQuitarQuienPaga(id)}
                                    className="text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded-full w-4 h-4 flex items-center justify-center cursor-pointer ml-0.5"
                                    title="Quitar persona"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Ninguna persona seleccionada como parte vencida aún.
                          </span>
                        )}

                        {/* Detalle de división en partes iguales cuando hay más de una persona */}
                        {numPagan > 1 && (
                          <div
                            id="info-division-pagadores"
                            className="bg-slate-50 border border-slate-300 rounded-lg p-2.5 mt-1 text-xs text-slate-900 flex flex-col gap-1"
                          >
                            <div className="flex items-center justify-between font-semibold">
                              <span>División equitativa entre {numPagan} personas:</span>
                              <span className="font-mono text-slate-900">
                                {(100 / numPagan).toFixed(1)}% c/u
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-slate-600">
                              <span>Monto a cargo de cada persona:</span>
                              <span className="font-mono font-bold text-slate-900">
                                {formatearMoneda(Math.round(agenciasTotalReferencialCOP / numPagan))} c/u
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 flex items-start gap-2">
                        <Users className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-slate-900">Sin personas registradas en el caso actual</p>
                          <p className="text-[11px] text-slate-600 mt-0.5">
                            Registre a los partícipes en el paso &quot;Personas y Leyes&quot; para poder seleccionarlos como partes vencidas en el litigio.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* SECTOR 2: QUIÉN RECIBE (PARTE VENCEDORA) */}
                  <div className="flex flex-col gap-2 bg-white border border-slate-200 rounded-xl p-3.5">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="select-quien-recibe"
                        className="text-xs font-bold text-slate-900 flex items-center gap-1.5"
                      >
                        <ArrowDownLeft className="w-4 h-4 text-slate-900" />
                        <span>Quién Recibe (Parte Vencedora en Litigio)</span>
                      </label>
                      <BadgeTag>
                        {numReciben} seleccionada{numReciben === 1 ? '' : 's'}
                      </BadgeTag>
                    </div>

                    <p className="text-[11px] text-slate-500">
                      Seleccione una o más personas que recibirán las costas como acreedoras.
                    </p>

                    {/* Selector desplegable alimentado directamente de Personas del caso */}
                    {personasCaso.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        <select
                          id="select-quien-recibe"
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              handleAgregarQuienRecibe(e.target.value);
                            }
                          }}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-900 cursor-pointer"
                        >
                          <option value="">+ Seleccionar persona para agregar a Quién Recibe...</option>
                          {personasCaso.map((p) => {
                            const yaSeleccionado = config.quienesRecibenIds?.includes(p.id);
                            const enElOtroLado = config.quienesPaganIds?.includes(p.id);
                            return (
                              <option
                                key={`opt-recibe-${p.id}`}
                                value={p.id}
                                disabled={yaSeleccionado}
                              >
                                {yaSeleccionado
                                  ? `✓ ${p.rol} (Ya agregada)`
                                  : enElOtroLado
                                  ? `⚠️ ${p.rol} (Está en Quién Paga)`
                                  : `+ ${p.rol}`}
                              </option>
                            );
                          })}
                        </select>

                        {/* Chips con personas seleccionadas */}
                        {numReciben > 0 ? (
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {config.quienesRecibenIds?.map((id) => {
                              const p = personasCaso.find((pers) => pers.id === id);
                              const esConflicto = personasEnConflicto.includes(id);
                              return (
                                <span
                                  key={`chip-recibe-${id}`}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border shadow-2xs transition ${
                                    esConflicto
                                      ? 'bg-slate-100 text-slate-900 border-2 border-slate-900 font-bold'
                                      : 'bg-slate-50 text-slate-900 border-slate-300'
                                  }`}
                                >
                                  <span>{p ? p.nombre : id}</span>
                                  <span className="text-[10px] text-slate-500 font-normal">
                                    ({p ? (p.tipoRelacion === 'Familiar' ? p.parentesco : 'Socio / Tercero') : 'Parte'})
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleQuitarQuienRecibe(id)}
                                    className="text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded-full w-4 h-4 flex items-center justify-center cursor-pointer ml-0.5"
                                    title="Quitar persona"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Ninguna persona seleccionada como parte vencedora aún.
                          </span>
                        )}

                        {/* Detalle de división en partes iguales cuando hay más de una persona */}
                        {numReciben > 1 && (
                          <div
                            id="info-division-receptores"
                            className="bg-slate-50 border border-slate-300 rounded-lg p-2.5 mt-1 text-xs text-slate-900 flex flex-col gap-1"
                          >
                            <div className="flex items-center justify-between font-semibold">
                              <span>División equitativa entre {numReciben} personas:</span>
                              <span className="font-mono text-slate-900">
                                {(100 / numReciben).toFixed(1)}% c/u
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-slate-600">
                              <span>Monto a favor de cada persona:</span>
                              <span className="font-mono font-bold text-slate-900">
                                {formatearMoneda(Math.round(agenciasTotalReferencialCOP / numReciben))} c/u
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 flex items-start gap-2">
                        <Users className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-slate-900">Sin personas registradas en el caso actual</p>
                          <p className="text-[11px] text-slate-600 mt-0.5">
                            Registre a los partícipes en el paso &quot;Personas y Leyes&quot; para poder seleccionarlos como partes vencedoras en el litigio.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Barra inferior fija siempre visible sin importar el scroll */}
      <div className="bg-white border-t border-slate-200 px-6 py-3.5 shrink-0 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 z-20 w-full">
        <div className="flex items-center gap-2">
          {hayConflicto ? (
            <div className="flex items-center gap-2 text-xs text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-400 font-semibold">
              <AlertTriangle className="w-4 h-4 text-slate-900 shrink-0" />
              <span>Conflicto: La misma persona no puede pagar y recibir costas a la vez</span>
            </div>
          ) : hayCambiosPendientes ? (
            <div className="flex items-center gap-2 text-xs text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-slate-900 animate-pulse shrink-0" />
              <span>Hay modificaciones pendientes en honorarios sin aplicar</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-slate-500 px-2 py-1">
              <Check className="w-3.5 h-3.5 text-slate-900 shrink-0" />
              <span>Configuración actualizada • Sin cambios pendientes</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {hayCambiosPendientes && (
            <button
              type="button"
              id="btn-descartar-cambios-honorarios"
              onClick={handleDescartarCambios}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Descartar Cambios
            </button>
          )}

          <button
            type="button"
            id="btn-aplicar-cambios-honorarios"
            disabled={!puedeGuardar}
            onClick={handleAplicarCambios}
            className={`inline-flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-xs font-bold transition-all ${
              puedeGuardar
                ? 'bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white cursor-pointer shadow-sm hover:shadow'
                : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed shadow-none'
            }`}
            title={
              hayConflicto
                ? 'No es posible guardar: Existe conflicto de personas entre Quién Paga y Quién Recibe'
                : !hayCambiosPendientes
                ? 'Sin cambios pendientes para guardar'
                : 'Aplicar y guardar cambios'
            }
          >
            <Check className="w-4 h-4" />
            <span>Aplicar Cambios</span>
          </button>
        </div>
      </div>
    </div>
  );
};
