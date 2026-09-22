import { Ley, HonorariosConfig, ProcesoParticion, PerfilAbogado, AjustesApp, CasoFinalizado, ResultadoParticion } from '../types';
import { calcularParticion } from './calculator';

export const LEYES_PREDETERMINADAS: Ley[] = [
  {
    id: 'ley-1',
    nombre: '50% Legítima Rigurosa (Ley 1934/2018)',
    porcentaje: 50,
    aplicaA: 'Hijo',
    activa: true,
    descripcion: 'Cuota forzosa entre legitimarios (hijos u orden sucesoral aplicable).',
  },
  {
    id: 'ley-2',
    nombre: '50% Libre Disposición (Ley 1934/2018)',
    porcentaje: 50,
    aplicaA: 'Todas',
    activa: true,
    descripcion: 'Porción de libre asignación para cualquier persona, familiar o tercero.',
  },
  {
    id: 'ley-3',
    nombre: 'Orden Sucesoral Intestado (Arts. 1045-1051 C.C.)',
    porcentaje: 100,
    aplicaA: 'Todas',
    activa: false,
    descripcion: 'Distribuye el 100% según el 1°, 2° o 3° orden sucesoral legal (Arts. 1045, 1046 y 1047 del Código Civil).',
  },
  {
    id: 'ley-4',
    nombre: 'Gananciales Cónyuge (Art. 1830 C.C.)',
    porcentaje: 50,
    aplicaA: 'Cónyuge',
    activa: false,
    descripcion: '50% del haber social de la sociedad conyugal previo a la masa hereditaria.',
  },
  {
    id: 'ley-indignidad',
    nombre: 'Indignidad Sucesoral (Art. 1025 C.C., Ley 1893/2018)',
    porcentaje: 0,
    aplicaA: 'Todas',
    activa: true,
    descripcion: 'Excluye legalmente del reparto a la persona declarada indigna y redistribuye su porcentaje entre los demás herederos de su misma categoría.',
  },
  {
    id: 'ley-desheredamiento',
    nombre: 'Desheredamiento Testamentario (Arts. 1265-1281 C.C.)',
    porcentaje: 0,
    aplicaA: 'Hijo',
    activa: false,
    descripcion: 'Disposición testamentaria expresa que priva de la legítima al legitimario por causales legales, acreciendo a los demás legitimarios hábiles.',
  },
  {
    id: 'ley-ganancia-ocasional',
    nombre: 'Impuesto de Ganancia Ocasional (Arts. 302-306 E.T.)',
    porcentaje: 15,
    aplicaA: 'Todas',
    activa: true,
    descripcion: 'Tarifa general impositiva estimada (15% según reforma Ley 2277/2022) sobre la masa adjudicada a cada heredero, sujeta a exenciones en UVT (Art. 307 E.T.).',
  },
  {
    id: 'ley-capitulaciones',
    nombre: 'Capitulaciones Matrimoniales (Art. 1771 C.C.)',
    porcentaje: 50,
    aplicaA: 'Cónyuge',
    activa: false,
    descripcion: 'Convención que modifica el régimen de gananciales legal por defecto (Art. 1830 C.C.), aplicando el porcentaje acordado en la escritura de capitulaciones.',
  },
  {
    id: 'ley-disolucion-sociedades',
    nombre: 'Disolución y Liquidación Societaria (Arts. 218-259 C.Co.)',
    porcentaje: 100,
    aplicaA: 'Amigo/Socio',
    activa: false,
    descripcion: 'Distribución del remanente patrimonial de la sociedad entre los socios según su porcentaje de participación fijado en los estatutos sociales.',
  },
  {
    id: 'ley-copropiedad',
    nombre: 'División de Copropiedad / Comunidad (Art. 1374 C.C.)',
    porcentaje: 100,
    aplicaA: 'Todas',
    activa: false,
    descripcion: 'Partición de bienes proindiviso entre condueños conforme al porcentaje de cuota parte registrado en sus títulos o escrituras.',
  },
];

/**
 * Aplica la regla de exclusión mutua estricta para que nunca coexistan
 * regímenes mutuamente excluyentes (ej. Testado 50+50 vs Intestado 100% vs Disolución Societaria 100%).
 */
