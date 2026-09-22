import React, { useState } from 'react';
import {
  Persona,
  Ley,
  TipoRelacion,
  ParentescoFamiliar,
  BaseCalculoLey,
  ResultadoParticion,
} from '../../types';
import {
  calcularParticion,
  determinarOrdenSucesoral,
  formatearMoneda,
} from '../../utils/calculator';
import { InputPorcentaje } from '../InputPorcentaje';
import {
  Users,
  Plus,
  Trash2,
  Scale,
  Scroll,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Check,
  Info,
  ArrowLeft,
  ArrowRight,
  PieChart,
  Percent,
  GitFork,
} from 'lucide-react';

interface Paso2PersonasYLeyesProps {
  personas: Persona[];
  leyes: Ley[];
  regimenSucesoral?: 'testado' | 'intestado';
  tipoProceso?: string;
  resultado?: ResultadoParticion;
  onAgregarPersona: (nueva: Omit<Persona, 'id'>) => void;
  onActualizarPersona: (persona: Persona) => void;
  onEliminarPersona: (id: string) => void;
  onToggleLey: (id: string) => void;
  onActualizarPorcentajeLey: (id: string, nuevoPct: number) => void;
  onActualizarBaseCalculoLey?: (id: string, baseCalculo: BaseCalculoLey, leyPadreId?: string) => void;
  onAplicarRegimenTestado: () => void;
  onAplicarRegimenIntestado: () => void;
  onAplicarRegimenSocietario?: () => void;
  onAnterior: () => void;
  onSiguiente: () => void;
}

