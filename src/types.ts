export type TipoRelacion = 'Familiar' | 'Amigo/Socio';

export type ParentescoFamiliar = 'Cónyuge' | 'Hijo' | 'Padre' | 'Hermano' | 'Otro';

export type DestinatarioLey = ParentescoFamiliar | 'Amigo/Socio' | 'Todas';

export interface PerfilAbogado {
  nombre: string;
  tarjetaProfesional: string;
  documentoIdentidad: string;
  despachoFirma: string;
  sitioWeb?: string;
  correo: string;
  telefono: string;
  ciudad: string;
  especialidad: string;
  leyendaNotarial?: string;
  registrado: boolean;
  fotoPerfil?: string; // Data URL o URL de la foto de perfil
}

export interface AjustesApp {
  temaVisual: 'blanco-corporativo' | 'gris-tecnico' | 'negro-ejecutivo';
  densidadInterfaz: 'comoda' | 'compacta' | 'amplia';
  formatoMonedaConDecimales: boolean;
  mostrarSeparadorMiles: boolean;
  incluirEncabezadoAbogadoEnPDF: boolean;
  confirmarEliminacionBorradores: boolean;
  autoGuardadoLocal: boolean;
}

export interface Persona {
  id: string;
  nombre: string;
  tipoRelacion: TipoRelacion;
  parentesco?: ParentescoFamiliar;
  bienesAsignadosIds?: string[]; // IDs de bienes asignados preferentemente
  declaradoIndigno?: boolean; // Art. 1025 C.C., modificado por Ley 1893/2018
  desheredado?: boolean; // Arts. 1265-1281 C.C.
  porcentajeParticipacion?: number; // Para Disolución Societaria (Arts. 218-259 C.Co.) o Copropiedad (Art. 1374 C.C.)
}

export interface Bien {
  id: string;
  nombre: string;
  valor: number; // en COP
  asignadoAId?: string; // ID de la persona asignada o 'comun'
}

export type BaseCalculoLey = 'patrimonio_total' | 'remanente_de_ley';

export interface Ley {
  id: string;
  nombre: string;
  porcentaje: number;
  aplicaA: DestinatarioLey;
  activa: boolean;
  descripcion?: string;
  baseCalculo?: BaseCalculoLey; // 'patrimonio_total' o 'remanente_de_ley'
  leyPadreId?: string; // ID de la ley padre cuyo remanente se toma como base
}

export type ViaProceso = 'notarial' | 'judicial';
export type EstadoAgencias = 'estimado' | 'confirmado';

export interface MovimientoAgenciasDerecho {
  aplica: boolean;
  viaProceso: ViaProceso;
  montoCOP: number;
  porcentajeCalculado: number;
  quienPagaId?: string;
  quienPagaNombre?: string;
  quienRecibeId?: string;
  quienRecibeNombre?: string;
  quienesPaganIds?: string[];
  quienesPaganNombres?: string[];
  montoPorPagadorCOP?: number;
  quienesRecibenIds?: string[];
  quienesRecibenNombres?: string[];
  montoPorReceptorCOP?: number;
  estado: EstadoAgencias;
}

export interface HonorariosConfig {
  viaProceso?: ViaProceso; // 'notarial' | 'judicial'
  abogadoPorcentaje: number; // Libremente acordado
  agenciasDerechoPorcentaje: number; // Habitual 10% - 20% (Acuerdo PCAA16-10554)
  juezCostasPorcentaje?: number; // Compatibilidad
  abogadoFijoCOP?: number;
  agenciasDerechoFijoCOP?: number;
  juezCostasFijoCOP?: number; // Compatibilidad
  modalidad: 'porcentaje' | 'fijo';
  
  // Agencias en Derecho en Vía Judicial (Selección múltiple de partes en litigio)
  quienesPaganIds?: string[]; // IDs de las personas vencidas que pagan
  quienesPaganNombres?: string[]; // Nombres de las personas vencidas
  quienesRecibenIds?: string[]; // IDs de las personas vencedoras que reciben
  quienesRecibenNombres?: string[]; // Nombres de las personas vencedoras

  // Compatibilidad hacia atrás
  quienPagaId?: string;
  quienPagaNombre?: string;
  quienRecibeId?: string;
  quienRecibeNombre?: string;
  estadoAgencias?: EstadoAgencias; // 'estimado' | 'confirmado'
}

export type TipoOrdenSucesoral =
  | 'primer_orden'
  | 'segundo_orden'
  | 'tercer_orden'
  | 'testado'
  | 'disolucion_societaria'
  | 'copropiedad'
  | 'mixto_o_personalizado';

export interface OrdenSucesoralInfo {
  tipo: TipoOrdenSucesoral;
  titulo: string;
  regla: string;
}

