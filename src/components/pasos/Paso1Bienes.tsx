import React, { useState } from 'react';
import { ProcesoParticion, Bien } from '../../types';
import { formatearMoneda } from '../../utils/calculator';
import { InputPorcentaje } from '../InputPorcentaje';
import {
  Building2,
  Plus,
  Trash2,
  FileText,
  Scale,
  Scroll,
  Briefcase,
  AlertCircle,
  ArrowRight,
  Info,
  Layers,
} from 'lucide-react';

interface Paso1BienesProps {
  proceso: ProcesoParticion;
  onActualizarInfoGeneral: (
    nombreCaso: string,
    tipoProceso: string,
    regimen: 'testado' | 'intestado',
    tieneCapitulaciones?: boolean,
    porcentajeGanancialesCapitulaciones?: number
  ) => void;
  onAgregarBien: (nombre: string, valorCOP: number) => void;
  onEliminarBien: (id: string) => void;
  onSiguiente: () => void;
}

const TIPOS_PROCESO_FRECUENTES = [
  'Sucesión por Causa de Muerte (Notarial)',
  'Sucesión por Causa de Muerte (Judicial)',
  'Liquidación de Sociedad Conyugal y Sucesión',
  'Disolución y Liquidación Societaria (Arts. 218-259 C.Co.)',
  'Partición Patrimonial en Vida (Art. 487 CGP)',
  'Partición Voluntaria Extrajudicial',
  'División de Copropiedad / Comunidad (Art. 1374 C.C.)',
];

