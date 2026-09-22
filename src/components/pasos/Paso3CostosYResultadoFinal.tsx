import React from 'react';
import {
  ProcesoParticion,
  HonorariosConfig,
  ResultadoParticion,
  ViaProceso,
  EstadoAgencias,
} from '../../types';
import { formatearMoneda } from '../../utils/calculator';
import { InputPorcentaje } from '../InputPorcentaje';
import { InputMoneda } from '../InputMoneda';
import {
  Briefcase,
  Scale,
  Download,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Users,
  Check,
  Percent,
  Info,
  Gavel,
  FileCheck,
  UserCheck,
  UserX,
  Clock,
  ArrowRight,
  Lock,
  X,
} from 'lucide-react';

interface Paso3CostosYResultadoFinalProps {
  proceso: ProcesoParticion;
  resultado: ResultadoParticion;
  onActualizarHonorarios: (honorarios: HonorariosConfig) => void;
  onAsignarBienAPersona: (bienId: string, personaId?: string) => void;
  onGenerarPDF: () => void;
  onFinalizarProceso: () => void;
  onAnterior: () => void;
}

export const Paso3CostosYResultadoFinal: React.FC<Paso3CostosYResultadoFinalProps> = ({
  proceso,
  resultado,
  onActualizarHonorarios,
  onAsignarBienAPersona,
  onGenerarPDF,
  onFinalizarProceso,
  onAnterior,
}) => {
  const { honorarios } = proceso;
  const viaProceso: ViaProceso = honorarios.viaProceso ?? 'judicial';
  const esNotarial = viaProceso === 'notarial';
  const esJudicial = viaProceso === 'judicial';

  const handleCambiarViaProceso = (nuevaVia: ViaProceso) => {
    onActualizarHonorarios({
      ...honorarios,
      viaProceso: nuevaVia,
    });
  };

  const handleCambiarModalidad = (modalidad: 'porcentaje' | 'fijo') => {
    onActualizarHonorarios({
      ...honorarios,
      modalidad,
    });
  };

  const handleCambiarAbogado = (valor: number) => {
    if (honorarios.modalidad === 'fijo') {
      onActualizarHonorarios({
        ...honorarios,
        abogadoFijoCOP: valor,
      });
    } else {
      onActualizarHonorarios({
        ...honorarios,
        abogadoPorcentaje: valor,
      });
    }
  };

  const estaConfirmado = honorarios.estadoAgencias === 'confirmado';

  const handleCambiarAgencias = (valor: number) => {
    if (estaConfirmado) return;
    if (honorarios.modalidad === 'fijo') {
      onActualizarHonorarios({
        ...honorarios,
        agenciasDerechoFijoCOP: valor,
        juezCostasFijoCOP: valor,
      });
    } else {
      onActualizarHonorarios({
        ...honorarios,
        agenciasDerechoPorcentaje: valor,
        juezCostasPorcentaje: valor,
      });
    }
  };

  const quienesPaganIds = React.useMemo(() => {
    if (Array.isArray(honorarios.quienesPaganIds) && honorarios.quienesPaganIds.length > 0) {
      return honorarios.quienesPaganIds;
    }
    return honorarios.quienPagaId ? [honorarios.quienPagaId] : [];
  }, [honorarios.quienesPaganIds, honorarios.quienPagaId]);

  const quienesRecibenIds = React.useMemo(() => {
    if (Array.isArray(honorarios.quienesRecibenIds) && honorarios.quienesRecibenIds.length > 0) {
      return honorarios.quienesRecibenIds;
    }
    return honorarios.quienRecibeId ? [honorarios.quienRecibeId] : [];
  }, [honorarios.quienesRecibenIds, honorarios.quienRecibeId]);

  const personasEnConflictoPaso3 = React.useMemo(() => {
    return quienesPaganIds.filter((id) => quienesRecibenIds.includes(id));
  }, [quienesPaganIds, quienesRecibenIds]);

  const hayConflictoPaso3 = personasEnConflictoPaso3.length > 0;

  const handleAgregarQuienPaga = (id: string) => {
    if (!id || quienesPaganIds.includes(id)) return;
    const nuevosIds = [...quienesPaganIds, id];
    const nuevosNombres = nuevosIds.map(
      (pid) => proceso.personas.find((p) => p.id === pid)?.nombre || pid
    );
    onActualizarHonorarios({
      ...honorarios,
      quienesPaganIds: nuevosIds,
      quienesPaganNombres: nuevosNombres,
      quienPagaId: nuevosIds[0] || '',
      quienPagaNombre: nuevosNombres.join(', '),
    });
  };

  const handleQuitarQuienPaga = (id: string) => {
    const nuevosIds = quienesPaganIds.filter((pid) => pid !== id);
    const nuevosNombres = nuevosIds.map(
      (pid) => proceso.personas.find((p) => p.id === pid)?.nombre || pid
    );
    onActualizarHonorarios({
      ...honorarios,
      quienesPaganIds: nuevosIds,
      quienesPaganNombres: nuevosNombres,
      quienPagaId: nuevosIds[0] || '',
      quienPagaNombre: nuevosNombres.join(', '),
    });
  };

  const handleAgregarQuienRecibe = (id: string) => {
    if (!id || quienesRecibenIds.includes(id)) return;
    const nuevosIds = [...quienesRecibenIds, id];
    const nuevosNombres = nuevosIds.map(
      (pid) => proceso.personas.find((p) => p.id === pid)?.nombre || pid
    );
    onActualizarHonorarios({
      ...honorarios,
      quienesRecibenIds: nuevosIds,
      quienesRecibenNombres: nuevosNombres,
      quienRecibeId: nuevosIds[0] || '',
      quienRecibeNombre: nuevosNombres.join(', '),
    });
  };

  const handleQuitarQuienRecibe = (id: string) => {
    const nuevosIds = quienesRecibenIds.filter((pid) => pid !== id);
    const nuevosNombres = nuevosIds.map(
      (pid) => proceso.personas.find((p) => p.id === pid)?.nombre || pid
    );
    onActualizarHonorarios({
      ...honorarios,
      quienesRecibenIds: nuevosIds,
      quienesRecibenNombres: nuevosNombres,
      quienRecibeId: nuevosIds[0] || '',
      quienRecibeNombre: nuevosNombres.join(', '),
    });
  };

  const handleCambiarEstadoAgencias = (nuevoEstado: EstadoAgencias) => {
    onActualizarHonorarios({
      ...honorarios,
      estadoAgencias: nuevoEstado,
    });
  };

  const agenciasVal = honorarios.agenciasDerechoPorcentaje ?? honorarios.juezCostasPorcentaje ?? 15;
  const movimiento = resultado.movimientoAgencias;

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
      {/* ALERTA DE REMANENTE SIN ASIGNAR O EXCEDIDO */}
      {resultado.hayRemanenteSinAsignar && (
        <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-4.5 shadow-xs flex items-start gap-3.5">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <h4 className="font-bold text-amber-950 text-sm mb-1 flex items-center gap-2">
              Liquidación Incompleta: Remanente sin Asignar Detectado
            </h4>
            <p className="text-amber-900 leading-relaxed mb-2.5">
              Tras aplicar las leyes y cuotas en cascada, ha quedado dinero sin asignar a los herederos o legatarios. Conforme a la legislación sucesoral colombiana, el 100% de la masa neta debe quedar adjudicado antes de expedir la liquidación final o generar el documento en PDF.
            </p>
            <div className="bg-white/80 border border-amber-300 rounded-lg p-3 divide-y divide-amber-200">
              {resultado.remanentesIncompletos.length > 0 ? (
                resultado.remanentesIncompletos.map((r) => (
                  <div key={r.id} className="py-1.5 first:pt-0 last:pb-0 flex items-center justify-between font-mono">
                    <span className="font-semibold text-amber-950">
                      {r.origenNombre}:
                    </span>
                    <span className="font-bold text-amber-800">
                      {r.excedido
                        ? `Excedido en ${(r.porcentajeAsignado - 100).toFixed(1)}%`
                        : `Queda ${r.porcentajeFaltante.toFixed(1)}% sin asignar (${formatearMoneda(r.montoFaltanteCOP)})`}
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-between font-mono">
                  <span className="font-semibold text-amber-950">Patrimonio Neto:</span>
                  <span className="font-bold text-amber-800">
                    Quedan {formatearMoneda(resultado.remanenteSinAsignarCOP)} sin asignar
                  </span>
                </div>
              )}
            </div>
            <div className="mt-2.5 text-[11px] text-amber-800 flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>
                Regrese al <strong>Paso 2 (Personas y Leyes)</strong> para asignar este remanente a Libre Disposición, ajustar porcentajes o activar las leyes pertinentes.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 1. SECCIÓN: CONFIGURACIÓN DE COSTOS DEL PROCESO Y VÍA PROCESAL */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Barra superior de configuración */}
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-slate-800" />
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                1. Configuración del Proceso y Honorarios
              </h3>
              <span className="text-[11px] text-slate-500">
                Seleccione la vía procesal y defina los honorarios y costas
              </span>
            </div>
          </div>

          {/* Modalidad: Porcentaje vs Monto Fijo */}
          <div className="flex items-center gap-1.5 bg-slate-200/70 p-0.5 rounded-lg text-xs font-medium">
            <button
              type="button"
              id="paso3-btn-modalidad-porcentaje"
              onClick={() => handleCambiarModalidad('porcentaje')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                honorarios.modalidad === 'porcentaje'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Porcentaje (%)
            </button>
            <button
              type="button"
              id="paso3-btn-modalidad-fijo"
              onClick={() => handleCambiarModalidad('fijo')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                honorarios.modalidad === 'fijo'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monto Fijo (COP)
            </button>
          </div>
        </div>

        {/* Selector obligatorio de Vía del Proceso */}
        <div className="p-5 border-b border-slate-100 bg-white">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-slate-700" />
              <span>Vía del Proceso</span>
              <span className="text-[10px] bg-red-100 text-red-800 font-bold px-1.5 py-0.2 rounded uppercase">
                Obligatorio
              </span>
            </label>
            <span className="text-[11px] text-slate-400">
              {esNotarial
                ? 'Mutuo acuerdo ante notario: solo honorarios de abogado'
                : 'Litigio judicial: habilita agencias en derecho a cargo de la parte vencida'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Opción Notarial */}
            <button
              type="button"
              id="paso3-btn-via-notarial"
              onClick={() => handleCambiarViaProceso('notarial')}
              className={`p-3.5 rounded-xl border-2 text-left transition flex items-start gap-3 cursor-pointer ${
                esNotarial
                  ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900/10'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="mt-0.5">
                <FileCheck className={`w-4 h-4 ${esNotarial ? 'text-slate-900' : 'text-slate-400'}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">
                    Notarial (Mutuo Acuerdo)
                  </span>
                  {esNotarial && (
                    <span className="text-[10px] bg-slate-900 text-white font-bold px-1.5 py-0.2 rounded">
                      Activo
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  No hay litigio judicial. Las <strong>Agencias en Derecho se deshabilitan</strong>; solo aplican Honorarios de Abogado.
                </p>
              </div>
            </button>

            {/* Opción Judicial */}
            <button
              type="button"
              id="paso3-btn-via-judicial"
              onClick={() => handleCambiarViaProceso('judicial')}
              className={`p-3.5 rounded-xl border-2 text-left transition flex items-start gap-3 cursor-pointer ${
                esJudicial
                  ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900/10'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="mt-0.5">
                <Gavel className={`w-4 h-4 ${esJudicial ? 'text-slate-900' : 'text-slate-400'}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">
                    Judicial (Litigio)
                  </span>
                  {esJudicial && (
                    <span className="text-[10px] bg-slate-900 text-white font-bold px-1.5 py-0.2 rounded">
                      Activo
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Contencioso judicial. Se habilitan <strong>Agencias en Derecho</strong> entre la parte vencida y la vencedora.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Inputs de honorarios de abogado y agencias en derecho */}
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Honorarios del Abogado (Aplica siempre en cualquier vía) */}
          <div className="bg-slate-50/60 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-slate-700" />
                  <label className="text-xs font-bold text-slate-900">
                    Honorarios de Abogado
                  </label>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">
                  {honorarios.modalidad === 'porcentaje' ? `${honorarios.abogadoPorcentaje}%` : 'Monto Fijo'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mb-3">
                Aplica siempre. Se deduce del patrimonio bruto total antes de distribuir.
              </p>

              {honorarios.modalidad === 'porcentaje' ? (
                <div className="relative">
                  <InputPorcentaje
                    id="costo-abogado-pct"
                    value={honorarios.abogadoPorcentaje}
                    onChange={handleCambiarAbogado}
                    min={0}
                    max={100}
                    step="0.5"
                    valorPorDefectoEnBlur={0}
                    className="w-full bg-white border border-slate-300 rounded-lg pl-3 pr-7 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-slate-800"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono">
                    %
                  </span>
                </div>
              ) : (
                <div className="relative">
                  <InputMoneda
                    id="costo-abogado-fijo"
                    value={honorarios.abogadoFijoCOP || 0}
                    onChange={handleCambiarAbogado}
                    placeholder="$0"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-slate-800"
                  />
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500">Deducción de Masa Bruta:</span>
              <span className="font-mono font-bold text-slate-900">
                {formatearMoneda(resultado.deducciones.abogadoCOP)}
              </span>
            </div>
          </div>

          {/* Agencias en Derecho / Costas Judiciales */}
          {esNotarial ? (
            /* Oculto / Deshabilitado en vía notarial */
            <div
              id="paso3-agencias-inactivo-notarial"
              className="bg-slate-50/70 border border-dashed border-slate-300 rounded-xl p-4 flex flex-col justify-between text-slate-400"
            >
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Briefcase className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold text-slate-600">
                    Agencias en Derecho (Inactivo)
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 leading-relaxed bg-white/70 p-3 rounded-lg border border-slate-200">
                  <p className="font-semibold text-slate-700 mb-1">
                    No aplica en Vía Notarial (Mutuo Acuerdo)
                  </p>
                  Las Agencias en Derecho solo proceden en litigios con sentencia judicial contenciosa (Art. 365 C.G.P.). Al tramitarse ante Notaría no se genera condena en costas entre las partes.
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-400">
                <span>Monto Liquidado:</span>
                <span className="font-mono font-bold text-slate-500">$ 0 COP</span>
              </div>
            </div>
          ) : (
            /* Activo en Vía Judicial */
            <div
              id="paso3-agencias-activo-judicial"
              className="bg-slate-50/60 border border-slate-200 rounded-xl p-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5">
                    <Gavel className="w-3.5 h-3.5 text-slate-800" />
                    <label className="text-xs font-bold text-slate-900">
                      Agencias en Derecho
                    </label>
                  </div>
                  <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-mono">
                    {honorarios.modalidad === 'porcentaje' ? 'Sugerido 10% - 20%' : 'Monto Fijo'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mb-2">
                  No se resta de la masa común; se transfiere de la parte vencida a la vencedora.
                </p>

                {honorarios.modalidad === 'porcentaje' ? (
                  <div className="flex flex-col gap-1.5">
                    <div className="relative">
                      <InputPorcentaje
                        id="costo-agencias-pct"
                        value={agenciasVal}
                        onChange={handleCambiarAgencias}
                        min={0}
                        max={100}
                        step="0.5"
                        disabled={estaConfirmado}
                        valorPorDefectoEnBlur={0}
                        className={`w-full border rounded-lg pl-3 pr-7 py-2 text-xs font-mono font-bold focus:outline-none ${
                          estaConfirmado
                            ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-300'
                            : 'bg-white border-slate-300 text-slate-800 focus:border-slate-800'
                        }`}
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono">
                        %
                      </span>
                    </div>
                    {estaConfirmado && (
                      <div
                        id="aviso-paso3-agencias-bloqueado"
                        className="flex items-center gap-1.5 text-[10px] text-emerald-900 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md"
                      >
                        <Lock className="w-3 h-3 text-emerald-700 shrink-0" />
                        <span>Bloqueado por providencia judicial. Cambie a &quot;Estimado&quot; para editar.</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <div className="relative">
                      <InputMoneda
                        id="costo-agencias-fijo"
                        value={honorarios.agenciasDerechoFijoCOP || 0}
                        onChange={handleCambiarAgencias}
                        disabled={estaConfirmado}
                        placeholder="$0"
                        className={`w-full border rounded-lg px-3 py-2 text-xs font-mono font-bold focus:outline-none ${
                          estaConfirmado
                            ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-300'
                            : 'bg-white border-slate-300 text-slate-800 focus:border-slate-800'
                        }`}
                      />
                    </div>
                    {estaConfirmado && (
                      <div
                        id="aviso-paso3-agencias-fijo-bloqueado"
                        className="flex items-center gap-1.5 text-[10px] text-emerald-900 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md"
                      >
                        <Lock className="w-3 h-3 text-emerald-700 shrink-0" />
                        <span>Bloqueado por providencia judicial. Cambie a &quot;Estimado&quot; para editar.</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Selector de Estado con etiqueta visual distinta */}
                <div className="mt-3 pt-2.5 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-slate-700">Estado de Fijación:</span>
                    {estaConfirmado ? (
                      <span
                        id="badge-paso3-confirmado"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300"
                      >
                        <Check className="w-3 h-3 text-emerald-700" />
                        Confirmado por Sentencia
                      </span>
                    ) : (
                      <span
                        id="badge-paso3-estimado"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300"
                      >
                        <Clock className="w-3 h-3 text-amber-700" />
                        Estimado (En Litigio)
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      id="btn-paso3-estado-estimado"
                      onClick={() => handleCambiarEstadoAgencias('estimado')}
                      className={`px-2 py-1 rounded text-xs font-medium border transition cursor-pointer ${
                        !estaConfirmado
                          ? 'bg-amber-100 text-amber-900 border-amber-400 font-bold shadow-2xs'
                          : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      Estimado
                    </button>
                    <button
                      type="button"
                      id="btn-paso3-estado-confirmado"
                      onClick={() => handleCambiarEstadoAgencias('confirmado')}
                      className={`px-2 py-1 rounded text-xs font-medium border transition cursor-pointer ${
                        estaConfirmado
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-400 font-bold shadow-2xs'
                          : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      Confirmado
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-500">Monto Total de Agencias:</span>
                <span className="font-mono font-bold text-slate-900">
                  {formatearMoneda(resultado.deducciones.agenciasDerechoCOP)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* En Vía Judicial: Partes involucradas (Quién Paga y Quién Recibe con Multi-selección) */}
        {esJudicial && (
          <div className="mx-5 mb-5 p-4 bg-slate-50/90 border border-slate-200 rounded-xl flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <Gavel className="w-4 h-4 text-slate-700" />
                <span>Condena en Costas: Asignación de Partes en el Litigio</span>
              </div>
              <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-semibold">
                Transferencia directa entre cuotas
              </span>
            </div>

            {/* Aviso de Conflicto en Paso 3 */}
            {hayConflictoPaso3 && (
              <div
                id="banner-conflicto-paso3"
                className="bg-rose-50 border border-rose-300 rounded-lg p-3 text-xs text-rose-950 flex items-start gap-2.5 shadow-2xs"
              >
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-bold mb-0.5">Conflicto de Partes (Art. 365 C.G.P.)</div>
                  <p className="text-rose-800 leading-normal">
                    La misma persona no puede estar seleccionada simultáneamente en &quot;Quién Paga&quot; y en &quot;Quién Recibe&quot;.
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {personasEnConflictoPaso3.map((id) => {
                      const p = proceso.personas.find((pers) => pers.id === id);
                      return (
                        <span
                          key={`conflict-p3-${id}`}
                          className="inline-flex items-center gap-1.5 bg-white border border-rose-300 text-rose-900 px-2 py-0.5 rounded text-[11px] font-bold"
                        >
                          <span>{p ? p.nombre : id}</span>
                          <button
                            type="button"
                            onClick={() => handleQuitarQuienPaga(id)}
                            className="text-[10px] text-rose-700 hover:text-rose-950 underline cursor-pointer"
                          >
                            Quitar de Paga
                          </button>
                          <span>|</span>
                          <button
                            type="button"
                            onClick={() => handleQuitarQuienRecibe(id)}
                            className="text-[10px] text-rose-700 hover:text-rose-950 underline cursor-pointer"
                          >
                            Quitar de Recibe
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Quién Paga (Multi-select) */}
              <div className="flex flex-col gap-1.5 bg-white border border-slate-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="paso3-select-quien-paga"
                    className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5"
                  >
                    <UserX className="w-3.5 h-3.5 text-rose-600" />
                    <span>Quién Paga (Parte Vencida):</span>
                  </label>
                  <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-1.5 py-0.2 rounded">
                    {quienesPaganIds.length}
                  </span>
                </div>

                <select
                  id="paso3-select-quien-paga"
                  value=""
                  onChange={(e) => {
                    if (e.target.value) handleAgregarQuienPaga(e.target.value);
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-800 cursor-pointer"
                >
                  <option value="">+ Agregar persona a Quién Paga...</option>
                  {proceso.personas.map((p) => {
                    const yaPaga = quienesPaganIds.includes(p.id);
                    const enRecibe = quienesRecibenIds.includes(p.id);
                    const rol = p.tipoRelacion === 'Familiar' ? p.parentesco : 'Socio / Tercero';
                    return (
                      <option key={`paga-${p.id}`} value={p.id} disabled={yaPaga}>
                        {yaPaga ? `✓ ${p.nombre} (${rol})` : enRecibe ? `⚠️ ${p.nombre} (${rol}) [En Recibe]` : `+ ${p.nombre} (${rol})`}
                      </option>
                    );
                  })}
                </select>

                {/* Chips de personas que pagan */}
                {quienesPaganIds.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {quienesPaganIds.map((id) => {
                      const p = proceso.personas.find((pers) => pers.id === id);
                      const esConflicto = personasEnConflictoPaso3.includes(id);
                      return (
                        <span
                          key={`chip-p3-paga-${id}`}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] border ${
                            esConflicto
                              ? 'bg-rose-100 text-rose-900 border-rose-300 font-bold ring-1 ring-rose-400'
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}
                        >
                          <span>{p ? p.nombre : id}</span>
                          <button
                            type="button"
                            onClick={() => handleQuitarQuienPaga(id)}
                            className="text-rose-500 hover:text-rose-900 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-400 italic">Ninguna persona seleccionada.</span>
                )}

                {quienesPaganIds.length > 1 && (
                  <div className="text-[10px] text-rose-700 bg-rose-50/70 border border-rose-200 rounded p-1.5 mt-0.5">
                    Dividido en partes iguales ({quienesPaganIds.length}):{' '}
                    <strong>{(100 / quienesPaganIds.length).toFixed(1)}% c/u</strong> (
                    {formatearMoneda(
                      Math.round(resultado.deducciones.agenciasDerechoCOP / quienesPaganIds.length)
                    )}{' '}
                    c/u)
                  </div>
                )}
              </div>

              {/* Quién Recibe (Multi-select) */}
              <div className="flex flex-col gap-1.5 bg-white border border-slate-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="paso3-select-quien-recibe"
                    className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Quién Recibe (Parte Vencedora):</span>
                  </label>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                    {quienesRecibenIds.length}
                  </span>
                </div>

                <select
                  id="paso3-select-quien-recibe"
                  value=""
                  onChange={(e) => {
                    if (e.target.value) handleAgregarQuienRecibe(e.target.value);
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-800 cursor-pointer"
                >
                  <option value="">+ Agregar persona a Quién Recibe...</option>
                  {proceso.personas.map((p) => {
                    const yaRecibe = quienesRecibenIds.includes(p.id);
                    const enPaga = quienesPaganIds.includes(p.id);
                    const rol = p.tipoRelacion === 'Familiar' ? p.parentesco : 'Socio / Tercero';
                    return (
                      <option key={`recibe-${p.id}`} value={p.id} disabled={yaRecibe}>
                        {yaRecibe ? `✓ ${p.nombre} (${rol})` : enPaga ? `⚠️ ${p.nombre} (${rol}) [En Paga]` : `+ ${p.nombre} (${rol})`}
                      </option>
                    );
                  })}
                </select>

                {/* Chips de personas que reciben */}
                {quienesRecibenIds.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {quienesRecibenIds.map((id) => {
                      const p = proceso.personas.find((pers) => pers.id === id);
                      const esConflicto = personasEnConflictoPaso3.includes(id);
                      return (
                        <span
                          key={`chip-p3-recibe-${id}`}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] border ${
                            esConflicto
                              ? 'bg-rose-100 text-rose-900 border-rose-300 font-bold ring-1 ring-rose-400'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          <span>{p ? p.nombre : id}</span>
                          <button
                            type="button"
                            onClick={() => handleQuitarQuienRecibe(id)}
                            className="text-emerald-600 hover:text-emerald-950 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-400 italic">Ninguna persona seleccionada.</span>
                )}

                {quienesRecibenIds.length > 1 && (
                  <div className="text-[10px] text-emerald-700 bg-emerald-50/70 border border-emerald-200 rounded p-1.5 mt-0.5">
                    Dividido en partes iguales ({quienesRecibenIds.length}):{' '}
                    <strong>{(100 / quienesRecibenIds.length).toFixed(1)}% c/u</strong> (
                    {formatearMoneda(
                      Math.round(resultado.deducciones.agenciasDerechoCOP / quienesRecibenIds.length)
                    )}{' '}
                    c/u)
                  </div>
                )}
              </div>
            </div>

            {/* Resumen del movimiento directo de costas */}
            {movimiento && movimiento.aplica && (
              <div className="mt-1 bg-white border border-slate-200 rounded-lg p-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-rose-700">
                    {movimiento.quienPagaNombre || 'Parte Vencida'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-semibold text-emerald-700">
                    {movimiento.quienRecibeNombre || 'Parte Vencedora'}
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-slate-500">Condena Total:</span>
                  <strong className="text-slate-900">{formatearMoneda(movimiento.montoCOP)}</strong>
                </div>
              </div>
            )}
          </div>
        )}

        {/* IMPUESTO DE GANANCIA OCASIONAL */}
        <div className="mx-5 mb-5 p-4 bg-slate-50/90 border border-slate-200 rounded-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="p-1 bg-slate-200 text-slate-800 rounded">
                <Percent className="w-3.5 h-3.5" />
              </span>
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  Impuesto de Ganancia Ocasional sobre Herencias y Donaciones (Arts. 302 a 306 E.T.)
                </h4>
                <span className="text-[11px] text-slate-500">
                  Cálculo informativo a cargo de los herederos (Reforma Tributaria Ley 2277 de 2022)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-600">Tarifa Legal:</span>
              <span className="text-xs font-bold font-mono bg-white border border-slate-300 text-slate-900 px-2 py-0.5 rounded shadow-2xs">
                {resultado.gananciaOcasional?.tarifaPorcentaje || 15}%
              </span>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                <strong>Fundamento y Exenciones (Artículo 307 E.T.):</strong> Este gravamen tributario se calcula sobre las asignaciones de cada heredero. Las primeras <strong>3.250 UVT</strong> recibidas por concepto de herencia sobre bienes inmuebles y las primeras <strong>7.700 UVT</strong> para el inmueble correspondiente a la casa o apartamento de habitación propiedad del causante están legalmente <strong>exentas</strong> del impuesto.
              </p>
              <p className="text-[10px] text-slate-500 mt-1 italic">
                *Nota: Este impuesto no se descuenta de la masa de bienes a adjudicar en la partición, sino que representa la obligación tributaria estimada que cada heredero debe declarar individualmente ante la DIAN.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col justify-between sm:text-right">
              <span className="text-[11px] font-semibold text-slate-500">
                Total Impuesto Estimado Agregado (15%):
              </span>
              <span className="text-base font-bold font-mono text-slate-900 mt-0.5">
                {formatearMoneda(resultado.gananciaOcasional?.impuestoTotalEstimadoCOP || 0)}
              </span>
              <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                Calculado sobre la masa neta partible ({formatearMoneda(resultado.patrimonioNetoPartibleCOP)})
              </span>
            </div>
          </div>
        </div>

        {/* Advertencia si agencias en derecho está fuera del rango legal en Vía Judicial */}
        {esJudicial && resultado.deducciones.agenciasFueraDeRango && (
          <div className="mx-5 mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Aviso sobre Agencias en Derecho:</strong> El valor asignado ({resultado.deducciones.agenciasDerechoPorcentaje.toFixed(1)}%) se encuentra fuera del rango habitual del 10% al 20% estipulado por el Acuerdo PCAA16-10554 del Consejo Superior de la Judicatura para procesos de partición de mayor cuantía.
            </div>
          </div>
        )}

        {/* Resumen de orden de cálculo y masa neta partible */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-600 flex-wrap">
            <span>Patrimonio Bruto: <strong className="font-mono text-slate-900">{formatearMoneda(resultado.patrimonioBrutoCOP)}</strong></span>
            <span className="text-slate-300">•</span>
            <span>Deducción Honorarios Abogado: <strong className="font-mono text-slate-900">- {formatearMoneda(resultado.deducciones.abogadoCOP)}</strong></span>
            {esJudicial && resultado.deducciones.agenciasDerechoCOP > 0 && (
              <>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500">Agencias en Derecho: <strong className="font-mono text-slate-700">{formatearMoneda(resultado.deducciones.agenciasDerechoCOP)} (Entre partes)</strong></span>
              </>
            )}
          </div>
          <div className="text-slate-900 font-semibold">
            Masa Neta a Repartir (100%): <span className="font-mono text-emerald-800 text-sm">{formatearMoneda(resultado.patrimonioNetoPartibleCOP)}</span>
          </div>
        </div>
      </div>

      {/* 2. SÍNTESIS PATRIMONIAL FINAL */}
      <div className={`grid grid-cols-1 ${esJudicial ? 'sm:grid-cols-4' : 'sm:grid-cols-3'} gap-3`}>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
            Patrimonio Bruto Total
          </span>
          <span className="text-lg font-bold font-mono text-slate-900 mt-1 block">
            {formatearMoneda(resultado.patrimonioBrutoCOP)}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            {proceso.bienes.length} bienes y activos
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
              Deducción Abogado
            </span>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium font-mono">
              Masa Común
            </span>
          </div>
          <span className="text-lg font-bold font-mono text-slate-900 mt-1 block">
            - {formatearMoneda(resultado.deducciones.abogadoCOP)}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            {honorarios.modalidad === 'porcentaje'
              ? `${resultado.deducciones.abogadoPorcentaje.toFixed(1)}% sobre masa bruta`
              : 'Monto fijo acordado'}
          </span>
        </div>

        <div className="bg-white border border-emerald-200 bg-emerald-50/20 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-emerald-800 uppercase tracking-wider font-bold">
              Masa Neta Partible
            </span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold font-mono">
              100% a repartir
            </span>
          </div>
          <span className="text-lg font-bold font-mono text-emerald-900 mt-1 block">
            {formatearMoneda(resultado.patrimonioNetoPartibleCOP)}
          </span>
          <span className="text-[11px] text-emerald-700 mt-0.5 block">
            Distribuido entre {proceso.personas.length} partícipes
          </span>
        </div>

        {/* Tarjeta adicional en Vía Judicial: Agencias en Derecho */}
        {esJudicial && (
          <div className="bg-white border border-indigo-200 bg-indigo-50/20 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-indigo-800 uppercase tracking-wider font-bold">
                Agencias en Derecho
              </span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                  honorarios.estadoAgencias === 'confirmado'
                    ? 'bg-emerald-100 text-emerald-900'
                    : 'bg-amber-100 text-amber-900'
                }`}
              >
                {honorarios.estadoAgencias === 'confirmado' ? 'Confirmado' : 'Estimado'}
              </span>
            </div>
            <span className="text-lg font-bold font-mono text-indigo-950 mt-1 block">
              {formatearMoneda(resultado.deducciones.agenciasDerechoCOP)}
            </span>
            <span className="text-[10px] text-indigo-700 mt-0.5 block truncate">
              {movimiento?.quienPagaNombre && movimiento?.quienRecibeNombre
                ? `${movimiento.quienPagaNombre} → ${movimiento.quienRecibeNombre}`
                : 'Entre partes en litigio'}
            </span>
          </div>
        )}
      </div>

      {/* 3. RESUMEN FINAL: DESGLOSE POR CADA PERSONA */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-800" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              2. Asignación Patrimonial por Persona
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">
            Valores exactos liquidados en Pesos Colombianos (COP)
          </span>
        </div>

        {resultado.desglosePersonas.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Sin personas asignadas en el expediente.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {resultado.desglosePersonas.map((item, idx) => {
              const estaExcluidoIndigno = item.excluidoPorIndignidad || item.persona.declaradoIndigno;
              const estaDesheredado = item.excluidoPorDesheredamiento || item.persona.desheredado;
              const impuestoPersonaCOP = Math.round(
                item.totalAsignadoCOP * ((resultado.gananciaOcasional?.tarifaPorcentaje || 15) / 100)
              );

              return (
                <div
                  key={item.persona.id}
                  className={`p-4 hover:bg-slate-50/50 transition-colors ${
                    estaExcluidoIndigno || estaDesheredado ? 'bg-slate-100/30' : ''
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Datos personales */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono text-slate-400 w-5">
                          {idx + 1}.
                        </span>
                        <span className={`text-xs font-bold ${estaExcluidoIndigno ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                          {item.persona.nombre}
                        </span>
                        <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium border border-slate-200">
                          {item.persona.tipoRelacion === 'Familiar'
                            ? item.persona.parentesco
                            : 'Tercero / Socio'}
                        </span>

                        {estaExcluidoIndigno && (
                          <span className="text-[10px] bg-rose-100 text-rose-800 border border-rose-200 px-2 py-0.5 rounded font-semibold">
                            Indigno (Excluido Art. 1025 C.C.)
                          </span>
                        )}
                        {estaDesheredado && (
                          <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded font-semibold">
                            Desheredado (Arts. 1265-1281 C.C.)
                          </span>
                        )}

                        {/* Etiqueta especial de Agencias en Derecho si aplica a esta persona */}
                        {esJudicial && item.rolAgencias === 'paga' && (
                          <span className="text-[10px] bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                            <UserX className="w-3 h-3 text-rose-600" />
                            Condenado en Agencias
                          </span>
                        )}
                        {esJudicial && item.rolAgencias === 'recibe' && (
                          <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                            <UserCheck className="w-3 h-3 text-emerald-600" />
                            Compensado en Agencias
                          </span>
                        )}
                      </div>

                      {/* Explicación jurídica o Leyes aplicadas a esta persona */}
                      {estaExcluidoIndigno ? (
                        <p className="mt-1.5 pl-7 text-[11px] text-rose-700">
                          Excluido por indignidad sucesoral: Su porcentaje fue redistribuido entre los demás herederos de su misma categoría.
                        </p>
                      ) : (
                        <div className="mt-1.5 pl-7 flex flex-wrap gap-2 text-[11px]">
                          {item.leyesAplicadas.map((la, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 bg-slate-50 text-slate-700 px-2 py-0.5 rounded border border-slate-200"
                            >
                              <span>{la.leyNombre}:</span>
                              <strong className="font-mono text-slate-900">{formatearMoneda(la.montoCOP)}</strong>
                              <span className="text-slate-400 font-mono">({la.porcentaje.toFixed(1)}%)</span>
                            </span>
                          ))}
                          {item.leyesAplicadas.length === 0 && (
                            <span className="text-slate-400 italic">Sin asignación forzosa directa</span>
                          )}
                        </div>
                      )}

                      {/* En Vía Judicial: Desglose del movimiento de Agencias en Derecho */}
                      {esJudicial && item.ajusteAgenciasCOP !== undefined && item.ajusteAgenciasCOP !== 0 && (
                        <div className="mt-2 pl-7 flex items-center gap-2 text-xs">
                          {item.rolAgencias === 'paga' ? (
                            <span className="text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-[11px] font-medium">
                              - Pago por condena en agencias a {movimiento?.quienRecibeNombre}:{' '}
                              <strong className="font-mono">{formatearMoneda(Math.abs(item.ajusteAgenciasCOP))}</strong>
                            </span>
                          ) : (
                            <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-medium">
                              + Compensación en agencias recibida de {movimiento?.quienPagaNombre}:{' '}
                              <strong className="font-mono">{formatearMoneda(item.ajusteAgenciasCOP)}</strong>
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Total asignado a la persona y Ganancia Ocasional Estimada */}
                    <div className="text-right sm:self-center shrink-0 pl-7 sm:pl-0">
                      <div className="text-base font-bold font-mono text-slate-900">
                        {formatearMoneda(
                          item.totalFinalConAgenciasCOP !== undefined
                            ? item.totalFinalConAgenciasCOP
                            : item.totalAsignadoCOP
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500">
                        {item.porcentajeDelTotal.toFixed(1)}% de la masa neta
                      </div>

                      {esJudicial && item.ajusteAgenciasCOP !== undefined && item.ajusteAgenciasCOP !== 0 && (
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                          Base masa: {formatearMoneda(item.totalAsignadoCOP)}
                        </div>
                      )}

                      {item.totalAsignadoCOP > 0 && (
                        <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                          Impuesto Est. (15%): <span className="font-semibold text-slate-700">{formatearMoneda(impuestoPersonaCOP)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Adjudicación preferente de bienes en especie (opcional) */}
                  {proceso.bienes.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 pl-7 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="text-[11px] text-slate-500">
                        Adjudicación preferente de activos en especie:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {proceso.bienes.map((b) => {
                          const estaAsignado = b.asignadoAId === item.persona.id;
                          return (
                            <button
                              key={b.id}
                              type="button"
                              onClick={() =>
                                onAsignarBienAPersona(
                                  b.id,
                                  estaAsignado ? undefined : item.persona.id
                                )
                              }
                              className={`text-[10px] px-2 py-0.5 rounded border transition cursor-pointer ${
                                estaAsignado
                                  ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              {estaAsignado ? '✓ ' : '+ '} {b.nombre} ({formatearMoneda(b.valor)})
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. LISTA DE LEYES APLICADAS */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-slate-800" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              3. Leyes y Fundamentos Jurídicos Aplicados
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-slate-600">
            Cálculo en Cascada de Bases y Remanentes
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {resultado.leyesCalculadas && resultado.leyesCalculadas.length > 0 ? (
            resultado.leyesCalculadas.map((l) => (
              <div key={l.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{l.nombre}</span>
                    <span className="text-slate-500 text-[11px] font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                      {l.porcentaje.toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                    <span className="font-medium text-slate-700">
                      Base de cálculo:
                    </span>
                    <span className="font-mono text-slate-800">
                      {l.baseCalculo === 'remanente_de_ley' && l.leyPadreNombre
                        ? `Remanente de "${l.leyPadreNombre}" (${formatearMoneda(l.baseDineroCOP)})`
                        : `Patrimonio Total (${formatearMoneda(l.baseDineroCOP)})`}
                    </span>
                  </div>
                </div>
                <div className="text-right sm:self-center">
                  <div className="font-mono font-bold text-slate-900 text-sm">
                    {formatearMoneda(l.montoCalculadoCOP)}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Cuota adjudicada
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-3 text-xs text-slate-500 italic">
              Sin leyes especiales registradas. Repartición directa sobre el 100% del patrimonio neto.
            </div>
          )}

          {/* Fila de remanente sin asignar si existe */}
          {resultado.hayRemanenteSinAsignar && (
            <div className="py-3 bg-amber-50/70 -mx-5 px-5 flex items-center justify-between text-xs border-t border-amber-200">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span className="font-bold text-amber-900">
                  Remanente sin Asignar (Masa pendiente)
                </span>
              </div>
              <span className="font-mono font-bold text-amber-800 text-sm">
                {formatearMoneda(resultado.remanenteSinAsignarCOP)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 5. ACCIONES FINALES Y BOTONES */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          type="button"
          onClick={onAnterior}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-lg border border-slate-300 transition shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Atrás: Personas y Leyes</span>
        </button>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          {resultado.hayRemanenteSinAsignar ? (
            <span className="text-[11px] font-medium text-amber-800 bg-amber-100/80 px-3 py-1.5 rounded-lg border border-amber-300 text-center">
              ⚠️ Resuelva el remanente sin asignar para habilitar la descarga del PDF
            </span>
          ) : hayConflictoPaso3 ? (
            <span className="text-[11px] font-medium text-rose-800 bg-rose-100/80 px-3 py-1.5 rounded-lg border border-rose-300 text-center">
              ⚠️ Resuelva el conflicto en Agencias en Derecho para continuar
            </span>
          ) : null}

          <button
            type="button"
            id="btn-generar-pdf"
            disabled={resultado.hayRemanenteSinAsignar || hayConflictoPaso3}
            onClick={() => {
              if (resultado.hayRemanenteSinAsignar) {
                alert(
                  'No es posible generar el PDF final mientras exista un remanente sin asignar. Por favor regrese al Paso 2 y distribuya la totalidad del patrimonio.'
                );
                return;
              }
              if (hayConflictoPaso3) {
                alert(
                  'No es posible generar la liquidación mientras una misma persona esté seleccionada tanto en Quién Paga como en Quién Recibe las costas judiciales.'
                );
                return;
              }
              onGenerarPDF();
            }}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 text-xs font-bold px-4 py-2.5 rounded-lg border transition shadow-2xs cursor-pointer ${
              resultado.hayRemanenteSinAsignar || hayConflictoPaso3
                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300'
            }`}
          >
            <Download className="w-4 h-4 text-slate-700" />
            <span>Descargar Liquidación en PDF</span>
          </button>

          <button
            type="button"
            id="btn-finalizar-proceso"
            disabled={resultado.hayRemanenteSinAsignar || hayConflictoPaso3}
            onClick={() => {
              if (resultado.hayRemanenteSinAsignar) {
                alert(
                  'No es posible finalizar el proceso mientras exista un remanente sin asignar. Por favor regrese al Paso 2 y complete la asignación.'
                );
                return;
              }
              if (hayConflictoPaso3) {
                alert(
                  'No es posible finalizar el proceso mientras exista un conflicto entre Quién Paga y Quién Recibe las costas judiciales.'
                );
                return;
              }
              onFinalizarProceso();
            }}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 text-xs font-bold px-5 py-2.5 rounded-lg transition shadow-xs cursor-pointer ${
              resultado.hayRemanenteSinAsignar || hayConflictoPaso3
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Finalizar Proceso</span>
          </button>
        </div>
      </div>
    </div>
  );
};
