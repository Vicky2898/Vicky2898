/* Redacción de cada documento del expediente.
   Cada constructor recibe el contexto (datos del expediente + práctica) y devuelve
   { code, title, kind, landscape, blocks }. Los bloques los dibuja render.js
   en pantalla, Word, PDF y Excel. */

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function parseFecha(iso) {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
}
function fLarga(iso) {
  const d = parseFecha(iso);
  return d ? `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}` : '[fecha]';
}
function fCorta(iso) {
  const d = parseFecha(iso);
  if (!d) return '';
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}
function hoyISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function diasHasta(iso) {
  const d = parseFecha(iso);
  if (!d) return null;
  const h = parseFecha(hoyISO());
  return Math.round((d - h) / 86400000);
}
function estadoVigencia(iso) {
  const n = diasHasta(iso);
  if (n === null) return 'Sin dato';
  if (n < 0) return 'Caducada';
  if (n <= 90) return 'Por caducar';
  return 'Vigente';
}
/* Texto entre corchetes para que se note lo que falta llenar */
const ph = (v, etiqueta) => (v && String(v).trim()) ? String(v).trim() : `[${etiqueta}]`;

/* Bloques */
const H = (text) => ({ t: 'h', text });
const Ps = (text, o = {}) => ({ t: 'p', text, ...o });
const L = (items, ordered = false) => ({ t: 'list', items, ordered });
const T = (head, rows, o = {}) => ({ t: 'table', head, rows, ...o });
const KV = (rows, o = {}) => ({ t: 'kv', rows, ...o });
const LINES = (items, o = {}) => ({ t: 'lines', items, ...o });
const SIGN = (items) => ({ t: 'sign', items });
const NOTE = (text) => ({ t: 'note', text });
const SP = () => ({ t: 'space' });
const PB = () => ({ t: 'pb' });

const GRUPOS = ['Oficios', 'Declaraciones y nombramientos', 'Planes y procedimientos', 'Informes y listados', 'Registros', 'Formatos y rótulos'];

function crearContexto(S) {
  const P = PRACTICAS[S.practica];
  const I = S.inst, R = S.resp, V = S.serv, O = S.oficio, M = S.meta;
  const poe = S.poe.filter(p => (p.nombre || '').trim());
  const eq = S.equipos.filter(e => (e.tipo || e.marca || e.serie));
  const BAJA = /baja|Vendido|Donado|Trasladado|Devuelto/i;
  const eqAct = eq.filter(e => !BAJA.test(e.estado || ''));
  const eqBaja = eq.filter(e => BAJA.test(e.estado || ''));
  const epp = S.epp.filter(e => (e.tipo || e.codigo));
  const fecha = M.fechaEmision || hoyISO();
  const anio = M.anioPlan || (parseFecha(fecha) || new Date()).getFullYear();
  const pref = (M.prefijo || 'SR').trim();
  const rolOSR = R.osrAplica ? 'Oficial de Seguridad Radiológica' : 'Responsable de protección radiológica';
  const tiposPresentes = eqAct.map(e => e.tipo || '').join(' | ');
  const tiene = (re) => re.test(tiposPresentes);

  const firmas = {
    rep: { name: ph(I.repLegal, 'Representante legal'), role: [I.repCargo || 'Gerente General', 'Representante legal'].filter(Boolean).join('\n'), ced: I.repCedula, sello: true },
    osr: { name: ph(R.osrNombre, R.osrAplica ? 'Nombre del OSR' : 'Nombre del responsable'), role: rolOSR, ced: R.osrCedula },
    med: { name: ph(R.medNombre, 'Nombre del ' + P.profResp), role: P.tituloResp, ced: R.medCedula }
  };
  /* Si el representante legal es también responsable (consultorios), no repetir firmas idénticas */
  const mismaPersona = (a, b) => a.name && b.name && a.name.replace(/\W/g, '').toLowerCase() === b.name.replace(/\W/g, '').toLowerCase();

  return { S, P, I, R, V, O, M, poe, eq, eqAct, eqBaja, epp, fecha, anio, pref, rolOSR, tiene, firmas, mismaPersona };
}

function aprobaciones(c) {
  const items = [
    { label: 'Elaborado por', ...c.firmas.osr },
    { label: 'Revisado por', ...c.firmas.med },
    { label: 'Aprobado por', ...c.firmas.rep }
  ];
  return SIGN(items);
}

function lugarFecha(c) {
  return `${ph(c.I.ciudad, 'Ciudad')}, ${fLarga(c.fecha)}`;
}

function destinatarioMEM(c) {
  return LINES([
    ph(c.O.tecnicoTitulo, 'Título'),
    ph(c.O.tecnicoNombre, 'Nombre del técnico'),
    ph(c.O.tecnicoCargo, 'Cargo'),
    'Dirección de Licenciamiento y Protección Radiológica',
    'MINISTERIO DE ENERGÍA Y MINAS',
    'En su despacho.'
  ]);
}

function ubicacion(c) {
  return `${ph(c.I.direccion, 'Dirección')}, cantón ${ph(c.I.ciudad, 'Ciudad')}, provincia de ${ph(c.I.provincia, 'Provincia')}`;
}

/* Estado de cada requisito en la lista de verificación */
const ESTADOS_REQ = ['Se adjunta', 'No aplica', 'En trámite', 'Pendiente'];
function estadoReq(c, r) {
  const v = (c.S.check[r.id] || {}).estado;
  if (v) return v;
  if (r.id === 'I-7' || r.id === 'I-23') return c.R.osrAplica ? 'Se adjunta' : 'No aplica';
  if (r.id === 'II-9') return c.eqBaja.length ? 'Se adjunta' : 'No aplica';
  if (r.id === 'I-31') return c.S.practica === 'odontologico' ? 'No aplica' : 'Se adjunta';
  return r.ext && !r.doc ? 'Pendiente' : 'Se adjunta';
}

/* ---------------------------------------------------------------- OFICIOS */

function docOficioRespuesta(c) {
  const { I, O, P } = c;
  const filas = REQUISITOS.map(r => [r.id.replace('II-', 'II.').replace('I-', ''), r.txt, estadoReq(c, r), (c.S.check[r.id] || {}).obs || '']);
  const noAplica = REQUISITOS.filter(r => estadoReq(c, r) === 'No aplica');
  const tramite = REQUISITOS.filter(r => estadoReq(c, r) === 'En trámite');
  const blocks = [
    Ps(`Oficio Nro. ${ph(O.numResp, 'Número de oficio de la institución')}`, { align: 'r', bold: true }),
    Ps(lugarFecha(c), { align: 'r' }),
    SP(),
    Ps(`**Asunto:** Entrega de requisitos documentales para la inspección de seguridad radiológica de la práctica de ${P.corto}, en atención al Oficio Nro. ${ph(O.numero, 'Oficio del MEM')}.`),
    SP(),
    destinatarioMEM(c),
    SP(),
    Ps('De mi consideración:'),
    Ps(`En atención al Oficio Nro. ${ph(O.numero, 'Oficio del MEM')}, de ${fLarga(O.fecha)}, mediante el cual esa Dirección notificó la inspección de seguridad radiológica a la práctica de ${P.corto} de ${ph(I.razonSocial, 'Razón social')}, ubicada en ${ubicacion(c)}${O.tramite ? `, dentro del trámite ${O.tramite}` : ''}, remito la documentación solicitada en el mismo orden del requerimiento.`, { align: 'j' }),
    Ps('El detalle de lo que se adjunta es el siguiente:', { align: 'j' }),
    T(['N.º', 'Requisito', 'Estado', 'Observación'], filas, { widths: [8, 54, 14, 24], small: true })
  ];
  if (noAplica.length) {
    blocks.push(Ps(`Los numerales marcados como «No aplica» (${noAplica.map(r => r.id).join(', ')}) corresponden a supuestos en los que la instalación no se encuentra; la justificación de cada uno consta en la columna de observaciones.`, { align: 'j' }));
  }
  if (tramite.length) {
    blocks.push(Ps(`Respecto de los numerales ${tramite.map(r => r.id).join(', ')}, adjuntamos el respaldo de la gestión iniciada y remitiremos el documento definitivo en cuanto sea emitido.`, { align: 'j' }));
  }
  blocks.push(
    Ps(`Para cualquier aclaración, la persona de contacto es ${ph(c.R.osrNombre, 'Nombre del responsable')}, ${c.rolOSR.toLowerCase()}, teléfono ${ph(c.R.osrTelefono || I.telefono, 'Teléfono')}, correo electrónico ${ph(c.R.osrCorreo || I.correo, 'Correo')}.`, { align: 'j' }),
    Ps('Con sentimientos de distinguida consideración.'),
    Ps('Atentamente,'),
    SIGN([c.firmas.rep])
  );
  return { code: `${c.pref}-OF-01`, title: 'Oficio de entrega de requisitos', kind: 'carta', blocks };
}

function docOficioDisposiciones(c) {
  const { I, O } = c;
  const disp = c.S.disp.filter(d => (d.nc || d.accion));
  const blocks = [
    Ps(`Oficio Nro. ${ph(O.numDisp || O.numResp, 'Número de oficio de la institución')}`, { align: 'r', bold: true }),
    Ps(lugarFecha(c), { align: 'r' }),
    SP(),
    Ps(`**Asunto:** Cumplimiento de disposiciones del Informe de Inspección Documental de Seguridad Radiológica${O.informeNum ? ' ' + O.informeNum : ''} – ${ph(I.razonSocial, 'Razón social')}.`),
    SP(),
    destinatarioMEM(c),
    SP(),
    Ps('De mi consideración:'),
    Ps(`Me refiero al Informe de Inspección Documental de Seguridad Radiológica${O.informeNum ? ' remitido con Oficio Nro. ' + O.informeNum : ''}${O.informeFecha ? ', de ' + fLarga(O.informeFecha) : ''}, en el que la Dirección de Licenciamiento y Protección Radiológica estableció ${disp.length || 'las'} disposiciones para la práctica de ${c.P.corto} de nuestra instalación, con un plazo de ${O.plazo || 90} días hábiles para su cumplimiento.`, { align: 'j' }),
    Ps('Dentro de ese plazo, informo las acciones ejecutadas y adjunto los respaldos correspondientes:', { align: 'j' }),
    T(['N.º', 'No conformidad', 'Acción ejecutada', 'Anexo'], (disp.length ? disp : [{ nc: '', accion: '', anexo: '' }]).map((d, i) => [String(i + 1), ph(d.nc, 'No conformidad'), ph(d.accion, 'Acción ejecutada'), d.anexo || `Anexo ${i + 1}`]), { widths: [7, 36, 42, 15], small: true }),
    Ps('Con lo expuesto, solicito comedidamente que se verifique el cumplimiento y se continúe con el trámite de licenciamiento institucional.', { align: 'j' }),
    Ps('Atentamente,'),
    SIGN([c.firmas.rep])
  ];
  return { code: `${c.pref}-OF-02`, title: 'Oficio de cumplimiento de disposiciones', kind: 'carta', blocks };
}