export const Paso1Bienes: React.FC<Paso1BienesProps> = ({
  proceso,
  onActualizarInfoGeneral,
  onAgregarBien,
  onEliminarBien,
  onSiguiente,
}) => {
  const [nombreCaso, setNombreCaso] = useState(proceso.nombreCaso);
  const [tipoProceso, setTipoProceso] = useState(proceso.tipoProceso);
  const [tieneCapitulaciones, setTieneCapitulaciones] = useState(
    proceso.tieneCapitulaciones ?? false
  );
  const [porcentajeCapitulaciones, setPorcentajeCapitulaciones] = useState<number>(
    proceso.porcentajeGanancialesCapitulaciones ?? 50
  );

  // Determinar régimen actual (por defecto testado si no está especificado)
  const regimenActual: 'testado' | 'intestado' =
    proceso.regimenSucesoral ||
    (proceso.leyes.some(
      (l) => l.activa && (l.id === 'ley-3' || l.nombre.toLowerCase().includes('orden sucesoral'))
    )
      ? 'intestado'
      : 'testado');

  // Formulario nuevo bien/empresa
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoValor, setNuevoValor] = useState('');
  const [categoriaSugerida, setCategoriaSugerida] = useState('Inmueble');
  const [errorBien, setErrorBien] = useState<string | null>(null);

  const totalPatrimonioBruto = proceso.bienes.reduce(
    (acc, b) => acc + (Number(b.valor) || 0),
    0
  );

  const handleGuardarDatosGenerales = (
    nuevoNombreCaso = nombreCaso,
    nuevoTipo = tipoProceso,
    nuevoRegimen = regimenActual,
    nuevasCapitulaciones = tieneCapitulaciones,
    nuevoPorcentajeCap = porcentajeCapitulaciones
  ) => {
    onActualizarInfoGeneral(
      nuevoNombreCaso,
      nuevoTipo,
      nuevoRegimen,
      nuevasCapitulaciones,
      nuevoPorcentajeCap
    );
  };

  const handleCambiarRegimen = (nuevoRegimen: 'testado' | 'intestado') => {
    handleGuardarDatosGenerales(nombreCaso, tipoProceso, nuevoRegimen);
  };

  const handleToggleCapitulaciones = (checked: boolean) => {
    setTieneCapitulaciones(checked);
    handleGuardarDatosGenerales(
      nombreCaso,
      tipoProceso,
      regimenActual,
      checked,
      porcentajeCapitulaciones
    );
  };

  const handleCambiarPorcentajeCapitulaciones = (pct: number) => {
    const seguroPct = isNaN(pct) ? 0 : Math.max(0, Math.min(100, pct));
    setPorcentajeCapitulaciones(seguroPct);
    handleGuardarDatosGenerales(
      nombreCaso,
      tipoProceso,
      regimenActual,
      tieneCapitulaciones,
      seguroPct
    );
  };

  const handleAgregarBienSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNombre = nuevoNombre.trim();
    const valorNumerico = parseFloat(nuevoValor.replace(/\./g, '').replace(/,/g, '.'));

    if (!cleanNombre) {
      setErrorBien('Especifique el nombre o razón social del bien o empresa');
      return;
    }

    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      setErrorBien('Ingrese un valor comercial o catastral válido en COP mayor a 0');
      return;
    }

    const nombreCompleto =
      categoriaSugerida && categoriaSugerida !== 'Otro' && !cleanNombre.toLowerCase().includes(categoriaSugerida.toLowerCase())
        ? `${categoriaSugerida}: ${cleanNombre}`
        : cleanNombre;

    onAgregarBien(nombreCompleto, valorNumerico);
    setNuevoNombre('');
    setNuevoValor('');
    setErrorBien(null);
  };

  return (
    <div className="flex flex-col gap-5 max-w-4xl mx-auto w-full">
      {/* 1. INFORMACIÓN GENERAL DEL CASO */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
          <FileText className="w-4 h-4 text-slate-800" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            1. Información General del Caso
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Nombre del caso */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nombre del Caso / Expediente
            </label>
            <input
              type="text"
              value={nombreCaso}
              onChange={(e) => {
                setNombreCaso(e.target.value);
                handleGuardarDatosGenerales(e.target.value, tipoProceso, regimenActual);
              }}
              placeholder="Ej: Sucesión Familia Gómez Restrepo"
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-slate-800"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Identificador del expediente procesal o notarial.
            </span>
          </div>

          {/* Tipo de proceso */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tipo de Proceso
            </label>
            <input
              type="text"
              list="tipos-proceso-list"
              value={tipoProceso}
              onChange={(e) => {
                setTipoProceso(e.target.value);
                handleGuardarDatosGenerales(nombreCaso, e.target.value, regimenActual);
              }}
              placeholder="Seleccione o escriba el trámite"
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-slate-800"
            />
            <datalist id="tipos-proceso-list">
              {TIPOS_PROCESO_FRECUENTES.map((tipo) => (
                <option key={tipo} value={tipo} />
              ))}
            </datalist>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Vía procesal aplicable para la partición.
            </span>
          </div>
        </div>

        {/* RÉGIMEN SUCESORAL: TESTADO O INTESTADO */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            Régimen Sucesoral Aplicable
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Opción 1: Testado */}
            <div
              onClick={() => handleCambiarRegimen('testado')}
              className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                regimenActual === 'testado'
                  ? 'border-slate-900 bg-slate-50/70 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300 opacity-80'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Scroll className="w-3.5 h-3.5 text-slate-800" />
                    Sucesión Testada (Con Testamento)
                  </span>
                  {regimenActual === 'testado' && (
                    <span className="text-[10px] bg-slate-900 text-white font-semibold px-2 py-0.5 rounded">
                      Activo
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Aplica la <strong>Ley 1934 de 2018</strong>: 50% para Legítima Rigurosa (cuota forzosa a legitimarios) y 50% de Libre Disposición para herederos o terceros asignados.
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-200 text-[10px] font-mono text-slate-600 flex items-center justify-between">
                <span>Partición bipartita:</span>
                <span className="font-bold text-slate-800">50% + 50% = 100%</span>
              </div>
            </div>

            {/* Opción 2: Intestado */}
            <div
              onClick={() => handleCambiarRegimen('intestado')}
              className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                regimenActual === 'intestado'
                  ? 'border-slate-900 bg-slate-50/70 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300 opacity-80'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-slate-800" />
                    Sucesión Intestada (Sin Testamento)
                  </span>
                  {regimenActual === 'intestado' && (
                    <span className="text-[10px] bg-slate-900 text-white font-semibold px-2 py-0.5 rounded">
                      Activo
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Aplica las reglas del <strong>Código Civil Colombiano</strong>: 100% adjudicado al orden sucesoral legal que corresponda según las personas registradas (Hijos, Padres, Cónyuge, Hermanos).
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-200 text-[10px] font-mono text-slate-600 flex items-center justify-between">
                <span>Orden legal automático:</span>
                <span className="font-bold text-slate-800">100% de la masa</span>
              </div>
            </div>
          </div>
        </div>

        {/* CAPITULACIONES MATRIMONIALES (ART. 1771 CÓDIGO CIVIL) */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50/70 border border-slate-200 rounded-xl">
            <div className="flex items-start gap-2.5">
              <input
                id="check-capitulaciones"
                type="checkbox"
                checked={tieneCapitulaciones}
                onChange={(e) => handleToggleCapitulaciones(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded text-slate-900 border-slate-300 focus:ring-slate-800 cursor-pointer"
              />
              <div>
                <label
                  htmlFor="check-capitulaciones"
                  className="text-xs font-bold text-slate-900 cursor-pointer flex items-center gap-1.5"
                >
                  <Briefcase className="w-3.5 h-3.5 text-slate-700" />
                  Capitulaciones Matrimoniales (Artículo 1771 del Código Civil)
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5 max-w-xl leading-relaxed">
                  Marque si los cónyuges o compañeros celebraron escritura pública de capitulaciones modificando el haber o el reparto patrimonial legal. Al marcar esta opción, puede personalizar manualmente el porcentaje de gananciales acordado en lugar de usar el 50/50 por defecto del Artículo 1830.
                </p>
              </div>
            </div>

            {tieneCapitulaciones && (
              <div className="flex items-center gap-2 pl-6 sm:pl-0 shrink-0">
                <label className="text-[11px] font-semibold text-slate-700 whitespace-nowrap">
                  % Gananciales Acordado:
                </label>
                <div className="relative w-20">
                  <InputPorcentaje
                    id="capitulaciones-pct"
                    min={0}
                    max={100}
                    step="1"
                    value={porcentajeCapitulaciones}
                    onChange={handleCambiarPorcentajeCapitulaciones}
                    valorPorDefectoEnBlur={50}
                    className="w-full bg-white border border-slate-300 rounded-lg pl-2 pr-6 py-1 text-xs font-mono font-bold text-slate-900 text-right focus:outline-none focus:border-slate-800"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono select-none">
                    %
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. BIENES Y EMPRESAS DEL CASO */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-800" />
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                2. Inventario de Bienes y Empresas ({proceso.bienes.length})
              </h3>
              <span className="text-[11px] text-slate-400">
                Inmuebles, empresas, vehículos, cuentas, sociedades o títulos valores
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">
              Patrimonio Bruto Total
            </span>
            <span className="text-base font-bold font-mono text-slate-900">
              {formatearMoneda(totalPatrimonioBruto)}
            </span>
          </div>
        </div>

        {/* Formulario de registro de bienes y empresas */}
        <div className="p-4 bg-slate-50/50 border-b border-slate-200">
          <form onSubmit={handleAgregarBienSubmit} className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500 mr-1">Tipo de Activo:</span>
              {['Inmueble', 'Empresa / Sociedad', 'Vehículo', 'Cuenta / Inversión', 'Otro'].map(
                (cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoriaSugerida(cat)}
                    className={`text-[11px] px-2.5 py-1 rounded-md border font-medium transition cursor-pointer ${
                      categoriaSugerida === cat
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cat}
                  </button>
                )
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-end gap-2.5">
              <div className="flex-1 w-full">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Descripción o Razón Social
                </label>
                <input
                  type="text"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  placeholder={`Ej: ${
                    categoriaSugerida === 'Empresa / Sociedad'
                      ? 'Inmobiliaria del Café SAS (100% de cuotas)'
                      : categoriaSugerida === 'Inmueble'
                      ? 'Casa Campestre Villeta Matrícula 50N-12345'
                      : 'Vehículo Toyota RAV4 Placa XYZ-123'
                  }`}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-slate-800"
                />
              </div>

              <div className="w-full sm:w-52">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Valoración Comercial (COP)
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono">
                    $
                  </span>
                  <input
                    type="number"
                    step="100000"
                    min="0"
                    value={nuevoValor}
                    onChange={(e) => setNuevoValor(e.target.value)}
                    placeholder="0"
                    className="w-full bg-white border border-slate-300 rounded-lg pl-6 pr-10 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-slate-800"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-mono">
                    COP
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-2xs cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Activo</span>
              </button>
            </div>

            {errorBien && (
              <div className="text-red-700 text-xs flex items-center gap-1.5 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorBien}</span>
              </div>
            )}
          </form>
        </div>

        {/* Lista de bienes inventariados */}
        {proceso.bienes.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center">
            <Layers className="w-8 h-8 text-slate-300 mb-2 stroke-1" />
            <span className="font-semibold text-slate-700">Sin activos registrados aún</span>
            <p className="text-slate-500 mt-1 max-w-sm">
              Agregue los inmuebles, empresas, vehículos o cuentas bancarias que componen el patrimonio bruto del causante.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {proceso.bienes.map((bien, index) => (
              <div
                key={bien.id}
                className="p-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="text-xs font-mono text-slate-400 w-6 text-right shrink-0">
                    {index + 1}.
                  </span>
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-slate-900 block truncate">
                      {bien.nombre}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Activo inventariado del proceso
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-xs font-mono font-bold text-slate-900">
                    {formatearMoneda(bien.valor)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onEliminarBien(bien.id)}
                    className="text-slate-400 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50 transition cursor-pointer"
                    title="Eliminar activo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Totalizador inferior */}
        {proceso.bienes.length > 0 && (
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">
              Total Patrimonio Inventariado ({proceso.bienes.length} bienes/empresas):
            </span>
            <span className="font-mono font-bold text-sm text-slate-900">
              {formatearMoneda(totalPatrimonioBruto)}
            </span>
          </div>
        )}
      </div>

      {/* BOTÓN PARA AVANZAR A PASO 2 */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={onSiguiente}
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-xs font-semibold px-5 py-2.5 rounded-lg transition shadow-xs cursor-pointer"
        >
          <span>Siguiente: Personas y Leyes</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
