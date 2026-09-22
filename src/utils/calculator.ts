import {
  Persona,
  Bien,
  Ley,
  HonorariosConfig,
  ResultadoParticion,
  DesglosePersona,
  DeduccionHonorarios,
  OrdenSucesoralInfo,
  DesgloseLeyCalculada,
  RemanenteIncompletoInfo,
  ViaProceso,
  MovimientoAgenciasDerecho,
} from '../types';

/**
 * Formatea valores en Pesos Colombianos (COP)
 * Ejemplo: $ 450.000.000 COP
 */
export function formatearMoneda(monto: number): string {
  const valor = Math.round(Number(monto) || 0);
  const formateado = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(valor);

  return `${formateado} COP`;
}

/**
 * Formatea números con separador de miles
 */
export function formatearNumero(monto: number): string {
  const valor = Math.round(Number(monto) || 0);
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(valor);
}

/**
 * Determina automáticamente qué orden sucesoral intestado aplica según las personas registradas,
 * excluyendo a quienes hayan sido declarados indignos conforme al Art. 1025 C.C.
 */
export function determinarOrdenSucesoral(personas: Persona[]): OrdenSucesoralInfo {
  // Excluir a personas declaradas indignas del cómputo del orden sucesoral
  const personasHabiles = personas.filter((p) => !p.declaradoIndigno);

  const hijos = personasHabiles.filter((p) => p.tipoRelacion === 'Familiar' && p.parentesco === 'Hijo');
  const padres = personasHabiles.filter((p) => p.tipoRelacion === 'Familiar' && p.parentesco === 'Padre');
  const conyuge = personasHabiles.filter((p) => p.tipoRelacion === 'Familiar' && p.parentesco === 'Cónyuge');
  const hermanos = personasHabiles.filter((p) => p.tipoRelacion === 'Familiar' && p.parentesco === 'Hermano');

  // Primer orden: Cuando existen hijos
  if (hijos.length > 0) {
    return {
      tipo: 'primer_orden',
      titulo: '1° Orden Sucesoral: Hijos (Descendientes)',
      regla:
        '100% de la masa a los hijos por partes iguales. El cónyuge no hereda en este orden (recibe gananciales previos si aplica, Art. 1830 C.C.).',
    };
  }

  // Segundo orden: Cuando no hay hijos, pero hay padres
  if (padres.length > 0) {
    return {
      tipo: 'segundo_orden',
      titulo: '2° Orden Sucesoral: Padres y Cónyuge',
      regla:
        'Masa dividida en partes iguales por cabezas entre ascendientes (padres) y cónyuge supérstite.',
    };
  }

  // Tercer orden: Cuando no hay hijos ni padres
  if (conyuge.length > 0 || hermanos.length > 0) {
    return {
      tipo: 'tercer_orden',
      titulo: '3° Orden Sucesoral: Cónyuge y Hermanos',
      regla:
        'Cónyuge recibe 50% fijo; el otro 50% se divide entre hermanos en partes iguales.',
    };
  }

  return {
    tipo: 'mixto_o_personalizado',
    titulo: 'Orden No Definido',
    regla: 'Registre herederos con su parentesco para determinar el orden sucesoral.',
  };
}

/**
 * Determina si una persona coincide con el alcance subjetivo de una ley
 */
export function personaCoincideConLey(persona: Persona, aplicaA: string): boolean {
  if (aplicaA === 'Todas') {
    return true;
  }
  if (persona.tipoRelacion === 'Amigo/Socio' && (aplicaA === 'Amigo/Socio' || aplicaA === 'Todas')) {
    return true;
  }
  if (persona.tipoRelacion === 'Familiar' && persona.parentesco === aplicaA) {
    return true;
  }
  return false;
}

export interface ProcesoContextoOpcional {
  tipoProceso?: string;
  regimenSucesoral?: 'testado' | 'intestado';
  tieneCapitulaciones?: boolean;
  porcentajeGanancialesCapitulaciones?: number;
  calcularGananciaOcasional?: boolean;
  tarifaGananciaOcasionalPct?: number;
}

/**
 * Realiza el cálculo patrimonial en COP con deducciones (abogado y agencias en derecho),
 * aplicación de régimen testado (Ley 1934/2018), orden intestado automático (C.C.),
 * disolución societaria (C.Co.), capitulaciones matrimoniales (Art. 1771 C.C.),
 * exclusión por indignidad (Art. 1025 C.C.) o desheredamiento (Arts. 1265-1281 C.C.),
 * y cálculo informativo de ganancia ocasional (Arts. 302-306 E.T.).
 */
