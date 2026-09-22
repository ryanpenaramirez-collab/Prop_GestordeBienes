import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, BookOpen, AlertCircle, Check, Search, X } from 'lucide-react';
import { Ley, DestinatarioLey } from '../types';
import { InputPorcentaje } from './InputPorcentaje';

interface ConfigLeyesProps {
  leyes: Ley[];
  onGuardarLeyes: (leyes: Ley[]) => void;
  onVolver: () => void;
}

export const ConfigLeyes: React.FC<ConfigLeyesProps> = ({
  leyes: initialLeyes,
  onGuardarLeyes,
  onVolver,
}) => {
  const [leyesGuardadas, setLeyesGuardadas] = useState<Ley[]>(initialLeyes);
  const [listaLeyes, setListaLeyes] = useState<Ley[]>(initialLeyes);
  const [nombre, setNombre] = useState('');
  const [porcentaje, setPorcentaje] = useState('');
  const [aplicaA, setAplicaA] = useState<DestinatarioLey>('Todas');
  const [descripcion, setDescripcion] = useState('');
  const [errorInput, setErrorInput] = useState<string | null>(null);
  const [guardadoFeedback, setGuardadoFeedback] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  // Comparación profunda para detectar cambios pendientes
  const sonLeyesIdenticas = (a: Ley[], b: Ley[]): boolean => {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      const la = a[i];
      const lb = b[i];
      if (
        la.id !== lb.id ||
        la.nombre !== lb.nombre ||
        Number(la.porcentaje) !== Number(lb.porcentaje) ||
        la.aplicaA !== lb.aplicaA ||
        la.activa !== lb.activa ||
        (la.descripcion || '') !== (lb.descripcion || '')
      ) {
        return false;
      }
    }
    return true;
  };

  const hayCambiosPendientes = !sonLeyesIdenticas(listaLeyes, leyesGuardadas);

  // Sincronizar con props si no hay modificaciones pendientes
  useEffect(() => {
    if (!hayCambiosPendientes && !sonLeyesIdenticas(initialLeyes, leyesGuardadas)) {
      setListaLeyes(initialLeyes);
      setLeyesGuardadas(initialLeyes);
    }
  }, [initialLeyes, leyesGuardadas, hayCambiosPendientes]);

  // Normalización para búsqueda insensible a mayúsculas y acentos/tildes
  const normalizar = (texto: string) =>
    texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

  // Algoritmo de filtrado en tiempo real
  const coincideLey = (ley: Ley, termino: string): boolean => {
    const q = normalizar(termino);
    if (!q) return true;

    const nombreNorm = normalizar(ley.nombre);
    const descNorm = normalizar(ley.descripcion || '');
    const aplicaANorm = normalizar(ley.aplicaA);
    const idNorm = normalizar(ley.id);

    // 1. Coincidencia directa en texto del nombre, descripción o destinatario
    if (
      nombreNorm.includes(q) ||
      descNorm.includes(q) ||
      aplicaANorm.includes(q) ||
      idNorm.includes(q)
    ) {
      return true;
    }

    // 2. Coincidencia por primera letra o inicio de cualquiera de las palabras (ej. "legít" -> "Legítima Rigurosa")
    const palabras = nombreNorm.split(/[\s,()./+-]+/);
    if (palabras.some((p) => p.startsWith(q))) {
      return true;
    }

    // 3. Coincidencia por número o código legal relevante (ej. "1045" -> Orden Sucesoral)
    if (
      (q === '1045' || q.includes('1045')) &&
      (ley.id === 'ley-3' || nombreNorm.includes('orden sucesoral') || nombreNorm.includes('intestad'))
    ) {
      return true;
    }
    if (
      (q === '1934' || q.includes('1934')) &&
      (ley.id === 'ley-1' || ley.id === 'ley-2' || nombreNorm.includes('legitima') || nombreNorm.includes('libre'))
    ) {
      return true;
    }
    if (
      (q === '1025' || q.includes('1025')) &&
      (ley.id === 'ley-indignidad' || nombreNorm.includes('indignidad'))
    ) {
      return true;
    }
    if (
      (q === '1265' || q.includes('1265')) &&
      (ley.id === 'ley-desheredamiento' || nombreNorm.includes('desheredamiento'))
    ) {
      return true;
    }
    if (
      (q === '1830' || q.includes('1830')) &&
      (ley.id === 'ley-4' || nombreNorm.includes('gananciales'))
    ) {
      return true;
    }
    if (
      (q === '1771' || q.includes('1771')) &&
      (ley.id === 'ley-capitulaciones' || nombreNorm.includes('capitulaciones'))
    ) {
      return true;
    }
    if (
      (q === '218' || q.includes('218')) &&
      (ley.id === 'ley-disolucion-sociedades' || nombreNorm.includes('sociedad') || nombreNorm.includes('disolucion'))
    ) {
      return true;
    }

    return false;
  };

  const leyesFiltradas = listaLeyes.filter((l) => coincideLey(l, busqueda));

  const handleAgregarLey = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNombre = nombre.trim();
    const parsedPct = parseFloat(porcentaje.replace(/,/g, '.'));

    if (!cleanNombre) {
      setErrorInput('Ingrese el nombre de la ley o disposición');
      return;
    }

    if (isNaN(parsedPct) || parsedPct <= 0 || parsedPct > 100) {
      setErrorInput('Ingrese un porcentaje válido entre 0.01 y 100%');
      return;
    }

    const nuevaLey: Ley = {
      id: `ley-gen-${Date.now()}`,
      nombre: cleanNombre,
      porcentaje: parsedPct,
      aplicaA,
      activa: true,
      descripcion: descripcion.trim() || undefined,
    };

    const actualizada = [...listaLeyes, nuevaLey];
    setListaLeyes(actualizada);

    setNombre('');
    setPorcentaje('');
    setDescripcion('');
    setErrorInput(null);
  };

  const handleEliminarLey = (id: string) => {
    const actualizada = listaLeyes.filter((l) => l.id !== id);
    setListaLeyes(actualizada);
  };

  const handleModificarPorcentaje = (id: string, nuevoPct: number) => {
    const actualizada = listaLeyes.map((l) =>
      l.id === id ? { ...l, porcentaje: nuevoPct } : l
    );
    setListaLeyes(actualizada);
  };

  const handleAplicarLeyes = () => {
    if (!hayCambiosPendientes) return;
    onGuardarLeyes(listaLeyes);
    setLeyesGuardadas(listaLeyes);
    mostrarFeedback();
  };

  const handleDescartarCambios = () => {
    setListaLeyes(leyesGuardadas);
    setErrorInput(null);
  };

  const mostrarFeedback = () => {
    setGuardadoFeedback(true);
    setTimeout(() => setGuardadoFeedback(false), 2500);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100 w-full">
      {/* Encabezado */}
      <div className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shrink-0 shadow-2xs w-full">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onVolver}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver</span>
          </button>
          <div className="h-4 w-px bg-slate-300 mx-1" />
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-slate-800" />
            Configuración General de Leyes
          </h2>
        </div>

        {guardadoFeedback && (
          <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 flex items-center gap-1 animate-fadeIn">
            <Check className="w-3.5 h-3.5" />
            Cambios aplicados y guardados
          </span>
        )}
      </div>

      {/* Contenido que aprovecha todo el ancho disponible sin scroll de página */}
      <div className="flex-1 min-h-0 overflow-hidden px-6 py-3 w-full flex flex-col gap-3">
        {/* Formulario horizontal para agregar nueva ley general */}
        <div className="w-full bg-white rounded-xl border border-slate-200 p-3.5 sm:p-4 shadow-xs shrink-0">
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-slate-600" />
              Agregar Nueva Ley al Catálogo General
            </h3>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Se agregará a su borrador y se consolidará al presionar Aplicar Leyes
            </span>
          </div>

          <form onSubmit={handleAgregarLey} className="flex flex-col gap-3">
            {/* Contenedor que crece horizontalmente en lugar de apilarse */}
            <div className="flex flex-wrap lg:flex-nowrap items-end gap-3 w-full">
              {/* Nombre de la ley */}
              <div className="flex-1 min-w-[220px]">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Nombre de la Ley o Norma Jurídica
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Cuarta de Libre Disposición"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition shadow-2xs"
                />
              </div>

              {/* Descripción o Sustento */}
              <div className="flex-1 min-w-[220px]">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Descripción o Sustento Legal (Opcional)
                </label>
                <input
                  type="text"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Ej: Artículo 1240 del Código Civil"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition shadow-2xs"
                />
              </div>

              {/* Porcentaje */}
              <div className="w-28 shrink-0">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Porcentaje (%)
                </label>
                <div className="relative">
                  <InputPorcentaje
                    id="nueva-ley-porcentaje"
                    value={porcentaje !== '' ? parseFloat(porcentaje) : undefined}
                    onChange={(val) => setPorcentaje(String(val))}
                    onChangeNullable={() => setPorcentaje('')}
                    allowEmpty={true}
                    min={0}
                    max={100}
                    placeholder="25.00"
                    className="w-full bg-white border border-slate-300 rounded-lg pl-3 pr-6 py-1.5 text-xs text-slate-800 font-mono placeholder-slate-400 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition shadow-2xs text-right font-bold"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono select-none">
                    %
                  </span>
                </div>
              </div>

              {/* Aplica a */}
              <div className="w-36 shrink-0">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Aplica a
                </label>
                <select
                  value={aplicaA}
                  onChange={(e) => setAplicaA(e.target.value as DestinatarioLey)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition cursor-pointer shadow-2xs"
                >
                  <option value="Todas">Todas</option>
                  <option value="Cónyuge">Cónyuge</option>
                  <option value="Hijo">Hijo</option>
                  <option value="Padre">Padre</option>
                  <option value="Hermano">Hermano</option>
                  <option value="Otro">Otro</option>
                  <option value="Amigo/Socio">Amigo/Socio</option>
                </select>
              </div>

              {/* Botón de Agregar */}
              <div className="shrink-0 w-full sm:w-auto">
                <button
                  type="submit"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors shadow-2xs cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar al Catálogo</span>
                </button>
              </div>
            </div>

            {errorInput && (
              <div className="text-red-700 text-xs flex items-center gap-1.5 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorInput}</span>
              </div>
            )}
          </form>
        </div>

        {/* Contenedor de Leyes Registradas expandido horizontalmente al borde derecho con scroll interno */}
        <div className="w-full bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col flex-1 min-h-0">
          {/* Encabezado fijo de la sección con buscador en tiempo real */}
          <div className="px-6 py-2.5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 sticky top-0 z-10 w-full">
            <div className="flex items-center gap-2.5">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Leyes Registradas
              </h3>
              <span className="text-[11px] font-mono font-semibold bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded-full">
                {busqueda.trim()
                  ? `${leyesFiltradas.length} de ${listaLeyes.length}`
                  : listaLeyes.length}
              </span>
              <span className="text-[11px] text-slate-400 hidden md:inline">
                Edite los porcentajes directamente o agregue nuevas normas
              </span>
            </div>

            {/* Campo de búsqueda espacioso con ícono de lupa */}
            <div className="relative w-full sm:w-80 md:w-96">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar ley (ej. legít, 1045, 1934)..."
                className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-7 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition shadow-2xs"
              />
              {busqueda && (
                <button
                  type="button"
                  onClick={() => setBusqueda('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full cursor-pointer"
                  title="Limpiar búsqueda"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Contenedor de scroll interno para navegar las leyes expandido horizontalmente */}
          <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100 overscroll-contain w-full">
            {leyesFiltradas.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2 h-full">
                <Search className="w-7 h-7 text-slate-300 stroke-[1.5]" />
                <p className="font-semibold text-slate-700">
                  No se encontraron leyes con &ldquo;{busqueda}&rdquo;
                </p>
                <p className="text-[11px] text-slate-400 max-w-sm">
                  Intente buscar por otra palabra clave, nombre o número de norma (ej. legít, 1045, 1934, 1025).
                </p>
                <button
                  type="button"
                  onClick={() => setBusqueda('')}
                  className="mt-1 text-xs text-slate-900 font-semibold underline cursor-pointer hover:text-blue-700"
                >
                  Ver todas las leyes
                </button>
              </div>
            ) : (
              leyesFiltradas.map((ley, idx) => (
                <div
                  key={ley.id}
                  className="px-6 py-3.5 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs w-full"
                >
                  {/* Contenido descriptivo que crece horizontalmente */}
                  <div className="flex-1 min-w-0 flex items-start md:items-center gap-3">
                    <span className="text-slate-400 font-mono text-[11px] w-6 text-right shrink-0 mt-0.5 md:mt-0">
                      {idx + 1}.
                    </span>
                    <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
                      <span className="font-semibold text-slate-900 text-xs shrink-0">
                        {ley.nombre}
                      </span>
                      <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium shrink-0 border border-slate-200/60 inline-block self-start md:self-auto">
                        Aplica a: {ley.aplicaA}
                      </span>
                      {ley.descripcion && (
                        <p className="text-[11px] text-slate-500 truncate flex-1 min-w-0">
                          {ley.descripcion}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Controles de porcentaje y eliminación alineados */}
                  <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
                    <div className="flex items-center gap-1.5">
                      <label className="text-[11px] text-slate-500 font-medium">
                        % Base:
                      </label>
                      <div className="relative w-24">
                        <InputPorcentaje
                          id={`ley-pct-${ley.id}`}
                          value={ley.porcentaje}
                          onChange={(val) => handleModificarPorcentaje(ley.id, val)}
                          min={0}
                          max={100}
                          step="0.01"
                          valorPorDefectoEnBlur={0}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-900 font-mono font-bold text-right pr-6 focus:outline-none focus:border-slate-800"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono select-none">
                          %
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleEliminarLey(ley.id)}
                      className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                      title="Eliminar del catálogo general"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Barra inferior fija siempre visible sin importar el scroll */}
      <div className="bg-white border-t border-slate-200 px-6 py-3.5 shrink-0 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 z-20 w-full">
        <div className="flex items-center gap-2">
          {hayCambiosPendientes ? (
            <div className="flex items-center gap-2 text-xs text-amber-800 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
              <span>Hay modificaciones pendientes en el catálogo de leyes sin aplicar</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-slate-500 px-2 py-1">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Catálogo actualizado • Sin cambios pendientes</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {hayCambiosPendientes && (
            <button
              type="button"
              onClick={handleDescartarCambios}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Descartar Cambios
            </button>
          )}

          <button
            type="button"
            disabled={!hayCambiosPendientes}
            onClick={handleAplicarLeyes}
            className={`inline-flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-xs font-bold transition-all ${
              hayCambiosPendientes
                ? 'bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white cursor-pointer shadow-sm hover:shadow'
                : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed shadow-none'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>Aplicar Leyes</span>
          </button>
        </div>
      </div>
    </div>
  );
};