function docOficioBaja(c) {
  const { I } = c;
  const filas = c.eqBaja.map(e => [e.tipo || '', e.marca || '', e.modelo || '', e.serie || '', e.estado || '', fCorta(e.destinoFecha), e.destinoDoc || '']);
  const hayChatarra = c.eqBaja.some(e => /baja/i.test(e.estado || ''));
  const blocks = [
    Ps(`Oficio Nro. ${ph(c.O.numBaja, 'Número de oficio de la institución')}`, { align: 'r', bold: true }),
    Ps(lugarFecha(c), { align: 'r' }),
    SP(),
    Ps(`**Asunto:** Notificación del destino final de equipos generadores de radiación ionizante – ${ph(I.razonSocial, 'Razón social')}.`),
    SP(),
    destinatarioMEM(c),
    SP(),
    Ps('De mi consideración:'),
    Ps(`En cumplimiento del artículo 70 del ${REGLAMENTO}, pongo en conocimiento de la Autoridad Reguladora el destino final de los equipos que constaban registrados bajo responsabilidad de ${ph(I.razonSocial, 'Razón social')}, RUC ${ph(I.ruc, 'RUC')}:`, { align: 'j' }),
    T(['Tipo', 'Marca', 'Modelo', 'Serie', 'Destino', 'Fecha', 'Respaldo'], filas.length ? filas : [['', '', '', '', '', '', '']], { small: true }),
    hayChatarra
      ? Ps('Para los equipos dados de baja se adjunta el acta de chatarrización correspondiente, en la que constan la inutilización del tubo de rayos X y la identificación de cada equipo.', { align: 'j' })
      : Ps('Se adjuntan los documentos que respaldan la transferencia de cada equipo.', { align: 'j' }),
    Ps('Solicito que estos equipos sean excluidos del registro de la instalación.', { align: 'j' }),
    Ps('Atentamente,'),
    SIGN([c.firmas.rep])
  ];
  return { code: `${c.pref}-OF-03`, title: 'Oficio de destino final de equipos', kind: 'carta', blocks };
}

/* ---------------------------------------------------- DECLARACIONES Y NOMBRAMIENTOS */

function docDeclaracionMaxima(c) {
  const { I, P } = c;
  const blocks = [
    Ps('DECLARACIÓN DE RESPONSABILIDAD SOBRE LA SEGURIDAD RADIOLÓGICA', { align: 'c', bold: true }),
    SP(),
    Ps(`Yo, **${ph(I.repLegal, 'Nombre del representante legal')}**, con cédula de ciudadanía N.º ${ph(I.repCedula, 'Cédula')}, en mi calidad de ${ph(I.repCargo, 'Cargo')} y representante legal de **${ph(I.razonSocial, 'Razón social')}**, con RUC ${ph(I.ruc, 'RUC')}, declaro de forma expresa que asumo la condición de **Máximo Responsable por la Seguridad Radiológica** de la instalación ubicada en ${ubicacion(c)}, donde se desarrolla la práctica de ${P.corto}. Lo hago conforme al artículo 17, literal d) del ${REGLAMENTO}.`, { align: 'j' }),
    Ps('En consecuencia, me comprometo a:', { align: 'j' }),
    L([
      `Destinar los recursos humanos, técnicos y económicos para que la práctica se desarrolle según el Reglamento de Seguridad Radiológica y la ${NORMA_LARGA}.`,
      'Mantener vigentes la licencia institucional y las licencias ocupacionales de todo el personal ocupacionalmente expuesto (POE).',
      'Proveer el servicio de dosimetría personal y la vigilancia médica anual del POE.',
      'Contratar el mantenimiento preventivo y correctivo y el control de calidad de los equipos con empresas que tengan licencia vigente para la práctica.',
      'Notificar por escrito a la Autoridad Reguladora el ingreso y la salida del POE, así como la compra, venta, donación, traslado, cambio de tubo o baja de cualquier equipo.',
      'Comunicar de inmediato a la Autoridad Reguladora cualquier incidente o accidente radiológico.',
      'Facilitar el ingreso y el trabajo de los inspectores de seguridad radiológica y entregar la información que requieran.'
    ], true),
    Ps(`Las funciones operativas que delego en ${c.R.osrAplica ? 'el Oficial de Seguridad Radiológica' : 'el responsable de protección radiológica'} y en el ${P.profResp} no me eximen de la responsabilidad que me corresponde como representante legal.`, { align: 'j' }),
    Ps(`Para constancia, firmo en ${ph(I.ciudad, 'Ciudad')}, el ${fLarga(c.fecha)}.`, { align: 'j' }),
    SIGN([c.firmas.rep])
  ];
  return { code: `${c.pref}-DC-01`, title: 'Declaración de Máximo Responsable de la Seguridad Radiológica', kind: 'carta', blocks };
}

function docEmbrion(c) {
  const { I, P, S } = c;
  const medidaPractica = {
    medico: 'No realizará estudios con equipo portátil ni en quirófano, no participará en fluoroscopia y no sujetará pacientes durante la exposición. Sus tareas se concentrarán en la sala de comando y en actividades fuera de la zona controlada.',
    intervencionista: 'Será reubicada, en lo posible, fuera de la sala de procedimientos mientras dure la gestación. Si por la naturaleza del servicio debe permanecer, lo hará con delantal envolvente, detrás de la mampara y lejos del lado del tubo, con un segundo dosímetro bajo el delantal.',
    odontologico: 'Realizará las exposiciones siempre desde detrás de la barrera o a más de 2 m del tubo, no sostendrá receptores ni pacientes y no permanecerá en la sala durante tomas panorámicas o de tomografía.'
  }[S.practica];
  const blocks = [
    H('1. Objeto'),
    Ps(`Establecer las restricciones adicionales que ${ph(I.razonSocial, 'Razón social')} aplicará a las trabajadoras ocupacionalmente expuestas que declaren su embarazo, de modo que el embrión o feto reciba el mismo grado de protección que se exige para los miembros del público, conforme al numeral 5.2, literal b) de la Norma Técnica (${NORMA}).`, { align: 'j' }),
    H('2. Alcance'),
    Ps(`Aplica a todas las trabajadoras que forman parte del POE de la práctica de ${P.corto}, cualquiera sea su modalidad de contratación.`, { align: 'j' }),
    H('3. Compromiso del empleador'),
    Ps(`La institución, a través de su representante legal, se compromete a que la dosis al embrión o feto no supere **1 mSv durante el resto del embarazo**, contado desde la fecha de la notificación. La declaración de embarazo no será causa de despido, discriminación ni reducción de la remuneración.`, { align: 'j' }),
    H('4. Disposiciones'),
    L([
      `La trabajadora notifica su estado por escrito al ${c.rolOSR.toLowerCase()} tan pronto lo conozca, usando el formato de este documento. La notificación es voluntaria, pero la institución la promueve en cada capacitación.`,
      'En un plazo máximo de cinco días laborables, el responsable revisa con la trabajadora sus tareas, sus registros dosimétricos de los últimos doce meses y define las medidas por escrito.',
      medidaPractica,
      'Se le asigna, cuando corresponda, un segundo dosímetro a la altura del abdomen y por debajo del delantal, con lectura mensual. El responsable revisa cada lectura y, si la proyección indica que podría acercarse a 1 mSv, cambia de inmediato sus funciones.',
      'No participa en la atención de incidentes o situaciones de emergencia radiológica.',
      'Al tratarse de equipos generadores de rayos X, sin fuentes radiactivas, no existe riesgo de contaminación; por eso la lactancia no requiere restricciones adicionales.'
    ], true),
    H('5. Registro'),
    Ps('La notificación y las medidas adoptadas se archivan en el expediente de la trabajadora, con copia en el registro de vigilancia dosimétrica.', { align: 'j' }),
    H('6. Formato de notificación de embarazo'),
    KV([
      ['Nombres y apellidos', ''],
      ['Cédula', ''],
      ['Cargo / función', ''],
      ['Fecha probable de parto', ''],
      ['Fecha de notificación', ''],
      ['Medidas adoptadas', ''],
      ['Dosímetro adicional asignado (código)', '']
    ], { tall: true }),
    SIGN([{ name: '', role: 'Trabajadora', blank: true }, { ...c.firmas.osr }]),
    PB(),
    aprobaciones(c)
  ];
  return { code: `${c.pref}-PR-01`, title: 'Protección del embrión y feto en trabajadoras expuestas', kind: 'sgc', blocks };
}

function funcionesOSR(c) {
  const f = [
    'Elaborar, implementar y mantener actualizado el programa de protección radiológica de la instalación.',
    'Vigilar el cumplimiento del Reglamento de Seguridad Radiológica y de la Norma Técnica vigente.',
    `Gestionar la dosimetría personal: entrega y recambio de dosímetros, revisión de reportes, comunicación de las dosis a cada trabajador e investigación cuando se supere 1,5 mSv en un mes.`,
    'Coordinar los exámenes médicos pre-ocupacionales y periódicos del POE y mantener su registro.',
    'Elaborar y ejecutar el plan anual de capacitación y llevar el registro de asistencia.',
    'Verificar que el mantenimiento, el control de calidad y el levantamiento radiométrico se realicen en los plazos previstos y por empresas licenciadas.',
    'Mantener el inventario de prendas de protección y coordinar la prueba anual de integridad de su blindaje.',
    'Verificar la señalización, la rotulación y la delimitación de zonas controladas y supervisadas.',
    'Mantener el sistema de registros y la lista maestra de documentos.',
    'Investigar, registrar e informar los incidentes y accidentes radiológicos.',
    'Actuar como enlace con la Autoridad Reguladora y acompañar las inspecciones.',
    'Suspender cualquier operación que represente un riesgo radiológico no justificado e informar de inmediato al representante legal.'
  ];
  if (c.S.practica === 'intervencionista') f.splice(3, 0, 'Revisar los indicadores de dosis de los procedimientos y verificar que se aplique el seguimiento a pacientes que superen los niveles de vigilancia.');
  return f;
}

function docNombramientoOSR(c) {
  const { I, R, P } = c;
  const blocks = [
    Ps(lugarFecha(c), { align: 'r' }),
    SP(),
    LINES([ph(R.osrTitulo, 'Título'), ph(R.osrNombre, 'Nombre del OSR'), 'Presente.']),
    SP(),
    Ps('**Asunto:** Nombramiento de Oficial de Seguridad Radiológica'),
    Ps(`En aplicación del artículo 5, numeral 5.1, literales d), g) y h) de la Norma Técnica (${NORMA}), y en mi calidad de representante legal de ${ph(I.razonSocial, 'Razón social')}, le nombro **Oficial de Seguridad Radiológica (OSR)** de la práctica de ${P.corto} de la instalación ubicada en ${ubicacion(c)}.`, { align: 'j' }),
    Ps(`Este nombramiento se sustenta en su autorización de OSR N.º ${ph(R.osrAut, 'N.º de autorización')}, vigente hasta el ${fLarga(R.osrAutCad)}, y en su licencia ocupacional N.º ${ph(R.osrLicencia, 'N.º de licencia')}.`, { align: 'j' }),
    Ps('Además de las funciones del Anexo III de la Norma Técnica, le corresponde:', { align: 'j' }),
    L(funcionesOSR(c), true),
    Ps('La institución le otorga la autoridad necesaria para cumplir estas funciones y el tiempo de su jornada que requieran.', { align: 'j' }),
    SIGN([c.firmas.rep]),
    SP(),
    H('Aceptación'),
    Ps(`Yo, ${ph(R.osrNombre, 'Nombre del OSR')}, con cédula N.º ${ph(R.osrCedula, 'Cédula')}, acepto el nombramiento de Oficial de Seguridad Radiológica de ${ph(I.razonSocial, 'Razón social')} y me comprometo a cumplir las funciones descritas.`, { align: 'j' }),
    SIGN([{ ...c.firmas.osr, role: 'Oficial de Seguridad Radiológica' }])
  ];
  return { code: `${c.pref}-DC-02`, title: 'Nombramiento y aceptación del Oficial de Seguridad Radiológica', kind: 'carta', blocks };
}

