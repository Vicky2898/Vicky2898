/* Documentos agregados con la lista actualizada de requisitos de licenciamiento:
   registro de mantenimiento del equipo de rayos X, matriz completa de registros institucionales
   y procedimiento para informar a la persona expuesta sobre beneficios y riesgos.
   Se carga después de blindaje.js y registra sus documentos en DOCS. */

/* ================================================================ REGISTRO DE MANTENIMIENTO */

function docRegMantenimiento(c) {
  const { V } = c;
  const lista = (c.S.mant || []).filter(m => m.serie || m.fecha).slice().sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''));
  const eqDe = (serie) => c.eq.find(e => e.serie && e.serie === serie) || {};
  const filas = lista.map((m, i) => {
    const e = eqDe(m.serie);
    const mal = /No apto|Fuera/i.test(m.resultado || '');
    return [{ t: String(i + 1), align: 'c' }, fCorta(m.fecha), `${e.tipo || 'Equipo'} ${e.marca || ''} (${m.serie || 'NR'})`, m.tipo || '', `${m.empresa || V.mantEmpresa || ''}${(m.licEmpresa || V.mantLicencia) ? `\nLic. ${m.licEmpresa || V.mantLicencia}` : ''}`, `${m.tecnico || V.mantTecnico || ''}${(m.licTecnico || V.mantTecLicencia) ? `\nLic. ${m.licTecnico || V.mantTecLicencia}` : ''}`, m.informe || '', m.descripcion || '', { t: m.resultado || '', align: 'c', bold: true, fill: m.resultado ? (mal ? 'F8CBAD' : (/observ/i.test(m.resultado) ? 'FFE699' : 'C6E0B4')) : null }, fCorta(m.proxima), ''];
  });
  const resumen = c.eqAct.map(e => {
    const ult = lista.filter(m => m.serie === e.serie).pop() || {};
    const fecha = ult.fecha || e.mantFecha;
    const d = fecha ? diasHasta(fecha) : null;
    return [`${e.tipo || ''} ${e.marca || ''} ${e.modelo || ''}`.trim(), e.serie || 'NR', fCorta(fecha) || '—', ult.resultado || '—', fCorta(ult.proxima) || '—', { t: d == null ? 'Sin registro' : (d < -365 ? 'Vencido' : 'Al día'), align: 'c', bold: true, fill: d == null || d < -365 ? 'F8CBAD' : 'C6E0B4' }];
  });
  const blocks = [
    Ps(`Historial de mantenimiento preventivo, correctivo y control de calidad de los equipos generadores de radiación ionizante de la práctica de ${c.P.corto} de ${ph(c.I.razonSocial, 'Razón social')}. Cada intervención la realiza una empresa autorizada por la Autoridad Reguladora y se respalda con el informe técnico en el formato aprobado, firmado por el técnico con licencia personal vigente.`, { align: 'j' }),
    KV([
      ['Empresa de mantenimiento', ph(V.mantEmpresa, 'Empresa')],
      ['Licencia institucional de la empresa', ph(V.mantLicencia, 'N.º de licencia')],
      ['Técnico responsable / licencia personal', `${ph(V.mantTecnico, 'Técnico')} / ${ph(V.mantTecLicencia, 'N.º de licencia')}`],
      ['Contrato vigente hasta', V.mantVigencia ? fLarga(V.mantVigencia) : '[Vigencia]']
    ]),
    T(['N.º', 'Fecha', 'Equipo (serie)', 'Tipo de intervención', 'Empresa / licencia', 'Técnico / licencia', 'Informe N.º', 'Trabajos y hallazgos', 'Resultado', 'Próxima', 'Firma OSR'], [...filas, ...blancos(filas.length ? 3 : 6, 11)], { widths: [4, 8, 13, 11, 12, 11, 8, 17, 7, 7, 7], small: true }),
    Ps('Estado por equipo', { bold: true }),
    T(['Equipo', 'Serie', 'Último mantenimiento / CC', 'Resultado', 'Próxima intervención', 'Estado'], resumen.length ? resumen : [['', '', '', '', '', '']], { widths: [30, 12, 16, 16, 14, 12], small: true }),
    NOTE('«Vencido» indica más de 12 meses desde la última intervención. Un resultado «No apto» deja el equipo fuera de uso clínico hasta su reparación y un nuevo control de calidad.'),
    SIGN([c.firmas.osr])
  ];
  return { title: 'Registro de mantenimiento y control de calidad de los equipos de rayos X', kind: 'sgc', landscape: true, blocks };
}