export function sanitizarLeyesExclusionMutua(leyes: Ley[]): Ley[] {
  const tieneSocietarioActivo = leyes.some(
    (l) => l.activa && (l.id === 'ley-disolucion-sociedades' || l.nombre.toLowerCase().includes('disolución'))
  );
  const tieneIntestadoActivo = leyes.some(
    (l) => l.activa && (l.id === 'ley-3' || l.nombre.toLowerCase().includes('orden sucesoral'))
  );
  const tieneTestadoActivo = leyes.some(
    (l) =>
      l.activa &&
      (l.id === 'ley-1' ||
        l.id === 'ley-2' ||
        l.nombre.toLowerCase().includes('legítima') ||
        l.nombre.toLowerCase().includes('libre disposición'))
  );

  // Si societario está activo, desactivar sucesiones testada e intestada
  if (tieneSocietarioActivo && (tieneIntestadoActivo || tieneTestadoActivo)) {
    return leyes.map((l) => {
      if (
        l.id === 'ley-1' ||
        l.id === 'ley-2' ||
        l.id === 'ley-3' ||
        l.nombre.toLowerCase().includes('legítima') ||
        l.nombre.toLowerCase().includes('libre disposición') ||
        l.nombre.toLowerCase().includes('orden sucesoral')
      ) {
        return { ...l, activa: false };
      }
      return l;
    });
  }

  // Si ambos caminos sucesorales (intestado y testado) están activos al mismo tiempo, resolver la colisión
  if (tieneIntestadoActivo && tieneTestadoActivo) {
    return leyes.map((l) => {
      // Priorizar el régimen testado bipartito por defecto
      if (l.id === 'ley-3' || l.nombre.toLowerCase().includes('orden sucesoral')) {
        return { ...l, activa: false };
      }
      return l;
    });
  }

  return leyes;
}

export function alternarLeyConExclusionMutua(leyes: Ley[], id: string): Ley[] {
  const leyObjetivo = leyes.find((l) => l.id === id);
  if (!leyObjetivo) return leyes;

  const seVaAActivar = !leyObjetivo.activa;
  const esIntestado =
    leyObjetivo.id === 'ley-3' || leyObjetivo.nombre.toLowerCase().includes('orden sucesoral');
  const esTestado =
    leyObjetivo.id === 'ley-1' ||
    leyObjetivo.id === 'ley-2' ||
    leyObjetivo.nombre.toLowerCase().includes('legítima') ||
    leyObjetivo.nombre.toLowerCase().includes('libre disposición');
  const esSocietario =
    leyObjetivo.id === 'ley-disolucion-sociedades' ||
    leyObjetivo.nombre.toLowerCase().includes('disolución');

  return leyes.map((l) => {
    if (l.id === id) {
      return { ...l, activa: seVaAActivar };
    }

    // Regla de exclusión mutua: si se activa Intestado, desactivar Testado y Societario
    if (seVaAActivar && esIntestado) {
      if (
        l.id === 'ley-1' ||
        l.id === 'ley-2' ||
        l.id === 'ley-disolucion-sociedades' ||
        l.nombre.toLowerCase().includes('legítima') ||
        l.nombre.toLowerCase().includes('libre disposición') ||
        l.nombre.toLowerCase().includes('disolución')
      ) {
        return { ...l, activa: false };
      }
    }

    // Regla de exclusión mutua: si se activa Testado, desactivar Intestado y Societario
    if (seVaAActivar && esTestado) {
      if (
        l.id === 'ley-3' ||
        l.id === 'ley-disolucion-sociedades' ||
        l.nombre.toLowerCase().includes('orden sucesoral') ||
        l.nombre.toLowerCase().includes('disolución')
      ) {
        return { ...l, activa: false };
      }
    }

    // Regla de exclusión mutua: si se activa Societario, desactivar Testado e Intestado
    if (seVaAActivar && esSocietario) {
      if (
        l.id === 'ley-1' ||
        l.id === 'ley-2' ||
        l.id === 'ley-3' ||
        l.nombre.toLowerCase().includes('legítima') ||
        l.nombre.toLowerCase().includes('libre disposición') ||
        l.nombre.toLowerCase().includes('orden sucesoral')
      ) {
        return { ...l, activa: false };
      }
    }

    return l;
  });
}