function docDesignacionMedico(c) {
  const { I, R, P, S } = c;
  const resp = [
    'Justificar cada exposición a partir de la prescripción y de la información clínica disponible, y rechazar los estudios que no estén justificados.',
    'Aprobar los procedimientos técnicos y los protocolos de la práctica, junto con el personal operador.',
    'Verificar que antes de cada estudio se haya preguntado por la posibilidad de embarazo y se haya obtenido el consentimiento informado.',
    'Establecer la conducta frente a pacientes embarazadas y pediátricos según el procedimiento de justificación de la institución.',
    'Revisar periódicamente los indicadores de dosis de los pacientes y compararlos con los niveles de referencia para diagnóstico.',
    'Participar en el análisis de rechazo y repetición de imágenes y en las acciones de optimización.'
  ];
  if (S.practica === 'intervencionista') resp.push('Registrar los indicadores de dosis de cada procedimiento y activar el seguimiento clínico de los pacientes que superen los niveles de vigilancia de dosis en piel.');
  if (S.practica === 'odontologico') resp.push('Seleccionar la técnica intraoral o extraoral de menor dosis que responda a la pregunta diagnóstica.');
  const blocks = [
    Ps(lugarFecha(c), { align: 'r' }),
    SP(),
    LINES([ph(R.medTitulo, 'Título'), ph(R.medNombre, 'Nombre del profesional'), 'Presente.']),
    SP(),
    Ps('**Asunto:** Designación de responsable de la protección radiológica del paciente'),
    Ps(`Conforme al artículo 5, numeral 5.1, literal l) y al numeral 5.8.3 de la Norma Técnica (${NORMA}), le asigno la responsabilidad total de la protección del paciente en la práctica de ${P.corto} de ${ph(I.razonSocial, 'Razón social')}.`, { align: 'j' }),
    Ps(`Esta designación considera su formación como ${ph(R.medEspecialidad, 'especialidad')} y su licencia ocupacional tipo A N.º ${ph(R.medLicencia, 'N.º de licencia')}, vigente hasta el ${fLarga(R.medLicCad)}, en la que consta la razón social de la instalación.`, { align: 'j' }),
    Ps('Sus responsabilidades son:', { align: 'j' }),
    L(resp, true),
    SIGN([c.firmas.rep]),
    SP(),
    H('Aceptación'),
    Ps(`Yo, ${ph(R.medNombre, 'Nombre del profesional')}, con cédula N.º ${ph(R.medCedula, 'Cédula')}, acepto la designación y las responsabilidades que implica.`, { align: 'j' }),
    SIGN([c.firmas.med])
  ];
  return { code: `${c.pref}-DC-03`, title: 'Designación del responsable de la protección del paciente', kind: 'carta', blocks };
}

function docFunciones(c) {
  const { I, P, S, R } = c;
  const roles = [
    ['Representante legal', 'Máximo responsable de la seguridad radiológica. Provee recursos, mantiene vigentes las licencias, contrata dosimetría, vigilancia médica y mantenimiento, y notifica a la Autoridad Reguladora los cambios de personal y de equipos.'],
    [c.rolOSR, funcionesOSR(c).slice(0, 7).join(' ')],
    [P.tituloResp, 'Justifica las exposiciones, aprueba los procedimientos técnicos, define la conducta en embarazadas y pediátricos y revisa los indicadores de dosis de los pacientes.']
  ];
  if (S.practica === 'medico') {
    roles.push(['Tecnólogo médico (operador)', 'Verifica la prescripción y la identidad del paciente, pregunta por embarazo, aplica el procedimiento técnico, coloca las prendas de protección, colima, evita repeticiones, usa su dosímetro y reporta fallas del equipo o incidentes.']);
    roles.push(['Personal de apoyo (enfermería, camilleros)', 'Cuando deba permanecer en la sala o sujetar a un paciente, usa delantal y collarín y se ubica fuera del haz directo. No opera el equipo.']);
  } else if (S.practica === 'intervencionista') {
    roles.push(['Médico intervencionista (operador)', 'Dirige el uso de la fluoroscopia y de las adquisiciones, aplica las medidas de optimización y decide la conducta cuando se alcanzan los niveles de notificación de dosis.']);
    roles.push(['Tecnólogo médico', 'Opera el equipo, configura los protocolos de baja dosis, informa en voz alta el Ka,r acumulado a partir de 3 Gy y registra los indicadores de dosis al final del procedimiento.']);
    roles.push(['Enfermería y anestesiología', 'Usan delantal, collarín, gafas y dosímetro; se ubican lejos del tubo y detrás de la mampara cuando su tarea lo permite.']);
  } else {
    roles.push(['Odontólogo operador', 'Justifica la radiografía, selecciona la técnica, coloca chaleco plomado al paciente, usa posicionadores, realiza el disparo desde detrás de la barrera o a 2 m del tubo y usa su dosímetro.']);
    roles.push(['Asistente dental', 'Prepara al paciente y el material. No opera el equipo ni permanece en la sala durante el disparo; no sostiene receptores.']);
  }
  const acept = (c.poe.length ? c.poe : [{}, {}, {}]).map((p, i) => [String(i + 1), p.nombre || '', p.cedula || '', p.funcion || '', '', '']);
  const blocks = [
    H('1. Objeto'),
    Ps(`Asignar las funciones y responsabilidades en materia de seguridad radiológica al personal de la práctica de ${P.corto} de ${ph(I.razonSocial, 'Razón social')}, en cumplimiento del artículo 9 del Reglamento de Seguridad Radiológica y del artículo 12, literal g) de la Norma Técnica.`, { align: 'j' }),
    H('2. Funciones por cargo'),
    T(['Cargo', 'Funciones y responsabilidades'], roles, { widths: [26, 74] }),
    H('3. Obligaciones comunes a todo el POE'),
    L([
      'Mantener vigente su licencia ocupacional y presentarla cuando se le solicite.',
      'Portar el dosímetro personal durante toda la jornada y dejarlo, al terminar, en el lugar destinado fuera de la zona controlada.',
      'Firmar el recibido de su reporte dosimétrico.',
      'Asistir a las capacitaciones del plan anual.',
      'Realizarse el examen médico ocupacional anual.',
      'Informar de inmediato al responsable cualquier falla, incidente o condición insegura.'
    ]),
    H('4. Aceptación de funciones'),
    Ps('Con su firma, cada trabajador declara que conoce y acepta las funciones descritas para su cargo.', { align: 'j' }),
    T(['N.º', 'Nombres y apellidos', 'Cédula', 'Función', 'Firma', 'Fecha'], acept, { widths: [6, 30, 14, 22, 16, 12], tall: true }),
    aprobaciones(c)
  ];
  return { code: `${c.pref}-PR-02`, title: 'Asignación de funciones y responsabilidades', kind: 'sgc', blocks };
}

/* ---------------------------------------------------- PLANES Y PROCEDIMIENTOS */

function temasPlan(c) {
  const P = c.P;
  const extra = (P.temasSi || []).filter(t => c.tiene(t.si));
  return [...TEMAS_COMUNES, ...P.temas, ...extra];
}

function docPlanCapacitacion(c) {
  const { I, P, R } = c;
  const temas = temasPlan(c);
  const capacitador = ph(R.osrNombre, 'Capacitador');
  const filas = temas.map((t, i) => {
    const mes = MESES[Math.min(10, Math.round(i * 10 / Math.max(1, temas.length - 1)) + 1)];
    return [String(i + 1), t.tema, t.contenido, mes.charAt(0).toUpperCase() + mes.slice(1), String(t.horas), capacitador];
  });
  const totalH = temas.reduce((a, t) => a + t.horas, 0);
  const blocks = [
    H('1. Objetivo'),
    Ps(`Mantener y actualizar los conocimientos en protección radiológica del personal ocupacionalmente expuesto de la práctica de ${P.corto} de ${ph(I.razonSocial, 'Razón social')} durante el año ${c.anio}, en cumplimiento de los artículos 52 literal c), 55 y 132 del Reglamento de Seguridad Radiológica y del artículo 5, numeral 5.1, literal j) de la Norma Técnica.`, { align: 'j' }),
    H('2. Alcance'),
    Ps(`Dirigido a las ${c.poe.length || '[n]'} personas que integran el POE y, en los temas que corresponda, al personal de apoyo que ingresa a zonas controladas.`, { align: 'j' }),
    H('3. Responsable'),
    Ps(`La elaboración y ejecución del plan está a cargo de ${capacitador}, ${c.rolOSR.toLowerCase()}. Los temas especializados podrán ser dictados por profesionales externos con experiencia acreditada.`, { align: 'j' }),
    H('4. Metodología'),
    L([
      'Sesiones presenciales teórico-prácticas en las instalaciones, con material de apoyo entregado a los participantes.',
      'Evaluación escrita al final de cada tema; la calificación mínima aprobatoria es 7 sobre 10. Quien no apruebe repite el tema en el mes siguiente.',
      'Registro de asistencia firmado por cada participante y por el capacitador, y certificado de participación.',
      'El personal que ingrese durante el año recibe una inducción con los temas 1 a 5 antes de iniciar sus actividades.'
    ]),
    H(`5. Cronograma ${c.anio}`),
    T(['N.º', 'Tema', 'Contenido', 'Mes', 'Horas', 'Capacitador'], filas, { widths: [5, 20, 43, 10, 7, 15], small: true }),
    Ps(`Carga horaria total: **${totalH} horas** por trabajador.`),
    H('6. Indicadores'),
    L([
      'Cumplimiento del cronograma: temas dictados / temas programados × 100. Meta: 100 %.',
      'Cobertura: trabajadores capacitados / total del POE × 100. Meta: 100 %.',
      'Aprovechamiento: trabajadores que aprueban la evaluación / trabajadores evaluados × 100. Meta: mayor o igual a 90 %.'
    ]),
    H('7. Registros'),
    Ps(`La asistencia se registra en el formato ${c.pref}-RG-09 (Registro de capacitaciones). Los certificados y evaluaciones se archivan junto con el registro.`, { align: 'j' }),
    aprobaciones(c)
  ];
  return { code: `${c.pref}-PL-01`, title: `Plan anual de capacitación y entrenamiento ${c.anio}`, kind: 'sgc', blocks };
}