/* ================================================================ MATRIZ DE REGISTROS */

const PARTES_MATRIZ = [
  ['REG-LIC', 'Registro de licencia institucional'],
  ['REG-LIC', 'Registro de licencias personales del POE'],
  ['REG-EPP', 'Registro de inventario de los elementos de protección radiológica (con fotografías)'],
  ['REG-DOS', 'Registro de vigilancia dosimétrica'],
  ['REG-MED', 'Registro de vigilancia médica'],
  ['REG-MANT', 'Registro de mantenimiento del equipo de rayos X'],
  ['REG-INSP', 'Registro y seguimiento de las inspecciones de la DLPR'],
  ['REG-INC', 'Registro de incidentes y accidentes']
];

function docMatrizRegistros(c) {
  const vistos = new Set();
  const partes = [];
  PARTES_MATRIZ.forEach(([id]) => {
    if (vistos.has(id)) return;
    vistos.add(id);
    const d = DOCS.find(x => x.id === id);
    if (d && d.aplica(c)) partes.push(Object.assign(d.build(c), { id, code: codigoDoc(c, id) }));
  });
  const indice = PARTES_MATRIZ.map(([id, nombre], i) => {
    const p = partes.find(x => x.id === id);
    return [{ t: String(i + 1), align: 'c' }, nombre, p ? p.code : '—', p ? p.title : 'No aplica'];
  });
  const blocks = [
    Ps(`Matriz de los registros institucionales de seguridad radiológica de ${ph(c.I.razonSocial, 'Razón social')}, práctica de ${c.P.corto}. Reúne en un solo documento los registros que la Autoridad Reguladora solicita para el licenciamiento; en la versión de Excel cada registro ocupa su propia hoja.`, { align: 'j' }),
    T(['N.º', 'Registro', 'Código', 'Documento'], indice, { widths: [6, 44, 22, 28], small: true }),
    SIGN([{ ...c.firmas.osr, label: 'Elaborado por' }, { ...c.firmas.rep, label: 'Aprobado por' }])
  ];
  partes.forEach(p => {
    blocks.push(PB(), H(`${p.code} · ${p.title}`));
    // Las firmas de cada registro se omiten: la matriz se firma una sola vez en la portada
    p.blocks.filter(b => b.t !== 'sign').forEach(b => blocks.push(b));
  });
  return { title: 'Matriz de registros institucionales', kind: 'sgc', landscape: true, blocks, partes };
}

/* ================================================================ INFORMACIÓN AL PACIENTE */