export const Paso2PersonasYLeyes: React.FC<Paso2PersonasYLeyesProps> = ({
  personas,
  leyes,
  tipoProceso,
  resultado,
  onAgregarPersona,
  onActualizarPersona,
  onEliminarPersona,
  onToggleLey,
  onActualizarPorcentajeLey,
  onActualizarBaseCalculoLey,
  onAplicarRegimenTestado,
  onAplicarRegimenIntestado,
  onAplicarRegimenSocietario,
  onAnterior,
  onSiguiente,
}) => {
  // Estado para nueva persona
  const [nombrePersona, setNombrePersona] = useState('');
  const [tipoRelacion, setTipoRelacion] = useState<TipoRelacion>('Familiar');
  const [parentesco, setParentesco] = useState<ParentescoFamiliar>('Hijo');
  const [declaradoIndigno, setDeclaradoIndigno] = useState(false);
  const [desheredado, setDesheredado] = useState(false);
  const [porcentajeParticipacion, setPorcentajeParticipacion] = useState<string>('');
  const [errorPersona, setErrorPersona] = useState<string | null>(null);

  // Detección de proceso societario
  const esProcesoSocietario =
    (tipoProceso &&
      (tipoProceso.toLowerCase().includes('disolución') ||
        tipoProceso.toLowerCase().includes('societaria'))) ||
    leyes.some(
      (l) => l.activa && (l.id === 'ley-disolucion-sociedades' || l.nombre.toLowerCase().includes('disolución'))
    );

  // Leyes activas y cálculo de validación de 100%
  const leyesActivas = leyes.filter((l) => l.activa);
  const sumaPorcentajesReparto = leyesActivas
    .filter(
      (l) =>
        l.id !== 'ley-ganancia-ocasional' &&
        l.id !== 'ley-indignidad' &&
        l.id !== 'ley-desheredamiento'
    )
    .reduce((acc, l) => acc + (Number(l.porcentaje) || 0), 0);

  // Detección de régimen actual
  const esModoIntestado = leyesActivas.some(
    (l) => l.id === 'ley-3' || l.nombre.toLowerCase().includes('orden sucesoral')
  );
  const esModoTestado = leyesActivas.some(
    (l) =>
      l.id === 'ley-1' ||
      l.id === 'ley-2' ||
      l.nombre.toLowerCase().includes('legítima') ||
      l.nombre.toLowerCase().includes('libre disposición')
  );
  const esModoSocietario = leyesActivas.some(
    (l) => l.id === 'ley-disolucion-sociedades' || l.nombre.toLowerCase().includes('disolución')
  );

  // Orden sucesoral detectado automáticamente según personas registradas
  const ordenSucesoralInfo = determinarOrdenSucesoral(personas);

  // CÁLCULO INFORMATIVO PORCENTUAL (Simulación sobre base 100% sin deducir costos aún)
  const simulacionInformativa = calcularParticion(
    personas,
    [{ id: 'base-informativa', nombre: 'Base 100%', valor: 100000000 }],
    leyes,
    {
      abogadoPorcentaje: 0,
      agenciasDerechoPorcentaje: 0,
      modalidad: 'porcentaje',
    },
    { tipoProceso }
  );

  const calculoActivo = resultado || simulacionInformativa;
  const esRepartoValido = calculoActivo.repartoEsValido;

  // Agrupación informativa por categoría (Hijos, Cónyuge, Padres, etc.)
  const mapaPorcentajesPorCategoria = new Map<string, number>();
  for (const item of calculoActivo.desglosePersonas) {
    const categoria =
      item.persona.tipoRelacion === 'Familiar'
        ? item.persona.parentesco || 'Familiar'
        : 'Tercero / Amigo / Socio';
    const actual = mapaPorcentajesPorCategoria.get(categoria) || 0;
    mapaPorcentajesPorCategoria.set(categoria, actual + item.porcentajeDelTotal);
  }

  const handleAgregarPersonaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNombre = nombrePersona.trim();

    if (!cleanNombre) {
      setErrorPersona('Ingrese el nombre y apellidos completos de la persona');
      return;
    }

    const pctPartNum = parseFloat(porcentajeParticipacion);

    onAgregarPersona({
      nombre: cleanNombre,
      tipoRelacion,
      parentesco: tipoRelacion === 'Familiar' ? parentesco : undefined,
      declaradoIndigno: declaradoIndigno || undefined,
      desheredado: desheredado || undefined,
      porcentajeParticipacion: !isNaN(pctPartNum) && pctPartNum > 0 ? pctPartNum : undefined,
    });

    setNombrePersona('');
    setDeclaradoIndigno(false);
    setDesheredado(false);
    setPorcentajeParticipacion('');
    setErrorPersona(null);
  };

  const handleDistribuirPartesIguales = () => {
    if (personas.length === 0) return;
    const pct = Math.round((100 / personas.length) * 100) / 100;
    personas.forEach((p) => {
      onActualizarPersona({ ...p, porcentajeParticipacion: pct });
    });
  };

  const puedeAvanzar = esRepartoValido && personas.length > 0;

  return (
    <div className="flex flex-col gap-5 max-w-4xl mx-auto w-full">
      {/* 1. SECCIÓN: REGISTRO DE PERSONAS INVOLUCRADAS */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-800" />
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                1. Personas Involucradas ({personas.length} registradas)
              </h3>
              <span className="text-[11px] text-slate-400">
                Herederos legitimarios, cónyuge o terceros asignatarios
              </span>
            </div>
          </div>

          {/* Badge del orden sucesoral detectado automáticamente */}
          {personas.length > 0 && esModoIntestado && (
            <div className="bg-slate-100 text-slate-800 border border-slate-300 px-2.5 py-1 rounded-md text-[11px] font-medium">
              <span className="font-bold">{ordenSucesoralInfo.titulo}</span>
            </div>
          )}
        </div>

        {/* Formulario de agregar persona */}
        <div className="p-4 bg-slate-50/50 border-b border-slate-200">
          <form onSubmit={handleAgregarPersonaSubmit} className="flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
              {/* Nombre */}
              <div className="sm:col-span-6">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={nombrePersona}
                  onChange={(e) => setNombrePersona(e.target.value)}
                  placeholder="Ej: Camilo Andrés Gómez Restrepo"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-slate-800"
                />
              </div>

              {/* Tipo de Relación */}
              <div className="sm:col-span-3">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Tipo de Relación
                </label>
                <select
                  value={tipoRelacion}
                  onChange={(e) => setTipoRelacion(e.target.value as TipoRelacion)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-slate-800"
                >
                  <option value="Familiar">Familiar</option>
                  <option value="Amigo/Socio">Amigo / Socio / Tercero</option>
                </select>
              </div>

              {/* Parentesco si es familiar */}
              <div className="sm:col-span-3">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Parentesco Específico
                </label>
                <select
                  disabled={tipoRelacion !== 'Familiar'}
                  value={parentesco}
                  onChange={(e) => setParentesco(e.target.value as ParentescoFamiliar)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-slate-800 disabled:opacity-40"
                >
                  <option value="Hijo">Hijo / Hija</option>
                  <option value="Cónyuge">Cónyuge / Compañero(a)</option>
                  <option value="Padre">Padre / Madre</option>
                  <option value="Hermano">Hermano / Hermana</option>
                  <option value="Otro">Otro Pariente</option>
                </select>
              </div>
            </div>

            {/* OPCIONES LEGALES ESPECIALES POR PERSONA */}
            <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center gap-4 text-xs">
              {/* Indignidad Sucesoral */}
              <label className="inline-flex items-center gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-slate-100 transition">
                <input
                  type="checkbox"
                  checked={declaradoIndigno}
                  onChange={(e) => setDeclaradoIndigno(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-rose-700 border-slate-300 focus:ring-rose-700 cursor-pointer"
                />
                <span className="text-slate-700 text-[11px] font-medium">
                  <strong>Declarado Indigno</strong> (Art. 1025 C.C., Ley 1893/2018)
                </span>
              </label>

              {/* Desheredamiento */}
              <label className="inline-flex items-center gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-slate-100 transition">
                <input
                  type="checkbox"
                  checked={desheredado}
                  onChange={(e) => setDesheredado(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-amber-700 border-slate-300 focus:ring-amber-700 cursor-pointer"
                />
                <span className="text-slate-700 text-[11px] font-medium">
                  <strong>Desheredado</strong> (Arts. 1265-1281 C.C.)
                </span>
              </label>

              {/* Porcentaje de participación si es proceso societario o copropiedad */}
              {esProcesoSocietario && (
                <div className="flex items-center gap-2 ml-auto">
                  <label className="text-[11px] font-semibold text-slate-700">
                    % Participación Estatutos (Arts. 218-259 C.Co.):
                  </label>
                  <div className="relative w-20">
                    <InputPorcentaje
                      id="persona-add-pct"
                      value={porcentajeParticipacion ? parseFloat(porcentajeParticipacion) : undefined}
                      onChange={(val) => setPorcentajeParticipacion(String(val))}
                      onChangeNullable={() => setPorcentajeParticipacion('')}
                      allowEmpty={true}
                      min={0}
                      max={100}
                      step="0.1"
                      placeholder="Ej: 50"
                      className="w-full bg-white border border-slate-300 rounded-lg pl-2 pr-6 py-1 text-xs font-mono font-bold text-slate-900 text-right focus:outline-none focus:border-slate-800"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono select-none">
                      %
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mt-1">
              <span className="text-[11px] text-slate-400">
                {esProcesoSocietario
                  ? 'Cada socio participará según el porcentaje estatutario de sus cuotas o acciones sociales.'
                  : 'Las exclusiones por indignidad o desheredamiento redistribuyen la cuota automáticamente.'}
              </span>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-2xs cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Persona</span>
              </button>
            </div>

            {errorPersona && (
              <div className="text-red-700 text-xs flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorPersona}</span>
              </div>
            )}
          </form>
        </div>

        {/* Lista de personas registradas */}
        {personas.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center">
            <Users className="w-8 h-8 text-slate-300 mb-2 stroke-1" />
            <span className="font-semibold text-slate-700">Sin personas registradas aún</span>
            <p className="text-slate-500 mt-1 max-w-sm">
              Registre a los herederos, cónyuge o socios para calcular y visualizar el reparto que le corresponderá a cada uno.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {/* Header auxiliar si es societario */}
            {esProcesoSocietario && (
              <div className="px-4 py-2 bg-slate-100/60 flex items-center justify-between text-[11px] text-slate-600 border-b border-slate-200">
                <span>Participación Social en la Liquidación</span>
                <button
                  type="button"
                  onClick={handleDistribuirPartesIguales}
                  className="font-semibold text-slate-800 hover:underline cursor-pointer"
                >
                  Distribuir en partes iguales entre {personas.length} socios
                </button>
              </div>
            )}

            {personas.map((persona, index) => (
              <div
                key={persona.id}
                className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors ${
                  persona.declaradoIndigno || persona.desheredado ? 'bg-amber-50/20' : ''
                }`}
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                  <span className="text-xs font-mono text-slate-400 w-5 text-right shrink-0 mt-0.5 sm:mt-0">
                    {index + 1}.
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {persona.nombre}
                      </span>
                      <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium border border-slate-200 shrink-0">
                        {persona.tipoRelacion === 'Familiar'
                          ? `Familiar: ${persona.parentesco}`
                          : 'Amigo / Socio'}
                      </span>

                      {/* Badges de estado legal */}
                      {persona.declaradoIndigno && (
                        <span className="text-[10px] bg-rose-100 text-rose-800 border border-rose-200 px-2 py-0.5 rounded font-semibold shrink-0">
                          Indigno (Excluido Art. 1025 C.C.)
                        </span>
                      )}
                      {persona.desheredado && (
                        <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded font-semibold shrink-0">
                          Desheredado (Arts. 1265-1281 C.C.)
                        </span>
                      )}
                    </div>

                    {/* Explicación jurídica si fue excluido */}
                    {(persona.declaradoIndigno || persona.desheredado) && (
                      <p className="text-[10px] text-slate-500 mt-1">
                        {persona.declaradoIndigno &&
                          'Excluido por indignidad. Su cuota se redistribuye entre los demás legitimarios/herederos.'}
                        {persona.desheredado &&
                          !persona.declaradoIndigno &&
                          'Desheredado testamentario. Privado de la cuota forzosa de legítima rigurosa.'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Acciones y controles interactivos por persona */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 pl-8 sm:pl-0">
                  {/* % de Participación si es societario */}
                  {esProcesoSocietario && (
                    <div className="flex items-center gap-1.5 mr-2">
                      <span className="text-[10px] text-slate-500 font-semibold">Participación:</span>
                      <div className="relative w-18">
                        <InputPorcentaje
                          id={`persona-pct-${persona.id}`}
                          value={persona.porcentajeParticipacion}
                          onChange={(val) => onActualizarPersona({ ...persona, porcentajeParticipacion: val })}
                          onChangeNullable={() => onActualizarPersona({ ...persona, porcentajeParticipacion: undefined })}
                          allowEmpty={true}
                          min={0}
                          max={100}
                          step="0.1"
                          placeholder="%"
                          className="w-full bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs font-mono font-bold text-slate-900 text-right focus:outline-none focus:border-slate-800"
                        />
                        <span className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-mono">
                          %
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Toggle rápido Indignidad */}
                  <button
                    type="button"
                    onClick={() =>
                      onActualizarPersona({
                        ...persona,
                        declaradoIndigno: !persona.declaradoIndigno,
                      })
                    }
                    title="Alternar declaración de indignidad sucesoral"
                    className={`text-[10px] px-2 py-1 rounded border transition cursor-pointer ${
                      persona.declaradoIndigno
                        ? 'bg-rose-50 text-rose-700 border-rose-300 font-bold'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {persona.declaradoIndigno ? '✓ Indigno' : 'Indignidad'}
                  </button>

                  {/* Toggle rápido Desheredamiento */}
                  <button
                    type="button"
                    onClick={() =>
                      onActualizarPersona({
                        ...persona,
                        desheredado: !persona.desheredado,
                      })
                    }
                    title="Alternar desheredamiento testamentario"
                    className={`text-[10px] px-2 py-1 rounded border transition cursor-pointer ${
                      persona.desheredado
                        ? 'bg-amber-50 text-amber-700 border-amber-300 font-bold'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {persona.desheredado ? '✓ Desheredado' : 'Desheredar'}
                  </button>

                  <button
                    type="button"
                    onClick={() => onEliminarPersona(persona.id)}
                    className="text-slate-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition cursor-pointer"
                    title="Eliminar persona"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. SECCIÓN: LEYES APLICABLES CON REGLA DE EXCLUSIÓN MUTUA */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-slate-800" />
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                2. Leyes de Reparto Aplicables ({leyesActivas.length} activas)
              </h3>
              <span className="text-[11px] text-slate-400">
                Regla de exclusión mutua: Testado (50+50) vs Intestado (100)
              </span>
            </div>
          </div>

          {/* Botones de régimen rápido */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onAplicarRegimenTestado}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition cursor-pointer ${
                esModoTestado && !esModoIntestado && !esModoSocietario
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              Testado (50% + 50%)
            </button>
            <button
              type="button"
              onClick={onAplicarRegimenIntestado}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition cursor-pointer ${
                esModoIntestado && !esModoTestado && !esModoSocietario
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              Intestado (100%)
            </button>
            {onAplicarRegimenSocietario && (
              <button
                type="button"
                onClick={onAplicarRegimenSocietario}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition cursor-pointer ${
                  esModoSocietario
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                Societario (100%)
              </button>
            )}
          </div>
        </div>

        {/* Explicación jurídica de la regla de exclusión mutua */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-100 text-[11px] text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span>
            {esModoSocietario ? (
              <span>
                <strong>Régimen Societario Activo (Arts. 218-259 C.Co.):</strong> Liquidación del remanente social distribuido según el porcentaje de participación fijado en los estatutos sociales de la compañía.
              </span>
            ) : esModoTestado ? (
              <span>
                <strong>Régimen Testado Activo:</strong> La herencia se distribuye exclusivamente en 50% Legítima Rigurosa y 50% Libre Disposición (Ley 1934/2018).
              </span>
            ) : esModoIntestado ? (
              <span>
                <strong>Régimen Intestado Activo:</strong> Aplica el 100% según el orden sucesoral legal. {ordenSucesoralInfo.regla}
              </span>
            ) : (
              <span>
                Active el régimen testado, intestado o societario para fijar las cuotas de reparto.
              </span>
            )}
          </span>

          <span
            className={`font-mono font-bold px-2.5 py-1 rounded text-xs shrink-0 self-start sm:self-auto flex items-center gap-1.5 ${
              calculoActivo.repartoEsValido
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-900'
            }`}
          >
            {calculoActivo.repartoEsValido ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>Reparto: 100% Completo</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                <span>
                  {calculoActivo.hayRemanenteSinAsignar
                    ? `Falta ${formatearMoneda(calculoActivo.remanenteSinAsignarCOP)}`
                    : `Suma: ${sumaPorcentajesReparto.toFixed(1)}% / 100%`}
                </span>
              </>
            )}
          </span>
        </div>

        {/* Alerta de remanente sin asignar en reparto en cascada */}
        {calculoActivo.hayRemanenteSinAsignar && (
          <div className="m-4 p-4 bg-amber-50 border-2 border-amber-400 rounded-xl shadow-xs flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                <h4 className="font-bold text-amber-950 text-sm">
                  Alerta: Remanente sin asignar detectado
                </h4>
                <span className="font-mono font-bold bg-amber-200 text-amber-950 px-2 py-0.5 rounded text-xs shrink-0 self-start sm:self-auto">
                  {formatearMoneda(calculoActivo.remanenteSinAsignarCOP)} sin adjudicar
                </span>
              </div>
              <p className="text-amber-900 leading-relaxed mb-2.5">
                Al aplicar las leyes en cascada, ha quedado un remanente sin completar. Antes de continuar a los costos y generar el PDF final, debe resolverlo asignándolo a &ldquo;Libre Disposición&rdquo;, activando otra ley, o ajustando los porcentajes correspondientes.
              </p>
              <div className="bg-white/90 border border-amber-300 rounded-lg p-2.5 divide-y divide-amber-200">
                {calculoActivo.remanentesIncompletos.map((rem) => (
                  <div key={rem.id} className="py-1.5 first:pt-0 last:pb-0 flex items-center justify-between font-mono text-xs">
                    <span className="font-semibold text-amber-950">{rem.origenNombre}:</span>
                    <span className="font-bold text-amber-900">
                      {rem.excedido
                        ? `Excedido en ${(rem.porcentajeAsignado - 100).toFixed(1)}%`
                        : `Falta asignar ${rem.porcentajeFaltante.toFixed(1)}% (${formatearMoneda(rem.montoFaltanteCOP)})`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Notificación de reparto válido y completo */}
        {calculoActivo.repartoEsValido && (
          <div className="mx-4 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-2 text-xs text-emerald-950">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Reparto 100% Completo:</strong> Toda la masa partible y sus remanentes en cascada han sido asignados conforme a la ley.
              </span>
            </div>
            <span className="font-mono font-bold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded text-[11px] shrink-0">
              ✓ 100% Asignado
            </span>
          </div>
        )}

        {/* Lista interactiva de leyes */}
        <div className="divide-y divide-slate-100">
          {leyes.map((ley) => {
            const esLeyReparto =
              ley.id !== 'ley-ganancia-ocasional' &&
              ley.id !== 'ley-indignidad' &&
              ley.id !== 'ley-desheredamiento';
            const desglose = calculoActivo.leyesCalculadas?.find((dl) => dl.id === ley.id);
            const otrasLeyesCandidatas = leyesActivas.filter(
              (l) =>
                l.id !== ley.id &&
                l.id !== 'ley-ganancia-ocasional' &&
                l.id !== 'ley-indignidad' &&
                l.id !== 'ley-desheredamiento'
            );

            return (
              <div
                key={ley.id}
                className={`p-4 transition-colors ${
                  ley.activa ? 'bg-slate-50/40' : 'bg-white opacity-60'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div
                    onClick={() => onToggleLey(ley.id)}
                    className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                        ley.activa
                          ? 'bg-slate-900 border-slate-900 text-white'
                          : 'border-slate-300 bg-white text-transparent'
                      }`}
                    >
                      <Check className="w-3 h-3 stroke-[2.5]" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-semibold ${
                            ley.activa ? 'text-slate-900' : 'text-slate-500'
                          }`}
                        >
                          {ley.nombre}
                        </span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200 shrink-0">
                          {ley.aplicaA}
                        </span>
                      </div>
                      {ley.descripcion && (
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                          {ley.descripcion}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Ajuste de porcentaje si está activa */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    <div className="relative w-20">
                      <InputPorcentaje
                        id={`ley-proc-pct-${ley.id}`}
                        disabled={!ley.activa}
                        value={ley.porcentaje}
                        onChange={(val) => onActualizarPorcentajeLey(ley.id, val)}
                        min={0}
                        max={100}
                        step="0.5"
                        valorPorDefectoEnBlur={0}
                        className="w-full bg-white border border-slate-300 rounded-lg pl-2 pr-6 py-1 text-xs font-mono font-bold text-slate-900 text-right focus:outline-none focus:border-slate-800 disabled:opacity-40"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono select-none">
                        %
                      </span>
                    </div>
                  </div>
                </div>

                {/* Configuración de Base de Cálculo (Cascada vs Patrimonio Total) y desglose en COP */}
                {ley.activa && esLeyReparto && (
                  <div className="mt-3 pt-3 border-t border-slate-200/60 flex flex-col gap-2.5">
                    <div className="flex flex-wrap items-center gap-2.5 text-xs">
                      <span className="font-semibold text-slate-700 flex items-center gap-1">
                        <GitFork className="w-3.5 h-3.5 text-slate-500" />
                        Base de Cálculo:
                      </span>
                      <select
                        value={ley.baseCalculo || 'patrimonio_total'}
                        onChange={(e) => {
                          const nuevaBase = e.target.value as BaseCalculoLey;
                          const primerPadre =
                            otrasLeyesCandidatas.length > 0 ? otrasLeyesCandidatas[0].id : undefined;
                          onActualizarBaseCalculoLey?.(
                            ley.id,
                            nuevaBase,
                            nuevaBase === 'remanente_de_ley' ? (ley.leyPadreId || primerPadre) : undefined
                          );
                        }}
                        className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-medium focus:outline-none focus:border-slate-800 cursor-pointer"
                      >
                        <option value="patrimonio_total">Patrimonio Total (100% original)</option>
                        <option value="remanente_de_ley">Remanente de otra ley</option>
                      </select>

                      {ley.baseCalculo === 'remanente_de_ley' && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400 text-[11px]">sobre:</span>
                          <select
                            value={ley.leyPadreId || ''}
                            onChange={(e) =>
                              onActualizarBaseCalculoLey?.(ley.id, 'remanente_de_ley', e.target.value)
                            }
                            className="bg-white border border-blue-300 rounded-lg px-2.5 py-1 text-xs text-blue-900 font-semibold focus:outline-none focus:border-blue-600 max-w-[240px] truncate cursor-pointer"
                          >
                            <option value="">-- Seleccionar ley de origen --</option>
                            {otrasLeyesCandidatas.map((cl) => (
                              <option key={cl.id} value={cl.id}>
                                Remanente de {cl.nombre} ({cl.porcentaje}%)
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Visualización clara de la base real en COP y monto a asignar */}
                    {desglose && (
                      <div
                        className={`p-2.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs transition-colors ${
                          ley.baseCalculo === 'remanente_de_ley'
                            ? 'bg-blue-50/70 border-blue-200 text-blue-950'
                            : 'bg-slate-100/60 border-slate-200 text-slate-800'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5 font-semibold">
                            <Info
                              className={`w-3.5 h-3.5 shrink-0 ${
                                ley.baseCalculo === 'remanente_de_ley'
                                  ? 'text-blue-700'
                                  : 'text-slate-500'
                              }`}
                            />
                            <span>
                              {ley.baseCalculo === 'remanente_de_ley'
                                ? `Base real (Remanente de ${desglose.leyPadreNombre || 'Ley previa'}):`
                                : 'Base real de cálculo (Patrimonio Neto Total):'}
                            </span>
                            <span className="font-mono font-bold text-slate-900">
                              {formatearMoneda(desglose.baseDineroCOP)}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 ml-5 block font-mono">
                            Monto disponible antes de aplicar el {ley.porcentaje}%
                          </span>
                        </div>

                        <div className="text-right sm:self-center pl-5 sm:pl-0 shrink-0 font-mono">
                          <span className="text-[11px] text-slate-500 block">
                            Cuota a adjudicar ({ley.porcentaje}%):
                          </span>
                          <span className="font-bold text-slate-900 text-xs">
                            {formatearMoneda(desglose.montoCalculadoCOP)}
                          </span>
                          {ley.baseCalculo === 'remanente_de_ley' && (
                            <span className="text-[10px] text-blue-700 block">
                              (Remanente posterior: {formatearMoneda(desglose.remanentePosteriorCOP)})
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. SECCIÓN INFORMATIVA: DISTRIBUCIÓN PORCENTUAL POR PERSONA Y CATEGORÍA */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-slate-800" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              3. Distribución Porcentual Informativa (Sin valores en dinero)
            </h3>
          </div>
          <span className="text-[10px] bg-blue-50 text-blue-800 font-semibold px-2 py-0.5 rounded border border-blue-200">
            Informativo
          </span>
        </div>

        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
          Este desglose ilustra el porcentaje que le corresponderá a cada persona según las leyes activadas. En el siguiente paso (<strong>Costos y Resultado Final</strong>) se deducirán los honorarios del abogado y costas judiciales sobre el patrimonio bruto y se calculará el monto exacto en Pesos Colombianos (COP).
        </p>

        {personas.length === 0 ? (
          <div className="p-4 bg-slate-50 rounded-lg text-center text-xs text-slate-400">
            Registre al menos una persona para ver la distribución porcentual estimada.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Tarjetas resumen por categoría */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {Array.from(mapaPorcentajesPorCategoria.entries()).map(([cat, pct]) => (
                <div
                  key={cat}
                  className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col justify-between"
                >
                  <span className="text-[11px] font-semibold text-slate-600 block truncate">
                    {cat}
                  </span>
                  <span className="text-lg font-bold font-mono text-slate-900 mt-1">
                    {pct.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>

            {/* Detalle por cada persona individual */}
            <div className="bg-slate-50/50 border border-slate-200 rounded-lg overflow-hidden">
              <div className="px-4 py-2 bg-slate-100/70 text-[11px] font-semibold text-slate-700 flex justify-between border-b border-slate-200">
                <span>Persona y Relación</span>
                <span>Porcentaje Asignado</span>
              </div>
              <div className="divide-y divide-slate-200">
                {simulacionInformativa.desglosePersonas.map((desglose) => {
                  const estaExcluidoIndignidad = desglose.excluidoPorIndignidad || desglose.persona.declaradoIndigno;
                  const estaDesheredado = desglose.excluidoPorDesheredamiento || desglose.persona.desheredado;

                  return (
                    <div
                      key={desglose.persona.id}
                      className={`px-4 py-2.5 flex items-center justify-between text-xs ${
                        estaExcluidoIndignidad || estaDesheredado ? 'bg-slate-100/40 opacity-80' : ''
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${estaExcluidoIndignidad ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                            {desglose.persona.nombre}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            ({desglose.persona.tipoRelacion === 'Familiar'
                              ? desglose.persona.parentesco
                              : 'Tercero / Socio'})
                          </span>

                          {estaExcluidoIndignidad && (
                            <span className="text-[10px] bg-rose-100 text-rose-800 border border-rose-200 px-1.5 py-0.2 rounded font-semibold">
                              Indignidad (Art. 1025)
                            </span>
                          )}
                          {estaDesheredado && (
                            <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded font-semibold">
                              Desheredado (Arts. 1265-1281)
                            </span>
                          )}
                        </div>

                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {estaExcluidoIndignidad ? (
                            <span className="text-rose-700">
                              Excluido legalmente del reparto: Su cuota se redistribuyó proporcionalmente entre los demás legitimarios/herederos.
                            </span>
                          ) : estaDesheredado && desglose.porcentajeDelTotal === 0 ? (
                            <span className="text-amber-700">
                              Excluido de la legítima rigurosa por desheredamiento testamentario.
                            </span>
                          ) : (
                            desglose.leyesAplicadas
                              .map((la) => `${la.leyNombre} (${la.porcentaje.toFixed(1)}%)`)
                              .join(' + ') || 'Sin leyes asignadas'
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`font-mono font-bold text-sm ${
                            estaExcluidoIndignidad ? 'text-slate-400' : 'text-slate-900'
                          }`}
                        >
                          {desglose.porcentajeDelTotal.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Alerta de bloqueo si el reparto no es válido o faltan personas */}
      {!esRepartoValido && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900 shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Validación requerida:</strong>{' '}
              {calculoActivo.hayRemanenteSinAsignar
                ? `Queda un remanente sin asignar de ${formatearMoneda(calculoActivo.remanenteSinAsignarCOP)}. Debe asignar el 100% de la masa para continuar.`
                : `Las Leyes de Reparto deben sumar exactamente 100% (actualmente suman ${sumaPorcentajesReparto.toFixed(1)}%).`}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onAplicarRegimenTestado}
              className="text-[11px] font-semibold bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 px-2.5 py-1 rounded-md transition shadow-2xs cursor-pointer"
            >
              Fijar Testado (50+50)
            </button>
            <button
              type="button"
              onClick={onAplicarRegimenIntestado}
              className="text-[11px] font-semibold bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 px-2.5 py-1 rounded-md transition shadow-2xs cursor-pointer"
            >
              Fijar Intestado (100)
            </button>
          </div>
        </div>
      )}

      {personas.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center gap-2 text-xs text-amber-900 shadow-2xs">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Debe registrar al menos a una persona para continuar hacia la liquidación de costos y resultado final.
          </span>
        </div>
      )}

      {/* BOTONES DE NAVEGACIÓN */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onAnterior}
          className="inline-flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-lg border border-slate-300 transition shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Atrás: Bienes</span>
        </button>

        <button
          type="button"
          onClick={onSiguiente}
          disabled={!puedeAvanzar}
          className={`inline-flex items-center gap-2 text-xs font-semibold px-5 py-2.5 rounded-lg transition shadow-xs cursor-pointer ${
            puedeAvanzar
              ? 'bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white'
              : 'bg-slate-300 text-slate-500 cursor-not-allowed'
          }`}
          title={
            !puedeAvanzar
              ? 'Debe registrar al menos una persona y las leyes deben sumar 100%'
              : 'Avanzar a Costos y Resultado Final'
          }
        >
          <span>Siguiente: Costos y Resultado Final</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