function protocolosAplicables(c) {
  const lista = PROTOCOLOS[c.S.practica] || [];
  const filtrados = lista.filter(p => !p.si || c.tiene(p.si));
  return filtrados.length ? filtrados : lista;
}

function docProcTecnicos(c) {
  const { I, P, S } = c;
  const prot = protocolosAplicables(c);
  const head = S.practica === 'medico' ? ['Proyección', 'kV', 'mAs', 'DFI (cm)', 'Observaciones'] : null;
  const generales = {
    medico: [
      'Ningún estudio se realiza sin prescripción médica escrita y completa.',
      'Confirmar la identidad del paciente con dos datos (nombre completo y cédula o fecha de nacimiento).',
      'Preguntar a toda mujer entre 10 y 50 años si está embarazada o podría estarlo, y anotar la respuesta en la solicitud.',
      'Retirar objetos metálicos de la región de estudio y colocar delantal, collarín o protector gonadal cuando no interfieran con la imagen.',
      'Colimar al área de interés. El campo nunca debe ser mayor que el detector.',
      'Cerrar la puerta de la sala antes del disparo y verificar que la señalización luminosa esté encendida.',
      'El operador realiza la exposición desde la consola protegida, viendo al paciente y con comunicación verbal.',
      'Nadie del personal sujeta pacientes de forma rutinaria. Si es imprescindible, lo hace un acompañante con delantal, fuera del haz directo; nunca una mujer embarazada ni un menor de edad.',
      'Antes de repetir una imagen, consultar con el médico especialista. Las repeticiones se registran con su causa.'
    ],
    intervencionista: [
      'Ningún procedimiento se realiza sin prescripción médica y consentimiento informado firmado.',
      'Antes de iniciar, completar la lista de verificación de la sala.',
      'Todo el personal en sala usa delantal, collarín, gafas plomadas y dosímetro.',
      'Mantener la puerta cerrada y la señalización luminosa encendida durante el procedimiento.',
      'Al finalizar, registrar tiempo de fluoroscopia, Ka,r, PKA y número de series en la hoja del procedimiento.'
    ],
    odontologico: [
      'Toda radiografía se indica en la historia clínica odontológica con su justificación.',
      'Preguntar a las pacientes por la posibilidad de embarazo y registrar la respuesta.',
      'Colocar chaleco plomado al paciente, con collarín cuando no interfiera con la imagen.',
      'Nunca sostener el receptor ni el cabezal del equipo durante la exposición; usar posicionadores.',
      'El operador dispara desde detrás de la barrera o a no menos de 2 m del tubo.',
      'En niños, si necesitan ayuda, el acompañante usa chaleco plomado y se coloca fuera del haz.'
    ]
  }[S.practica];
  const blocks = [
    H('1. Objetivo'),
    Ps(`Establecer la forma de realizar cada una de las técnicas de exploración radiológica de la práctica de ${P.corto} de ${ph(I.razonSocial, 'Razón social')}, de modo que se obtenga la información diagnóstica necesaria con la menor dosis razonablemente posible para el paciente y el personal (Art. 6, numeral 6.1.3, literal b de la Norma Técnica).`, { align: 'j' }),
    H('2. Alcance'),
    Ps(`Aplica a los estudios realizados con los siguientes equipos: ${c.eqAct.length ? c.eqAct.map(e => `${e.tipo} ${e.marca || ''} ${e.modelo || ''}`.replace(/\s+/g, ' ').trim()).join('; ') : '[equipos de la instalación]'}.`, { align: 'j' }),
    H('3. Responsables'),
    Ps(`El ${P.profResp} aprueba y actualiza este documento; el personal operador lo aplica; el ${c.rolOSR.toLowerCase()} verifica su cumplimiento.`, { align: 'j' }),
    H('4. Disposiciones generales'),
    L(generales, true),
    H('5. Protocolos por estudio')
  ];
  prot.forEach((p, i) => {
    blocks.push(Ps(`5.${i + 1}. ${p.nombre}`, { bold: true }));
    if (p.params) blocks.push(T(p.paramsHead || head || ['Proyección', 'kV', 'mAs', 'DFI (cm)', 'Observaciones'], p.params, { small: true }));
    if (p.nota) blocks.push(NOTE(p.nota));
    blocks.push(L(p.pasos, true));
    if (p.calidad) blocks.push(Ps(`**Criterio de calidad:** ${p.calidad}`, { align: 'j' }));
  });
  if (S.practica !== 'intervencionista') {
    blocks.push(NOTE('Los valores de kV y mAs son referenciales para un paciente adulto de contextura media. Cada sala mantiene junto a la consola su propia tabla de técnicas, ajustada al equipo y al receptor de imagen.'));
  }
  blocks.push(
    H('6. Registros'),
    Ps('Libro o sistema de registro de estudios, registro de repeticiones con su causa y, cuando corresponda, indicadores de dosis del paciente.', { align: 'j' }),
    H('7. Firmas de elaboración conjunta'),
    Ps(`De acuerdo con la Norma Técnica, este procedimiento fue elaborado y es firmado conjuntamente por el ${P.profResp} y el personal operador.`, { align: 'j' })
  );
  const operadores = c.poe.filter(p => !c.mismaPersona({ name: p.nombre }, c.firmas.med));
  blocks.push(SIGN([c.firmas.med, ...operadores.map(p => ({ name: p.nombre, role: p.funcion || p.profesion || 'Operador', ced: p.cedula }))]));
  blocks.push(aprobaciones(c));
  return { code: `${c.pref}-PR-03`, title: 'Procedimientos técnicos de exploración radiológica', kind: 'sgc', blocks };
}

function docPrescripcion(c) {
  const { I, P, S } = c;
  const odont = S.practica === 'odontologico';
  const blocks = [
    H('1. Objetivo'),
    Ps(`Garantizar que ningún paciente de ${ph(I.razonSocial, 'Razón social')} sea expuesto a radiación ionizante sin una prescripción ${odont ? 'odontológica' : 'médica'} documentada, conforme al artículo 5, numeral 5.1, literal k) de la Norma Técnica.`, { align: 'j' }),
    H('2. Contenido mínimo de la prescripción'),
    L([
      'Nombres completos, número de cédula, edad y sexo del paciente.',
      'Estudio o procedimiento solicitado y región anatómica.',
      'Justificación clínica o diagnóstico presuntivo.',
      'Indicación sobre posible embarazo, cuando aplique.',
      `Nombre, firma, sello y registro profesional del ${odont ? 'odontólogo' : 'médico'} que prescribe, y fecha.`
    ]),
    H('3. Desarrollo'),
    L(odont ? [
      'El odontólogo registra en la historia clínica odontológica la radiografía indicada y su justificación antes de realizarla.',
      'Cuando el paciente llega con una orden externa, se verifica que tenga el contenido mínimo y se archiva en la historia clínica.',
      'Si la orden está incompleta o el estudio no se considera justificado, se conversa con el profesional que la emitió antes de realizarlo.',
      'La historia clínica y la orden se conservan como respaldo del estudio.'
    ] : [
      'En recepción se verifica que la solicitud tenga el contenido mínimo. Si falta algún dato, se devuelve o se contacta al médico prescriptor; el estudio no se realiza hasta completarla.',
      'El tecnólogo revisa nuevamente la solicitud antes de llamar al paciente y confirma su identidad.',
      `Si el estudio no parece justificado o existe una alternativa sin radiación ionizante, el tecnólogo lo consulta con el ${P.profResp}, quien decide.`,
      'Las solicitudes se archivan física o digitalmente junto con el informe del estudio.'
    ], true),
    H('4. Formato de solicitud de estudio'),
    KV([
      ['Paciente (nombres y apellidos)', ''],
      ['Cédula / Edad / Sexo', ''],
      ['Estudio solicitado', ''],
      ['Región anatómica', ''],
      ['Justificación clínica / diagnóstico presuntivo', ''],
      ['¿Embarazo o posibilidad de embarazo?', '(   ) Sí     (   ) No     (   ) No aplica'],
      ['Estudios previos relacionados', ''],
      [`${odont ? 'Odontólogo' : 'Médico'} prescriptor y registro profesional`, ''],
      ['Firma y sello', ''],
      ['Fecha', '']
    ], { tall: true }),
    aprobaciones(c)
  ];
  return { code: `${c.pref}-PR-04`, title: 'Procedimiento de prescripción de estudios', kind: 'sgc', blocks };
}

function docJustificacion(c) {
  const { I, P, S } = c;
  const odont = S.practica === 'odontologico';
  const blocks = [
    H('1. Objetivo'),
    Ps(`Establecer cómo se justifica y optimiza la exposición a radiación ionizante en pacientes embarazadas y pediátricos en la práctica de ${P.corto} de ${ph(I.razonSocial, 'Razón social')}, según el artículo 5, numeral 5.1, literal q) de la Norma Técnica.`, { align: 'j' }),
    H('2. Pacientes embarazadas o con posibilidad de embarazo'),
    L([
      `Antes de cada estudio, el operador pregunta a toda paciente entre 10 y 50 años: «¿Está embarazada o existe la posibilidad de que lo esté?». La respuesta queda escrita en la solicitud${odont ? ' o en la historia clínica' : ''}.`,
      'Si la respuesta es afirmativa o dudosa, el estudio se detiene y se comunica al profesional responsable.',
      odont
        ? 'El odontólogo valora si la radiografía puede postergarse hasta después del parto. Si es necesaria (dolor, infección, trauma), se realiza con chaleco plomado y collarín, técnica de menor dosis y el menor número de tomas. La dosis al feto en radiografía dental es prácticamente nula porque el haz no se dirige al abdomen.'
        : `El ${P.profResp} evalúa si existe una alternativa sin radiación ionizante (ecografía, resonancia magnética) o si el estudio puede postergarse.`,
      ...(odont ? [] : [
        'Si el estudio está justificado y el útero queda fuera del haz directo (tórax, extremidades, cráneo), se realiza con colimación estricta y protección del abdomen cuando no interfiera.',
        `Si el útero queda dentro del haz (abdomen, pelvis, columna lumbar${c.tiene(/Tomógrafo/) ? ', tomografía abdominopélvica' : ''}${S.practica === 'intervencionista' ? ', procedimientos abdominales o pélvicos' : ''}), el especialista documenta la justificación, se reducen al mínimo las proyecciones y el ${c.rolOSR.toLowerCase()} estima la dosis al feto a partir de los parámetros usados.`,
        'La paciente es informada de los beneficios y riesgos y firma el consentimiento informado, dejando constancia de su embarazo.'
      ])
    ], true),
    H('3. Pacientes pediátricos'),
    L([
      'La solicitud se revisa con especial cuidado, porque los niños son más sensibles a la radiación y tienen más años de vida por delante.',
      odont ? 'Usar los programas pediátricos del equipo panorámico y los tiempos de exposición reducidos para intraorales.' : 'Usar siempre técnicas y protocolos pediátricos ajustados al peso o a la edad; nunca aplicar el protocolo de adulto.',
      'Colimar de forma estricta y proteger con prendas de talla pediátrica las zonas fuera del campo cuando no interfieran.',
      'Inmovilizar con dispositivos o con ayuda del acompañante protegido con delantal, para evitar repeticiones por movimiento.',
      'Explicar al niño y al acompañante lo que se va a hacer, en lenguaje sencillo, para obtener su colaboración.'
    ], true),
    H('4. Formato de registro de justificación'),
    KV([
      ['Paciente / edad', ''],
      ['Condición', '(   ) Embarazada, semanas: ____     (   ) Pediátrico'],
      ['Estudio solicitado', ''],
      ['Alternativas consideradas', ''],
      ['Justificación del especialista', ''],
      ['Medidas de optimización aplicadas', ''],
      ['Dosis estimada al feto (si aplica)', ''],
      ['Firma del especialista / fecha', '']
    ], { tall: true }),
    aprobaciones(c)
  ];
  return { code: `${c.pref}-PR-05`, title: 'Justificación de exposición en pacientes embarazadas y pediátricos', kind: 'sgc', blocks };
}

