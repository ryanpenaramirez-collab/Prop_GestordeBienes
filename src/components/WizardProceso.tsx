import React, { useState } from 'react';
import { ProcesoParticion, Ley, HonorariosConfig, Persona, BaseCalculoLey, ResultadoParticion } from '../types';
import { calcularParticion, formatearMoneda } from '../utils/calculator';
import {
  alternarLeyConExclusionMutua,
  aplicarRegimenTestado,
  aplicarRegimenIntestado,
  aplicarRegimenSocietario,
} from '../utils/storage';
import { generarPDFParticion } from '../utils/pdfGenerator';
import { Paso1Bienes } from './pasos/Paso1Bienes';
import { Paso2PersonasYLeyes } from './pasos/Paso2PersonasYLeyes';
import { Paso3CostosYResultadoFinal } from './pasos/Paso3CostosYResultadoFinal';
import {
  ArrowLeft,
  ArrowRight,
  Scale,
  Save,
  CheckCircle,
  Building2,
  Users,
  Briefcase,
  AlertTriangle,
  Download,
} from 'lucide-react';

interface WizardProcesoProps {
  proceso: ProcesoParticion;
  onActualizarProceso: (proceso: ProcesoParticion) => void;
  onSalirAlInicio: () => void;
  onFinalizarProceso: (proceso?: ProcesoParticion, resultado?: ResultadoParticion) => void;
}