export function calcularParticion(
  personas: Persona[],
  bienes: Bien[],
  leyes: Ley[],
  honorarios: HonorariosConfig = {
    viaProceso: 'judicial',
    abogadoPorcentaje: 10,
    agenciasDerechoPorcentaje: 15,
    modalidad: 'porcentaje',
    estadoAgencias: 'estimado',
  },
  contexto?: ProcesoContextoOpcional
): ResultadoParticion {
  const viaProceso: ViaProceso = honorarios.viaProceso ?? 'judicial';

  // 1. Patrimonio Bruto Inventariado
  const patrimonioBrutoCOP = bienes.reduce((acc, b) => acc + (Number(b.valor) || 0), 0);

  // 2. Deducciones:
  // - Honorarios de Abogado: Aplican siempre y se deducen del patrimonio bruto total.
  // - Agencias en Derecho: Aplican ÚNICAMENTE en vía Judicial (litigio).
  //   NO se descuentan del patrimonio total a repartir; se tratan como un movimiento adicional
  //   entre las dos partes específicas seleccionadas (quien paga y quien recibe).
  let abogadoCOP = 0;
  if (honorarios.modalidad === 'fijo') {
    abogadoCOP = Number(honorarios.abogadoFijoCOP) || 0;
  } else {
    abogadoCOP = patrimonioBrutoCOP * ((Number(honorarios.abogadoPorcentaje) || 0) / 100);
  }

  let agenciasDerechoCOP = 0;
  let agenciasDerechoPorcentaje = 0;
  let agenciasFueraDeRango = false;

  const pctAgencias =
    honorarios.agenciasDerechoPorcentaje ?? honorarios.juezCostasPorcentaje ?? 15;

  if (viaProceso === 'judicial') {
    if (honorarios.modalidad === 'fijo') {
      agenciasDerechoCOP =
        Number(honorarios.agenciasDerechoFijoCOP ?? honorarios.juezCostasFijoCOP) || 0;
      agenciasDerechoPorcentaje =
        patrimonioBrutoCOP > 0 ? (agenciasDerechoCOP / patrimonioBrutoCOP) * 100 : pctAgencias;
    } else {
      agenciasDerechoPorcentaje = pctAgencias;
      agenciasDerechoCOP = patrimonioBrutoCOP * (pctAgencias / 100);
    }
    agenciasFueraDeRango =
      agenciasDerechoPorcentaje < 10 || agenciasDerechoPorcentaje > 20;
  }

  // ÚNICAMENTE los honorarios de abogado se deducen del patrimonio total a repartir entre las personas
  const totalDeduccionesCOP = abogadoCOP;
  const porcentajeCostosProceso =
    patrimonioBrutoCOP > 0
      ? (abogadoCOP / patrimonioBrutoCOP) * 100
      : Number(honorarios.abogadoPorcentaje) || 0;

  const patrimonioNetoPartibleCOP = Math.max(0, patrimonioBrutoCOP - totalDeduccionesCOP);

  // Resolver partes involucradas en Agencias en Derecho (Vía Judicial)
  const idsPaganSet = new Set<string>();
  if (Array.isArray(honorarios.quienesPaganIds) && honorarios.quienesPaganIds.length > 0) {
    honorarios.quienesPaganIds.forEach((id) => idsPaganSet.add(id));
  } else if (honorarios.quienPagaId) {
    idsPaganSet.add(honorarios.quienPagaId);
  }

  const idsRecibenSet = new Set<string>();
  if (Array.isArray(honorarios.quienesRecibenIds) && honorarios.quienesRecibenIds.length > 0) {
    honorarios.quienesRecibenIds.forEach((id) => idsRecibenSet.add(id));
  } else if (honorarios.quienRecibeId) {
    idsRecibenSet.add(honorarios.quienRecibeId);
  }

  // Filtrar personas reales registradas en el caso
  const personasPagan = personas.filter((p) => idsPaganSet.has(p.id));
  const personasReciben = personas.filter((p) => idsRecibenSet.has(p.id));

  const nombresPagan = personasPagan.map((p) => p.nombre);
  const nombresReciben = personasReciben.map((p) => p.nombre);

  const quienPagaNombreFinal =
    nombresPagan.length > 0
      ? nombresPagan.join(', ')
      : honorarios.quienPagaNombre || (viaProceso === 'judicial' ? 'Parte Vencida' : '');

  const quienRecibeNombreFinal =
    nombresReciben.length > 0
      ? nombresReciben.join(', ')
      : honorarios.quienRecibeNombre || (viaProceso === 'judicial' ? 'Parte Vencedora' : '');

  const montoPorPagadorCOP =
    personasPagan.length > 0
      ? Math.round(agenciasDerechoCOP / personasPagan.length)
      : agenciasDerechoCOP;

  const montoPorReceptorCOP =
    personasReciben.length > 0
      ? Math.round(agenciasDerechoCOP / personasReciben.length)
      : agenciasDerechoCOP;

  const movimientoAgencias: MovimientoAgenciasDerecho = {
    aplica: viaProceso === 'judicial' && agenciasDerechoCOP > 0,
    viaProceso,
    montoCOP: agenciasDerechoCOP,
    porcentajeCalculado: agenciasDerechoPorcentaje,
    quienPagaId: personasPagan[0]?.id || honorarios.quienPagaId,
    quienPagaNombre: quienPagaNombreFinal,
    quienRecibeId: personasReciben[0]?.id || honorarios.quienRecibeId,
    quienRecibeNombre: quienRecibeNombreFinal,
    quienesPaganIds: Array.from(idsPaganSet),
    quienesPaganNombres: nombresPagan,
    montoPorPagadorCOP,
    quienesRecibenIds: Array.from(idsRecibenSet),
    quienesRecibenNombres: nombresReciben,
    montoPorReceptorCOP,
    estado: honorarios.estadoAgencias ?? 'estimado',
  };

  const deducciones: DeduccionHonorarios = {
    viaProceso,
    abogadoCOP,
    abogadoPorcentaje:
      patrimonioBrutoCOP > 0 ? (abogadoCOP / patrimonioBrutoCOP) * 100 : honorarios.abogadoPorcentaje,
    agenciasDerechoCOP,
    agenciasDerechoPorcentaje,
    juezCostasCOP: agenciasDerechoCOP,
    juezCostasPorcentaje: agenciasDerechoPorcentaje,
    totalDeduccionesCOP,
    totalCostosPorcentajeSobreBruto: porcentajeCostosProceso,
    agenciasFueraDeRango,
    movimientoAgencias,
  };

  // 3. Determinar el orden sucesoral aplicable según las personas
  const ordenSucesoral = determinarOrdenSucesoral(personas);

  // Mapa de bienes asignados
  const mapaBienesPorPersona = new Map<string, string[]>();
  for (const b of bienes) {
    if (b.asignadoAId) {
      const arr = mapaBienesPorPersona.get(b.asignadoAId) || [];
      arr.push(b.nombre);
      mapaBienesPorPersona.set(b.asignadoAId, arr);
    }
  }

  // 4. Inicializar desglose por persona
  const mapaPersonas = new Map<string, DesglosePersona>();
  for (const p of personas) {
    mapaPersonas.set(p.id, {
      persona: p,
      leyesAplicadas: [],
      totalAsignadoCOP: 0,
      porcentajeDelTotal: 0,
      bienesAsignadosNombres: mapaBienesPorPersona.get(p.id) || [],
      excluidoPorIndignidad: !!p.declaradoIndigno,
      excluidoPorDesheredamiento: !!p.desheredado,
      montoBrutoCOP: 0,
      impuestoGananciaOcasionalCOP: 0,
      montoNetoDespuesImpuestoCOP: 0,
    });
  }

  let montoAsignadoPorLeyesCOP = 0;

  // LEYES ACTIVAS
  const leyesActivas = leyes.filter((l) => l.activa);
  const porcentajeTotalLeyesReparto = leyesActivas
    .filter(
      (l) =>
        l.id !== 'ley-ganancia-ocasional' &&
        l.id !== 'ley-indignidad' &&
        l.id !== 'ley-desheredamiento'
    )
    .reduce((acc, l) => acc + (Number(l.porcentaje) || 0), 0);

  const repartoEsValido100 = Math.abs(porcentajeTotalLeyesReparto - 100) < 0.01;

  // Detección de regímenes
  const esProcesoSocietario =
    (contexto?.tipoProceso &&
      (contexto.tipoProceso.toLowerCase().includes('disolución') ||
        contexto.tipoProceso.toLowerCase().includes('societaria'))) ||
    leyesActivas.some(
      (l) => l.id === 'ley-disolucion-sociedades' || l.nombre.toLowerCase().includes('disolución')
    );

  const tieneReglaCopropiedad = leyesActivas.some(
    (l) => l.id === 'ley-copropiedad' || l.nombre.toLowerCase().includes('copropiedad')
  );

  const tieneReglaIntestadoActiva = leyesActivas.some(
    (l) => l.nombre.toLowerCase().includes('orden sucesoral') || l.id === 'ley-3'
  );

  const tieneReglaTestadaActiva = leyesActivas.some(
    (l) =>
      l.nombre.toLowerCase().includes('legítima') ||
      l.nombre.toLowerCase().includes('libre disposición') ||
      l.id === 'ley-1' ||
      l.id === 'ley-2'
  );

  let regimenDetectado: 'testado' | 'intestado' | 'disolucion_societaria' | 'copropiedad' | 'personalizado' =
    'personalizado';

  if (esProcesoSocietario) {
    regimenDetectado = 'disolucion_societaria';
  } else if (tieneReglaCopropiedad) {
    regimenDetectado = 'copropiedad';
  } else if (tieneReglaIntestadoActiva && !tieneReglaTestadaActiva) {
    regimenDetectado = 'intestado';
  } else if (tieneReglaTestadaActiva && !tieneReglaIntestadoActiva) {
    regimenDetectado = 'testado';
  }

  // Marcar anticipadamente notas para personas excluidas por Indignidad o Desheredamiento
  for (const p of personas) {
    const item = mapaPersonas.get(p.id);
    if (!item) continue;
    if (p.declaradoIndigno) {
      item.leyesAplicadas.push({
        leyNombre: 'Excluido por Indignidad Sucesoral (Art. 1025 C.C., Ley 1893/2018). Cuota acrecentada a demás coherederos.',
        porcentaje: 0,
        montoCOP: 0,
      });
    }
  }

  // 5. Motor de leyes y repartos patrimoniales
  let leyesCalculadas: DesgloseLeyCalculada[] = [];
  let remanentesIncompletos: RemanenteIncompletoInfo[] = [];

  if (esProcesoSocietario && personas.length > 0 && patrimonioNetoPartibleCOP > 0) {
    // ==========================================
    // RÉGIMEN: DISOLUCIÓN SOCIETARIA (Arts. 218-259 C.Co.)
    // ==========================================
    const sociosHabiles = personas.filter((p) => !p.declaradoIndigno);

    if (sociosHabiles.length > 0) {
      // Verificar si hay porcentajes de participación en estatutos definidos
      const sumaParticipaciones = sociosHabiles.reduce(
        (acc, s) => acc + (Number(s.porcentajeParticipacion) || 0),
        0
      );
      const usanParticipacion = sumaParticipaciones > 0;

      for (const socio of sociosHabiles) {
        const item = mapaPersonas.get(socio.id);
        if (!item) continue;

        const pct = usanParticipacion
          ? Number(socio.porcentajeParticipacion) || 0
          : 100 / sociosHabiles.length;

        const cuotaSocio = patrimonioNetoPartibleCOP * (pct / 100);

        item.leyesAplicadas.push({
          leyNombre: `Disolución y Liquidación Societaria (Arts. 218-259 C.Co. - Cuota estatutaria: ${pct}%)`,
          porcentaje: pct,
          montoCOP: cuotaSocio,
        });
        item.totalAsignadoCOP = cuotaSocio;
      }
      montoAsignadoPorLeyesCOP = patrimonioNetoPartibleCOP;
    }
  } else if (tieneReglaIntestadoActiva && !tieneReglaTestadaActiva && personas.length > 0 && patrimonioNetoPartibleCOP > 0) {
    // ==========================================
    // RÉGIMEN: INTESTADO (Órdenes Sucesorales C.C.)
    // Personas declaradas indignas (Art. 1025 C.C.) son excluidas y su cuota se redistribuye entre los coherederos hábiles
    // ==========================================
    const hijos = personas.filter((p) => p.tipoRelacion === 'Familiar' && p.parentesco === 'Hijo' && !p.declaradoIndigno);
    const padres = personas.filter((p) => p.tipoRelacion === 'Familiar' && p.parentesco === 'Padre' && !p.declaradoIndigno);
    const conyuge = personas.filter((p) => p.tipoRelacion === 'Familiar' && p.parentesco === 'Cónyuge' && !p.declaradoIndigno);
    const hermanos = personas.filter((p) => p.tipoRelacion === 'Familiar' && p.parentesco === 'Hermano' && !p.declaradoIndigno);

    // Revisar capitulaciones matrimoniales
    const tieneCapitulaciones = contexto?.tieneCapitulaciones || leyesActivas.some((l) => l.id === 'ley-capitulaciones');
    const pctGananciales = contexto?.porcentajeGanancialesCapitulaciones ?? 50;

    if (ordenSucesoral.tipo === 'primer_orden' && hijos.length > 0) {
      // 1° Orden: 100% a los hijos hábiles en partes iguales.
      const cuotaHijo = patrimonioNetoPartibleCOP / hijos.length;
      montoAsignadoPorLeyesCOP = patrimonioNetoPartibleCOP;

      for (const h of hijos) {
        const item = mapaPersonas.get(h.id);
        if (item) {
          item.leyesAplicadas.push({
            leyNombre: `1° Orden: Hijos (${(100 / hijos.length).toFixed(2)}% por cabeza)`,
            porcentaje: 100 / hijos.length,
            montoCOP: cuotaHijo,
          });
          item.totalAsignadoCOP = cuotaHijo;
        }
      }

      // Si hay cónyuge registrado en 1° orden, informar su situación legal
      for (const c of conyuge) {
        const item = mapaPersonas.get(c.id);
        if (item) {
          const detalleGananciales = tieneCapitulaciones
            ? `Cónyuge: Recibe gananciales según capitulaciones matrimoniales (${pctGananciales}%, Art. 1771 C.C.)`
            : 'Cónyuge: No hereda en 1° orden (recibe 50% de gananciales de la sociedad conyugal, Art. 1830 C.C.)';
          item.leyesAplicadas.push({
            leyNombre: detalleGananciales,
            porcentaje: 0,
            montoCOP: 0,
          });
        }
      }
    } else if (ordenSucesoral.tipo === 'segundo_orden' && (padres.length > 0 || conyuge.length > 0)) {
      // 2° Orden: Masa dividida en partes iguales por cabezas entre padres y cónyuge hábiles
      const cabezas = [...padres, ...conyuge];
      if (cabezas.length > 0) {
        const cuota = patrimonioNetoPartibleCOP / cabezas.length;
        montoAsignadoPorLeyesCOP = patrimonioNetoPartibleCOP;

        for (const cb of cabezas) {
          const item = mapaPersonas.get(cb.id);
          if (item) {
            item.leyesAplicadas.push({
              leyNombre: `2° Orden: Ascendientes y Cónyuge (${(100 / cabezas.length).toFixed(2)}% por cabezas)`,
              porcentaje: 100 / cabezas.length,
              montoCOP: cuota,
            });
            item.totalAsignadoCOP = cuota;
          }
        }
      }
    } else if (ordenSucesoral.tipo === 'tercer_orden') {
      // 3° Orden: Cónyuge 50% fijo y el otro 50% entre hermanos hábiles
      if (conyuge.length > 0 && hermanos.length > 0) {
        const mitad = patrimonioNetoPartibleCOP * 0.5;
        const cuotaHermano = mitad / hermanos.length;
        const cuotaConyuge = mitad / conyuge.length;
        montoAsignadoPorLeyesCOP = patrimonioNetoPartibleCOP;

        for (const c of conyuge) {
          const item = mapaPersonas.get(c.id);
          if (item) {
            item.leyesAplicadas.push({
              leyNombre: `3° Orden: Cónyuge supérstite (${(50 / conyuge.length).toFixed(2)}%)`,
              porcentaje: 50 / conyuge.length,
              montoCOP: cuotaConyuge,
            });
            item.totalAsignadoCOP = cuotaConyuge;
          }
        }

        for (const hm of hermanos) {
          const item = mapaPersonas.get(hm.id);
          if (item) {
            item.leyesAplicadas.push({
              leyNombre: `3° Orden: Hermanos (${(50 / hermanos.length).toFixed(2)}% partes iguales)`,
              porcentaje: 50 / hermanos.length,
              montoCOP: cuotaHermano,
            });
            item.totalAsignadoCOP = cuotaHermano;
          }
        }
      } else if (conyuge.length > 0 && hermanos.length === 0) {
        const cuota = patrimonioNetoPartibleCOP / conyuge.length;
        montoAsignadoPorLeyesCOP = patrimonioNetoPartibleCOP;
        for (const c of conyuge) {
          const item = mapaPersonas.get(c.id);
          if (item) {
            item.leyesAplicadas.push({
              leyNombre: '3° Orden: Cónyuge único supérstite (100%)',
              porcentaje: 100 / conyuge.length,
              montoCOP: cuota,
            });
            item.totalAsignadoCOP = cuota;
          }
        }
      } else if (hermanos.length > 0 && conyuge.length === 0) {
        const cuota = patrimonioNetoPartibleCOP / hermanos.length;
        montoAsignadoPorLeyesCOP = patrimonioNetoPartibleCOP;
        for (const hm of hermanos) {
          const item = mapaPersonas.get(hm.id);
          if (item) {
            item.leyesAplicadas.push({
              leyNombre: `3° Orden: Hermanos (${(100 / hermanos.length).toFixed(2)}% partes iguales)`,
              porcentaje: 100 / hermanos.length,
              montoCOP: cuota,
            });
            item.totalAsignadoCOP = cuota;
          }
        }
      }
    }
  } else {
    // ==========================================
    // RÉGIMEN TESTADO (Ley 1934/2018) O LEYES CONFIGURADAS (CON SOPORTE DE REMANENTES EN CASCADA)
    // ==========================================
    const leyesReparto = tieneReglaTestadaActiva
      ? leyesActivas.filter(
          (l) =>
            !l.nombre.toLowerCase().includes('orden sucesoral') &&
            l.id !== 'ley-3' &&
            l.id !== 'ley-disolucion-sociedades' &&
            l.id !== 'ley-ganancia-ocasional' &&
            l.id !== 'ley-indignidad' &&
            l.id !== 'ley-desheredamiento'
        )
      : leyesActivas.filter(
          (l) =>
            l.id !== 'ley-ganancia-ocasional' &&
            l.id !== 'ley-indignidad' &&
            l.id !== 'ley-desheredamiento'
        );

    // Mapa de leyes para resolución en orden topológico (padres antes que hijos)
    const leyesRepartoMap = new Map(leyesReparto.map((l) => [l.id, l]));
    const mapaLeyesCalculadas = new Map<string, DesgloseLeyCalculada>();

    function resolverLey(leyId: string, ruta = new Set<string>()): DesgloseLeyCalculada | null {
      if (mapaLeyesCalculadas.has(leyId)) {
        return mapaLeyesCalculadas.get(leyId)!;
      }
      const ley = leyesRepartoMap.get(leyId);
      if (!ley) return null;

      if (ruta.has(leyId)) {
        // Romper ciclo si existe
        console.warn(`Ciclo detectado en ley ${ley.id}`);
      } else {
        ruta.add(leyId);
      }

      let pct = Math.max(0, Number(ley.porcentaje) || 0);
      if (
        (ley.id === 'ley-capitulaciones' || ley.id === 'ley-4') &&
        contexto?.tieneCapitulaciones &&
        contexto.porcentajeGanancialesCapitulaciones !== undefined
      ) {
        pct = contexto.porcentajeGanancialesCapitulaciones;
      }

      const quiereRemanente =
        ley.baseCalculo === 'remanente_de_ley' &&
        !!ley.leyPadreId &&
        ley.leyPadreId !== ley.id &&
        !ruta.has(ley.leyPadreId);

      let baseDineroCOP = patrimonioNetoPartibleCOP;
      let padreNombre: string | undefined = undefined;

      if (quiereRemanente && ley.leyPadreId) {
        const calcPadre = resolverLey(ley.leyPadreId, new Set(ruta));
        if (calcPadre) {
          baseDineroCOP = calcPadre.remanentePosteriorCOP;
          padreNombre = calcPadre.nombre;
        }
      }

      const montoCalculadoCOP = baseDineroCOP * (pct / 100);
      const remanentePosteriorCOP = Math.max(0, baseDineroCOP - montoCalculadoCOP);
      const pctEquivalenteTotal =
        patrimonioNetoPartibleCOP > 0
          ? (montoCalculadoCOP / patrimonioNetoPartibleCOP) * 100
          : baseDineroCOP === patrimonioNetoPartibleCOP
          ? pct
          : 0;

      const desglose: DesgloseLeyCalculada = {
        id: ley.id,
        nombre: ley.nombre,
        porcentaje: pct,
        baseCalculo: quiereRemanente && padreNombre ? 'remanente_de_ley' : 'patrimonio_total',
        leyPadreId: quiereRemanente && padreNombre ? ley.leyPadreId : undefined,
        leyPadreNombre: padreNombre,
        baseDineroCOP,
        montoCalculadoCOP,
        remanentePosteriorCOP,
        porcentajeEquivalenteTotal: pctEquivalenteTotal,
        aplicaA: ley.aplicaA,
        descripcion: ley.descripcion,
      };

      mapaLeyesCalculadas.set(ley.id, desglose);
      return desglose;
    }

    for (const l of leyesReparto) {
      resolverLey(l.id);
    }

    leyesCalculadas = leyesReparto
      .map((l) => mapaLeyesCalculadas.get(l.id))
      .filter((dl): dl is DesgloseLeyCalculada => dl !== undefined);

    for (const dl of leyesCalculadas) {
      let beneficiarios: Persona[] = [];
      const esLegitima = dl.nombre.toLowerCase().includes('legítima');

      if (esLegitima) {
        const hijosValidos = personas.filter(
          (p) =>
            p.tipoRelacion === 'Familiar' &&
            p.parentesco === 'Hijo' &&
            !p.declaradoIndigno &&
            !p.desheredado
        );
        const padresValidos = personas.filter(
          (p) =>
            p.tipoRelacion === 'Familiar' &&
            p.parentesco === 'Padre' &&
            !p.declaradoIndigno &&
            !p.desheredado
        );

        if (hijosValidos.length > 0) {
          beneficiarios = hijosValidos;
        } else if (padresValidos.length > 0) {
          beneficiarios = padresValidos;
        } else {
          beneficiarios = personas.filter(
            (p) =>
              personaCoincideConLey(p, dl.aplicaA) && !p.declaradoIndigno && !p.desheredado
          );
        }

        // Registrar nota para personas desheredadas
        for (const p of personas) {
          if (p.desheredado && (p.parentesco === 'Hijo' || p.parentesco === 'Padre')) {
            const item = mapaPersonas.get(p.id);
            if (item && !item.leyesAplicadas.some((la) => la.leyNombre.includes('Desheredamiento'))) {
              item.leyesAplicadas.push({
                leyNombre:
                  'Excluido de la legítima por Desheredamiento testamentario formal (Arts. 1265-1281 C.C.). Cuota acrecentada a coherederos.',
                porcentaje: 0,
                montoCOP: 0,
              });
            }
          }
        }
      } else {
        beneficiarios = personas.filter(
          (p) => personaCoincideConLey(p, dl.aplicaA) && !p.declaradoIndigno
        );
      }

      if (beneficiarios.length > 0) {
        const cuotaIndividual = dl.montoCalculadoCOP / beneficiarios.length;
        montoAsignadoPorLeyesCOP += dl.montoCalculadoCOP;

        for (const b of beneficiarios) {
          const item = mapaPersonas.get(b.id);
          if (item) {
            const infoBase =
              dl.baseCalculo === 'remanente_de_ley' && dl.leyPadreNombre
                ? ` (${dl.porcentaje}% s/ remanente de ${dl.leyPadreNombre})`
                : ` (${dl.porcentaje}%)`;

            item.leyesAplicadas.push({
              leyNombre: `${dl.nombre}${infoBase}`,
              porcentaje: dl.porcentajeEquivalenteTotal / beneficiarios.length,
              montoCOP: cuotaIndividual,
            });
            item.totalAsignadoCOP += cuotaIndividual;
          }
        }
      }
    }

    // Análisis de remanentes incompletos o excedidos
    remanentesIncompletos = [];

    // 1. Por cada ley padre que tiene leyes hijas aplicando sobre su remanente:
    const leyesPadreIds = new Set(
      leyesCalculadas
        .filter((l) => l.baseCalculo === 'remanente_de_ley' && l.leyPadreId)
        .map((l) => l.leyPadreId!)
    );

    for (const padreId of leyesPadreIds) {
      const padre = leyesCalculadas.find((l) => l.id === padreId);
      if (!padre) continue;

      const hijas = leyesCalculadas.filter(
        (l) => l.baseCalculo === 'remanente_de_ley' && l.leyPadreId === padreId
      );
      const sumaHijasPct = hijas.reduce((acc, h) => acc + h.porcentaje, 0);
      const remanenteBaseCOP = padre.remanentePosteriorCOP;

      if (sumaHijasPct > 100.01) {
        remanentesIncompletos.push({
          id: `exceso-${padre.id}`,
          origen: 'remanente_de_ley',
          origenNombre: `Remanente de "${padre.nombre}"`,
          leyPadreId: padre.id,
          baseCOP: remanenteBaseCOP,
          porcentajeAsignado: sumaHijasPct,
          porcentajeFaltante: 0,
          montoFaltanteCOP: 0,
          excedido: true,
        });
      } else if (sumaHijasPct < 99.99) {
        const pctFaltante = 100 - sumaHijasPct;
        const montoFaltanteCOP = remanenteBaseCOP * (pctFaltante / 100);
        remanentesIncompletos.push({
          id: `faltante-${padre.id}`,
          origen: 'remanente_de_ley',
          origenNombre: `Remanente de "${padre.nombre}"`,
          leyPadreId: padre.id,
          baseCOP: remanenteBaseCOP,
          porcentajeAsignado: sumaHijasPct,
          porcentajeFaltante: pctFaltante,
          montoFaltanteCOP: montoFaltanteCOP,
        });
      }
    }

    // 2. Revisión a nivel de Patrimonio Total
    const leyesRaiz = leyesCalculadas.filter((l) => l.baseCalculo === 'patrimonio_total');
    const leyesRaizConHijas = leyesRaiz.filter((r) => leyesPadreIds.has(r.id));
    const leyesRaizSinHijas = leyesRaiz.filter((r) => !leyesPadreIds.has(r.id));

    if (leyesRaizConHijas.length === 0 && leyesCalculadas.length > 0) {
      const sumaDirectaPct = leyesRaizSinHijas.reduce((acc, l) => acc + l.porcentaje, 0);
      if (sumaDirectaPct > 100.01) {
        remanentesIncompletos.push({
          id: 'exceso-patrimonio-total',
          origen: 'patrimonio_total',
          origenNombre: 'Patrimonio Total',
          baseCOP: patrimonioNetoPartibleCOP,
          porcentajeAsignado: sumaDirectaPct,
          porcentajeFaltante: 0,
          montoFaltanteCOP: 0,
          excedido: true,
        });
      } else if (sumaDirectaPct < 99.99) {
        const pctFaltante = 100 - sumaDirectaPct;
        remanentesIncompletos.push({
          id: 'faltante-patrimonio-total',
          origen: 'patrimonio_total',
          origenNombre: 'Patrimonio Total',
          baseCOP: patrimonioNetoPartibleCOP,
          porcentajeAsignado: sumaDirectaPct,
          porcentajeFaltante: pctFaltante,
          montoFaltanteCOP: patrimonioNetoPartibleCOP * (pctFaltante / 100),
        });
      }
    } else if (leyesCalculadas.length > 0) {
      const sumaFaltantesPoolsCOP = remanentesIncompletos.reduce(
        (acc, r) => acc + (r.montoFaltanteCOP || 0),
        0
      );
      const remanenteTotalNetoCOP = Math.max(0, patrimonioNetoPartibleCOP - montoAsignadoPorLeyesCOP);
      const gapSinExplicarCOP = remanenteTotalNetoCOP - sumaFaltantesPoolsCOP;

      if (gapSinExplicarCOP > 1) {
        const pctFaltante =
          patrimonioNetoPartibleCOP > 0
            ? (gapSinExplicarCOP / patrimonioNetoPartibleCOP) * 100
            : 0;
        remanentesIncompletos.push({
          id: 'faltante-patrimonio-total',
          origen: 'patrimonio_total',
          origenNombre: 'Patrimonio Total',
          baseCOP: patrimonioNetoPartibleCOP,
          porcentajeAsignado: 100 - pctFaltante,
          porcentajeFaltante: pctFaltante,
          montoFaltanteCOP: gapSinExplicarCOP,
        });
      }

      if (montoAsignadoPorLeyesCOP > patrimonioNetoPartibleCOP + 1) {
        if (!remanentesIncompletos.some((r) => r.excedido)) {
          remanentesIncompletos.push({
            id: 'exceso-patrimonio-total',
            origen: 'patrimonio_total',
            origenNombre: 'Patrimonio Total',
            baseCOP: patrimonioNetoPartibleCOP,
            porcentajeAsignado:
              (montoAsignadoPorLeyesCOP / (patrimonioNetoPartibleCOP || 1)) * 100,
            porcentajeFaltante: 0,
            montoFaltanteCOP: 0,
            excedido: true,
          });
        }
      }
    }

    // Si no hay leyes activas pero hay personas, aplicar el orden sucesoral intestado por defecto entre personas hábiles
    if (leyesReparto.length === 0 && personas.length > 0 && patrimonioNetoPartibleCOP > 0) {
      const personasHabiles = personas.filter((p) => !p.declaradoIndigno);
      const hijosHabiles = personasHabiles.filter((p) => p.tipoRelacion === 'Familiar' && p.parentesco === 'Hijo');

      if (hijosHabiles.length > 0) {
        const cuota = patrimonioNetoPartibleCOP / hijosHabiles.length;
        for (const h of hijosHabiles) {
          const item = mapaPersonas.get(h.id);
          if (item) {
            item.leyesAplicadas.push({
              leyNombre: `1° Orden: Hijos (${(100 / hijosHabiles.length).toFixed(2)}%)`,
              porcentaje: 100 / hijosHabiles.length,
              montoCOP: cuota,
            });
            item.totalAsignadoCOP = cuota;
          }
        }
        montoAsignadoPorLeyesCOP = patrimonioNetoPartibleCOP;
      } else if (personasHabiles.length > 0) {
        const cuotaEquitativa = patrimonioNetoPartibleCOP / personasHabiles.length;
        for (const p of personasHabiles) {
          const item = mapaPersonas.get(p.id);
          if (item) {
            item.leyesAplicadas.push({
              leyNombre: `Repartición Equitativa (${(100 / personasHabiles.length).toFixed(2)}%)`,
              porcentaje: 100 / personasHabiles.length,
              montoCOP: cuotaEquitativa,
            });
            item.totalAsignadoCOP = cuotaEquitativa;
          }
        }
        montoAsignadoPorLeyesCOP = patrimonioNetoPartibleCOP;
      }
    }
  }

  // ==========================================
  // 6. IMPUESTO DE GANANCIA OCASIONAL (Arts. 302 a 306 del Estatuto Tributario)
  // Tarifa general del 15% (Ley 2277 de 2022) sujeta a exenciones en UVT
  // ==========================================
  const leyGanancia = leyes.find((l) => l.id === 'ley-ganancia-ocasional');
  const calcularGO = contexto?.calcularGananciaOcasional ?? (leyGanancia ? leyGanancia.activa : true);
  const tarifaGO = contexto?.tarifaGananciaOcasionalPct ?? (leyGanancia ? leyGanancia.porcentaje : 15);

  let totalImpuestoGananciaOcasionalCOP = 0;

  for (const item of mapaPersonas.values()) {
    const bruto = item.totalAsignadoCOP;
    item.montoBrutoCOP = bruto;

    if (calcularGO && bruto > 0 && !item.persona.declaradoIndigno) {
      const impuesto = Math.round(bruto * (tarifaGO / 100));
      item.impuestoGananciaOcasionalCOP = impuesto;
      item.montoNetoDespuesImpuestoCOP = Math.max(0, bruto - impuesto);
      totalImpuestoGananciaOcasionalCOP += impuesto;
    } else {
      item.impuestoGananciaOcasionalCOP = 0;
      item.montoNetoDespuesImpuestoCOP = bruto;
    }

    // Movimiento individual de Agencias en Derecho (separado del reparto general del patrimonio)
    let ajuste = 0;
    let rol: 'paga' | 'recibe' | null = null;

    if (viaProceso === 'judicial' && agenciasDerechoCOP > 0) {
      const esQuienPaga = idsPaganSet.has(item.persona.id);
      const esQuienRecibe = idsRecibenSet.has(item.persona.id);

      // Si por alguna razón está en ambos, no se aplica ajuste (conflicto legal)
      if (esQuienPaga && esQuienRecibe) {
        ajuste = 0;
        rol = null;
      } else if (esQuienPaga) {
        ajuste = -montoPorPagadorCOP;
        rol = 'paga';
      } else if (esQuienRecibe) {
        ajuste = montoPorReceptorCOP;
        rol = 'recibe';
      }
    }

    item.ajusteAgenciasCOP = ajuste;
    item.rolAgencias = rol;
    const baseFinal = item.montoNetoDespuesImpuestoCOP ?? item.totalAsignadoCOP;
    item.totalFinalConAgenciasCOP = baseFinal + ajuste;
  }

  // 7. Porcentajes respecto al neto partible
  const desglosePersonas = Array.from(mapaPersonas.values()).map((dp) => {
    const pct =
      patrimonioNetoPartibleCOP > 0
        ? (dp.totalAsignadoCOP / patrimonioNetoPartibleCOP) * 100
        : 0;
    return {
      ...dp,
      porcentajeDelTotal: pct,
    };
  });

  const remanenteSinAsignarCOP = Math.max(0, patrimonioNetoPartibleCOP - montoAsignadoPorLeyesCOP);
  const hayRemanenteSinAsignar =
    remanentesIncompletos.length > 0 || (patrimonioNetoPartibleCOP > 0 && remanenteSinAsignarCOP > 1);
  const repartoEsValido = !hayRemanenteSinAsignar && !remanentesIncompletos.some((r) => r.excedido);

  return {
    patrimonioBrutoCOP,
    deducciones,
    patrimonioNetoPartibleCOP,
    personasCount: personas.length,
    bienesCount: bienes.length,
    leyesActivasCount: leyesActivas.length,
    desglosePersonas,
    leyesCalculadas,
    remanentesIncompletos,
    hayRemanenteSinAsignar,
    montoTotalSinAsignarCOP: remanenteSinAsignarCOP,
    repartoEsValido,
    porcentajeCostosProceso,
    porcentajeTotalLeyesReparto,
    repartoEsValido100: repartoEsValido,
    regimenDetectado,
    porcentajeTotalLeyes: porcentajeTotalLeyesReparto,
    montoAsignadoPorLeyesCOP,
    remanenteSinAsignarCOP,
    ordenSucesoral,
    movimientoAgencias,
    totalImpuestoGananciaOcasionalCOP,
    tarifaGananciaOcasionalAplicadaPct: tarifaGO,
    gananciaOcasional: {
      aplica: calcularGO,
      tarifaPorcentaje: tarifaGO,
      impuestoTotalEstimadoCOP: totalImpuestoGananciaOcasionalCOP,
      uvtExentaTexto:
        'Primeras 3.250 UVT para inmuebles de la herencia y 7.700 UVT para vivienda del causante (Art. 307 E.T.)',
    },
  };
}