function docDosimetria(c) {
  const { I, P, V, S } = c;
  const interv = S.practica === 'intervencionista';
  const blocks = [
    H('1. Objetivo'),
    Ps(`Definir cómo se realiza la vigilancia dosimétrica del POE de ${ph(I.razonSocial, 'Razón social')}, cómo se comunica la dosis a cada trabajador y qué se hace cuando una lectura supera el nivel de investigación.`, { align: 'j' }),
    H('2. Servicio de dosimetría'),
    KV([
      ['Proveedor', ph(V.dosEmpresa, 'Empresa de dosimetría')],
      ['Licencia del proveedor', ph(V.dosLicencia, 'N.º de licencia')],
      ['Tipo de dosímetro', ph(V.dosTipo, 'TLD / OSL')],
      ['Periodo de lectura', ph(V.dosPeriodo, 'Mensual')],
      ['Vigencia del contrato', V.dosVigencia ? `Hasta el ${fLarga(V.dosVigencia)}` : '[Vigencia]']
    ]),
    H('3. Uso y almacenamiento del dosímetro'),
    L([
      'El dosímetro es personal e intransferible y se usa durante toda la jornada.',
      interv ? 'Se coloca a la altura del tórax, debajo del delantal. Se recomienda un segundo dosímetro sobre el delantal, a la altura del cuello, para estimar la dosis en cristalino y tiroides.' : 'Se coloca a la altura del tórax, debajo del delantal cuando se lo usa.',
      'Al terminar la jornada se deja en el tablero de almacenamiento, ubicado fuera de la zona controlada y junto al dosímetro de control, lejos de fuentes de calor y humedad.',
      'Nunca se deja dentro de la sala, se expone de forma intencional ni se lleva a otra institución.',
      'Si se pierde o se daña, el trabajador lo informa el mismo día; el responsable solicita el reemplazo y asigna una dosis estimada a ese periodo.'
    ], true),
    H('4. Límites de dosis'),
    T(['Magnitud', 'Personal ocupacionalmente expuesto', 'Miembros del público'], [
      ['Dosis efectiva', '20 mSv por año, promediada en 5 años consecutivos, sin superar 50 mSv en un solo año', '1 mSv por año'],
      ['Dosis equivalente en cristalino', '20 mSv por año, promediada en 5 años, sin superar 50 mSv en un solo año', '15 mSv por año'],
      ['Dosis equivalente en piel', '500 mSv por año', '50 mSv por año'],
      ['Dosis equivalente en manos y pies', '500 mSv por año', '—']
    ], { widths: [26, 48, 26], small: true }),
    Ps('**Nivel de investigación** establecido por la Autoridad Reguladora: **1,5 mSv en un mes** de dosis equivalente personal Hp(10).', { align: 'j' }),
    H('5. Comunicación de la dosis'),
    L([
      `Al recibir el reporte, el ${c.rolOSR.toLowerCase()} lo revisa en un plazo de cinco días laborables.`,
      'Cada trabajador conoce su dosis del periodo y su dosis acumulada en el año y firma el recibido en el registro de dosimetría.',
      'El reporte original se archiva y se conserva durante toda la vida laboral del trabajador y al menos 30 años después de terminada su relación con la institución.'
    ], true),
    H('6. Investigación de dosis'),
    Ps('Cuando una lectura mensual supera 1,5 mSv, o cuando un valor no es coherente con el historial del trabajador, el responsable:', { align: 'j' }),
    L([
      'Entrevista al trabajador y verifica si el dosímetro estuvo bien usado y almacenado o si pudo quedar dentro de la sala.',
      'Revisa la carga de trabajo del periodo, los procedimientos en los que participó y el estado de las prendas de protección y del equipo.',
      'Determina si la dosis es real o atribuible a un mal uso del dosímetro y deja constancia escrita de la conclusión.',
      'Define acciones correctivas (reentrenamiento, cambio de funciones, revisión de blindajes o del equipo) y fija un plazo.',
      'Si se confirma una dosis que supera los límites, informa por escrito a la Autoridad Reguladora y al representante legal.',
      'Archiva el informe de investigación en el registro de dosimetría.'
    ], true),
    aprobaciones(c)
  ];
  return { code: `${c.pref}-PR-06`, title: 'Vigilancia dosimétrica e investigación de dosis', kind: 'sgc', blocks };
}

function docSeguimientoPaciente(c) {
  const { I } = c;
  const blocks = [
    H('1. Objetivo'),
    Ps(`Identificar a los pacientes de ${ph(I.razonSocial, 'Razón social')} que, por la complejidad o duración del procedimiento intervencionista, recibieron dosis en piel capaces de producir efectos deterministas, y asegurar su información y seguimiento.`, { align: 'j' }),
    H('2. Registro de dosis de cada procedimiento'),
    Ps('Al terminar cada procedimiento se registran, en la hoja del procedimiento y en el informe médico: tiempo de fluoroscopia, kerma en el punto de referencia (Ka,r), producto kerma-área (PKA) y número de series de adquisición.', { align: 'j' }),
    H('3. Niveles de notificación durante el procedimiento'),
    Ps('El tecnólogo informa en voz alta al médico operador cuando el Ka,r acumulado llega a 3 Gy y luego cada 1 Gy adicional. El médico decide si continúa, modifica la angulación o termina el procedimiento.', { align: 'j' }),
    H('4. Niveles de vigilancia para seguimiento'),
    T(['Indicador', 'Nivel que activa el seguimiento'], [
      ['Kerma en el punto de referencia (Ka,r)', '5 Gy'],
      ['Dosis pico en piel (si se dispone)', '3 Gy'],
      ['Producto kerma-área (PKA)', '500 Gy·cm²'],
      ['Tiempo de fluoroscopia', '60 minutos']
    ], { widths: [60, 40] }),
    NOTE('Niveles tomados del informe NCRP 168 y de las recomendaciones del OIEA para procedimientos guiados por fluoroscopia.'),
    H('5. Conducta'),
    L([
      'El médico operador informa al paciente o a su representante, antes del alta, que recibió una dosis elevada en piel y le explica qué signos vigilar (enrojecimiento, picazón, caída del vello o lesión en la zona del haz).',
      'Se deja constancia en la historia clínica de la zona de piel expuesta y de los indicadores de dosis.',
      'Se programa un control a las 2 a 4 semanas. Si aparece alguna lesión, se deriva a dermatología.',
      `El ${c.rolOSR.toLowerCase()} incluye el caso en el registro y analiza si hubo oportunidades de optimización.`,
      'Si se confirma una lesión radioinducida, se trata como incidente y se informa a la Autoridad Reguladora.'
    ], true),
    H('6. Formato de registro'),
    T(['Fecha', 'Paciente / HC', 'Procedimiento', 'Tiempo fluoro (min)', 'Ka,r (Gy)', 'PKA (Gy·cm²)', '¿Seguimiento?', 'Responsable'], Array.from({ length: 8 }, () => ['', '', '', '', '', '', '', '']), { small: true, tall: true }),
    aprobaciones(c)
  ];
  return { code: `${c.pref}-PR-07`, title: 'Seguimiento de pacientes con dosis elevadas en piel', kind: 'sgc', landscape: false, blocks };
}

/* ---------------------------------------------------- INFORMES Y LISTADOS */

const ES_PRENDA = /Delantal|Chaleco|Collarín|Falda|Guantes|Gorro|Faldón|dos piezas/i;

function docInformeDelantales(c) {
  const { I, V } = c;
  const prendas = c.epp.filter(e => ES_PRENDA.test(e.tipo || ''));
  const aptas = prendas.filter(p => (p.resultado || 'Apta') !== 'No apta');
  const noAptas = prendas.filter(p => p.resultado === 'No apta');
  const fecha = V.fechaPruebaEpp || c.fecha;
  const filas = prendas.map((p, i) => [String(i + 1), p.codigo || '', p.tipo || '', p.marca || '', p.espesor || '', p.sala || '', p.kv || '', p.mas || '', p.defectos || 'Ninguno', p.resultado || 'Apta']);
  const blocks = [
    H('1. Datos generales'),
    KV([
      ['Institución', ph(I.razonSocial, 'Razón social')],
      ['Fecha de la evaluación', fLarga(fecha)],
      ['Equipo utilizado', ph(V.eqPrueba, 'Equipo usado para la prueba')],
      ['Modalidad', ph(V.modoPrueba, 'Fluoroscopia o radiografía')],
      ['Evaluado por', ph(c.R.osrNombre, 'Responsable')]
    ]),
    H('2. Objetivo'),
    Ps('Comprobar la integridad del blindaje de las prendas de protección radiológica de la instalación, conforme al numeral 5.4, literal a) de la Norma Técnica, que dispone su verificación en intervalos aproximados de 12 meses con imágenes de rayos X de al menos 60 kV.', { align: 'j' }),
    H('3. Metodología'),
    L([
      'Inspección visual y táctil de cada prenda, extendida sobre una superficie plana, buscando dobleces, costuras abiertas, desgaste del forro y zonas endurecidas.',
      'Adquisición de imágenes de rayos X de toda la superficie de la prenda, con tensión de al menos 60 kV, para identificar grietas, perforaciones o zonas de menor atenuación.',
      'Medición aproximada del área de cada defecto encontrado.',
      'Las prendas que no se usan sobre el cuerpo (mamparas, faldones de mesa) se evalúan solo por inspección visual.'
    ], true),
    H('4. Criterio de aceptación'),
    Ps('Se adopta el criterio de Lambert y McKeon (2001), de uso extendido en la verificación de prendas plomadas. La prenda se retira de uso cuando presenta:', { align: 'j' }),
    L([
      'Defectos que sumen más de 15 mm² en zonas que cubren órganos críticos (tórax, abdomen, gónadas).',
      'Defectos que sumen más de 670 mm² en zonas de solapamiento o en la parte posterior.',
      'En collarines tiroideos, defectos que sumen más de 11 mm².'
    ]),
    H('5. Resultados'),
    T(['N.º', 'Código', 'Tipo', 'Marca', 'mm Pb', 'Sala', 'kV', 'mAs', 'Defectos', 'Resultado'], filas.length ? filas : [['', '', '', '', '', '', '', '', '', '']], { small: true }),
    H('6. Conclusiones'),
    Ps(prendas.length
      ? `Se evaluaron ${prendas.length} prendas de protección. ${aptas.length} ${aptas.length === 1 ? 'resultó apta' : 'resultaron aptas'} para su uso${noAptas.length ? ` y ${noAptas.length} ${noAptas.length === 1 ? 'no cumple' : 'no cumplen'} el criterio de aceptación (${noAptas.map(p => p.codigo || p.tipo).join(', ')})` : ''}.`
      : '[Registrar las prendas en la sección de prendas de protección.]', { align: 'j' }),
    H('7. Recomendaciones'),
    L([
      noAptas.length ? 'Retirar de inmediato las prendas no aptas, rotularlas como «fuera de uso» y gestionar su reposición, manteniendo al menos dos prendas de cada tipo por sala.' : 'Mantener las prendas en uso y repetir la evaluación en 12 meses.',
      'Guardar los delantales colgados en soportes y nunca doblados, para evitar fisuras en el material de blindaje.',
      'Realizar inspección visual mensual y registrar cualquier daño observado.'
    ]),
    H('8. Anexos'),
    Ps('Imágenes radiográficas de cada prenda, identificadas con su código, y parámetros de exposición utilizados.', { align: 'j' }),
    SIGN([c.firmas.osr])
  ];
  return { code: `${c.pref}-IN-01`, title: 'Informe de integridad del blindaje de prendas de protección', kind: 'sgc', landscape: true, blocks };
}

