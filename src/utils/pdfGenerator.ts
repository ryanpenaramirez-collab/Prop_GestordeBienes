import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ProcesoParticion, ResultadoParticion } from '../types';
import { formatearMoneda } from './calculator';
import { obtenerPerfilAbogado, obtenerAjustesApp } from './storage';

export function generarPDFParticion(
  proceso: ProcesoParticion,
  resultado: ResultadoParticion
): void {
  const perfilAbogado = obtenerPerfilAbogado();
  const ajustesApp = obtenerAjustesApp();
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;

  // Paleta sobria y legal
  const colorPrimario: [number, number, number] = [15, 39, 68]; // Slate Navy 900
  const colorTexto: [number, number, number] = [30, 41, 59]; // Slate 800
  const colorGris: [number, number, number] = [100, 116, 139]; // Slate 500
  const colorLinea: [number, number, number] = [226, 232, 240]; // Slate 200
  const colorFondoTabla: [number, number, number] = [248, 250, 252]; // Slate 50

  // 1. ENCABEZADO INSTITUCIONAL
  doc.setFillColor(...colorPrimario);
  doc.rect(margin, margin, pageWidth - margin * 2, 4, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...colorPrimario);
  doc.text('GESTOR DE BIENES', margin, margin + 24);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...colorGris);
  doc.text(
    'SISTEMA DE PARTICIÓN PATRIMONIAL Y LIQUIDACIÓN SUCESORAL EN PESOS COLOMBIANOS (COP)',
    margin,
    margin + 36
  );

  const fechaTexto = new Date().toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  doc.text(`Fecha: ${fechaTexto}`, pageWidth - margin, margin + 24, { align: 'right' });
  doc.text(`Moneda: Pesos Colombianos (COP)`, pageWidth - margin, margin + 36, { align: 'right' });

  doc.setDrawColor(...colorLinea);
  doc.setLineWidth(1);
  doc.line(margin, margin + 46, pageWidth - margin, margin + 46);

  // 2. CARÁTULA DEL EXPEDIENTE
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...colorPrimario);
  doc.text('I. CARÁTULA DEL CASO Y DATOS PROCESALES', margin, margin + 64);

  const casoNombre = proceso.nombreCaso.trim() || 'Expediente Sin Título';
  const tipoProc = proceso.tipoProceso.trim() || 'Partición de Bienes General';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...colorTexto);
  doc.text('Caso / Asunto:', margin, margin + 82);
  doc.setFont('helvetica', 'normal');
  doc.text(casoNombre, margin + 85, margin + 82);

  doc.setFont('helvetica', 'bold');
  doc.text('Tipo de Proceso:', margin, margin + 98);
  doc.setFont('helvetica', 'normal');
  doc.text(tipoProc, margin + 85, margin + 98);

  const regimenTexto =
    proceso.regimenSucesoral === 'intestado'
      ? 'Intestado (Código Civil - Órdenes Sucesorales)'
      : 'Testado (Ley 1934/2018 - Legítima 50% / Libre Disp. 50%)';

  doc.setFont('helvetica', 'bold');
  doc.text('Régimen Sucesoral:', margin, margin + 114);
  doc.setFont('helvetica', 'normal');
  doc.text(regimenTexto, margin + 100, margin + 114);

  doc.setFont('helvetica', 'bold');
  doc.text('Patrimonio Bruto:', margin + 310, margin + 82);
  doc.setFont('helvetica', 'normal');
  doc.text(formatearMoneda(resultado.patrimonioBrutoCOP), margin + 410, margin + 82);

  doc.setFont('helvetica', 'bold');
  doc.text('Masa Neta Partible:', margin + 310, margin + 98);
  doc.setFont('helvetica', 'normal');
  doc.text(formatearMoneda(resultado.patrimonioNetoPartibleCOP), margin + 410, margin + 98);

  let currentY = margin + 130;

  // 3. INVENTARIO DE BIENES Y AVALÚO (COP)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...colorPrimario);
  doc.text('II. INVENTARIO Y AVALÚO DE BIENES Y DERECHOS (COP)', margin, currentY);

  const filasBienes = proceso.bienes.map((b, i) => {
    const personaAsignada = proceso.personas.find((p) => p.id === b.asignadoAId);
    const asignacionTexto = personaAsignada ? personaAsignada.nombre : 'Masa Común / Por Liquidar';
    const pct =
      resultado.patrimonioBrutoCOP > 0
        ? `${((b.valor / resultado.patrimonioBrutoCOP) * 100).toFixed(2)}%`
        : '0.00%';

    return [`${i + 1}`, b.nombre, asignacionTexto, formatearMoneda(b.valor), pct];
  });

  if (filasBienes.length === 0) {
    filasBienes.push(['—', 'Sin bienes inventariados', '—', '$ 0 COP', '0.00%']);
  }

  autoTable(doc, {
    startY: currentY + 8,
    margin: { left: margin, right: margin },
    head: [['#', 'Descripción del Bien / Empresa', 'Adjudicación Específica', 'Avalúo Comercial (COP)', '% Bruto']],
    body: filasBienes,
    foot: [
      [
        '',
        'TOTAL PATRIMONIO BRUTO INVENTARIADO',
        '',
        formatearMoneda(resultado.patrimonioBrutoCOP),
        '100.00%',
      ],
    ],
    theme: 'plain',
    headStyles: {
      fillColor: colorPrimario,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 4,
    },
    bodyStyles: {
      textColor: colorTexto,
      fontSize: 8,
      cellPadding: 4,
    },
    footStyles: {
      fillColor: colorFondoTabla,
      textColor: colorPrimario,
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 4,
    },
    alternateRowStyles: {
      fillColor: colorFondoTabla,
    },
    columnStyles: {
      0: { cellWidth: 24, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 130 },
      3: { cellWidth: 120, halign: 'right' },
      4: { cellWidth: 50, halign: 'right' },
    },
  });

  // @ts-expect-error autoTable adds lastAutoTable to doc
  currentY = doc.lastAutoTable.finalY + 18;

  // 4. COSTOS Y HONORARIOS
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...colorPrimario);

  const viaProceso = proceso.honorarios.viaProceso ?? 'judicial';
  const esNotarial = viaProceso === 'notarial';

  const tituloSeccion = esNotarial
    ? 'III. COSTOS DEL PROCESO: VÍA NOTARIAL (MUTUO ACUERDO)'
    : 'III. COSTOS Y GASTOS PROCESALES: VÍA JUDICIAL (LITIGIO)';
  doc.text(tituloSeccion, margin, currentY);

  const modalidadTextoAbogado =
    proceso.honorarios.modalidad === 'fijo'
      ? 'Monto fijo acordado'
      : `${resultado.deducciones.abogadoPorcentaje.toFixed(1)}% del patrimonio bruto`;

  const filasHonorarios: string[][] = [
    [
      'Honorarios de Abogado (Deducción previa de masa común)',
      modalidadTextoAbogado,
      formatearMoneda(resultado.deducciones.abogadoCOP),
    ],
  ];

  if (esNotarial) {
    filasHonorarios.push([
      'Agencias en Derecho (Inaplicable en mutuo acuerdo notarial)',
      'No aplica en Vía Notarial (Art. 365 C.G.P.)',
      '$ 0 COP',
    ]);
  } else {
    const mov = resultado.movimientoAgencias;
    const estadoTexto =
      proceso.honorarios.estadoAgencias === 'confirmado'
        ? 'Confirmado por Sentencia'
        : 'Estimado en Litigio';

    const detallePartes =
      mov?.quienPagaNombre && mov?.quienRecibeNombre
        ? `Cargo: ${mov.quienPagaNombre} -> A favor: ${mov.quienRecibeNombre} (${estadoTexto})`
        : `Entre partes del litigio (${estadoTexto})`;

    const detalleDivision =
      (mov?.quienesPaganNombres && mov.quienesPaganNombres.length > 1) ||
      (mov?.quienesRecibenNombres && mov.quienesRecibenNombres.length > 1)
        ? `Condena dividida en partes iguales (${formatearMoneda(mov?.montoPorPagadorCOP || 0)} c/u pagador -> ${formatearMoneda(mov?.montoPorReceptorCOP || 0)} c/u receptor)`
        : 'Condena individual entre partes litigantes';

    filasHonorarios.push([
      `Agencias en Derecho / Costas Judiciales (${detallePartes})`,
      detalleDivision,
      `${formatearMoneda(resultado.deducciones.agenciasDerechoCOP)}*`,
    ]);
  }

  autoTable(doc, {
    startY: currentY + 8,
    margin: { left: margin, right: margin },
    head: [['Concepto', 'Base / Calidad Jurídica', 'Monto (COP)']],
    body: filasHonorarios,
    foot: [
      [
        'TOTAL DEDUCIDO DE LA MASA COMÚN PATRIMONIAL',
        'Honorarios profesionales',
        formatearMoneda(resultado.deducciones.totalDeduccionesCOP),
      ],
      [
        'PATRIMONIO NETO LÍQUIDO A REPARTIR (100%)',
        'Masa divisible entre herederos/partícipes',
        formatearMoneda(resultado.patrimonioNetoPartibleCOP),
      ],
    ],
    theme: 'plain',
    headStyles: {
      fillColor: colorPrimario,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 4,
    },
    bodyStyles: {
      textColor: colorTexto,
      fontSize: 8,
      cellPadding: 4,
    },
    footStyles: {
      fillColor: colorFondoTabla,
      textColor: colorPrimario,
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 4,
    },
    alternateRowStyles: {
      fillColor: colorFondoTabla,
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 170 },
      2: { cellWidth: 120, halign: 'right' },
    },
  });

  // @ts-expect-error autoTable adds lastAutoTable to doc
  currentY = doc.lastAutoTable.finalY + 18;

  // 5. MARCO JURÍDICO Y LEYES APLICADAS
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...colorPrimario);
  doc.text('IV. MARCO LEGAL Y LEYES APLICADAS AL CASO', margin, currentY);

  if (resultado.ordenSucesoral && resultado.ordenSucesoral.titulo) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...colorGris);
    doc.text(`Criterio Sucesoral: ${resultado.ordenSucesoral.titulo}`, margin, currentY + 12);
    currentY += 8;
  }

  const leyesParaPDF =
    resultado.leyesCalculadas && resultado.leyesCalculadas.length > 0
      ? resultado.leyesCalculadas
      : proceso.leyes
          .filter((l) => l.activa)
          .map((l) => ({
            id: l.id,
            nombre: l.nombre,
            porcentaje: l.porcentaje,
            baseCalculo: l.baseCalculo || 'patrimonio_total',
            baseDineroCOP: resultado.patrimonioNetoPartibleCOP,
            montoCalculadoCOP: resultado.patrimonioNetoPartibleCOP * (l.porcentaje / 100),
            leyPadreNombre: undefined,
          }));

  const filasLeyes = leyesParaPDF.map((dl, i) => {
    const baseDetalle =
      dl.baseCalculo === 'remanente_de_ley' && dl.leyPadreNombre
        ? `Remanente de ${dl.leyPadreNombre} (${formatearMoneda(dl.baseDineroCOP)})`
        : `Patrimonio Total (${formatearMoneda(dl.baseDineroCOP)})`;

    return [
      `${i + 1}`,
      dl.nombre,
      `${dl.porcentaje.toFixed(1)}%`,
      baseDetalle,
      formatearMoneda(dl.montoCalculadoCOP),
    ];
  });

  if (resultado.remanenteSinAsignarCOP > 1) {
    filasLeyes.push([
      '!',
      'REMANENTE SIN ASIGNAR (Masa pendiente de adjudicación)',
      '—',
      'Sin asignar',
      formatearMoneda(resultado.remanenteSinAsignarCOP),
    ]);
  }

  if (filasLeyes.length === 0) {
    filasLeyes.push([
      '—',
      'Sin leyes especiales (Repartición equitativa directa)',
      '100.00%',
      `Patrimonio Total (${formatearMoneda(resultado.patrimonioNetoPartibleCOP)})`,
      formatearMoneda(resultado.patrimonioNetoPartibleCOP),
    ]);
  }

  autoTable(doc, {
    startY: currentY + 8,
    margin: { left: margin, right: margin },
    head: [['#', 'Norma Jurídica / Ley de Partición', '% Cuota', 'Base de Cálculo (COP)', 'Monto Asignado (COP)']],
    body: filasLeyes,
    theme: 'plain',
    headStyles: {
      fillColor: colorPrimario,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 4,
    },
    bodyStyles: {
      textColor: colorTexto,
      fontSize: 8,
      cellPadding: 4,
    },
    alternateRowStyles: {
      fillColor: colorFondoTabla,
    },
    columnStyles: {
      0: { cellWidth: 24, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 60, halign: 'right' },
      3: { cellWidth: 100 },
      4: { cellWidth: 120, halign: 'right' },
    },
  });

  // @ts-expect-error autoTable adds lastAutoTable to doc
  currentY = doc.lastAutoTable.finalY + 20;

  // Control de salto de página
  if (currentY > pageHeight - 220) {
    doc.addPage();
    currentY = margin + 20;
  }

  // 6. LIQUIDACIÓN Y ASIGNACIÓN FINAL POR PERSONA
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...colorPrimario);
  doc.text('V. HIJUELAS INDIVIDUALES: ADJUDICACIÓN DE BIENES Y VALORES', margin, currentY);

  const filasAsignacion = resultado.desglosePersonas.map((item, idx) => {
    const p = item.persona;
    let relacionLabel =
      p.tipoRelacion === 'Familiar'
        ? `Familiar (${p.parentesco || 'Sin especificar'})`
        : 'Amigo/Socio';

    if (item.excluidoPorIndignidad || p.declaradoIndigno) {
      relacionLabel += ' [Indigno - Art. 1025 C.C.]';
    } else if (item.excluidoPorDesheredamiento || p.desheredado) {
      relacionLabel += ' [Desheredado - Arts. 1265-1281]';
    }

    let bienesTexto =
      item.excluidoPorIndignidad || p.declaradoIndigno
        ? 'Excluido por indignidad (Cuota acrecida a herederos)'
        : item.bienesAsignadosNombres && item.bienesAsignadosNombres.length > 0
        ? item.bienesAsignadosNombres.join('; ')
        : 'Cuota dineraria / Sin bien inmueble exclusivo';

    if (item.ajusteAgenciasCOP && item.ajusteAgenciasCOP !== 0) {
      const signo = item.ajusteAgenciasCOP > 0 ? '+' : '';
      bienesTexto += ` [Agencias: ${signo}${formatearMoneda(item.ajusteAgenciasCOP)}]`;
    }

    const valorFinalHijuela =
      item.totalFinalConAgenciasCOP !== undefined
        ? item.totalFinalConAgenciasCOP
        : item.totalAsignadoCOP;

    return [
      `${idx + 1}`,
      p.nombre,
      relacionLabel,
      bienesTexto,
      formatearMoneda(valorFinalHijuela),
      `${item.porcentajeDelTotal.toFixed(2)}%`,
    ];
  });

  if (filasAsignacion.length === 0) {
    filasAsignacion.push(['—', 'No se registraron personas', '—', '—', '$ 0 COP', '0.00%']);
  }

  autoTable(doc, {
    startY: currentY + 8,
    margin: { left: margin, right: margin },
    head: [['#', 'Partícipe / Heredero', 'Relación Jurídica', 'Bienes Asignados Específicos', 'Total Adjudicado (COP)', '% Neto']],
    body: filasAsignacion,
    foot: [
      [
        '',
        'TOTAL ASIGNADO EN HIJUELAS',
        '',
        resultado.remanenteSinAsignarCOP > 0
          ? `Remanente sin asignar: ${formatearMoneda(resultado.remanenteSinAsignarCOP)}`
          : '100% de masa líquida adjudicada',
        formatearMoneda(resultado.montoAsignadoPorLeyesCOP),
        '100.00%',
      ],
    ],
    theme: 'plain',
    headStyles: {
      fillColor: colorPrimario,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 4,
    },
    bodyStyles: {
      textColor: colorTexto,
      fontSize: 8,
      cellPadding: 4,
    },
    footStyles: {
      fillColor: colorFondoTabla,
      textColor: colorPrimario,
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 4,
    },
    alternateRowStyles: {
      fillColor: colorFondoTabla,
    },
    columnStyles: {
      0: { cellWidth: 24, halign: 'center' },
      1: { cellWidth: 110 },
      2: { cellWidth: 90 },
      3: { cellWidth: 'auto' },
      4: { cellWidth: 115, halign: 'right' },
      5: { cellWidth: 45, halign: 'right' },
    },
  });

  // @ts-expect-error autoTable adds lastAutoTable to doc
  currentY = doc.lastAutoTable.finalY + 22;

  if (currentY > pageHeight - 120) {
    doc.addPage();
    currentY = margin + 20;
  }

  // 7. DICTAMEN FINAL Y FIRMAS
  doc.setDrawColor(...colorPrimario);
  doc.setLineWidth(1.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...colorPrimario);
  doc.text('PATRIMONIO NETO LÍQUIDO DISTRIBUIDO:', margin, currentY + 18);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...colorPrimario);
  doc.text(formatearMoneda(resultado.patrimonioNetoPartibleCOP), pageWidth - margin, currentY + 18, {
    align: 'right',
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...colorGris);
  const impuestoInfo = resultado.gananciaOcasional
    ? ` • Impuesto de Ganancia Ocasional Estimado a cargo de los herederos (15% Ley 2277/2022, Arts. 302-306 E.T.): ${formatearMoneda(resultado.gananciaOcasional.impuestoTotalEstimadoCOP)} (Sujeto a exenciones de 3.250 / 7.700 UVT según Art. 307 E.T.).`
    : '';
  const notaLegal =
    perfilAbogado.leyendaNotarial && ajustesApp.incluirEncabezadoAbogadoEnPDF
      ? `${perfilAbogado.leyendaNotarial}${impuestoInfo}`
      : `El presente documento contiene la liquidación de hijuelas y adjudicación patrimonial calculada conforme a la legislación civil y comercial colombiana. Válido para suscribir escritura pública de partición o aportar a proceso judicial de sucesión.${impuestoInfo}`;
  doc.text(notaLegal, margin, currentY + 34, {
    maxWidth: pageWidth - margin * 2,
    lineHeightFactor: 1.25,
  });

  // Espacio de firmas formales
  currentY += 65;
  if (currentY < pageHeight - 50) {
    const firmaWidth = 140;
    // Firma Abogado
    doc.line(margin + 20, currentY, margin + 20 + firmaWidth, currentY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    const nombreFirma = (ajustesApp.incluirEncabezadoAbogadoEnPDF && perfilAbogado.nombre)
      ? perfilAbogado.nombre.toUpperCase()
      : 'ABOGADO DIRECTOR / APODERADO';
    doc.text(nombreFirma, margin + 20 + firmaWidth / 2, currentY + 12, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    const tpTexto = (ajustesApp.incluirEncabezadoAbogadoEnPDF && perfilAbogado.tarjetaProfesional)
      ? `T.P. No. ${perfilAbogado.tarjetaProfesional}`
      : 'T.P. No. _____________________';
    doc.text(tpTexto, margin + 20 + firmaWidth / 2, currentY + 22, { align: 'center' });
    if (ajustesApp.incluirEncabezadoAbogadoEnPDF && perfilAbogado.sitioWeb) {
      doc.setFontSize(6.5);
      doc.text(perfilAbogado.sitioWeb, margin + 20 + firmaWidth / 2, currentY + 31, { align: 'center' });
      doc.setFontSize(7.5);
    }

    // Firma Juez / Notario
    doc.line(pageWidth - margin - 20 - firmaWidth, currentY, pageWidth - margin - 20, currentY);
    doc.setFont('helvetica', 'bold');
    doc.text('JUEZ / NOTARIO COMPETENTE', pageWidth - margin - 20 - firmaWidth / 2, currentY + 12, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.text('Despacho / Notaría ___________', pageWidth - margin - 20 - firmaWidth / 2, currentY + 22, { align: 'center' });
  }

  // Numeración de páginas
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...colorGris);
    doc.text(
      `Gestor de Bienes — Expediente: ${casoNombre} — Página ${i} de ${totalPages}`,
      pageWidth / 2,
      pageHeight - 16,
      { align: 'center' }
    );
  }

  const cleanName = casoNombre.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30);
  doc.save(`Gestor_de_Bienes_${cleanName}.pdf`);
}