function docInformacionPaciente(c) {
  const { I, P, S } = c;
  const odont = S.practica === 'odontologico';
  const interv = S.practica === 'intervencionista';
  const estudio = interv ? 'procedimiento' : 'estudio';
  const prof = odont ? 'odontólogo' : (interv ? 'médico intervencionista' : 'médico');
  const riesgos = interv
    ? [['Beneficio esperado', 'Diagnóstico o tratamiento de la enfermedad sin cirugía abierta, con menor tiempo de recuperación.'], ['Riesgos por radiación', 'En procedimientos largos o complejos puede aparecer enrojecimiento de la piel en la zona expuesta días o semanas después; el riesgo de efectos a largo plazo es bajo y menor que el beneficio esperado.'], ['Otros riesgos', 'Los propios del procedimiento y del medio de contraste, que explica el médico tratante.']]
    : [['Beneficio esperado', `Obtener información diagnóstica necesaria para decidir el tratamiento.`], ['Riesgos por radiación', `La dosis de un ${odont ? 'estudio odontológico' : 'estudio radiográfico'} es baja; el riesgo de efectos a largo plazo es muy pequeño frente al beneficio diagnóstico. No produce efectos inmediatos.`], ['Embarazo', 'Se pregunta siempre; si existe o se sospecha embarazo se aplica el procedimiento de justificación antes de realizar el estudio.']];
  const blocks = [
    H('1. Objetivo'),
    Ps(`Establecer cómo se informa a la persona que será expuesta, o a su representante o apoderado, sobre los beneficios esperados y los riesgos asociados al ${estudio} radiológico antes de realizarlo, en la práctica de ${P.corto} de ${ph(I.razonSocial, 'Razón social')}.`, { align: 'j' }),
    H('2. Alcance'),
    Ps(`Aplica a todos los pacientes que se realizan ${odont ? 'estudios radiográficos odontológicos' : (interv ? 'procedimientos intervencionistas guiados por fluoroscopia' : 'estudios de radiodiagnóstico')} en la institución, incluidos menores de edad y personas que no pueden decidir por sí mismas, en cuyo caso se informa a su representante legal o apoderado.`, { align: 'j' }),
    H('3. Responsables'),
    L([
      `El ${prof} que prescribe o realiza el ${estudio} explica la justificación clínica, los beneficios y los riesgos${interv ? ', y obtiene el consentimiento informado firmado' : ''}.`,
      `El ${odont ? 'personal operador' : 'tecnólogo o personal operador'} confirma, antes de la exposición, que la persona fue informada, resuelve dudas sobre la técnica y pregunta por un posible embarazo.`,
      `El ${c.rolOSR} mantiene actualizado este procedimiento y los materiales informativos, y capacita al personal en su aplicación.`
    ]),
    H('4. Desarrollo'),
    L([
      'Verificar la identidad de la persona con dos datos (nombres completos y cédula) y que exista prescripción documentada.',
      `Explicar en lenguaje sencillo qué ${estudio} se realizará, para qué sirve y qué información aportará.`,
      'Informar los beneficios esperados y los riesgos asociados a la radiación, en proporción a la dosis del estudio, y si existen alternativas sin radiación ionizante.',
      'Preguntar a toda mujer en edad fértil si está o podría estar embarazada; en caso afirmativo, aplicar el procedimiento de justificación para pacientes embarazadas.',
      'En pacientes pediátricos, informar a los padres o al representante y explicar las medidas de protección que se usarán (técnica pediátrica, colimación y blindajes).',
      'Si un acompañante debe sujetar al paciente, informarle de su exposición, entregarle el delantal y el collarín plomados y registrar su participación; no puede ser una mujer embarazada ni un menor de edad.',
      `Resolver las preguntas de la persona y confirmar que comprendió la información.${interv ? ' Obtener la firma del consentimiento informado antes del procedimiento.' : ' En estudios con medio de contraste o de mayor dosis, obtener la firma del consentimiento informado.'}`,
      'Dejar constancia en la solicitud del estudio o en la historia clínica de que se informó a la persona, con la fecha y el nombre de quien informó.'
    ], true),
    H('5. Contenido mínimo de la información'),
    KV(riesgos),
    H('6. Registros'),
    L([
      `Consentimiento informado (${codigoDoc(c, 'CONS-INF') || 'formato de consentimiento'}), cuando corresponde.`,
      'Constancia en la solicitud del estudio o en la historia clínica.',
      'Rótulos informativos para pacientes y acompañantes en la sala de espera y en la puerta de la sala.'
    ]),
    aprobaciones(c)
  ];
  return { title: `Procedimiento para informar a la persona expuesta sobre beneficios y riesgos`, kind: 'sgc', blocks };
}

/* Registro de documentos nuevos */
(function () {
  registrarDoc({ id: 'REG-MANT', tipo: 'REG-MNT', grupo: 'Registros', aplica: () => true, build: docRegMantenimiento, nota: 'Requisito III.6 · lista actualizada de licenciamiento' }, 'REG-EQ');
  registrarDoc({ id: 'MAT-REG', tipo: 'MTZ-REG', grupo: 'Registros', aplica: () => true, build: docMatrizRegistros, nota: 'Requisito III.5 · una hoja por registro en Excel' }, 'REG-CAP');
  registrarDoc({ id: 'PROC-INF', tipo: 'PRO-INF', grupo: 'Planes y procedimientos', aplica: () => true, build: docInformacionPaciente, nota: 'Requisito III.7' }, 'PROC-PRES');
})();