function docNominaPOE(c) {
  const filas = c.poe.map((p, i) => [String(i + 1), p.nombre, p.cedula || '', p.profesion || '', p.funcion || '', p.licencia || '', fCorta(p.licCad), estadoVigencia(p.licCad), p.autOsr || (p.esOsr ? 'Sí' : '—')]);
  const blocks = [
    Ps(`Nómina del personal ocupacionalmente expuesto de la práctica de ${c.P.corto}, actualizada al ${fLarga(c.fecha)}.`, { align: 'j' }),
    T(['N.º', 'Apellidos y nombres', 'Cédula', 'Profesión', 'Función', 'Licencia N.º', 'Caducidad', 'Estado', 'Autorización OSR'], filas.length ? filas : [['1', '', '', '', '', '', '', '', '']], { small: true }),
    Ps('Todo ingreso o salida de personal será comunicado por escrito a la Autoridad Reguladora, conforme al artículo 9 del Reglamento de Seguridad Radiológica.', { align: 'j' }),
    SIGN([c.firmas.osr, c.firmas.rep])
  ];
  return { code: `${c.pref}-LS-01`, title: 'Nómina del personal ocupacionalmente expuesto', kind: 'sgc', landscape: true, blocks };
}

function filasEquipos(c, lista) {
  return lista.map((e, i) => [String(i + 1), e.tipo || '', e.marca || 'NR', e.modelo || 'NR', e.serie || 'NR', e.tuboMarca || 'NR', e.tuboModelo || 'NR', e.tuboSerie || 'NR', e.anio || '', e.sala || '', e.estado || 'Funcionando']);
}

function docListadoEquipos(c) {
  const blocks = [
    Ps(`Equipos generadores de radiación ionizante de la práctica de ${c.P.corto} de ${ph(c.I.razonSocial, 'Razón social')}.`, { align: 'j' }),
    T(['N.º', 'Tipo', 'Marca equipo', 'Modelo equipo', 'Serie equipo', 'Marca tubo', 'Modelo tubo (insert)', 'Serie tubo (insert)', 'Año fab.', 'Ubicación', 'Estado'], filasEquipos(c, c.eqAct).length ? filasEquipos(c, c.eqAct) : [['1', '', '', '', '', '', '', '', '', '', '']], { small: true }),
    NOTE('NR: no registra en la placa. Se adjuntan fotografías de las placas de identificación del equipo y del tubo de rayos X.'),
    SIGN([c.firmas.osr])
  ];
  return { code: `${c.pref}-LS-02`, title: 'Listado de equipos generadores de radiación ionizante', kind: 'sgc', landscape: true, blocks };
}

function codigoDoc(c, id) {
  const d = DOCS.find(x => x.id === id);
  return d ? `${c.pref}-${d.cod}` : '';
}

function listaDocumentosGenerados(c) {
  return DOCS.filter(d => d.aplica(c)).map(d => {
    const title = d.id === 'LISTA-M' ? 'Lista maestra de documentos' : (d.id === 'MATRIZ' ? 'Matriz de cumplimiento de requisitos' : d.build(c).title);
    return { code: codigoDoc(c, d.id), title, grupo: d.grupo, id: d.id };
  });
}

function docListaMaestra(c) {
  const docs = listaDocumentosGenerados(c);
  const conserv = (id) => /REG-DOS|REG-MED/.test(id) ? 'Vida laboral + 30 años' : (/REG-|INF-/.test(id) ? '10 años' : 'Mientras esté vigente + 5 años');
  const filas = docs.map((d, i) => [String(i + 1), d.code, d.title, c.M.version || '01', fCorta(c.fecha), /REG-/.test(d.id) ? c.rolOSR : (/OF-|DEC-|NOM-OSR|DES-/.test(d.id) ? 'Representante legal' : c.rolOSR), c.M.ubicacion || 'Archivo físico y digital', conserv(d.id)]);
  const blocks = [
    Ps(`Lista maestra de los documentos del sistema de seguridad radiológica de la práctica de ${c.P.corto}. El archivo se mantiene clasificado, ordenado y disponible para la Autoridad Reguladora, según el artículo 8 de la Norma Técnica.`, { align: 'j' }),
    T(['N.º', 'Código', 'Documento', 'Versión', 'Fecha', 'Responsable', 'Ubicación', 'Conservación'], filas, { small: true }),
    aprobaciones(c)
  ];
  return { code: `${c.pref}-LM-01`, title: 'Lista maestra de documentos', kind: 'sgc', landscape: true, blocks };
}

function docMatriz(c) {
  const filas = REQUISITOS.map(r => {
    const docsGen = (r.doc || []).map(id => { const d = DOCS.find(x => x.id === id); return d && d.aplica(c) ? codigoDoc(c, id) : null; }).filter(Boolean);
    return [r.id, r.txt, docsGen.join(', ') || (r.ext ? 'Documento de la institución' : '—'), estadoReq(c, r), (c.S.check[r.id] || {}).obs || ''];
  });
  const blocks = [
    Ps(`Verificación de los requisitos del Oficio Nro. ${ph(c.O.numero, 'Oficio del MEM')} para la práctica de ${c.P.corto}.`, { align: 'j' }),
    T(['N.º', 'Requisito', 'Documento', 'Estado', 'Observación'], filas, { widths: [7, 45, 18, 12, 18], small: true })
  ];
  return { code: `${c.pref}-LS-03`, title: 'Matriz de cumplimiento de requisitos', kind: 'sgc', landscape: true, blocks };
}

/* ---------------------------------------------------- REGISTROS */

function blancos(n, cols) { return Array.from({ length: n }, () => Array(cols).fill('')); }

function docRegLicencias(c) {
  const { I } = c;
  const filas = [['Institucional', I.razonSocial || '', I.ruc || '', I.licencia || '', fCorta(I.licenciaCad), estadoVigencia(I.licenciaCad)]];
  c.poe.forEach(p => filas.push(['Ocupacional', p.nombre, p.cedula || '', p.licencia || '', fCorta(p.licCad), estadoVigencia(p.licCad)]));
  const blocks = [
    T(['Tipo', 'Titular', 'Cédula / RUC', 'N.º de licencia', 'Caducidad', 'Estado'], [...filas, ...blancos(3, 6)], { small: true }),
    NOTE('«Por caducar» indica que faltan 90 días o menos. La renovación debe iniciarse con anticipación para no operar con licencia caducada.'),
    SIGN([c.firmas.osr])
  ];
  return { code: `${c.pref}-RG-01`, title: 'Registro de licencias institucional y ocupacionales', kind: 'sgc', blocks };
}

function docRegOSR(c) {
  const { R } = c;
  const filas = [];
  if (R.osrNombre) filas.push([R.osrNombre, R.osrCedula || '', R.osrAut || '', fCorta(R.osrAutCad), estadoVigencia(R.osrAutCad), c.P.nombre]);
  c.poe.filter(p => p.autOsr && p.nombre !== R.osrNombre).forEach(p => filas.push([p.nombre, p.cedula || '', p.autOsr, '', '', c.P.nombre]));
  const blocks = [
    T(['Nombre', 'Cédula', 'N.º de autorización', 'Caducidad', 'Estado', 'Práctica'], [...filas, ...blancos(2, 6)], { small: true }),
    SIGN([c.firmas.osr])
  ];
  return { code: `${c.pref}-RG-02`, title: 'Registro de autorizaciones de Oficial de Seguridad Radiológica', kind: 'sgc', blocks };
}

function docRegEquipos(c) {
  const filas = c.eq.map((e, i) => [String(i + 1), e.tipo || '', e.marca || 'NR', e.modelo || 'NR', e.serie || 'NR', e.tuboMarca || 'NR', e.tuboModelo || 'NR', e.tuboSerie || 'NR', e.uso || '', e.sala || '', e.anio || '', fCorta(e.mantFecha), e.estado || 'Funcionando']);
  const blocks = [
    T(['N.º', 'Tipo', 'Marca', 'Modelo', 'Serie', 'Marca tubo', 'Modelo tubo', 'Serie tubo', 'Uso', 'Ubicación', 'Año', 'Último mant. / CC', 'Estado'], [...filas, ...blancos(2, 13)], { small: true }),
    KV([
      ['Empresa de mantenimiento', ph(c.V.mantEmpresa, 'Empresa')],
      ['Licencia de la empresa', ph(c.V.mantLicencia, 'N.º de licencia')],
      ['Vigencia del contrato', c.V.mantVigencia ? fLarga(c.V.mantVigencia) : '[Vigencia]']
    ]),
    SIGN([c.firmas.osr])
  ];
  return { code: `${c.pref}-RG-03`, title: 'Registro de inventario de equipos generadores de radiación ionizante', kind: 'sgc', landscape: true, blocks };
}