export const WizardProceso: React.FC<WizardProcesoProps> = ({
  proceso,
  onActualizarProceso,
  onSalirAlInicio,
  onFinalizarProceso,
}) => {
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

  const resultado = calcularParticion(
    proceso.personas,
    proceso.bienes,
    proceso.leyes,
    proceso.honorarios,
    {
      tipoProceso: proceso.tipoProceso,
      tieneCapitulaciones: proceso.tieneCapitulaciones,
      porcentajeGanancialesCapitulaciones: proceso.porcentajeGanancialesCapitulaciones,
      calcularGananciaOcasional: proceso.calcularGananciaOcasional,
    }
  );

  const setPaso = (nuevoPaso: 1 | 2 | 3) => {
    // Si intenta pasar al paso 3 sin que las leyes sumen 100% o sin personas
    if (nuevoPaso === 3) {
      if (proceso.personas.length === 0) {
        setErrorValidacion(
          'Debe registrar al menos a una persona para continuar hacia Costos y Resultado Final.'
        );
        return;
      }
      if (!resultado.repartoEsValido) {
        setErrorValidacion(
          resultado.hayRemanenteSinAsignar
            ? `Quedan fondos sin asignar (${formatearMoneda(resultado.remanenteSinAsignarCOP)}). Debe asignar la totalidad del remanente antes de continuar.`
            : `Las Leyes de Reparto deben sumar exactamente 100% (actualmente suman ${resultado.porcentajeTotalLeyesReparto.toFixed(
                1
              )}%). Corrija la distribución antes de continuar.`
        );
        return;
      }
    }

    setErrorValidacion(null);
    onActualizarProceso({
      ...proceso,
      pasoActual: nuevoPaso,
      fechaUltimaEdicion: new Date().toISOString(),
    });
  };

  const pasoSiguiente = () => {
    if (proceso.pasoActual === 2) {
      if (proceso.personas.length === 0) {
        setErrorValidacion(
          'Debe registrar al menos a una persona para continuar hacia Costos y Resultado Final.'
        );
        return;
      }
      if (!resultado.repartoEsValido) {
        if (resultado.remanentesIncompletos && resultado.remanentesIncompletos.length > 0) {
          const primero = resultado.remanentesIncompletos[0];
          if (primero.excedido) {
            setErrorValidacion(
              `El reparto excede el 100% en "${primero.origenNombre}" (suma ${primero.porcentajeAsignado.toFixed(1)}%). Corrija los porcentajes antes de continuar.`
            );
          } else {
            setErrorValidacion(
              `Quedó un remanente sin asignar (${primero.porcentajeFaltante.toFixed(1)}% / ${formatearMoneda(primero.montoFaltanteCOP)} en "${primero.origenNombre}"). Asigne la totalidad del remanente antes de continuar.`
            );
          }
        } else if (resultado.hayRemanenteSinAsignar) {
          setErrorValidacion(
            `Quedan fondos sin asignar (${formatearMoneda(resultado.remanenteSinAsignarCOP)}). Debe asignar la totalidad del patrimonio partible antes de continuar.`
          );
        } else {
          setErrorValidacion(
            `Las Leyes de Reparto deben sumar exactamente 100% (actualmente suman ${resultado.porcentajeTotalLeyesReparto.toFixed(
              1
            )}%). Corrija la selección antes de continuar.`
          );
        }
        return;
      }
    }

    setErrorValidacion(null);
    if (proceso.pasoActual < 3) {
      setPaso((proceso.pasoActual + 1) as 1 | 2 | 3);
    }
  };

  const pasoAnterior = () => {
    setErrorValidacion(null);
    if (proceso.pasoActual > 1) {
      setPaso((proceso.pasoActual - 1) as 1 | 2 | 3);
    } else {
      onSalirAlInicio();
    }
  };

  // 1. Handlers para Paso 1: Bienes e Información General
  const handleActualizarInfoGeneral = (
    nombreCaso: string,
    tipoProceso: string,
    regimen: 'testado' | 'intestado'
  ) => {
    let nuevasLeyes = proceso.leyes;
    if (regimen !== proceso.regimenSucesoral) {
      nuevasLeyes =
        regimen === 'testado'
          ? aplicarRegimenTestado(proceso.leyes)
          : aplicarRegimenIntestado(proceso.leyes);
    }

    onActualizarProceso({
      ...proceso,
      nombreCaso,
      tipoProceso,
      regimenSucesoral: regimen,
      leyes: nuevasLeyes,
      fechaUltimaEdicion: new Date().toISOString(),
    });
  };

  const handleAgregarBien = (nombre: string, valorCOP: number) => {
    const nuevoBien = {
      id: `bien-${Date.now()}`,
      nombre,
      valor: valorCOP,
    };
    onActualizarProceso({
      ...proceso,
      bienes: [...proceso.bienes, nuevoBien],
      fechaUltimaEdicion: new Date().toISOString(),
    });
  };

  const handleEliminarBien = (id: string) => {
    onActualizarProceso({
      ...proceso,
      bienes: proceso.bienes.filter((b) => b.id !== id),
      fechaUltimaEdicion: new Date().toISOString(),
    });
  };

  // 2. Handlers para Paso 2: Personas y Leyes
  const handleAgregarPersona = (nueva: Omit<Persona, 'id'>) => {
    const persona: Persona = {
      ...nueva,
      id: `per-${Date.now()}`,
    };
    onActualizarProceso({
      ...proceso,
      personas: [...proceso.personas, persona],
      fechaUltimaEdicion: new Date().toISOString(),
    });
  };

  const handleEliminarPersona = (id: string) => {
    onActualizarProceso({
      ...proceso,
      personas: proceso.personas.filter((p) => p.id !== id),
      bienes: proceso.bienes.map((b) =>
        b.asignadoAId === id ? { ...b, asignadoAId: undefined } : b
      ),
      fechaUltimaEdicion: new Date().toISOString(),
    });
  };

  const handleActualizarPersona = (personaActualizada: Persona) => {
    onActualizarProceso({
      ...proceso,
      personas: proceso.personas.map((p) =>
        p.id === personaActualizada.id ? personaActualizada : p
      ),
      fechaUltimaEdicion: new Date().toISOString(),
    });
  };

  const handleToggleLey = (id: string) => {
    setErrorValidacion(null);
    const leyesActualizadas = alternarLeyConExclusionMutua(proceso.leyes, id);
    onActualizarProceso({
      ...proceso,
      leyes: leyesActualizadas,
      fechaUltimaEdicion: new Date().toISOString(),
    });
  };

  const handleActualizarPorcentajeLey = (id: string, nuevoPct: number) => {
    setErrorValidacion(null);
    const leyesActualizadas = proceso.leyes.map((l) =>
      l.id === id ? { ...l, porcentaje: nuevoPct } : l
    );
    onActualizarProceso({
      ...proceso,
      leyes: leyesActualizadas,
      fechaUltimaEdicion: new Date().toISOString(),
    });
  };

  const handleActualizarBaseCalculoLey = (
    id: string,
    baseCalculo: BaseCalculoLey,
    leyPadreId?: string
  ) => {
    setErrorValidacion(null);
    const leyesActualizadas = proceso.leyes.map((l) =>
      l.id === id
        ? {
            ...l,
            baseCalculo,
            leyPadreId: baseCalculo === 'remanente_de_ley' ? leyPadreId : undefined,
          }
        : l
    );
    onActualizarProceso({
      ...proceso,
      leyes: leyesActualizadas,
      fechaUltimaEdicion: new Date().toISOString(),
    });
  };

  const handleAplicarRegimenTestado = () => {
    setErrorValidacion(null);
    const leyesActualizadas = aplicarRegimenTestado(proceso.leyes);
    onActualizarProceso({
      ...proceso,
      regimenSucesoral: 'testado',
      leyes: leyesActualizadas,
      fechaUltimaEdicion: new Date().toISOString(),
    });
  };

  const handleAplicarRegimenIntestado = () => {
    setErrorValidacion(null);
    const leyesActualizadas = aplicarRegimenIntestado(proceso.leyes);
    onActualizarProceso({
      ...proceso,
      regimenSucesoral: 'intestado',
      leyes: leyesActualizadas,
      fechaUltimaEdicion: new Date().toISOString(),
    });
  };

  const handleAplicarRegimenSocietario = () => {
    setErrorValidacion(null);
    const leyesActualizadas = aplicarRegimenSocietario(proceso.leyes);
    onActualizarProceso({
      ...proceso,
      leyes: leyesActualizadas,
      fechaUltimaEdicion: new Date().toISOString(),
    });
  };

  // 3. Handlers para Paso 3: Costos y Resultado Final
  const handleActualizarHonorarios = (nuevos: HonorariosConfig) => {
    onActualizarProceso({
      ...proceso,
      honorarios: nuevos,
      fechaUltimaEdicion: new Date().toISOString(),
    });
  };

  const handleAsignarBienAPersona = (bienId: string, personaId: string | undefined) => {
    onActualizarProceso({
      ...proceso,
      bienes: proceso.bienes.map((b) =>
        b.id === bienId ? { ...b, asignadoAId: personaId } : b
      ),
      fechaUltimaEdicion: new Date().toISOString(),
    });
  };

  const handleGenerarPDF = () => {
    generarPDFParticion(proceso, resultado);
  };

  // Las tres categorías solicitadas
  const pasos = [
    { num: 1, label: 'Bienes', icon: Building2 },
    { num: 2, label: 'Personas y Leyes', icon: Users },
    { num: 3, label: 'Costos y Resultado Final', icon: Briefcase },
  ];

  const bloqueoAvanzar =
    proceso.pasoActual === 2 &&
    (!resultado.repartoEsValido || proceso.personas.length === 0);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 text-slate-800 font-sans overflow-hidden">
      {/* BARRA SUPERIOR DEL EXPEDIENTE / CASO */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between gap-4 shrink-0 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            id="btn-regresar-casos"
            onClick={onSalirAlInicio}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
            title="Volver a la lista de casos"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-slate-900 truncate font-serif">
              {proceso.nombreCaso || 'Expediente de Partición'}
            </h1>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="truncate">{proceso.tipoProceso}</span>
              <span>•</span>
              <span className="font-semibold text-slate-600">
                {proceso.regimenSucesoral === 'intestado' ? 'Intestado' : 'Testado'}
              </span>
            </div>
          </div>
        </div>

        {/* NAVEGACIÓN ENTRE PASOS EN LA MISMA PANTALLA (SIN MODALES) */}
        <div className="hidden md:flex items-center gap-1.5">
          {pasos.map((p, idx) => {
            const activo = proceso.pasoActual === p.num;
            const completado = proceso.pasoActual > p.num;
            const StepIcon = p.icon;

            return (
              <React.Fragment key={p.num}>
                <button
                  type="button"
                  id={`btn-nav-paso-${p.num}`}
                  onClick={() => setPaso(p.num as 1 | 2 | 3)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    activo
                      ? 'bg-slate-900 text-white shadow-xs'
                      : completado
                      ? 'text-slate-700 hover:bg-slate-100'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                      activo
                        ? 'bg-white text-slate-900'
                        : completado
                        ? 'bg-slate-200 text-slate-800'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {p.num}
                  </span>
                  <span>{p.label}</span>
                </button>
                {idx < pasos.length - 1 && (
                  <span className="text-slate-300 px-0.5 text-xs font-light">/</span>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* ACCIÓN SALIR */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            id="btn-guardar-y-salir"
            onClick={onSalirAlInicio}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 transition shadow-2xs cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Guardar y Salir</span>
          </button>
        </div>
      </div>

      {/* BANNER DE ERROR DE VALIDACIÓN */}
      {errorValidacion && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center justify-between gap-4 text-xs text-amber-900 shrink-0">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{errorValidacion}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleAplicarRegimenTestado}
              className="text-[11px] font-semibold bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 px-2 py-0.5 rounded transition cursor-pointer"
            >
              Fijar Testado (50+50)
            </button>
            <button
              type="button"
              onClick={handleAplicarRegimenIntestado}
              className="text-[11px] font-semibold bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 px-2 py-0.5 rounded transition cursor-pointer"
            >
              Fijar Intestado (100)
            </button>
          </div>
        </div>
      )}

      {/* ÁREA DE CONTENIDO DEL PASO ACTIVO (DENTRO DE LA MISMA PANTALLA) */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {proceso.pasoActual === 1 && (
          <Paso1Bienes
            proceso={proceso}
            onActualizarInfoGeneral={handleActualizarInfoGeneral}
            onAgregarBien={handleAgregarBien}
            onEliminarBien={handleEliminarBien}
            onSiguiente={pasoSiguiente}
          />
        )}

        {proceso.pasoActual === 2 && (
          <Paso2PersonasYLeyes
            personas={proceso.personas}
            leyes={proceso.leyes}
            regimenSucesoral={proceso.regimenSucesoral}
            tipoProceso={proceso.tipoProceso}
            resultado={resultado}
            onAgregarPersona={handleAgregarPersona}
            onActualizarPersona={handleActualizarPersona}
            onEliminarPersona={handleEliminarPersona}
            onToggleLey={handleToggleLey}
            onActualizarPorcentajeLey={handleActualizarPorcentajeLey}
            onActualizarBaseCalculoLey={handleActualizarBaseCalculoLey}
            onAplicarRegimenTestado={handleAplicarRegimenTestado}
            onAplicarRegimenIntestado={handleAplicarRegimenIntestado}
            onAplicarRegimenSocietario={handleAplicarRegimenSocietario}
            onAnterior={pasoAnterior}
            onSiguiente={pasoSiguiente}
          />
        )}

        {proceso.pasoActual === 3 && (
          <Paso3CostosYResultadoFinal
            proceso={proceso}
            resultado={resultado}
            onActualizarHonorarios={handleActualizarHonorarios}
            onAsignarBienAPersona={handleAsignarBienAPersona}
            onGenerarPDF={handleGenerarPDF}
            onFinalizarProceso={() => onFinalizarProceso(proceso, resultado)}
            onAnterior={pasoAnterior}
          />
        )}
      </div>

      {/* PIE DE PÁGINA FIJO CON INDICADORES Y NAVEGACIÓN */}
      <div className="bg-white border-t border-slate-200 px-6 py-2.5 flex items-center justify-between gap-4 shrink-0 shadow-xs">
        {/* Botón Atrás */}
        <button
          type="button"
          id="btn-paso-atras"
          onClick={pasoAnterior}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition cursor-pointer shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{proceso.pasoActual === 1 ? 'Casos' : 'Atrás'}</span>
        </button>

        {/* Resumen central: Estado de los dos grupos */}
        <div className="flex items-center gap-4 text-xs truncate">
          {/* Bienes / Patrimonio */}
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="text-slate-500 hidden sm:inline">Bruto:</span>
            <span className="font-mono font-bold text-slate-800">
              {formatearMoneda(resultado.patrimonioBrutoCOP)}
            </span>
          </div>

          <span className="text-slate-300">|</span>

          {/* Leyes de reparto */}
          <div className="flex items-center gap-1.5">
            <Scale className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="text-slate-500 hidden sm:inline">Leyes Reparto:</span>
            {resultado.repartoEsValido ? (
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                ✓ 100% Asignado
              </span>
            ) : (
              <span className="text-[10px] bg-amber-100 text-amber-900 font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                ⚠️ {resultado.hayRemanenteSinAsignar ? `Remanente sin asignar (${formatearMoneda(resultado.remanenteSinAsignarCOP)})` : 'Ajustar a 100%'}
              </span>
            )}
          </div>
        </div>

        {/* Botón Siguiente o Acciones finales */}
        {proceso.pasoActual < 3 ? (
          <button
            type="button"
            id="btn-paso-siguiente"
            onClick={pasoSiguiente}
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-1.5 rounded-lg transition shadow-2xs cursor-pointer shrink-0 ${
              bloqueoAvanzar
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white'
            }`}
            title={
              bloqueoAvanzar
                ? 'Las leyes de reparto deben sumar exactamente 100% y registrar al menos 1 persona'
                : 'Avanzar al siguiente paso'
            }
          >
            <span>Siguiente</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleGenerarPDF}
              className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold px-3 py-1.5 rounded-lg transition shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">PDF</span>
            </button>
            <button
              type="button"
              onClick={() => onFinalizarProceso(proceso, resultado)}
              className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg transition shadow-2xs cursor-pointer"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Finalizar</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