export function aplicarRegimenTestado(leyes: Ley[]): Ley[] {
  return leyes.map((l) => {
    if (l.id === 'ley-1' || l.nombre.toLowerCase().includes('legítima')) {
      return { ...l, activa: true, porcentaje: 50 };
    }
    if (l.id === 'ley-2' || l.nombre.toLowerCase().includes('libre disposición')) {
      return { ...l, activa: true, porcentaje: 50 };
    }
    if (
      l.id === 'ley-3' ||
      l.id === 'ley-disolucion-sociedades' ||
      l.nombre.toLowerCase().includes('orden sucesoral') ||
      l.nombre.toLowerCase().includes('disolución')
    ) {
      return { ...l, activa: false };
    }
    return l;
  });
}

export function aplicarRegimenIntestado(leyes: Ley[]): Ley[] {
  return leyes.map((l) => {
    if (l.id === 'ley-3' || l.nombre.toLowerCase().includes('orden sucesoral')) {
      return { ...l, activa: true, porcentaje: 100 };
    }
    if (
      l.id === 'ley-1' ||
      l.id === 'ley-2' ||
      l.id === 'ley-disolucion-sociedades' ||
      l.nombre.toLowerCase().includes('legítima') ||
      l.nombre.toLowerCase().includes('libre disposición') ||
      l.nombre.toLowerCase().includes('disolución')
    ) {
      return { ...l, activa: false };
    }
    return l;
  });
}

export function aplicarRegimenSocietario(leyes: Ley[]): Ley[] {
  return leyes.map((l) => {
    if (l.id === 'ley-disolucion-sociedades' || l.nombre.toLowerCase().includes('disolución')) {
      return { ...l, activa: true, porcentaje: 100 };
    }
    if (
      l.id === 'ley-1' ||
      l.id === 'ley-2' ||
      l.id === 'ley-3' ||
      l.nombre.toLowerCase().includes('legítima') ||
      l.nombre.toLowerCase().includes('libre disposición') ||
      l.nombre.toLowerCase().includes('orden sucesoral')
    ) {
      return { ...l, activa: false };
    }
    return l;
  });
}

export const HONORARIOS_PREDETERMINADOS: HonorariosConfig = {
  viaProceso: 'judicial',
  abogadoPorcentaje: 10,
  agenciasDerechoPorcentaje: 15, // Rango habitual 10% - 20% (Acuerdo PCAA16-10554 CSJ)
  juezCostasPorcentaje: 15,
  abogadoFijoCOP: 0,
  agenciasDerechoFijoCOP: 0,
  juezCostasFijoCOP: 0,
  modalidad: 'porcentaje',
  quienPagaId: '',
  quienPagaNombre: '',
  quienRecibeId: '',
  quienRecibeNombre: '',
  estadoAgencias: 'estimado',
};

const STORAGE_KEY_PROCESOS = 'gestordebienes_procesos_v3';
const STORAGE_KEY_CASOS_FINALIZADOS = 'gestordebienes_casos_finalizados_v1';
const STORAGE_KEY_LEYES_GRAL = 'gestordebienes_leyes_generales_v3';
const STORAGE_KEY_HONORARIOS_GRAL = 'gestordebienes_honorarios_generales_v3';