export interface ProcesoParticion {
  id: string;
  nombreCaso: string;
  tipoProceso: string;
  regimenSucesoral?: 'testado' | 'intestado';
  tieneCapitulaciones?: boolean; // Art. 1771 C.C.
  porcentajeGanancialesCapitulaciones?: number; // % acordado en capitulaciones (en lugar del 50% legal Art. 1830)
  calcularGananciaOcasional?: boolean; // Arts. 302-306 E.T.
  tarifaGananciaOcasionalPct?: number; // Tarifa general vigente (por defecto 15% Ley 2277/2022)
  fechaCreacion: string;
  fechaUltimaEdicion: string;
  finalizado: boolean;
  pasoActual: 1 | 2 | 3;
  bienes: Bien[];
  leyes: Ley[];
  personas: Persona[];
  honorarios: HonorariosConfig;
}

export interface CasoFinalizado {
  id: string;
  procesoId: string;
  nombreCaso: string;
  tipoProceso: string;
  regimenSucesoral?: 'testado' | 'intestado';
  fechaCreacion: string;
  fechaFinalizacion: string;
  patrimonioTotalCOP: number;
  proceso: ProcesoParticion;
  resultado?: ResultadoParticion;
}

export interface DesglosePersona {
  persona: Persona;
  leyesAplicadas: {
    leyNombre: string;
    porcentaje: number;
    montoCOP: number;
  }[];
  totalAsignadoCOP: number;
  porcentajeDelTotal: number;
  bienesAsignadosNombres: string[];
  excluidoPorIndignidad?: boolean;
  excluidoPorDesheredamiento?: boolean;
  montoBrutoCOP?: number;
  impuestoGananciaOcasionalCOP?: number;
  montoNetoDespuesImpuestoCOP?: number;

  // Ajuste individual de Agencias en Derecho (Vía Judicial)
  ajusteAgenciasCOP?: number; // Positivo si recibe, negativo si paga, 0 si no aplica
  rolAgencias?: 'paga' | 'recibe' | null;
  totalFinalConAgenciasCOP?: number; // Total final tras aplicar el movimiento de agencias
}

export interface DeduccionHonorarios {
  viaProceso: ViaProceso;
  abogadoCOP: number;
  abogadoPorcentaje: number;
  agenciasDerechoCOP: number;
  agenciasDerechoPorcentaje: number;
  juezCostasCOP?: number;
  juezCostasPorcentaje?: number;
  totalDeduccionesCOP: number; // Monto efectivamente restado del patrimonio bruto (solo abogado)
  totalCostosPorcentajeSobreBruto: number;
  agenciasFueraDeRango: boolean; // Menor al 10% o mayor al 20%
  movimientoAgencias?: MovimientoAgenciasDerecho;
}

export interface DesgloseLeyCalculada {
  id: string;
  nombre: string;
  porcentaje: number;
  baseCalculo: BaseCalculoLey;
  leyPadreId?: string;
  leyPadreNombre?: string;
  baseDineroCOP: number;
  montoCalculadoCOP: number;
  remanentePosteriorCOP: number;
  porcentajeEquivalenteTotal: number;
  aplicaA: DestinatarioLey;
  descripcion?: string;
}

export interface RemanenteIncompletoInfo {
  id: string;
  origen: 'patrimonio_total' | 'remanente_de_ley';
  origenNombre: string;
  leyPadreId?: string;
  baseCOP: number;
  porcentajeAsignado: number;
  porcentajeFaltante: number;
  montoFaltanteCOP: number;
  excedido?: boolean;
}

export interface ResultadoParticion {
  patrimonioBrutoCOP: number;
  deducciones: DeduccionHonorarios;
  patrimonioNetoPartibleCOP: number;
  personasCount: number;
  bienesCount: number;
  leyesActivasCount: number;
  desglosePersonas: DesglosePersona[];
  leyesCalculadas: DesgloseLeyCalculada[];
  remanentesIncompletos: RemanenteIncompletoInfo[];
  hayRemanenteSinAsignar: boolean;
  montoTotalSinAsignarCOP: number;
  repartoEsValido: boolean;
  porcentajeCostosProceso: number; // Grupo 1: % deducido sobre el patrimonio bruto (sin tope de 100%)
  porcentajeTotalLeyesReparto: number; // Grupo 2: % sobre el patrimonio neto resultante (restringido estrictamente al 100%)
  repartoEsValido100: boolean; // true si la suma total del reparto no excede matemáticamente el 100% del neto partible
  regimenDetectado: 'testado' | 'intestado' | 'disolucion_societaria' | 'copropiedad' | 'personalizado';
  porcentajeTotalLeyes: number; // Compatibilidad con vistas previas
  montoAsignadoPorLeyesCOP: number;
  remanenteSinAsignarCOP: number;
  ordenSucesoral: OrdenSucesoralInfo;
  movimientoAgencias?: MovimientoAgenciasDerecho;
  totalImpuestoGananciaOcasionalCOP?: number;
  tarifaGananciaOcasionalAplicadaPct?: number;
  gananciaOcasional?: {
    aplica: boolean;
    tarifaPorcentaje: number;
    impuestoTotalEstimadoCOP: number;
    uvtExentaTexto: string;
  };
}
