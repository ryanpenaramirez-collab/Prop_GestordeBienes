import React from 'react';
import { Plus, Play, Trash2, Calendar, Scale, Briefcase, FileText } from 'lucide-react';
import { ProcesoParticion } from '../types';
import { formatearMoneda } from '../utils/calculator';

interface HomeScreenProps {
  procesos: ProcesoParticion[];
  onNuevoProceso: () => void;
  onRetomarProceso: (proceso: ProcesoParticion) => void;
  onEliminarProceso: (id: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  procesos,
  onNuevoProceso,
  onRetomarProceso,
  onEliminarProceso,
}) => {
  const formatearFecha = (iso: string) => {
    try {
      const fecha = new Date(iso);
      return fecha.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100">
      {/* Barra de título específico de la pantalla sin botones de navegación duplicados */}
      <div className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between gap-4 shrink-0 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center border border-slate-200">
            <Scale className="w-4 h-4 text-slate-800" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight font-serif">
              Expedientes de Partición
            </h2>
            <p className="text-[11px] text-slate-500">
              Gestión y liquidación de particiones patrimoniales y sucesorales
            </p>
          </div>
        </div>
      </div>

      {/* Contenido principal: Botón "+ Nueva Partición de Bienes" y Lista de Procesos Pendientes */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 max-w-5xl w-full mx-auto">
        {/* BOTÓN PRINCIPAL GRANDE Y VISIBLE: + NUEVA PARTICIÓN DE BIENES */}
        <div className="bg-white rounded-xl border-2 border-dashed border-slate-300 hover:border-slate-800 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all duration-150 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Nueva Partición</h3>
              <p className="text-xs text-slate-500">Guardado local automático en el dispositivo.</p>
            </div>
          </div>

          <button
            type="button"
            id="btn-nueva-particion-bienes"
            onClick={onNuevoProceso}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-all duration-150 shadow-sm cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nueva Partición de Bienes</span>
          </button>
        </div>

        {/* SECCIÓN: PROCESOS PENDIENTES */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="w-3.5 h-3.5 text-slate-700" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Procesos Pendientes ({procesos.length})
              </h3>
            </div>
            <span className="text-[11px] text-slate-500">
              Guardados localmente
            </span>
          </div>

          {procesos.length === 0 ? (
            <div className="p-8 flex flex-col items-center justify-center text-center">
              <FileText className="w-8 h-8 stroke-1 text-slate-300 mb-1.5" />
              <h4 className="text-sm font-semibold text-slate-700">Sin procesos pendientes</h4>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {procesos.map((proc) => {
                const totalMasa = proc.bienes.reduce((acc, b) => acc + (Number(b.valor) || 0), 0);

                return (
                  <div
                    key={proc.id}
                    id={`proceso-card-${proc.id}`}
                    className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm truncate">
                          {proc.nombreCaso || 'Expediente Sin Nombre'}
                        </span>
                        <span className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 shrink-0">
                          {proc.tipoProceso || 'Partición'}
                        </span>
                        <span className="text-[10px] font-semibold bg-blue-50 text-blue-800 px-2 py-0.5 rounded border border-blue-200 shrink-0">
                          Paso {Math.min(3, proc.pasoActual || 1)} de 3
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-y-1 gap-x-3 mt-1.5 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {formatearFecha(proc.fechaUltimaEdicion)}
                        </span>
                        <span>•</span>
                        <span>
                          Masa: <strong className="text-slate-800 font-mono">{formatearMoneda(totalMasa)}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          {proc.personas.length} personas
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        id={`btn-retomar-${proc.id}`}
                        onClick={() => onRetomarProceso(proc)}
                        className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-colors shadow-2xs cursor-pointer"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Retomar</span>
                      </button>

                      <button
                        type="button"
                        id={`btn-eliminar-proceso-${proc.id}`}
                        onClick={() => onEliminarProceso(proc.id)}
                        className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