export function obtenerLeyesGenerales(): Ley[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LEYES_GRAL);
    if (raw) {
      const parsed: Ley[] = JSON.parse(raw);
      // Depuración: eliminar cualquier regla derogada de Cuarta de Mejoras y aplicar exclusión mutua
      const filtradas = parsed.filter(
        (l) => !l.nombre.toLowerCase().includes('cuarta de mejoras') && !l.id.includes('cuarta')
      );
      // Asegurar que las leyes esenciales del catálogo siempre estén disponibles y con referencias completas
      const idsExistentes = new Set(filtradas.map((l) => l.id));
      for (const leyBase of LEYES_PREDETERMINADAS) {
        if (!idsExistentes.has(leyBase.id)) {
          filtradas.push({ ...leyBase });
        }
      }

      // Enriquecer ley-3 con referencia al Art. 1045 si no la tenía
      const enriquecidas = filtradas.map((l) => {
        if (l.id === 'ley-3' && !l.nombre.includes('1045') && !(l.descripcion || '').includes('1045')) {
          return {
            ...l,
            nombre: 'Orden Sucesoral Intestado (Arts. 1045-1051 C.C.)',
            descripcion: 'Distribuye el 100% según el 1°, 2° o 3° orden sucesoral legal (Arts. 1045, 1046 y 1047 del Código Civil).',
          };
        }
        return l;
      });

      const sanitizadas = sanitizarLeyesExclusionMutua(enriquecidas);
      if (sanitizadas.length !== parsed.length || JSON.stringify(sanitizadas) !== raw) {
        guardarLeyesGenerales(sanitizadas);
      }
      if (sanitizadas.length > 0) {
        return sanitizadas;
      }
    }
  } catch (e) {
    console.error('Error cargando leyes generales:', e);
  }
  return LEYES_PREDETERMINADAS;
}

export function guardarLeyesGenerales(leyes: Ley[]): void {
  try {
    const depuradas = leyes.filter(
      (l) => !l.nombre.toLowerCase().includes('cuarta de mejoras')
    );
    localStorage.setItem(STORAGE_KEY_LEYES_GRAL, JSON.stringify(depuradas));
  } catch (e) {
    console.error('Error guardando leyes generales:', e);
  }
}

export function obtenerHonorariosGenerales(): HonorariosConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HONORARIOS_GRAL);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        viaProceso: parsed.viaProceso ?? 'judicial',
        abogadoPorcentaje: parsed.abogadoPorcentaje ?? 10,
        agenciasDerechoPorcentaje: parsed.agenciasDerechoPorcentaje ?? parsed.juezCostasPorcentaje ?? 15,
        juezCostasPorcentaje: parsed.agenciasDerechoPorcentaje ?? parsed.juezCostasPorcentaje ?? 15,
        abogadoFijoCOP: parsed.abogadoFijoCOP ?? 0,
        agenciasDerechoFijoCOP: parsed.agenciasDerechoFijoCOP ?? parsed.juezCostasFijoCOP ?? 0,
        juezCostasFijoCOP: parsed.agenciasDerechoFijoCOP ?? parsed.juezCostasFijoCOP ?? 0,
        modalidad: parsed.modalidad ?? 'porcentaje',
        quienPagaId: parsed.quienPagaId ?? '',
        quienPagaNombre: parsed.quienPagaNombre ?? '',
        quienRecibeId: parsed.quienRecibeId ?? '',
        quienRecibeNombre: parsed.quienRecibeNombre ?? '',
        estadoAgencias: parsed.estadoAgencias ?? 'estimado',
      };
    }
  } catch (e) {
    console.error('Error cargando honorarios generales:', e);
  }
  return HONORARIOS_PREDETERMINADOS;
}

export function guardarHonorariosGenerales(config: HonorariosConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_HONORARIOS_GRAL, JSON.stringify(config));
  } catch (e) {
    console.error('Error guardando honorarios generales:', e);
  }
}