function docRegEpp(c) {
  const filas = c.epp.map((e, i) => [String(i + 1), e.codigo || '', e.tipo || '', e.espesor || '', e.marca || '', e.talla || '', e.sala || '', e.estado || 'Bueno', fCorta(e.fechaPrueba), e.resultado || 'Apta', `Foto ${i + 1}`]);
  const salas = [...new Set(c.epp.map(e => e.sala).filter(Boolean))];
  const resumen = salas.map(s => {
    const deSala = c.epp.filter(e => e.sala === s);
    const del = deSala.filter(e => /Delantal|Chaleco|dos piezas/i.test(e.tipo || '')).length;
    const col = deSala.filter(e => /Collar/i.test(e.tipo || '') || /Chaleco plomado con collarín/i.test(e.tipo || '')).length;
    return [s, String(del), String(col), del >= 2 && col >= 2 ? 'Cumple' : 'Completar'];
  });
  const blocks = [
    T(['N.º', 'Código', 'Tipo', 'mm Pb', 'Marca', 'Talla', 'Sala', 'Estado', 'Última prueba', 'Resultado', 'Fotografía'], [...filas, ...blancos(2, 11)], { small: true }),
    Ps('Espesor mínimo exigido: delantales de 0,5 a 0,7 mm Pb cuando cubren solo el frente, o 0,25 mm Pb cuando cubren completamente los costados del tórax y la pelvis; collarín tiroideo de 0,5 mm Pb. Al menos dos prendas de cada tipo por sala.', { align: 'j' }),
    ...(resumen.length ? [T(['Sala', 'Delantales', 'Collarines', 'Mínimo de dos por tipo'], resumen, { small: true })] : []),
    SIGN([c.firmas.osr])
  ];
  return { code: `${c.pref}-RG-04`, title: 'Registro de inventario de elementos de protección radiológica', kind: 'sgc', landscape: true, blocks };
}

function docRegDosimetria(c) {
  const bim = /bimestral/i.test(c.V.dosPeriodo || '');
  const periodos = bim ? ['Ene-Feb', 'Mar-Abr', 'May-Jun', 'Jul-Ago', 'Sep-Oct', 'Nov-Dic'] : MESES_CORTOS;
  const filas = (c.poe.length ? c.poe : [{}, {}, {}]).map((p, i) => [String(i + 1), p.nombre || '', p.cedula || '', p.dosimetro || '', ...periodos.map(() => ''), '', '']);
  const blocks = [
    Ps(`Dosis equivalente personal Hp(10) en mSv, año ${c.anio}. Proveedor: ${ph(c.V.dosEmpresa, 'Empresa de dosimetría')}. Nivel de investigación: 1,5 mSv/mes.`, { align: 'j' }),
    T(['N.º', 'Apellidos y nombres', 'Cédula', 'Dosímetro', ...periodos, 'Total anual', 'Firma de recibido'], filas, { small: true, tall: true, widths: [3, 15, 8, 6, ...periodos.map(() => (100 - 3 - 15 - 8 - 6 - 6 - 10) / periodos.length), 6, 10] }),
    NOTE('ND: no detectable (por debajo del umbral de detección del servicio). Toda lectura mayor a 1,5 mSv en un mes se marca y se investiga según el procedimiento de vigilancia dosimétrica.'),
    SIGN([c.firmas.osr])
  ];
  return { code: `${c.pref}-RG-05`, title: 'Registro de reportes de dosimetría personal', kind: 'sgc', landscape: true, blocks };
}

function docRegMedico(c) {
  const filas = (c.poe.length ? c.poe : [{}, {}, {}]).map((p, i) => [String(i + 1), p.cedula || '', p.nombre || '', p.certTipo || 'Periódico', fCorta(p.certMed), p.certMed ? 'Apto' : '', c.V.labMedico || '', '']);
  const blocks = [
    T(['N.º', 'Cédula', 'Nombres completos', 'Tipo de examen', 'Fecha del certificado', 'Resultado', 'Médico / centro', 'Firma del responsable'], [...filas, ...blancos(2, 8)], { small: true, tall: true }),
    Ps('El certificado se emite con base en biometría hemática completa y recuento de plaquetas. El examen pre-ocupacional se realiza antes de iniciar actividades y el periódico, una vez al año (Art. 112 del Reglamento de Seguridad Radiológica).', { align: 'j' }),
    SIGN([c.firmas.osr])
  ];
  return { code: `${c.pref}-RG-06`, title: 'Registro de controles médico laborales del POE', kind: 'sgc', landscape: true, blocks };
}

function docRegIncidentes(c) {
  const blocks = [
    T(['N.º', 'Fecha y hora', 'Equipo / sala', 'Descripción del evento', 'Personas involucradas', 'Dosis estimada', 'Acciones tomadas', 'Notificado a la ARCN (fecha)', 'Responsable'], blancos(8, 9), { small: true, tall: true }),
    NOTE('Se registran también los eventos sin consecuencias (exposición de un paciente equivocado, repetición por falla del equipo, ingreso a la sala durante un disparo), porque permiten corregir a tiempo.'),
    SIGN([c.firmas.osr])
  ];
  return { code: `${c.pref}-RG-07`, title: 'Registro de incidentes y accidentes radiológicos', kind: 'sgc', landscape: true, blocks };
}

function docRegInspecciones(c) {
  const { O } = c;
  const filas = [];
  if (O.numero) filas.push([fCorta(O.fecha), 'Documental', O.numero, O.tecnicoNombre || '', '', '', 'En curso', '']);
  if (O.informeNum) filas.push([fCorta(O.informeFecha), 'Informe de inspección', O.informeNum, O.tecnicoNombre || '', String(c.S.disp.filter(d => d.nc).length || ''), `${O.plazo || 90} días hábiles`, 'En cumplimiento', '']);
  const blocks = [
    T(['Fecha', 'Tipo', 'Oficio / informe N.º', 'Inspector', 'N.º de no conformidades', 'Plazo', 'Estado', 'Oficio de cierre'], [...filas, ...blancos(5, 8)], { small: true, tall: true }),
    SIGN([c.firmas.osr])
  ];
  return { code: `${c.pref}-RG-08`, title: 'Registro de inspecciones de seguridad radiológica', kind: 'sgc', landscape: true, blocks };
}

function docRegCapacitacion(c) {
  const temas = temasPlan(c);
  const blocks = [];
  temas.forEach((t, i) => {
    blocks.push(Ps(`Tema ${i + 1}: ${t.tema}`, { bold: true }));
    blocks.push(KV([['Capacitador', ph(c.R.osrNombre, 'Capacitador')], ['Fecha', ''], ['Duración', `${t.horas} h`]]));
    const filas = (c.poe.length ? c.poe : [{}, {}, {}]).map((p, j) => [String(j + 1), p.cedula || '', p.nombre || '', '', '']);
    blocks.push(T(['N.º', 'Cédula', 'Nombres completos', 'Calificación', 'Firma'], filas, { widths: [6, 18, 40, 14, 22], small: true, tall: true }));
    blocks.push(SIGN([{ name: ph(c.R.osrNombre, 'Capacitador'), role: 'Capacitador' }, { ...c.firmas.osr, role: 'Responsable del registro' }].filter((x, k, arr) => k === 0 || !c.mismaPersona(x, arr[0]))));
    if (i < temas.length - 1) blocks.push(PB());
  });
  return { code: `${c.pref}-RG-09`, title: 'Registro de capacitaciones', kind: 'sgc', blocks };
}

/* ---------------------------------------------------- FORMATOS Y RÓTULOS */

function docConsentimiento(c) {
  const { I, P, S } = c;
  const blocks = [
    Ps(`CONSENTIMIENTO INFORMADO PARA ${S.practica === 'intervencionista' ? 'PROCEDIMIENTOS GUIADOS POR FLUOROSCOPIA' : 'ESTUDIOS CON RADIACIONES IONIZANTES'}`, { align: 'c', bold: true }),
    H('Datos del paciente'),
    KV([
      ['Nombres y apellidos', ''],
      ['Cédula / Historia clínica', ''],
      ['Edad / Sexo', ''],
      [S.practica === 'intervencionista' ? 'Procedimiento' : 'Estudio solicitado', ''],
      ['Profesional que informa', '']
    ], { tall: true }),
    H('Información para el paciente'),
    Ps(S.practica === 'odontologico'
      ? 'Su odontólogo le ha indicado una radiografía para ver estructuras de los dientes y de los huesos de la cara que no se aprecian en la revisión clínica. Esa información permite un diagnóstico y un tratamiento correctos.'
      : S.practica === 'intervencionista'
        ? 'El procedimiento que se le va a realizar utiliza rayos X para que el médico vea en tiempo real el recorrido de los catéteres dentro de su cuerpo. Sin esa imagen el procedimiento no podría hacerse de forma segura.'
        : 'El estudio que le han indicado utiliza rayos X para obtener imágenes del interior de su cuerpo. Esas imágenes ayudan a su médico a confirmar o descartar un diagnóstico y a decidir el tratamiento.', { align: 'j' }),
    Ps('**Beneficios:** obtener información diagnóstica que no puede conseguirse de otra manera igual de rápida o precisa.', { align: 'j' }),
    Ps('**Riesgos:**', { align: 'j' }),
    L(P.riesgos),
    Ps('Como referencia, la dosis aproximada de algunos estudios comparada con la radiación natural que todos recibimos (alrededor de 3 mSv al año) es:', { align: 'j' }),
    T(['Estudio', 'Dosis efectiva aproximada', 'Equivale a radiación natural de'], P.dosis, { small: true }),
    Ps('**Alternativas:** cuando existe un estudio sin radiación ionizante (ecografía, resonancia magnética) que responda a la misma pregunta clínica, el profesional se lo indicará.', { align: 'j' }),
    H('Declaración de embarazo (mujeres de 10 a 50 años)'),
    Ps('¿Está embarazada o existe la posibilidad de que lo esté?     (   ) Sí     (   ) No     (   ) No sabe'),
    H('Consentimiento'),
    Ps(`Declaro que he sido informado/a en un lenguaje claro sobre el ${S.practica === 'intervencionista' ? 'procedimiento' : 'estudio'}, sus beneficios, sus riesgos y las alternativas; que pude hacer preguntas y que fueron respondidas. Autorizo a ${ph(I.nombreComercial || I.razonSocial, 'Institución')} a realizarlo. Sé que puedo retirar este consentimiento en cualquier momento antes de su realización.`, { align: 'j' }),
    KV([['Lugar y fecha', '']], {}),
    SIGN([{ name: '', role: 'Paciente', blank: true }, { name: '', role: 'Representante legal o apoderado (si aplica)\nNombre y cédula:', blank: true }, { name: '', role: 'Profesional que informa', blank: true }]),
    H('Revocatoria'),
    Ps('Revoco el consentimiento otorgado y no autorizo la realización del estudio.  Fecha: ______________   Firma: ______________________', { align: 'j' })
  ];
  return { code: `${c.pref}-FO-01`, title: 'Consentimiento informado', kind: 'sgc', blocks };
}