export function obtenerProcesosPendientes(): ProcesoParticion[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROCESOS);
    if (raw) {
      const list: ProcesoParticion[] = JSON.parse(raw);
      // Depuración de leyes derogadas y corrección de regla de exclusión mutua (evitar el 250%)
      const depurados = list.map((p) => {
        const leyesBase = p.leyes
          ? p.leyes.filter((l) => !l.nombre.toLowerCase().includes('cuarta de mejoras'))
          : obtenerLeyesGenerales();
        const ids = new Set(leyesBase.map((l) => l.id));
        for (const leyBase of LEYES_PREDETERMINADAS) {
          if (!ids.has(leyBase.id)) {
            leyesBase.push({
              ...leyBase,
              activa: leyBase.id === 'ley-indignidad' || leyBase.id === 'ley-ganancia-ocasional' ? true : false,
            });
          }
        }
        const tieneIntestado = leyesBase.some(
          (l) => l.activa && (l.id === 'ley-3' || l.nombre.toLowerCase().includes('orden sucesoral'))
        );
        return {
          ...p,
          pasoActual: (Math.min(3, p.pasoActual || 1)) as 1 | 2 | 3,
          regimenSucesoral: p.regimenSucesoral || (tieneIntestado ? 'intestado' : 'testado'),
          tieneCapitulaciones: p.tieneCapitulaciones ?? false,
          porcentajeGanancialesCapitulaciones: p.porcentajeGanancialesCapitulaciones ?? 50,
          calcularGananciaOcasional: p.calcularGananciaOcasional ?? true,
          tarifaGananciaOcasionalPct: p.tarifaGananciaOcasionalPct ?? 15,
          leyes: sanitizarLeyesExclusionMutua(leyesBase),
        };
      });
      return depurados.filter((p) => !p.finalizado);
    }
  } catch (e) {
    console.error('Error cargando procesos pendientes:', e);
  }

  // Si está vacío, sembrar un proceso inicial de demostración para que el usuario vea la UI inmediatamente
  const procesoInicial: ProcesoParticion = {
    id: 'proc-demo-1',
    nombreCaso: 'Sucesión Familia Gómez Restrepo',
    tipoProceso: 'Partición Notarial de Bienes',
    regimenSucesoral: 'testado',
    fechaCreacion: new Date(Date.now() - 3600000 * 24).toISOString(),
    fechaUltimaEdicion: new Date().toISOString(),
    finalizado: false,
    pasoActual: 1,
    bienes: [
      { id: 'b-1', nombre: 'Apartamento 402 Edificio Panorama (Bogotá D.C.)', valor: 450000000 },
      { id: 'b-2', nombre: 'Finca Campestre La Esperanza (Villeta, Cundinamarca)', valor: 320000000 },
      { id: 'b-3', nombre: 'Cuenta de Ahorros y CDT Bancolombia', valor: 85000000 },
      { id: 'b-4', nombre: 'Vehículo Camioneta Toyota RAV4', valor: 95000000 },
    ],
    leyes: obtenerLeyesGenerales().map((l) => ({ ...l })),
    personas: [
      { id: 'p-1', nombre: 'María Helena Restrepo de Gómez', tipoRelacion: 'Familiar', parentesco: 'Cónyuge' },
      { id: 'p-2', nombre: 'Camilo Gómez Restrepo', tipoRelacion: 'Familiar', parentesco: 'Hijo' },
      { id: 'p-3', nombre: 'Valentina Gómez Restrepo', tipoRelacion: 'Familiar', parentesco: 'Hijo' },
    ],
    honorarios: obtenerHonorariosGenerales(),
  };

  guardarProcesos([procesoInicial]);
  return [procesoInicial];
}

export function guardarProceso(proceso: ProcesoParticion): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROCESOS);
    let list: ProcesoParticion[] = raw ? JSON.parse(raw) : [];
    const procesoLimpio = {
      ...proceso,
      leyes: proceso.leyes.filter((l) => !l.nombre.toLowerCase().includes('cuarta de mejoras')),
    };
    const index = list.findIndex((p) => p.id === proceso.id);
    if (index >= 0) {
      list[index] = procesoLimpio;
    } else {
      list.unshift(procesoLimpio);
    }
    localStorage.setItem(STORAGE_KEY_PROCESOS, JSON.stringify(list));
  } catch (e) {
    console.error('Error guardando proceso:', e);
  }
}

export function eliminarProceso(id: string): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROCESOS);
    if (raw) {
      const list: ProcesoParticion[] = JSON.parse(raw);
      const filtered = list.filter((p) => p.id !== id);
      localStorage.setItem(STORAGE_KEY_PROCESOS, JSON.stringify(filtered));
    }
  } catch (e) {
    console.error('Error eliminando proceso:', e);
  }
}