function docRotulos(c) {
  const rot = [
    { t: 'trebol' },
    { t: 'big', text: 'PRECAUCIÓN\nZONA CONTROLADA\nRADIACIÓN IONIZANTE', sub: 'Prohibido el ingreso a personal no autorizado' },
    PB(),
    { t: 'big', text: 'SE PROHÍBE LA ENTRADA CUANDO LA LUZ ESTÉ ENCENDIDA', sub: 'Colocar junto a la señalización luminosa roja, sobre la puerta de acceso' },
    PB(),
    { t: 'big', text: 'PACIENTE:\nSOLICITE VESTIMENTAS PLOMADAS PARA SU PROTECCIÓN DURANTE EL EXAMEN RADIOGRÁFICO' },
    PB(),
    { t: 'big', text: 'ACOMPAÑANTE:\nCUANDO HAYA NECESIDAD DE SUJETAR AL PACIENTE, EXIJA Y USE CORRECTAMENTE LAS VESTIMENTAS PLOMADAS PARA SU PROTECCIÓN' },
    PB(),
    { t: 'big', text: 'SI USTED ESTÁ EMBARAZADA O CREE ESTARLO, HÁGALO SABER AL OPERADOR' },
    PB(),
    { t: 'trebol' },
    { t: 'big', text: 'ZONA SUPERVISADA', sub: 'Permanencia limitada al tiempo necesario' }
  ];
  return { code: `${c.pref}-FO-02`, title: 'Rótulos de señalización', kind: 'rotulo', blocks: rot };
}

/* ---------------------------------------------------- REGISTRO DE DOCUMENTOS */

const DOCS = [
  { id: 'OF-RESP', cod: 'OF-01', grupo: 'Oficios', aplica: () => true, build: docOficioRespuesta, nota: 'Respuesta al oficio de notificación' },
  { id: 'OF-DISP', cod: 'OF-02', grupo: 'Oficios', aplica: (c) => c.S.disp.some(d => d.nc), build: docOficioDisposiciones, nota: 'Respuesta al informe de inspección' },
  { id: 'OF-BAJA', cod: 'OF-03', grupo: 'Oficios', aplica: (c) => c.eqBaja.length > 0, build: docOficioBaja, nota: 'Requisito II.9' },
  { id: 'DEC-MAX', cod: 'DC-01', grupo: 'Declaraciones y nombramientos', aplica: () => true, build: docDeclaracionMaxima, nota: 'Requisito I.4' },
  { id: 'NOM-OSR', cod: 'DC-02', grupo: 'Declaraciones y nombramientos', aplica: (c) => !!c.R.osrAplica, build: docNombramientoOSR, nota: 'Requisito I.7' },
  { id: 'DES-MED', cod: 'DC-03', grupo: 'Declaraciones y nombramientos', aplica: () => true, build: docDesignacionMedico, nota: 'Requisito I.8' },
  { id: 'DEC-EMB', cod: 'PR-01', grupo: 'Planes y procedimientos', aplica: () => true, build: docEmbrion, nota: 'Requisito I.5' },
  { id: 'FUN-RESP', cod: 'PR-02', grupo: 'Planes y procedimientos', aplica: () => true, build: docFunciones, nota: 'Requisito I.12' },
  { id: 'PLAN-CAP', cod: 'PL-01', grupo: 'Planes y procedimientos', aplica: () => true, build: docPlanCapacitacion, nota: 'Requisito I.11' },
  { id: 'PROC-TEC', cod: 'PR-03', grupo: 'Planes y procedimientos', aplica: () => true, build: docProcTecnicos, nota: 'Requisito I.15' },
  { id: 'PROC-PRES', cod: 'PR-04', grupo: 'Planes y procedimientos', aplica: () => true, build: docPrescripcion, nota: 'Requisito I.16' },
  { id: 'PROC-JUST', cod: 'PR-05', grupo: 'Planes y procedimientos', aplica: () => true, build: docJustificacion, nota: 'Requisito I.33' },
  { id: 'PROC-DOS', cod: 'PR-06', grupo: 'Planes y procedimientos', aplica: () => true, build: docDosimetria, nota: 'Disposiciones de dosimetría' },
  { id: 'PROC-SEG', cod: 'PR-07', grupo: 'Planes y procedimientos', aplica: (c) => c.S.practica === 'intervencionista', build: docSeguimientoPaciente, nota: 'Propio de intervencionismo' },
  { id: 'INF-DEL', cod: 'IN-01', grupo: 'Informes y listados', aplica: () => true, build: docInformeDelantales, nota: 'Requisito I.18' },
  { id: 'NOM-POE', cod: 'LS-01', grupo: 'Informes y listados', aplica: () => true, build: docNominaPOE, nota: 'Requisito I.13' },
  { id: 'LIST-EQ', cod: 'LS-02', grupo: 'Informes y listados', aplica: () => true, build: docListadoEquipos, nota: 'Requisito II.8' },
  { id: 'LISTA-M', cod: 'LM-01', grupo: 'Informes y listados', aplica: () => true, build: docListaMaestra, nota: 'Requisito II.1' },
  { id: 'MATRIZ', cod: 'LS-03', grupo: 'Informes y listados', aplica: () => true, build: docMatriz, nota: 'Control interno' },
  { id: 'REG-LIC', cod: 'RG-01', grupo: 'Registros', aplica: () => true, build: docRegLicencias, nota: 'Requisito I.22' },
  { id: 'REG-OSR', cod: 'RG-02', grupo: 'Registros', aplica: (c) => !!c.R.osrAplica, build: docRegOSR, nota: 'Requisito I.23' },
  { id: 'REG-EQ', cod: 'RG-03', grupo: 'Registros', aplica: () => true, build: docRegEquipos, nota: 'Requisito I.24' },
  { id: 'REG-EPP', cod: 'RG-04', grupo: 'Registros', aplica: () => true, build: docRegEpp, nota: 'Requisito I.25' },
  { id: 'REG-DOS', cod: 'RG-05', grupo: 'Registros', aplica: () => true, build: docRegDosimetria, nota: 'Requisito I.26' },
  { id: 'REG-MED', cod: 'RG-06', grupo: 'Registros', aplica: () => true, build: docRegMedico, nota: 'Requisito I.27' },
  { id: 'REG-INC', cod: 'RG-07', grupo: 'Registros', aplica: () => true, build: docRegIncidentes, nota: 'Requisito I.28' },
  { id: 'REG-INSP', cod: 'RG-08', grupo: 'Registros', aplica: () => true, build: docRegInspecciones, nota: 'Requisito I.29' },
  { id: 'REG-CAP', cod: 'RG-09', grupo: 'Registros', aplica: () => true, build: docRegCapacitacion, nota: 'Requisito I.30' },
  { id: 'CONS-INF', cod: 'FO-01', grupo: 'Formatos y rótulos', aplica: () => true, build: docConsentimiento, nota: 'Requisito I.17' },
  { id: 'ROTULOS', cod: 'FO-02', grupo: 'Formatos y rótulos', aplica: () => true, build: docRotulos, nota: 'Requisitos II.2 y II.3' }
];

/* Alertas técnicas que una OSR revisaría antes de enviar */
function revisarExpediente(c) {
  const a = [];
  const { I, R, V } = c;
  const ev = estadoVigencia(I.licenciaCad);
  if (I.licenciaCad && ev !== 'Vigente') a.push({ nivel: ev === 'Caducada' ? 'alta' : 'media', txt: `Licencia institucional ${ev.toLowerCase()} (${fCorta(I.licenciaCad)}).` });
  c.poe.forEach(p => {
    const e = estadoVigencia(p.licCad);
    if (!p.licencia) a.push({ nivel: 'media', txt: `${p.nombre}: falta el número de licencia ocupacional.` });
    else if (e === 'Caducada' || e === 'Por caducar') a.push({ nivel: e === 'Caducada' ? 'alta' : 'media', txt: `${p.nombre}: licencia ocupacional ${e.toLowerCase()} (${fCorta(p.licCad)}).` });
    const dm = diasHasta(p.certMed);
    if (!p.certMed) a.push({ nivel: 'media', txt: `${p.nombre}: sin fecha de certificado médico.` });
    else if (dm < -365) a.push({ nivel: 'alta', txt: `${p.nombre}: certificado médico con más de un año (${fCorta(p.certMed)}).` });
  });
  const necesitaOSR = c.eqAct.length >= 4 && c.eqAct.some(e => TIPOS_OSR.test(e.tipo || ''));
  if (necesitaOSR && !R.osrAplica) a.push({ nivel: 'alta', txt: `La instalación tiene ${c.eqAct.length} equipos y al menos uno de tipo angiógrafo, tomógrafo, arco en C, litotriptor o telecomandado: debe contar con OSR (Art. 5, lit. g). Active la opción en Responsables.` });
  if (R.osrAplica) {
    const e = estadoVigencia(R.osrAutCad);
    if (e === 'Caducada' || e === 'Por caducar') a.push({ nivel: e === 'Caducada' ? 'alta' : 'media', txt: `Autorización de OSR ${e.toLowerCase()}.` });
  }
  if (R.medLicCad && estadoVigencia(R.medLicCad) === 'Caducada') a.push({ nivel: 'alta', txt: 'La licencia del responsable de la protección del paciente está caducada.' });
  c.eqAct.forEach(e => {
    const d = diasHasta(e.mantFecha);
    const id = `${e.tipo || 'Equipo'} ${e.marca || ''} serie ${e.serie || 'NR'}`;
    if (!e.mantFecha) a.push({ nivel: 'media', txt: `${id}: sin fecha de último mantenimiento y control de calidad.` });
    else if (d < -365) a.push({ nivel: 'alta', txt: `${id}: mantenimiento con más de 12 meses (${fCorta(e.mantFecha)}).` });
    if (!e.tuboSerie) a.push({ nivel: 'baja', txt: `${id}: falta la serie del tubo (insert); el MEM la exige en el informe técnico.` });
  });
  if (V.dosVigencia && diasHasta(V.dosVigencia) < 0) a.push({ nivel: 'alta', txt: 'El contrato de dosimetría personal está vencido.' });
  if (V.mantVigencia && diasHasta(V.mantVigencia) < 0) a.push({ nivel: 'alta', txt: 'El contrato de mantenimiento está vencido.' });
  const prendas = c.epp.filter(e => ES_PRENDA.test(e.tipo || ''));
  prendas.forEach(p => {
    if (p.fechaPrueba && diasHasta(p.fechaPrueba) < -365) a.push({ nivel: 'media', txt: `Prenda ${p.codigo || p.tipo}: prueba de integridad con más de 12 meses.` });
    if (p.resultado === 'No apta') a.push({ nivel: 'alta', txt: `Prenda ${p.codigo || p.tipo}: no apta, retirar de uso y reponer.` });
    const mm = parseFloat(String(p.espesor || '').replace(',', '.'));
    if (/Collar/i.test(p.tipo || '') && mm && mm < 0.5) a.push({ nivel: 'media', txt: `Collarín ${p.codigo || ''}: espesor menor a 0,5 mm Pb.` });
    if (/frontal/i.test(p.tipo || '') && mm && mm < 0.5) a.push({ nivel: 'media', txt: `Delantal ${p.codigo || ''}: espesor menor a 0,5 mm Pb para uso frontal.` });
  });
  if (!c.poe.length) a.push({ nivel: 'media', txt: 'Aún no hay personal registrado.' });
  if (!c.eqAct.length) a.push({ nivel: 'media', txt: 'Aún no hay equipos registrados.' });
  const pend = REQUISITOS.filter(r => estadoReq(c, r) === 'Pendiente');
  if (pend.length) a.push({ nivel: 'baja', txt: `${pend.length} requisitos marcados como pendientes en la lista de verificación.` });
  return a;
}