export function finalizarProcesoEnStorage(id: string, procesoCompleto?: ProcesoParticion, resultadoCalculado?: ResultadoParticion): CasoFinalizado | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROCESOS);
    let procesoFinalizado: ProcesoParticion | undefined = procesoCompleto;

    if (raw) {
      const list: ProcesoParticion[] = JSON.parse(raw);
      if (!procesoFinalizado) {
        procesoFinalizado = list.find((p) => p.id === id);
      }
      // Actualizar estado en la lista de borradores/procesos
      const updated = list.map((p) =>
        p.id === id ? { ...p, finalizado: true, fechaUltimaEdicion: new Date().toISOString() } : p
      );
      localStorage.setItem(STORAGE_KEY_PROCESOS, JSON.stringify(updated));
    }

    if (procesoFinalizado) {
      const patrimonioTotal = procesoFinalizado.bienes.reduce((acc, b) => acc + (Number(b.valor) || 0), 0);
      const resultadoFinal = resultadoCalculado || calcularParticion(
        procesoFinalizado.personas,
        procesoFinalizado.bienes,
        procesoFinalizado.leyes,
        procesoFinalizado.honorarios,
        {
          tipoProceso: procesoFinalizado.tipoProceso,
          regimenSucesoral: procesoFinalizado.regimenSucesoral,
          tieneCapitulaciones: procesoFinalizado.tieneCapitulaciones,
          porcentajeGanancialesCapitulaciones: procesoFinalizado.porcentajeGanancialesCapitulaciones,
          calcularGananciaOcasional: procesoFinalizado.calcularGananciaOcasional,
          tarifaGananciaOcasionalPct: procesoFinalizado.tarifaGananciaOcasionalPct,
        }
      );

      const registroFinalizado: CasoFinalizado = {
        id: `caso-fin-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        procesoId: procesoFinalizado.id,
        nombreCaso: procesoFinalizado.nombreCaso || 'Expediente Sin Nombre',
        tipoProceso: procesoFinalizado.tipoProceso || 'Partición de Bienes',
        regimenSucesoral: procesoFinalizado.regimenSucesoral,
        fechaCreacion: procesoFinalizado.fechaCreacion,
        fechaFinalizacion: new Date().toISOString(),
        patrimonioTotalCOP: patrimonioTotal,
        proceso: { ...procesoFinalizado, finalizado: true },
        resultado: resultadoFinal,
      };

      guardarCasoEnHistorial(registroFinalizado);
      return registroFinalizado;
    }
  } catch (e) {
    console.error('Error finalizando proceso:', e);
  }
  return null;
}

// -------------------------------------------------------------
// HISTORIAL DE CASOS FINALIZADOS (PERMANENTE Y LOCAL)
// -------------------------------------------------------------

export function obtenerCasosFinalizados(): CasoFinalizado[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CASOS_FINALIZADOS);
    if (raw) {
      const list: CasoFinalizado[] = JSON.parse(raw);
      return Array.isArray(list) ? list : [];
    }
  } catch (e) {
    console.error('Error cargando historial de casos finalizados:', e);
  }
  return [];
}

export function guardarCasoEnHistorial(caso: CasoFinalizado): void {
  try {
    const existentes = obtenerCasosFinalizados();
    // Evitar duplicados por id
    const filtrados = existentes.filter((c) => c.id !== caso.id);
    const actualizados = [caso, ...filtrados];
    localStorage.setItem(STORAGE_KEY_CASOS_FINALIZADOS, JSON.stringify(actualizados));
  } catch (e) {
    console.error('Error guardando caso en historial finalizado:', e);
  }
}

export function eliminarCasoFinalizado(id: string): void {
  try {
    const existentes = obtenerCasosFinalizados();
    const filtrados = existentes.filter((c) => c.id !== id);
    localStorage.setItem(STORAGE_KEY_CASOS_FINALIZADOS, JSON.stringify(filtrados));
  } catch (e) {
    console.error('Error eliminando caso del historial:', e);
  }
}

export function vaciarHistorialCasosFinalizados(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_CASOS_FINALIZADOS);
  } catch (e) {
    console.error('Error vaciando historial de casos finalizados:', e);
  }
}

function guardarProcesos(list: ProcesoParticion[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_PROCESOS, JSON.stringify(list));
  } catch (e) {
    console.error('Error guardando lista de procesos:', e);
  }
}

// -------------------------------------------------------------
// CONFIGURACIÓN GENERAL: PERFIL DEL ABOGADO, AJUSTES Y SESIÓN
// -------------------------------------------------------------

export const STORAGE_KEY_PERFIL_ABOGADO = 'gestor_bienes_abogado_perfil';
export const STORAGE_KEY_AJUSTES_APP = 'gestor_bienes_ajustes_app';
export const STORAGE_KEY_SESION_ACTIVA = 'gestor_bienes_sesion_activa';

export const PERFIL_ABOGADO_PREDETERMINADO: PerfilAbogado = {
  nombre: 'Dr. Alejandro Restrepo Salazar',
  tarjetaProfesional: '248.910 del C.S.J.',
  documentoIdentidad: 'C.C. 1.020.456.789 de Bogotá D.C.',
  despachoFirma: 'Restrepo & Asociados - Consultores Jurídicos y Patrimoniales',
  sitioWeb: '',
  correo: 'alejandro.restrepo@gestordebienes.legal',
  telefono: '+57 (601) 315-8900',
  ciudad: 'Bogotá D.C., Colombia',
  especialidad: 'Derecho de Familia, Sucesiones y Liquidación Patrimonial',
  leyendaNotarial: 'Liquidación patrimonial elaborada bajo las disposiciones del C.C. y C.G.P.',
  registrado: true,
};

export const AJUSTES_APP_PREDETERMINADOS: AjustesApp = {
  temaVisual: 'blanco-corporativo',
  densidadInterfaz: 'comoda',
  formatoMonedaConDecimales: false,
  mostrarSeparadorMiles: true,
  incluirEncabezadoAbogadoEnPDF: true,
  confirmarEliminacionBorradores: true,
  autoGuardadoLocal: true,
};

export function obtenerPerfilAbogado(): PerfilAbogado {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PERFIL_ABOGADO);
    if (raw) {
      return { ...PERFIL_ABOGADO_PREDETERMINADO, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Error obteniendo perfil de abogado:', e);
  }
  return { ...PERFIL_ABOGADO_PREDETERMINADO };
}

export function guardarPerfilAbogado(perfil: PerfilAbogado): void {
  try {
    localStorage.setItem(STORAGE_KEY_PERFIL_ABOGADO, JSON.stringify(perfil));
  } catch (e) {
    console.error('Error guardando perfil de abogado:', e);
  }
}

export function obtenerAjustesApp(): AjustesApp {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AJUSTES_APP);
    if (raw) {
      const parsed = JSON.parse(raw);
      let tema = parsed.temaVisual;
      if (tema === 'clasico-formal') tema = 'blanco-corporativo';
      else if (tema === 'monocromo-notarial') tema = 'gris-tecnico';
      else if (tema === 'alto-contraste') tema = 'negro-ejecutivo';
      else if (!['blanco-corporativo', 'gris-tecnico', 'negro-ejecutivo'].includes(tema)) {
        tema = 'blanco-corporativo';
      }
      return { ...AJUSTES_APP_PREDETERMINADOS, ...parsed, temaVisual: tema };
    }
  } catch (e) {
    console.error('Error obteniendo ajustes de la aplicación:', e);
  }
  return { ...AJUSTES_APP_PREDETERMINADOS };
}

export function guardarAjustesApp(ajustes: AjustesApp): void {
  try {
    localStorage.setItem(STORAGE_KEY_AJUSTES_APP, JSON.stringify(ajustes));
  } catch (e) {
    console.error('Error guardando ajustes de la aplicación:', e);
  }
}

export function obtenerEstadoSesion(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SESION_ACTIVA);
    if (raw !== null) {
      return JSON.parse(raw) === true;
    }
  } catch (e) {
    console.error('Error obteniendo estado de sesión:', e);
  }
  return false; // Pantalla previa de inicio de sesión requerida para acceder
}

export function guardarEstadoSesion(activa: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY_SESION_ACTIVA, JSON.stringify(activa));
  } catch (e) {
    console.error('Error guardando estado de sesión:', e);
  }
}

