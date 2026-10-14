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

const GRUPOS = ['Oficios', 'Declaraciones y nombramientos', 'Planes y procedimientos', 'Bitácoras y control del POE', 'Informes y listados', 'Registros', 'Formatos y rótulos'];

/* Completa los datos de cada persona del POE (nombre completo, licencia = cédula, autorización OSR) */
function personaPOE(p, practica) {
  const nombre = [p.apellidos, p.nombres].filter(x => x && x.trim()).join(' ').trim() || (p.nombre || '').trim();
  const cat = p.categoria || (p.autOsr ? 'osr' : 'tecnologo');
  return Object.assign({}, p, {
    nombre,
    categoria: cat,
    funcion: p.cargo || p.funcion || '',
    licencia: p.licencia || p.cedula || '',
    autOsr: cat === 'osr' ? (p.codigo || p.autOsr || '') : (p.autOsr || ''),
    area: p.area || DOS_AREA[practica] || '6',
    tipoDos: p.tipoDos || DOS_TIPO,
    cargoDos: p.cargoDos || DOS_CARGO[cat] || '15'
  });
}

function crearContexto(S) {
  const P = PRACTICAS[S.practica];
  const I = S.inst, R = S.resp, V = S.serv, O = S.oficio, M = S.meta;
  const poe = S.poe.map(p => personaPOE(p, S.practica)).filter(p => p.nombre);
  const eq = S.equipos.filter(e => (e.tipo || e.marca || e.serie));
  const BAJA = /baja|Vendido|Donado|Trasladado|Devuelto/i;
  const eqAct = eq.filter(e => !BAJA.test(e.estado || ''));
  const eqBaja = eq.filter(e => BAJA.test(e.estado || ''));
  const epp = S.epp.filter(e => (e.tipo || e.codigo));
  const fecha = M.fechaEmision || hoyISO();
  const anio = M.anioPlan || (parseFecha(fecha) || new Date()).getFullYear();
  const pref = (M.siglas || M.prefijo || 'SR').trim();
  const rolOSR = R.osrAplica ? 'Oficial de Seguridad Radiológica' : 'Responsable de protección radiológica';
  const tiposPresentes = eqAct.map(e => e.tipo || '').join(' | ');
  const tiene = (re) => re.test(tiposPresentes);
  const autoridad = (O.autoridad || 'Ministerio de Ambiente y Energía').trim();

  /* Representante legal: persona natural, o persona jurídica que actúa mediante su representante */
  const repTop = I.repEmpresa ? I.repEmpresa : '';
  const repNombre = I.repEmpresa ? `Rep.: ${ph(I.repLegal, 'Nombre del representante')}` : ph(I.repLegal, 'Representante legal');
  const firmas = {
    rep: { top: repTop, name: repNombre, role: I.repEmpresa ? 'Representante Legal / Licenciatario' : [I.repCargo || 'Gerente General', 'Representante Legal / Licenciatario'].join('\n'), ced: I.repCedula, sello: true },
    osr: { top: R.osrProfesion ? R.osrProfesion.toUpperCase() : '', name: [R.osrTitulo, ph(R.osrNombre, R.osrAplica ? 'Nombre del OSR' : 'Nombre del responsable')].filter(Boolean).join(' '), role: R.osrAplica && R.osrAut ? `${rolOSR}\nAutorización OSR: ${R.osrAut}` : rolOSR, ced: R.osrCedula },
    med: { name: [R.medTitulo, ph(R.medNombre, 'Nombre del ' + P.profResp)].filter(Boolean).join(' '), role: P.tituloResp, ced: R.medCedula }
  };
  /* Si el representante legal es también responsable (consultorios), no repetir firmas idénticas */
  const mismaPersona = (a, b) => a.name && b.name && a.name.replace(/^Rep\.: /, '').replace(/\W/g, '').toLowerCase().endsWith(b.name.replace(/^Rep\.: /, '').replace(/\W/g, '').toLowerCase().slice(-12));

  return { S, P, I, R, V, O, M, poe, eq, eqAct, eqBaja, epp, fecha, anio, pref, rolOSR, tiene, firmas, mismaPersona, autoridad };
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
    c.O.direccionMEM || 'Dirección de Licenciamiento y Protección Radiológica',
    c.autoridad.toUpperCase(),
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
  const quedan = c.eqAct.length;
  const blocks = [
    Ps(`Oficio Nro. ${ph(c.O.numBaja, 'Número de oficio de la institución')}`, { align: 'r', bold: true }),
    Ps(lugarFecha(c), { align: 'r' }),
    SP(),
    Ps(`**Asunto:** Notificación del destino final de equipos generadores de radiación ionizante y solicitud de actualización de la licencia institucional tipo C – ${ph(I.razonSocial, 'Razón social')}.`),
    SP(),
    destinatarioMEM(c),
    SP(),
    Ps('De mi consideración:'),
    Ps(`En cumplimiento del artículo 70 del ${REGLAMENTO}, que obliga a notificar la venta o el arrendamiento de una máquina de rayos X dentro de los quince días siguientes, y del numeral 4.3.2 de la Norma Técnica (${NORMA}), pongo en conocimiento de la Autoridad Reguladora el destino final de los equipos que constaban registrados bajo responsabilidad de ${ph(I.razonSocial, 'Razón social')}, RUC ${ph(I.ruc, 'RUC')}${I.licencia ? `, licencia institucional ${I.licencia}` : ''}:`, { align: 'j' }),
    T(['Tipo', 'Marca', 'Modelo', 'Serie', 'Destino', 'Fecha', 'Respaldo'], filas.length ? filas : [['', '', '', '', '', '', '']], { small: true }),
    hayChatarra
      ? Ps('Para los equipos dados de baja se adjunta el acta de chatarrización correspondiente, en la que constan la inutilización del tubo de rayos X y la identificación de cada equipo.', { align: 'j' })
      : Ps('Se adjuntan los documentos que respaldan la transferencia de cada equipo.', { align: 'j' }),
    quedan
      ? Ps(`Por lo expuesto, solicito la actualización de la licencia institucional tipo C para los ${quedan} ${quedan === 1 ? 'equipo que continúa' : 'equipos que continúan'} en operación.`, { align: 'j' })
      : Ps('Al no quedar equipos generadores de radiación ionizante en operación, solicito la extinción de la licencia institucional y el cierre del expediente, conforme al numeral 4.3.2 de la Norma Técnica.', { align: 'j' }),
    Ps('Atentamente,'),
    SIGN([c.firmas.rep])
  ];
  return { title: 'Oficio de destino final de equipos', kind: 'carta', blocks };
}

/* ---------------------------------------------------- DECLARACIONES Y NOMBRAMIENTOS */

function docEmbrion(c) {
  const { I, P, S } = c;
  const tareas = {
    medico: 'tareas administrativas del servicio, recepción y verificación de solicitudes, gestión de imágenes y del archivo, o actividades fuera de la zona controlada',
    intervencionista: 'tareas fuera de la sala de procedimientos: programación, preparación previa del paciente fuera de la sala, registro de indicadores de dosis y gestión documental',
    odontologico: 'atención clínica sin exposición, gestión de historias clínicas o actividades fuera de la sala de rayos X'
  }[S.practica];
  const blocks = [
    H('1. Objeto'),
    Ps(`Establecer las restricciones adicionales que ${ph(I.razonSocial, 'Razón social')} aplicará a las trabajadoras ocupacionalmente expuestas en estado de gestación, de modo que el embrión o feto reciba el mismo grado de protección que se exige para los miembros del público.`, { align: 'j' }),
    H('2. Base legal'),
    T(['Norma', 'Referencia', 'Disposición'], [
      ['Norma Técnica MERNNR-MERNNR-2022-0011-AM', { t: 'Num. 5.2 lit. b)', align: 'c' }, 'La sospecha de embarazo no excluye a la trabajadora; el empleador aplica restricciones adicionales para dar al embrión o feto la protección de un miembro del público.'],
      ['Norma Técnica MERNNR-MERNNR-2022-0011-AM', { t: 'Num. 6.1.1 lit. c)', align: 'c' }, 'La vigilancia radiológica del POE en estado de gravidez no debe sobrepasar el límite de 1 mSv para el feto durante la gestación.'],
      ['Norma Técnica MERNNR-MERNNR-2022-0011-AM', { t: 'Num. 6.1.2 lit. d)', align: 'c' }, 'La trabajadora que sospeche estar embarazada lo notifica al representante legal o su delegado.'],
      ['Reglamento de Seguridad Radiológica (D.S. 3640)', { t: 'Art. 112 lit. e)', align: 'c' }, 'El personal femenino en estado de gravidez reconocido por diagnóstico médico no debe estar en contacto con radiación y se destina a labores sin contacto directo con las radiaciones ionizantes.']
    ], { widths: [30, 17, 53], small: true }),
    H('3. Alcance'),
    Ps(`Aplica a todas las trabajadoras que forman parte del POE de la práctica de ${P.corto}, cualquiera sea su modalidad de contratación.`, { align: 'j' }),
    H('4. Compromiso del empleador'),
    Ps(`La institución, a través de su representante legal, garantiza que la dosis al embrión o feto no supere **1 mSv durante la gestación**. La notificación del embarazo no será motivo para excluir a la trabajadora, reducir su remuneración ni darle un trato discriminatorio.`, { align: 'j' }),
    H('5. Disposiciones'),
    L([
      `La trabajadora que sospeche estar embarazada lo notifica por escrito al representante legal o al ${c.rolOSR.toLowerCase()}, como su delegado, usando el formato de este documento.`,
      'En un plazo máximo de cinco días laborables, el responsable revisa con ella sus tareas y sus registros dosimétricos de los últimos doce meses, y deja por escrito las medidas adoptadas.',
      `Confirmado el embarazo por diagnóstico médico, la trabajadora es destinada a labores sin contacto directo con las radiaciones ionizantes (Art. 112 lit. e del Reglamento), como ${tareas}.`,
      'Mientras permanezca en el servicio mantiene su dosímetro personal y, si su nueva tarea la acerca a una zona supervisada, se le asigna un segundo dosímetro a la altura del abdomen. El responsable revisa cada lectura frente al límite de 1 mSv.',
      'No sujeta pacientes ni actúa como acompañante durante exposiciones, en concordancia con el numeral 6.1.4 lit. b) de la Norma Técnica, y no participa en la atención de incidentes radiológicos.',
      'Al tratarse de equipos generadores de rayos X, sin fuentes radiactivas, no existe riesgo de contaminación; la lactancia no requiere restricciones adicionales.'
    ], true),
    H('6. Registro'),
    Ps('La notificación, el certificado médico y las medidas adoptadas se archivan en el expediente de la trabajadora, con copia en el registro de vigilancia dosimétrica.', { align: 'j' }),
    H('7. Formato de notificación de embarazo'),
    KV([
      ['Nombres y apellidos', ''],
      ['Cédula', ''],
      ['Cargo / función', ''],
      ['Fecha probable de parto', ''],
      ['Fecha de notificación', ''],
      ['Labor asignada durante la gestación', ''],
      ['Dosímetro adicional asignado (código)', '']
    ], { tall: true }),
    SIGN([{ name: '', role: 'Trabajadora', blank: true }, { ...c.firmas.osr }]),
    PB(),
    aprobaciones(c)
  ];
  return { title: 'Protección del embrión y feto en trabajadoras expuestas', kind: 'sgc', blocks };
}

/* Funciones del OSR según el Anexo III de la Norma Técnica */
function funcionesOSR(c) {
  const f = [
    'Conocer, participar y supervisar el diseño, montaje, instalación, operación, modificación y clausura de la instalación, aplicando la filosofía ALARA (Anexo III, num. 1).',
    'Velar porque las licencias, autorizaciones y demás documentación estén actualizadas, vigentes y disponibles (num. 2).',
    'Asegurar que solo el personal autorizado manipule los equipos y que los manuales de operación estén disponibles (num. 3 y 4).',
    'Estar presente en las inspecciones y auditorías de la Autoridad Reguladora e informar al titular de la licencia cualquier hecho relacionado con la seguridad (num. 5 y 6).',
    'Llevar a cabo o verificar el levantamiento radiométrico y participar desde la adquisición hasta la recepción de los equipos (num. 7 y 8).',
    'Clasificar, señalizar y vigilar las zonas controladas y supervisadas y establecer los requisitos de acceso y permanencia (num. 11 y 12).',
    'Gestionar la vigilancia dosimétrica: archivo de datos, récord dosimétrico, investigación de dosis que superen el nivel de investigación e información a cada trabajador de su dosis (num. 13).',
    'Verificar la aptitud médica del POE y proporcionar al médico los datos del riesgo radiológico de cada puesto (num. 14).',
    'Coordinar los procedimientos del manual de seguridad radiológica en caso de incidente o accidente (num. 15 y 16).',
    'Capacitar al POE según el plan anual, con la temática mínima de protección del POE y del paciente, dosímetro personal, elementos de protección y trámites de licencias, e inducir al personal nuevo (num. 17 y 18).',
    'Elaborar el programa de vigilancia y control de dosis y vigilar el control de calidad de los equipos de rayos X (num. 19 y 20).',
    'Asegurar la corrección de las no conformidades de las auditorías y paralizar los trabajos cuando no se cumplan los requisitos de protección radiológica (num. 21 y 22).',
    'Elaborar el manual de seguridad radiológica, implementar el programa de protección radiológica y llevar todos los registros y evidencias (num. 23 a 25).'
  ];
  if (c.S.practica === 'intervencionista') f.splice(7, 0, 'Revisar los registros de parámetros dosimétricos de los pacientes (Art. 10.1 lit. e) y verificar el seguimiento de quienes superen los niveles de vigilancia de dosis en piel.');
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
  const { I, R, P } = c;
  const rm = responsabilidadesMedico(c);
  const blocks = [
    Ps(lugarFecha(c), { align: 'r' }),
    SP(),
    LINES([ph(R.medTitulo, 'Título'), ph(R.medNombre, 'Nombre del profesional'), 'Presente.']),
    SP(),
    Ps('**Asunto:** Designación de responsable de la protección radiológica del paciente'),
    Ps(`Conforme al artículo 5, numeral 5.1, literal l) de la Norma Técnica (${NORMA}), le asigno la responsabilidad total de la protección del paciente en la práctica de ${P.corto} de ${ph(I.razonSocial, 'Razón social')}.`, { align: 'j' }),
    Ps(`Esta designación considera su formación como ${ph(R.medEspecialidad, 'especialidad')} y su licencia personal tipo A ${ph(R.medLicencia, 'N.º de licencia')}, vigente hasta el ${fLarga(R.medLicCad)}, en la que consta la razón social de la instalación.`, { align: 'j' }),
    Ps(`De acuerdo con el ${rm.num} de la Norma Técnica, sus responsabilidades son:`, { align: 'j' }),
    L(rm.lista, true),
    SIGN([c.firmas.rep]),
    SP(),
    H('Aceptación'),
    Ps(`Yo, ${ph(R.medNombre, 'Nombre del profesional')}, con cédula N.º ${ph(R.medCedula, 'Cédula')}, acepto la designación y las responsabilidades que implica.`, { align: 'j' }),
    SIGN([c.firmas.med])
  ];
  return { title: 'Designación del responsable de la protección del paciente', kind: 'carta', blocks };
}

function docFunciones(c) {
  const { I, P, S } = c;
  const tecnologo = 'Operar el equipo bajo condiciones seguras; utilizar las técnicas que correspondan a cada estudio; proporcionar y asegurar el uso de los elementos de protección radiológica al paciente y a sus acompañantes; usar adecuadamente su dosímetro y los elementos de protección; participar en la optimización y en el programa de garantía de calidad; cumplir los protocolos clínicos; mantener su licencia personal tipo A vigente.';
  const rm = responsabilidadesMedico(c);
  const roles = [
    [{ t: 'Representante legal / licenciatario', bold: true }, { t: 'Art. 5, num. 5.1', align: 'c' }, 'Máximo responsable de la protección radiológica de la instalación. Asegura licencias personales tipo A, nombra al OSR cuando corresponde, ejecuta el plan anual de capacitación, garantiza la prescripción documentada, la justificación en embarazadas y pediátricos, la vigilancia dosimétrica y médica, y notifica a la Autoridad Reguladora la suspensión de equipos y los cambios de personal en los plazos establecidos.'],
    [{ t: c.rolOSR, bold: true }, { t: c.R.osrAplica ? 'Num. 5.8.3 y Anexo III' : 'Reglamento, Art. 17 lit. d)', align: 'c' }, c.R.osrAplica ? funcionesOSR(c).slice(0, 8).map(x => x.replace(/\s*\((Anexo III, )?num\.[^)]*\)/g, '')).join(' ') : 'Por delegación del representante legal, vigila de forma permanente los aspectos de control de radiación: dosimetría, vigilancia médica, capacitación, registros, prendas de protección, señalización y relación con la Autoridad Reguladora.'],
    [{ t: P.tituloResp, bold: true }, { t: rm.num.replace('numerales', 'Num.').replace('numeral', 'Num.'), align: 'c' }, rm.lista.join(' ')]
  ];
  if (S.practica !== 'odontologico') roles.push([{ t: 'Técnico, tecnólogo médico o licenciado en radiología', bold: true }, { t: 'Num. 5.8.4', align: 'c' }, tecnologo]);
  if (S.practica === 'odontologico') roles.push([{ t: 'Tecnólogo o licenciado en radiología (si lo hay)', bold: true }, { t: 'Num. 16.4 y 5.8.4', align: 'c' }, tecnologo]);
  if (S.practica === 'intervencionista') roles.push([{ t: 'Anestesiología, instrumentación, enfermería y practicantes', bold: true }, { t: 'Num. 10.3.4 y Art. 11', align: 'c' }, 'No requieren licencia de la Autoridad Reguladora, pero obligatoriamente usan dosimetría personal (cuerpo entero, extremidades y cristalino cuando corresponda), elementos de protección y cumplen el control médico. Se ubican lejos del tubo y detrás de las mamparas siempre que su tarea lo permita.']);
  if (S.practica === 'medico') roles.push([{ t: 'Personal de apoyo (enfermería, camilleros)', bold: true }, { t: 'Num. 6.1.4 lit. a) y b)', align: 'c' }, 'Permanece fuera de la zona controlada durante la exposición salvo que su presencia sea indispensable; en ese caso usa los dispositivos de protección que entrega el operador. Una persona en estado de gestación no puede actuar como acompañante.']);
  if (S.practica === 'odontologico') roles.push([{ t: 'Asistente dental', bold: true }, { t: '—', align: 'c' }, 'Prepara al paciente y el material. No opera el equipo, no permanece en la sala durante el disparo y no sostiene receptores.']);
  const acept = (c.poe.length ? c.poe : [{}, {}, {}]).map((p, i) => [String(i + 1), p.nombre || '', p.cedula || '', p.funcion || '', '', '']);
  const blocks = [
    H('1. Objeto'),
    Ps(`Asignar las funciones y responsabilidades en materia de seguridad radiológica al personal de la práctica de ${P.corto} de ${ph(I.razonSocial, 'Razón social')}, con la aceptación respectiva de cada trabajador, según el artículo 9 del Reglamento de Seguridad Radiológica y los artículos ${S.practica === 'intervencionista' ? '12 lit. g)' : '15 lit. g)'} y 5.8 de la Norma Técnica.`, { align: 'j' }),
    H('2. Funciones por cargo'),
    T(['Cargo', 'Base', 'Funciones y responsabilidades'], roles, { widths: [20, 13, 67], small: true }),
    H('3. Obligaciones comunes a todo el POE'),
    L([
      'Mantener vigente su licencia personal tipo A y presentarla cuando se le solicite. Las licencias caducan a los cuatro años y la renovación se solicita con 90 días de anticipación (Reglamento, Art. 33 y 105).',
      'Portar el dosímetro personal durante la jornada y dejarlo, al terminar, almacenado en la institución fuera de la zona controlada (Norma, num. 6.1.2 lit. c).',
      'Firmar el recibido de su reporte dosimétrico.',
      'Asistir a las capacitaciones del plan anual.',
      'Realizarse el examen médico ocupacional anual (Reglamento, Art. 112).',
      'Informar de inmediato al responsable cualquier falla, incidente o condición insegura.'
    ]),
    H('4. Aceptación de funciones'),
    Ps('Con su firma, cada trabajador declara que conoce y acepta las funciones descritas para su cargo.', { align: 'j' }),
    T(['N.º', 'Nombres y apellidos', 'Cédula', 'Función', 'Firma', 'Fecha'], acept, { widths: [6, 30, 14, 22, 16, 12], tall: true }),
    aprobaciones(c)
  ];
  return { title: 'Asignación de funciones y responsabilidades', kind: 'sgc', blocks };
}

/* ---------------------------------------------------- PLANES Y PROCEDIMIENTOS */

function temasPlan(c) {
  return cronogramaActual(c).map(x => ({ tema: x.tema, contenido: x.obs || '', horas: horasEntre(x.horaIni, x.horaFin) || 2 }));
}

function responsabilidadesMedico(c) {
  if (c.S.practica === 'odontologico') return {
    num: 'numeral 16.5.1',
    lista: [
      'Operar el equipo bajo condiciones seguras.',
      'Interpretar las imágenes que se obtengan como resultado del radiodiagnóstico odontológico.',
      'Proporcionar y asegurar el uso de los elementos de protección radiológica al paciente y a sus acompañantes, y mantenerlos en condiciones adecuadas.',
      'Justificar cada radiografía, con énfasis en pacientes embarazadas y pediátricos (Art. 5, num. 5.1 lit. q).',
      'Mantener su licencia personal tipo A vigente.'
    ]
  };
  return {
    num: c.S.practica === 'medico' ? 'numerales 5.8.1 y 5.8.2' : 'numeral 5.8.1',
    lista: [
      'Asumir la responsabilidad de la protección radiológica del paciente durante el diagnóstico o el procedimiento.',
      'Evaluar el estudio solicitado y recomendar el procedimiento adecuado para obtener la información diagnóstica con la mínima exposición del paciente.',
      'Cumplir y establecer los protocolos clínicos optimizados de la práctica, y los parámetros de exposición por tipo de equipo y de estudio, revisando las tablas de técnicas con los operadores.',
      'Justificar todos los estudios, con énfasis en personas embarazadas y pediátricas.',
      'Evaluar cualquier incidente o accidente radiológico ocurrido.',
      'Utilizar adecuadamente los dosímetros y elementos de seguridad radiológica y mantenerlos en condiciones adecuadas.',
      'Participar activamente en la optimización de la práctica y en el programa de garantía de calidad.',
      'Mantener su licencia personal tipo A vigente.',
      ...(c.S.practica === 'intervencionista' ? ['Mantener el registro de parámetros dosimétricos del paciente y activar el seguimiento clínico cuando se superen los niveles de vigilancia de dosis en piel (Art. 10.1 lit. e y g).'] : [])
    ]
  };
}

function horasEntre(a, b) {
  const p = (t) => { const m = /^(\d{1,2}):(\d{2})/.exec(t || ''); return m ? +m[1] + (+m[2]) / 60 : null; };
  const x = p(a), y = p(b);
  return x != null && y != null && y > x ? Math.round((y - x) * 10) / 10 : null;
}

function fechaHabil(anio, mes, dia) {
  const d = new Date(anio, mes, dia);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  return isoDe(d);
}

/* Propuesta basada en el Anexo III, num. 17 de la Norma Técnica y en el formato de la OSR */
function cronogramaPropuesto(c) {
  const P = c.P, S = c.S;
  const base = [
    [`Principios básicos de protección radiológica en ${P.corto}`, 'POE y personal administrativo', 'Incluye medidas prácticas y responsabilidades'],
    ['Uso correcto del dosímetro personal y lectura de los reportes dosimétricos', 'POE', 'Revisión del cumplimiento y registro'],
    ['Protección radiológica del paciente: justificación, embarazadas y pediátricos', 'POE', 'Revisión de los procedimientos internos'],
    ['Uso adecuado y mantenimiento del equipo de protección radiológica', 'POE', 'Capacitación práctica y teórica'],
    ['Procedimientos para la obtención y renovación de licencias institucionales y personales', 'POE y representante legal', 'Actualización de normativa']
  ];
  const propio = S.practica === 'intervencionista'
    ? ['Protección del cristalino y dosis en piel del paciente en intervencionismo', 'POE y personal involucrado en la práctica', 'Incluye niveles de notificación de Ka,r']
    : S.practica === 'odontologico'
      ? ['Técnicas intraorales y extraorales de baja dosis', 'POE', 'Uso de posicionadores y colimación']
      : c.tiene(/Tomógrafo/)
        ? ['Optimización de dosis en tomografía computarizada', 'POE', 'CTDIvol, DLP y protocolos pediátricos']
        : ['Optimización de técnicas radiográficas y control de calidad básico', 'POE', 'Revisión de tablas de técnicas'];
  const lista = [...base, propio,
    ['Gestión de riesgos radiológicos y emergencias', 'POE y personal administrativo', 'Simulacro y evaluación'],
    ['Actualización sobre normativa de seguridad radiológica nacional e internacional', 'POE y representante legal', 'Revisión y ajustes al plan anual']];
  const meses = [2, 3, 4, 5, 6, 7, 9, 11];
  const anio = +c.anio;
  return lista.map((x, i) => ({ fecha: fechaHabil(anio, meses[i], 15), tema: x[0], horaIni: '09:00', horaFin: '11:00', dirigido: x[1], obs: x[2], capacitador: '' }));
}

function cronogramaActual(c) {
  const l = (c.S.capacitaciones || []).filter(x => x.tema);
  return l.length ? l : cronogramaPropuesto(c);
}

function datosResponsable(c) {
  const R = c.R;
  return [
    ['Responsable', [R.osrProfesion, R.osrNombre].filter(Boolean).join(' ') || '[Nombre]'],
    ['RUC', R.osrRuc || '[RUC]'],
    ['Dirección', R.osrDireccion || '[Dirección]'],
    ['Cargo', c.rolOSR],
    ['Autorización de O.S.R. N.°', R.osrLicencia || R.osrCedula || '[N.º]'],
    ['Código', R.osrAut || '[Código]'],
    ['Vigencia', R.osrAutCad ? fCorta(R.osrAutCad) : '[Vigencia]']
  ];
}

function datosInstitucion(c) {
  const I = c.I;
  return [
    ['Razón social', ph(I.razonSocial, 'Razón social')],
    ['RUC', ph(I.ruc, 'RUC')],
    ['Nombre comercial', I.nombreComercial || 'No registra'],
    ['Práctica', c.P.nombre],
    ['Dirección', `${ph(I.direccion, 'Dirección')}, ${ph(I.ciudad, 'Ciudad')}, ${ph(I.provincia, 'Provincia')}`],
    ['Representante legal', I.repEmpresa ? `${I.repEmpresa} (Rep.: ${ph(I.repLegal, 'Nombre')})` : ph(I.repLegal, 'Representante legal')],
    ['Cargo', I.repCargo || 'Representante legal']
  ];
}

function tipoCorto(t) {
  t = t || '';
  if (/Delantal|Mandil|Chaleco|dos piezas/i.test(t)) return 'Mandil';
  if (/Collar/i.test(t)) return 'Collarín';
  if (/gonadal/i.test(t)) return 'Protector gonadal';
  if (/Guante/i.test(t)) return 'Guantes';
  if (/Faldilla|Falda|Faldón/i.test(t)) return 'Faldilla';
  if (/Gorro/i.test(t)) return 'Gorro';
  if (/Gafa|Lente/i.test(t)) return 'Lentes';
  return t;
}

function nombresEPR(lista) {
  const cuenta = {};
  return lista.map(p => { const k = tipoCorto(p.tipo); cuenta[k] = (cuenta[k] || 0) + 1; return `${k} ${cuenta[k]}`; });
}
const nivel = (v) => { const n = parseFloat(String(v).replace(',', '.')); return isNaN(n) ? null : n; };

function estadoDePuntaje(prom) {
  if (prom == null) return '';
  if (prom >= 4.75) return 'Excelente';
  if (prom >= 3.75) return 'Bueno';
  if (prom >= 2.5) return 'Regular';
  return 'Pésimo';
}
const colorEstado = (e) => ({ Excelente: 'C6E0B4', Bueno: 'FFF2CC', Regular: 'F8CBAD', Pésimo: 'F4B183' })[e] || null;

function estadoCaducidad(p) {
  if (!p.fechaCaducidad) return p.estado === 'Malo' ? 'Pésimo' : (p.estado === 'Regular' ? 'Regular' : 'Bueno');
  const n = diasHasta(p.fechaCaducidad);
  if (n < 0) return 'Pésimo';
  if (n <= 180) return 'Regular';
  return 'Bueno';
}

function estadoFuncional(p) {
  const v = [p.cubierta, p.sujeciones, p.costuras].map(nivel).filter(x => x != null);
  return v.length ? estadoDePuntaje(v.reduce((a, b) => a + b, 0) / v.length) : (p.estado === 'Bueno' ? 'Bueno' : p.estado || '');
}

function estadoIntegridad(p) {
  if (p.resultado === 'No apta') return 'Pésimo';
  return p.estadoBlindaje || (/ningun|^$/i.test(p.defectos || '') ? 'Excelente' : 'Bueno');
}

const COLORES_SALA = ['BDD7EE', 'F8CBAD', 'FFE699', 'C6E0B4', 'D9D2E9', 'F4B183', 'B4C7E7', 'E2EFDA', 'FCE4D6'];

function docPlanCapacitacion(c) {
  const lista = cronogramaActual(c);
  const capacitador = (x) => x.capacitador || [c.R.osrTitulo, c.R.osrNombre].filter(Boolean).join(' ') || c.rolOSR;
  const filas = lista.map((x, i) => [{ t: String(i + 1), align: 'c' }, { t: fCorta(x.fecha), align: 'c' }, x.tema, { t: x.horaIni || '', align: 'c' }, { t: x.horaFin || '', align: 'c' }, { t: String(horasEntre(x.horaIni, x.horaFin) || ''), align: 'c' }, x.dirigido || 'POE', x.obs || '']);
  const total = lista.reduce((a, x) => a + (horasEntre(x.horaIni, x.horaFin) || 0), 0);
  const di = datosInstitucion(c), dr = datosResponsable(c);
  const blocks = [
    Ps(`La planificación se realiza con base en el Anexo III, numeral 17 de la Norma Técnica para las Actividades de Licenciamiento y Operación en Radiología Intervencionista, Radiodiagnóstico Médico, Odontológico y Veterinario, que fija como temática mínima la protección radiológica del POE y del paciente, el uso correcto del dosímetro personal y de los elementos de protección radiológica, y los trámites de licencia personal e institucional.`, { align: 'j' }),
    { t: 'kv4', rows: di.map((r, i) => [r[0], r[1], dr[i][0], dr[i][1]]) },
    T(['N.°', 'Fecha', 'Tema', 'Hora inicio', 'Hora fin', 'Carga horaria', 'Dirigido a', 'Observaciones'],
      [...filas, [{ t: '', align: 'c' }, '', { t: 'Carga horaria total', bold: true }, '', '', { t: String(total), align: 'c', bold: true }, '', '']],
      { widths: [4, 9, 31, 8, 8, 8, 14, 18], small: true }),
    Ps('**Observaciones generales:**'),
    L([
      'El plan de capacitación deberá estar disponible en todo momento para la Autoridad Reguladora durante las inspecciones (Norma Técnica, Art. 5 num. 5.1 lit. j).',
      `Se llevará un registro de asistencia firmado por cada participante, que archivará el ${c.rolOSR}, con la carga horaria y la frecuencia de cada capacitación (Art. ${c.S.practica === 'intervencionista' ? '12' : '15'} lit. d y e).`,
      'Se entregará material de apoyo digital y certificado de asistencia al finalizar cada sesión.',
      'El personal que ingrese durante el año recibirá una inducción en protección radiológica antes de iniciar sus actividades (Anexo III, num. 18).'
    ], true),
    SIGN([{ ...c.firmas.rep, role: 'Representante Legal' }, { ...c.firmas.osr, role: 'Responsable' }])
  ];
  return { title: `Plan de capacitación anual y entrenamiento en seguridad radiológica ${c.anio}`, kind: 'sgc', landscape: true, blocks };
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
      'Nadie del personal sujeta pacientes de forma rutinaria. Si es imprescindible, lo hace un acompañante con delantal, fuera del haz directo; nunca una persona en estado de gestación (num. 6.1.4 lit. b) ni un menor de 18 años (Reglamento, Art. 3).',
      'Durante la exposición no permanecen personas ni pacientes en los vestidores internos de la sala, las puertas de la sala y de los vestidores se mantienen cerradas y la sala se usa para un solo paciente a la vez (num. 6.1.3 lit. c, d y f).',
      'Proteger las gónadas del paciente que queden a menos de 5 cm del campo con un blindaje de al menos 0,5 mm Pb, salvo que interfiera con el estudio (num. 6.1.3 lit. h).',
      'Antes de repetir una imagen, consultar con el médico especialista. Las repeticiones se registran con su causa.'
    ],
    intervencionista: [
      'Ningún procedimiento se realiza sin prescripción médica y consentimiento informado firmado.',
      'Antes de iniciar, completar la lista de verificación de la sala.',
      'Todo el personal en sala usa delantal, collarín, lentes plomados de 0,2 mm Pb y su dosimetría de cuerpo entero, cristalino y extremidades; el médico intervencionista usa además gorro plomado (num. 5.4 lit. b; Art. 11 lit. a).',
      'Usar las cortinas plomadas bajo la mesa, la mampara móvil y la cielítica (Art. 10.1 lit. i).',
      'Mantener la puerta cerrada y la señalización luminosa encendida durante el procedimiento.',
      'Al finalizar, registrar tiempo de fluoroscopia, Ka,r, PKA y número de series en la hoja del procedimiento.'
    ],
    odontologico: [
      'Toda radiografía se indica en la historia clínica odontológica con su justificación.',
      'Preguntar a las pacientes por la posibilidad de embarazo y registrar la respuesta.',
      'Colocar chaleco plomado al paciente, con collarín cuando no interfiera con la imagen.',
      'Nunca sostener el receptor ni el cabezal del equipo durante la exposición; usar posicionadores.',
      'El operador dispara desde detrás de la barrera o a no menos de 2 m del tubo. Los controles de exposición del equipo periapical se ubican en un lugar seguro para evitar manipulaciones (num. 16.2.1 lit. d).',
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
      `Este procedimiento es el que exige el numeral 6.1.3 lit. g) de la Norma Técnica para verificar la posibilidad de embarazo. Los exámenes a pacientes embarazadas se evitan salvo fuertes indicaciones clínicas (lit. i).`,
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
  const { I, V, S } = c;
  const interv = S.practica === 'intervencionista';
  const blocks = [
    H('1. Objetivo'),
    Ps(`Definir cómo se realiza la vigilancia dosimétrica del POE de ${ph(I.razonSocial, 'Razón social')}, cómo se comunica la dosis a cada trabajador y qué se hace cuando una lectura supera el nivel de investigación.`, { align: 'j' }),
    H('2. Servicio de dosimetría'),
    KV([
      ['Laboratorio autorizado (num. 6.1.1)', ph(V.dosEmpresa, 'Empresa de dosimetría')],
      ['Licencia del laboratorio', ph(V.dosLicencia, 'N.º de licencia')],
      ['Tipo de dosímetro', `${ph(V.dosTipo, 'TLD / OSL')} de cuerpo entero${interv ? ', extremidades y cristalino (Art. 11 lit. a)' : ''}`],
      ['Periodo de recambio', ph(V.dosPeriodo, 'Bimestral')],
      ['Contrato', `${V.dosInicio ? 'Desde ' + fLarga(V.dosInicio) : '[inicio]'} ${V.dosVigencia ? 'hasta ' + fLarga(V.dosVigencia) : '[fin]'}`]
    ]),
    H('3. Uso y almacenamiento del dosímetro'),
    L([
      'El dosímetro es personal e intransferible y su portación es obligatoria durante toda la jornada (Reglamento, Art. 5; Norma, num. 6.1.1 lit. a y b). Incluye a estudiantes y personal en formación.',
      interv
        ? 'El dosímetro de cuerpo entero se coloca a la altura del tórax, bajo el delantal. El de cristalino se usa a la altura de los ojos, del lado más próximo al tubo, y el de extremidades en la mano dominante del médico operador, como exige el Art. 11 lit. a) de la Norma.'
        : 'Se coloca a la altura del tórax, por debajo del delantal cuando se lo usa.',
      'Al terminar la jornada se deja almacenado en la institución, en un lugar adecuado fuera de la zona controlada, junto al dosímetro de control (num. 6.1.2 lit. c).',
      'Nunca se deja dentro de la sala, se expone de forma intencional ni se lleva a otra institución.',
      'Si se pierde o se daña, el trabajador lo informa el mismo día; el responsable solicita el reemplazo y asigna una dosis estimada a ese periodo.'
    ], true),
    H('4. Límites de dosis'),
    Ps('Límites del numeral 5.2 lit. a) de la Norma Técnica, que actualiza los valores del Art. 1 del Reglamento de Seguridad Radiológica (expresados en rem) a los límites internacionales vigentes:', { align: 'j' }),
    T(['Magnitud', 'Personal ocupacionalmente expuesto', 'Miembros del público'], [
      ['Dosis efectiva', '20 mSv por año promediados en 5 años consecutivos (100 mSv en 5 años), sin superar 50 mSv en un año cualquiera', '1 mSv por año'],
      ['Dosis equivalente en cristalino', '20 mSv por año promediados en 5 años consecutivos, sin superar 50 mSv en un año cualquiera', '—'],
      ['Dosis equivalente en extremidades (manos y pies) o piel', '500 mSv en un año', '—'],
      ['Embrión o feto de una trabajadora gestante', '1 mSv durante la gestación (num. 6.1.1 lit. c)', '—']
    ], { widths: [26, 50, 24], small: true }),
    Ps('**Nivel de investigación** establecido por la Autoridad Reguladora: **1,5 mSv en un mes** de dosis equivalente personal Hp(10).', { align: 'j' }),
    H('5. Comunicación de la dosis'),
    L([
      `Al recibir cada reporte, el ${c.rolOSR.toLowerCase()} lo revisa en un plazo máximo de cinco días laborables.`,
      'Cada trabajador conoce su dosis del periodo y su dosis acumulada, y firma el recibido en el registro de dosimetría. La comunicación se realiza al menos trimestralmente (Reglamento, Art. 7 lit. b) y con cada reporte del laboratorio (Norma, num. 6.1.1 lit. e).',
      'El POE tiene acceso a sus registros de dosis. Los registros se conservan durante todo el empleo y como mínimo treinta años después de que el trabajador deje la institución (num. 5.1 lit. r).',
      'Al cese de funciones de un trabajador, se le entrega su récord dosimétrico en un plazo no mayor a quince días (Reglamento, Art. 133).'
    ], true),
    H('6. Investigación de dosis'),
    Ps('Cuando una lectura mensual supera 1,5 mSv, o un valor no es coherente con el historial del trabajador, el empleador investiga el hecho e implementa acciones correctivas (num. 5.1 lit. r; Anexo III, num. 13 lit. d). El responsable:', { align: 'j' }),
    L([
      'Entrevista al trabajador y verifica si el dosímetro estuvo bien usado y almacenado o si pudo quedar dentro de la sala.',
      'Revisa la carga de trabajo del periodo, los procedimientos en los que participó y el estado de las prendas de protección y del equipo.',
      'Determina si la dosis es real o atribuible a un mal uso del dosímetro y deja constancia escrita de la conclusión.',
      'Define acciones correctivas (reentrenamiento, cambio de funciones, revisión de blindajes o del equipo) con un plazo.',
      'Si se confirma una dosis que supera los límites, informa por escrito a la Autoridad Reguladora y al representante legal.',
      'Archiva el informe de investigación en el registro de dosimetría.'
    ], true),
    aprobaciones(c)
  ];
  return { title: 'Vigilancia dosimétrica e investigación de dosis', kind: 'sgc', blocks };
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

const ES_PRENDA = /Delantal|Mandil|Chaleco|Collar|Falda|Guantes|Gorro|Faldón|dos piezas|gonadal/i;

function docInformeDelantales(c) {
  const { I, V, R } = c;
  const prendas = c.epp.filter(e => ES_PRENDA.test(e.tipo || ''));
  const nom = nombresEPR(prendas);
  const eti = (i) => prendas[i].codigo ? `${nom[i]}\n${prendas[i].codigo}` : nom[i];
  const fecha = V.fechaPruebaEpp || c.fecha;
  const tipos = [...new Set(prendas.map(p => tipoCorto(p.tipo).toLowerCase()))];
  const tiposTxt = tipos.length ? tipos.map(t => t === 'mandil' ? 'mandiles' : t === 'collarín' ? 'collarines' : t + 'es').join(', ').replace(/, ([^,]*)$/, ' y $1') + ' plomados' : 'mandiles y collarines plomados';
  const inst = `${ph(I.razonSocial, 'Razón social')}${I.nombreComercial ? ' – ' + I.nombreComercial.toUpperCase() : ''}${I.sede ? ' ' + I.sede.toUpperCase() : ''}`;
  const sinFilas = [['', '', '']];
  const f1 = prendas.map((p, i) => [eti(i), { t: p.fechaCaducidad ? fCorta(p.fechaCaducidad) : 'NR', align: 'c' }, (() => { const e = estadoCaducidad(p); return { t: e, align: 'c', fill: colorEstado(e) }; })()]);
  const f2 = prendas.map((p, i) => [eti(i), { t: `Cubierta: ${p.cubierta || '—'}\nSujeciones: ${p.sujeciones || '—'}\nCosturas: ${p.costuras || '—'}`, align: 'c' }, (() => { const e = estadoFuncional(p); return { t: e, align: 'c', fill: colorEstado(e) }; })()]);
  const f3 = prendas.map((p, i) => [eti(i), `Indicaciones de la etiqueta del proveedor: ${p.espesor || '[espesor]'} mm Pb equivalente`, (() => { const mm = nivel(p.espesor); const ok = mm != null && (/Collar|gonadal/i.test(p.tipo) ? mm >= 0.5 : (/envolvente|dos piezas/i.test(p.tipo) ? mm >= 0.25 : mm >= 0.5)); const e = mm == null ? '' : (ok ? 'Excelente' : 'Pésimo'); return { t: e, align: 'c', fill: colorEstado(e) }; })()]);
  const modo = V.modoPrueba === 'Fluoroscopia' ? 'Exploración fluoroscópica' : 'Exploración radiográfica';
  const tec = (kv, ma) => (kv || ma) ? `kV: ${kv || '—'}\nmA: ${ma || '—'}` : '—';
  const f4 = prendas.map((p, i) => [eti(i), modo, { t: tec(p.kv1 || p.kv, p.ma1 || p.mas), align: 'c' }, { t: tec(p.kv2, p.ma2), align: 'c' }, p.defectos || 'Ninguno', (() => { const e = estadoIntegridad(p); return { t: e, align: 'c', fill: colorEstado(e) }; })()]);
  const f5 = [];
  prendas.forEach((p, i) => {
    if (p.img1) f5.push([eti(i), { t: `Prueba 1\nkV: ${p.kv1 || p.kv || '—'}\nmA: ${p.ma1 || p.mas || '—'}`, align: 'c' }, { img: p.img1, h: 55 }]);
    if (p.img2) f5.push([eti(i), { t: `Prueba 2\nkV: ${p.kv2 || '—'}\nmA: ${p.ma2 || '—'}`, align: 'c' }, { img: p.img2, h: 55 }]);
  });
  const f6 = prendas.map((p, i) => [eti(i), { t: `Valoración estética: ${p.estetica || '—'}`, align: 'c' }, (() => { const e = estadoDePuntaje(nivel(p.estetica)); return { t: e, align: 'c', fill: colorEstado(e) }; })()]);

  /* Conclusiones según los resultados */
  const est = (fn) => [...new Set(prendas.map(fn).filter(Boolean))];
  const resumen = (lst) => lst.length === 1 ? lst[0].toUpperCase() : lst.map(x => x.toUpperCase()).join(' y ');
  const caducan = prendas.filter(p => p.fechaCaducidad && diasHasta(p.fechaCaducidad) <= 180);
  const conDef = prendas.filter(p => p.defectos && !/ningun/i.test(p.defectos));
  const noAptas = prendas.filter(p => p.resultado === 'No apta');
  const kvs = prendas.flatMap(p => [p.kv1 || p.kv, p.kv2].map(nivel)).filter(x => x != null);
  const mas = prendas.flatMap(p => [p.ma1 || p.mas, p.ma2].map(nivel)).filter(x => x != null);
  const rango = (a, u) => a.length ? (Math.min(...a) === Math.max(...a) ? `${String(Math.min(...a)).replace('.', ',')} ${u}` : `${String(Math.min(...a)).replace('.', ',')} – ${String(Math.max(...a)).replace('.', ',')} ${u}`) : '';
  const conclusiones = prendas.length ? [
    `Se verificó y valoró la integridad del blindaje de ${prendas.length} elementos de protección radiológica (${tiposTxt}) de ${inst}, mediante procedimientos acordes con la Norma Técnica y con las recomendaciones internacionales para el control de prendas plomadas.`,
    caducan.length
      ? `Prueba 1, fecha de expiración: ${caducan.map(p => nom[prendas.indexOf(p)]).join(', ')} ${caducan.length === 1 ? 'tiene' : 'tienen'} la fecha de caducidad vencida o dentro de los próximos seis meses, por lo que su reemplazo debe planificarse de inmediato.`
      : `Prueba 1, fecha de expiración: el estado de los elementos fue ${resumen(est(estadoCaducidad))}; las fechas registradas son prudentes para prever y planificar su cambio.`,
    `Prueba 2, evaluación funcional: revisadas la cubierta, las sujeciones y las costuras, el estado general fue ${resumen(est(estadoFuncional))}.${est(estadoFuncional).some(e => e !== 'Excelente') ? ' Para asegurar la protección radiológica del POE y de los pacientes, este estado debe llevarse a EXCELENTE.' : ''}`,
    `Prueba 3, inspección del blindaje: según la etiqueta del proveedor, los elementos tienen ${[...new Set(prendas.map(p => p.espesor).filter(Boolean))].join(' y ') || '[espesor]'} mm Pb equivalente. La exploración ${V.modoPrueba === 'Fluoroscopia' ? 'fluoroscópica' : 'radiográfica'} se realizó con ${kvs.length ? 'dos técnicas (' + rango(kvs, 'kVp') + (mas.length ? ' y ' + rango(mas, 'mA') : '') + ')' : 'las técnicas indicadas'}, sin control automático de exposición, manteniendo al mínimo la dosis y el desgaste del tubo. ${conDef.length ? `Se observaron defectos en ${conDef.map(p => nom[prendas.indexOf(p)]).join(', ')}.` : 'No se observaron grietas, perforaciones ni zonas de falta de homogeneidad.'}${noAptas.length ? ` ${noAptas.map(p => nom[prendas.indexOf(p)]).join(', ')} no ${noAptas.length === 1 ? 'cumple' : 'cumplen'} el criterio de aceptación y ${noAptas.length === 1 ? 'debe retirarse' : 'deben retirarse'} de uso.` : ''}`,
    `Prueba 4, valoración estética: el aspecto general de los elementos es ${resumen(est(p => estadoDePuntaje(nivel(p.estetica)))) || '[pendiente]'}.`
  ] : ['[Registre las prendas y sus resultados en la sección Prendas de protección.]'];

  const blocks = [
    H('1. Datos generales'),
    Ps('1.1. Responsable', { bold: true }),
    KV([
      ['Nombre', ph(R.osrNombre, 'Nombre')],
      ['Título', R.osrProfesion || '[Título]'],
      ['RUC', R.osrRuc || '[RUC]'],
      ['Dirección', R.osrDireccion || '[Dirección]'],
      ['Autorización de O.S.R. N.°', R.osrLicencia || R.osrCedula || '[N.º]'],
      ['Código', R.osrAut || '[Código]'],
      ['Vigencia', R.osrAutCad ? fCorta(R.osrAutCad) : '[Vigencia]']
    ]),
    Ps('1.2. Institución', { bold: true }),
    KV([
      ['Razón social', ph(I.razonSocial, 'Razón social')],
      ['Nombre comercial', I.nombreComercial || 'No registra'],
      ['RUC', ph(I.ruc, 'RUC')],
      ['Dirección', `${ph(I.direccion, 'Dirección')}, ${ph(I.ciudad, 'Ciudad')}, ${ph(I.provincia, 'Provincia')}`],
      ['Práctica', c.P.nombre],
      ['Representante legal', I.repEmpresa ? `${I.repEmpresa} (Rep.: ${ph(I.repLegal, 'Nombre')})` : ph(I.repLegal, 'Representante legal')],
      ['Cargo', I.repProfesion || I.repCargo || '[Cargo]'],
      ['Informe dirigido a', V.informeDirigido || ph(I.repLegal, 'Destinatario')],
      ['Fecha de la evaluación', fLarga(fecha)],
      ['Equipo utilizado', ph(V.eqPrueba, 'Equipo usado para la prueba')]
    ]),
    Ps(`**Tema:** Integridad del blindaje del equipo de protección radiológica (${tiposTxt}) de ${inst}.`, { align: 'j' }),
    H('2. Antecedentes'),
    Ps('La seguridad en las prácticas radiológicas es de suma importancia y los delantales plomados cumplen un papel central en la protección del personal. Es imprescindible revisar periódicamente estos equipos de protección para garantizar su funcionamiento óptimo. En la evaluación se consideran los siguientes aspectos:', { align: 'j' }),
    L(['Revisión de la fecha de expiración', 'Evaluación funcional', 'Inspección del blindaje', 'Valoración estética', 'Documentación de los resultados']),
    H('3. Objetivo'),
    Ps(`Verificar y valorar la integridad del blindaje del equipo de protección radiológica (${tiposTxt}) de ${inst}.`, { align: 'j' }),
    H('4. Desarrollo'),
    Ps('El Título II, Art. 5, numeral 5.4, literal a) de la Norma Técnica para las Actividades de Licenciamiento y Operación en Radiología Intervencionista, Radiodiagnóstico Médico, Odontológico y Veterinario dispone que «los delantales plomados deben ser probados a intervalos aproximados de 12 meses con el fin de comprobar la integridad de su blindaje. Las fallas en el blindaje pueden comprobarse usando imágenes de Rx mínimo a 60 kVp». El mismo numeral exige delantales de 0,5 a 0,7 mm Pb cuando cubren solo el frente (0,25 mm si cubren completamente los costados), collarín tiroideo de 0,5 mm Pb y protectores gonadales de 0,5 mm Pb, y prohíbe doblar las vestimentas plomadas.', { align: 'j' }),
    Ps('4.1. Prueba 1: revisión de la fecha de expiración', { bold: true }),
    Ps('La vida útil estimada de cada elemento de protección plomado es de aproximadamente cinco años en condiciones normales de uso y almacenamiento. Un uso intensivo o un almacenamiento inadecuado reducen ese periodo, por lo que la fecha de caducidad se verifica de forma regular para no utilizar prendas que ya no ofrecen la protección adecuada.', { align: 'j' }),
    T(['EPR', 'Fecha de caducidad', 'Estado (Excelente, Bueno, Regular, Pésimo)'], f1.length ? f1 : sinFilas, { widths: [30, 30, 40], small: true }),
    Ps('4.2. Prueba 2: evaluación funcional', { bold: true }),
    Ps('Aunque el material de blindaje interno esté en buen estado, un deterioro de la cubierta o de las sujeciones vuelve inseguro el uso de la prenda y dificulta su limpieza, con el consiguiente riesgo de contaminación biológica. Se evalúan cubierta, sujeciones y costuras en una escala del 1 al 5 (1 = pésimo, 5 = excelente).', { align: 'j' }),
    T(['EPR', 'Evaluación funcional (1 a 5)', 'Estado general'], f2.length ? f2 : sinFilas, { widths: [30, 40, 30], small: true }),
    Ps('4.3. Prueba 3: inspección del blindaje', { bold: true }),
    Ps('**Atenuación:** debe estar certificada por el fabricante o el proveedor conforme a la norma internacional IEC 61331-1, que determina las propiedades de atenuación de los materiales de protección contra la radiación de diagnóstico médico, o una equivalente. El dato consta en la etiqueta de identificación de la prenda.', { align: 'j' }),
    T(['EPR', 'Atenuación', 'Estado'], f3.length ? f3 : sinFilas, { widths: [30, 45, 25], small: true }),
    Ps(`**Integridad y homogeneidad:** se inspecciona cada prenda para identificar grietas, perforaciones o zonas sin homogeneidad, mediante ${V.modoPrueba === 'Fluoroscopia' ? 'exploración fluoroscópica' : 'exploración radiográfica'} con al menos 60 kVp. Como criterio de rechazo se adopta el propuesto por Lambert y McKeon (2001): defectos que sumen más de 15 mm² sobre órganos críticos, más de 670 mm² en zonas de solapamiento o espalda, o más de 11 mm² en collarines tiroideos.`, { align: 'j' }),
    T(['EPR', 'Integridad y homogeneidad', 'Prueba 1', 'Prueba 2', 'Defectos encontrados', 'Estado'], f4.length ? f4 : [['', '', '', '', '', '']], { widths: [16, 20, 14, 14, 20, 16], small: true }),
    ...(f5.length
      ? [Ps('Se adjuntan las tomas de cada elemento de protección radiológica, con las dos técnicas utilizadas.', { align: 'j' }), T(['EPR', 'Técnica', 'Imagen radiográfica'], f5, { widths: [20, 18, 62], small: true })]
      : [NOTE('Cargue las imágenes radiográficas de cada prenda (prueba 1 y prueba 2) en la sección Prendas de protección para incluirlas en esta tabla.')]),
    Ps('4.4. Prueba 4: valoración estética', { bold: true }),
    Ps('Aunque es un aspecto secundario, la apariencia de las prendas refleja el cuidado del servicio y la imagen de la institución.', { align: 'j' }),
    T(['EPR', 'Valoración estética (1 a 5)', 'Estado general'], f6.length ? f6 : sinFilas, { widths: [30, 40, 30], small: true }),
    H('5. Conclusiones'),
    L(conclusiones),
    H('6. Recomendaciones'),
    L([
      ...(noAptas.length ? ['Retirar de inmediato las prendas no aptas, rotularlas como «fuera de uso» y reponerlas, manteniendo al menos dos prendas de cada tipo por sala.'] : []),
      'Seguir las recomendaciones del fabricante para el cuidado de los elementos de protección radiológica.',
      'Repetir la inspección al menos una vez al año y documentar los hallazgos (Norma Técnica, num. 5.4 lit. a).',
      'Usar las prendas de manera regular durante los procedimientos, tanto el POE como los pacientes y acompañantes.',
      ...(caducan.length ? ['Planificar el reemplazo de las prendas próximas a su fecha de caducidad dentro del próximo semestre.'] : []),
      'Guardarlas colgadas en soportes tipo percha, sin doblarlas, para preservar su integridad.',
      'Realizar una inspección visual de cubierta, sujeciones y costuras y una inspección táctil del material interno; ante cualquier daño, comunicarlo de inmediato al responsable de protección radiológica.'
    ]),
    SIGN([{ ...c.firmas.osr, label: 'Elaborado por', role: `${c.rolOSR}${R.osrLicencia || R.osrCedula ? '\nLicencia N.°: ' + (R.osrLicencia || R.osrCedula) : ''}${R.osrAut ? '\nCódigo: ' + R.osrAut : ''}` }])
  ];
  return { title: 'Informe de integridad del blindaje del equipo de protección radiológica', kind: 'sgc', blocks };
}

function docDeclaracionMaxima(c) {
  const { I, P, R } = c;
  const esOdont = c.S.practica === 'odontologico';
  const repTexto = I.repEmpresa
    ? `Yo, **${ph(I.repLegal, 'Nombre del representante')}**, con cédula/pasaporte N.° **${ph(I.repCedula, 'Cédula')}**, en calidad de representante de **${I.repEmpresa}**, entidad que consta como Representante Legal de **${ph(I.razonSocial, 'Razón social')}**${I.nombreComercial ? `, vinculada a la identificación institucional **${I.nombreComercial}**` : ''}, declaro de manera libre, expresa y formal que reconozco que el Representante Legal / Licenciatario es el **máximo responsable de la protección y seguridad radiológica** de la instalación descrita en este documento.`
    : `Yo, **${ph(I.repLegal, 'Nombre del representante legal')}**, con cédula/pasaporte N.° **${ph(I.repCedula, 'Cédula')}**, en calidad de ${ph(I.repCargo, 'Cargo')} y Representante Legal de **${ph(I.razonSocial, 'Razón social')}**${I.nombreComercial ? ` (${I.nombreComercial})` : ''}, declaro de manera libre, expresa y formal que reconozco que el Representante Legal / Licenciatario es el **máximo responsable de la protección y seguridad radiológica** de la instalación descrita en este documento.`;
  const datos = [
    ['Razón social', ph(I.razonSocial, 'Razón social')],
    ['RUC', ph(I.ruc, 'RUC')],
    ['Identificación visual / nombre comercial', I.nombreComercial || 'No registra'],
    ['Número de establecimiento', I.establecimiento || '[N.º de establecimiento en el RUC]'],
    ['Tipo de establecimiento / estado', I.tipoEstab || '[Oficina / Abierto]'],
    ['Actividad económica relacionada', I.actividad || '[Código CIIU y descripción, p. ej. Q869021 - Actividades de laboratorios de radiología (Rayos X) y otros centros de diagnóstico por imagen]'],
    ['Ubicación geográfica', `Provincia: ${ph(I.provincia, 'Provincia')}; Cantón: ${ph(I.ciudad, 'Cantón')}${I.parroquia ? '; Parroquia: ' + I.parroquia : ''}`],
    ['Dirección', ph(I.direccion, 'Dirección')],
    ...(I.referencia ? [['Referencia', I.referencia]] : []),
    ['Área / práctica solicitada', `${P.nombre} / equipos generadores de radiación ionizante`],
    ['Licencia institucional', I.licencia ? `${I.licencia}${I.licenciaCad ? ', vigente hasta el ' + fLarga(I.licenciaCad) : ''}` : 'En trámite'],
    ...(I.repEmpresa ? [['Representante Legal según RUC', I.repEmpresa], [`Representante de ${I.repEmpresa}`, ph(I.repLegal, 'Nombre')]] : [['Representante Legal', ph(I.repLegal, 'Nombre')]]),
    ['Cédula / pasaporte', ph(I.repCedula, 'Cédula')],
    ['Cargo / profesión', I.repProfesion || I.repCargo || '[Cargo]'],
    ['Teléfono', I.repTelefono || I.telefono || '[Teléfono]'],
    ['Correo electrónico', I.repCorreo || I.correo || '[Correo]']
  ];
  const compromisos = [
    ['Responsabilidad principal', 'Asumir la responsabilidad máxima de la protección radiológica de la instalación y garantizar que toda actividad con radiaciones ionizantes se realice bajo condiciones seguras, justificadas, optimizadas y controladas.'],
    ['Operación segura y controlada', 'Demostrar ante la Autoridad Reguladora que la operación de los equipos generadores de radiación ionizante se realiza conforme a la normativa nacional vigente, las Normas Básicas de Seguridad del OIEA y el principio ALARA.'],
    ['Licenciamiento y autorizaciones', 'Garantizar que la instalación opere únicamente dentro del alcance autorizado y que los equipos, áreas, personal y procedimientos correspondan a lo declarado y licenciado.'],
    ['Personal autorizado', 'Asegurar que el personal asociado a la práctica cuente con Licencia Personal Tipo A vigente, capacitación, entrenamiento, aptitud médica y autorización interna para operar o participar en actividades con exposición ocupacional.'],
    ['Oficial de Seguridad Radiológica', 'Nombrar o mantener designado un Oficial de Seguridad Radiológica, cuando aplique, y facilitar los recursos necesarios para la vigilancia continua de la protección radiológica.'],
    ['Recursos técnicos y financieros', 'Proveer recursos para dosimetría personal, elementos de protección radiológica, señalización, mantenimiento preventivo y correctivo, control de calidad, levantamientos radiométricos y adecuaciones de blindaje cuando correspondan.'],
    ['Capacitación anual', 'Asegurar la elaboración, ejecución y archivo del plan anual de capacitación y entrenamiento en seguridad radiológica, disponible para inspección por la Autoridad Reguladora.'],
    ['Protección del paciente', `Garantizar que ningún paciente sea sometido a exposiciones radiológicas sin prescripción ${esOdont ? 'odontológica' : 'médica'} documentada; asignar la responsabilidad de protección del paciente a ${esOdont ? 'un odontólogo con licencia vigente' : 'un médico especialista'} y reforzar la justificación en pacientes pediátricos, mujeres embarazadas o con posibilidad de embarazo.`],
    ['Dosimetría y vigilancia médica', 'Proveer vigilancia dosimétrica ocupacional al POE, permitir el acceso individual a sus registros de dosis, investigar lecturas inusuales o superiores al nivel de investigación y garantizar la vigilancia médica ocupacional inicial y periódica.'],
    ['Registros e informes', 'Implementar y mantener disponible un sistema de registro y archivo físico y/o digital de toda la documentación generada en el servicio: licencias, autorizaciones, capacitaciones, dosimetría, control de calidad, mantenimiento, inspecciones, incidentes, acciones correctivas y funciones del personal.'],
    ['Notificación a la Autoridad Reguladora', 'Informar por escrito cualquier incidente, accidente, situación de riesgo radiológico, modificación relevante, cambio de representante legal, cese de OSR o suspensión temporal o definitiva de operación de equipos dentro de los plazos establecidos.'],
    ['Acciones correctivas', 'Disponer acciones correctivas inmediatas ante incumplimientos, fallas de equipo, desviaciones del programa de protección radiológica, dosis anómalas o condiciones que puedan comprometer la seguridad de pacientes, POE o público.']
  ].map((r, i) => [{ t: String(i + 1), align: 'c', bold: true }, { t: r[0], bold: true, align: 'c' }, r[1]]);
  const f = parseFecha(c.fecha) || new Date();
  const blocks = [
    H('1. Base legal y objeto del documento'),
    Ps(`En cumplimiento del Decreto Supremo Nro. 3640 - Reglamento de Seguridad Radiológica, Art. 17 literal d), y de la Norma Técnica para las Actividades de Licenciamiento y Operación en Radiología Intervencionista, Radiodiagnóstico Médico, Odontológico y Veterinario, expedida mediante Acuerdo Ministerial **MERNNR-MERNNR-2022-0011-AM**, se emite la presente declaración expresa para reconocer formalmente la responsabilidad máxima del Representante Legal en materia de protección radiológica de la instalación.`, { align: 'j' }),
    Ps('La Norma Técnica establece que el titular de la Licencia Institucional tipo C debe ser el máximo responsable de la protección radiológica de la instalación, demostrar operación segura y controlada de los equipos generadores de radiación ionizante, asegurar personal autorizado, vigilancia dosimétrica, capacitación, justificación de exposiciones y disponibilidad de registros e informes.', { align: 'j' }),
    T(['Norma / documento', 'Referencia', 'Aplicación en esta declaración'], [
      ['Decreto Supremo Nro. 3640 - Reglamento de Seguridad Radiológica', { t: 'Art. 17 literal d)', align: 'c' }, 'Sustenta la declaración expresa del Representante Legal como máximo responsable de la seguridad radiológica de la instalación.'],
      ['Acuerdo Ministerial MERNNR-MERNNR-2022-0011-AM - Norma Técnica', { t: 'Art. 5.1 literales a, b, c, d, j, k, l, m, o, p, q, r, s y t', align: 'c' }, 'Define obligaciones del titular de la licencia institucional tipo C para operar equipos generadores de radiación ionizante de forma segura y controlada.'],
      ['Acuerdo Ministerial MERNNR-MERNNR-2022-0011-AM - Norma Técnica', { t: 'Art. 12', align: 'c' }, 'Obliga al licenciatario a implementar y mantener disponible el sistema de registros e informes de la práctica.'],
      ['Normas Básicas de Seguridad del OIEA / principio ALARA', { t: 'Aplicación técnica complementaria', align: 'c' }, 'Refuerza justificación, optimización y limitación de dosis para proteger al paciente, POE, acompañantes y público.']
    ], { widths: [32, 28, 40], small: true }),
    H('2. Datos de la instalación'),
    KV(datos),
    H('3. Declaración expresa de responsabilidad'),
    Ps(repTexto, { align: 'j' }),
    Ps(`Esta responsabilidad comprende la protección radiológica de pacientes, personal ocupacionalmente expuesto (POE), acompañantes, trabajadores no expuestos y público, así como el cumplimiento de la normativa ecuatoriana vigente, las condiciones de la Licencia Institucional tipo C y las disposiciones de la Autoridad Reguladora.`, { align: 'j' }),
    H('4. Compromisos del Representante Legal / Licenciatario'),
    T(['N.°', 'Compromiso', 'Declaración operativa'], compromisos, { widths: [7, 25, 68], small: true }),
    H('5. Disponibilidad y custodia documental'),
    Ps('La presente declaración formará parte del archivo maestro de seguridad radiológica de la instalación y deberá mantenerse disponible, legible, vigente y trazable para inspecciones internas, auditorías o requerimientos de la Autoridad Reguladora. En caso de cambio de Representante Legal, cambio de alcance de la práctica o modificación relevante de la instalación, deberá emitirse una actualización documental.', { align: 'j' }),
    H('6. Firmas de conformidad'),
    Ps(`En constancia de aceptación expresa de responsabilidad y aprobación institucional, se suscribe el presente documento en la ciudad de ${ph(I.ciudad, 'Ciudad')}, a los ${String(f.getDate()).padStart(2, '0')} días del mes de ${MESES[f.getMonth()]} de ${f.getFullYear()}.`, { align: 'j' }),
    SIGN([
      { ...c.firmas.rep, label: 'Representante Legal / Licenciatario', role: 'Firma y aceptación expresa' },
      { ...c.firmas.osr, label: c.rolOSR, role: (R.osrAplica && R.osrAut ? `Autorización OSR: ${R.osrAut}\n` : '') + 'Revisión técnica / archivo PR' }
    ])
  ];
  return { title: 'Declaración expresa de responsabilidad del Representante Legal', subtitle: 'Máximo responsable de la protección y seguridad radiológica de la instalación', kind: 'sgc', blocks };
}

function cabeceraInstitucion(c) {
  const I = c.I;
  return KV([
    ['Institución', ph(I.razonSocial, 'Razón social')],
    ['Nombre comercial', I.nombreComercial || 'No registra'],
    ['RUC', ph(I.ruc, 'RUC')],
    ['Representante legal', I.repEmpresa ? `${I.repEmpresa} (Rep.: ${ph(I.repLegal, 'Nombre')})` : ph(I.repLegal, 'Representante legal')],
    ['Práctica', c.P.nombre],
    ['Dirección', ph(I.direccion, 'Dirección')],
    ['Provincia / ciudad', `${ph(I.provincia, 'Provincia')} / ${ph(I.ciudad, 'Ciudad')}`],
    ['Teléfono', ph(I.telefono, 'Teléfono')]
  ]);
}

function colorVigencia(iso) {
  const e = estadoVigencia(iso);
  return e === 'Caducada' ? 'F8CBAD' : (e === 'Por caducar' ? 'FFE699' : null);
}

function docBitacoraPOE(c) {
  const blocks = [cabeceraInstitucion(c)];
  const tipoLic = (cat) => cat === 'osr' ? 'AUTORIZACIÓN DE OFICIAL DE SEGURIDAD RADIOLÓGICA' : 'LICENCIA OCUPACIONAL DE SEGURIDAD RADIOLÓGICA PROFESIONAL - TIPO A';
  CATEGORIAS_POE.forEach(cat => {
    const gente = c.poe.filter(p => p.categoria === cat.id);
    if (!gente.length) return;
    blocks.push(H(cat.t.toUpperCase() + ':'));
    blocks.push(KV([['Tipo de licencia', tipoLic(cat.id)]]));
    blocks.push(T(['Nombre', 'Cédula', 'Licencia N.°', 'Código', 'Ren.', 'Act.', 'Expedición', 'Expira', 'Profesión', 'Cargo', 'Campo de aplicación', 'Observación'],
      gente.map(p => [p.nombre, p.cedula || '', p.licencia || '', p.codigo || p.autOsr || '', { t: p.ren || '0', align: 'c' }, { t: p.act || '0', align: 'c' }, fCorta(p.expedicion), { t: fCorta(p.licCad) || p.licCadTxt || '', fill: colorVigencia(p.licCad) }, p.profesion || '', p.funcion || '', p.campo || c.P.nombre, p.observacion || '']),
      { widths: [13, 7.5, 7.5, 6, 4, 4, 7, 7, 11, 9, 10, 14], small: true }));
  });
  if (!c.poe.length) blocks.push(Ps('[Registre el personal en la sección Personal expuesto.]'));
  blocks.push(KV([['Fecha de actualización', fLarga(c.fecha)]]));
  blocks.push(NOTE('Celdas en rojo: licencia caducada. Celdas en amarillo: caduca en 90 días o menos. Todo ingreso o salida de personal se comunica por escrito a la Autoridad Reguladora (Art. 9 del Reglamento de Seguridad Radiológica).'));
  blocks.push(SIGN([c.firmas.osr]));
  return { title: 'Bitácora de POE', kind: 'sgc', landscape: true, blocks };
}

function docChecklistPOE(c) {
  const fillCat = Object.fromEntries(CATEGORIAS_POE.map(x => [x.id, x.fill]));
  const naranja = 'F4B183';
  const filas = c.poe.map(p => [
    { t: p.nombre.toUpperCase(), fill: fillCat[p.categoria] || null, bold: true },
    ...DOCS_POE.map(d => {
      const v = (p.docs || {})[d.k] || '';
      return { t: v, align: 'c', bold: true, fill: /No posee|Falta/i.test(v) ? naranja : null };
    })
  ]);
  const blocks = [
    KV([['Centro médico', ph(c.I.razonSocial, 'Razón social') + (c.I.nombreComercial ? ` (${c.I.nombreComercial})` : '')], ['Área', c.P.mayus]]),
    T(['Apellidos y nombres', ...DOCS_POE.map(d => d.t)], filas.length ? filas : [['', ...DOCS_POE.map(() => '')]], { widths: [16, 6, 6, 5, 7, 7, 8, 8, 8, 10, 10, 9], small: true }),
    { t: 'legend', items: [
      { t: 'NA = No aplica    X = Sí posee' },
      { t: 'Sin color: licenciados, tecnólogos o su equivalente' },
      { t: 'Naranja: falta de documentos', fill: naranja },
      { t: 'Celeste: médico imagenólogo responsable del Departamento de Imagen', fill: fillCat.medico },
      { t: 'Verde: Oficial de Seguridad Radiológica', fill: fillCat.osr }
    ] },
    SIGN([{ ...c.firmas.osr, label: 'Realizado por', role: `${c.rolOSR}\n${fCorta(c.fecha)}` }, { ...c.firmas.med, label: 'Revisado por' }])
  ];
  return { title: 'Check list de documentos del POE', kind: 'sgc', landscape: true, blocks };
}

function sumarMeses(d, m) { const r = new Date(d); r.setMonth(r.getMonth() + m); return r; }
function isoDe(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }

function periodosRecambio(c) {
  const paso = /bimestral/i.test(c.V.dosPeriodo || '') ? 2 : (/trimestral/i.test(c.V.dosPeriodo || '') ? 3 : 1);
  const ini = parseFecha(c.V.dosInicio), fin = parseFecha(c.V.dosVigencia);
  if (!ini) return { paso, lista: Array.from({ length: 12 / paso }, () => ['', '']) };
  const meses = fin ? Math.max(1, Math.round((fin - ini) / (30.44 * 86400000))) : 12;
  const n = Math.min(12, Math.max(1, Math.round(meses / paso)));
  const lista = [];
  for (let k = 0; k < n; k++) {
    const d = sumarMeses(ini, k * paso), h = sumarMeses(ini, (k + 1) * paso); h.setDate(h.getDate() - 1);
    lista.push([fCorta(isoDe(d)), fCorta(isoDe(h))]);
  }
  return { paso, lista };
}

function docRecambio(c) {
  const { lista } = periodosRecambio(c);
  const n = lista.length;
  const resto = 55 / (2 * n);
  const filas = (c.poe.length ? c.poe : [{}, {}, {}]).map((p, i) => [
    { t: String(i + 1), align: 'c' }, p.apellidos || p.nombre || '', p.nombres || '', p.cedula || '',
    { t: p.area || '', align: 'c' }, { t: p.tipoDos || '', align: 'c' }, { t: p.cargoDos || '', align: 'c' },
    ...lista.flatMap(() => ['', ''])
  ]);
  const blancos = Array.from({ length: 3 }, (_, i) => [{ t: String(filas.length + i + 1), align: 'c' }, '', '', '', '', '', '', ...lista.flatMap(() => ['', ''])]);
  const blocks = [
    KV([
      ['Institución', ph(c.I.razonSocial, 'Razón social')],
      ['Dirección', ph(c.I.direccion, 'Dirección')],
      ['Servicio de dosimetría', `${ph(c.V.dosEmpresa, 'Empresa')} · ${c.V.dosTipo || ''} · lectura ${String(c.V.dosPeriodo || 'mensual').toLowerCase()}`],
      ['Fecha inicio / fin de contrato', `${c.V.dosInicio ? fCorta(c.V.dosInicio) : '[inicio]'} / ${c.V.dosVigencia ? fCorta(c.V.dosVigencia) : '[fin]'}`],
      ['Responsable', c.firmas.osr.name]
    ]),
    T(['N.°', 'Apellidos', 'Nombres', 'Documento (C.I. / pasaporte)', 'Área', 'Tipo de dosímetro', 'Cargo o función', ...lista.flatMap(p => [p[0] || 'Desde', p[1] || 'Hasta'])],
      [...filas, ...blancos],
      {
        widths: [3, 10, 10, 8, 4, 5, 5, ...lista.flatMap(() => [resto, resto])], small: true, tall: true,
        pre: [
          [{ t: '', s: 7 }, { t: 'FECHAS DE RECAMBIO', s: 2 * n }],
          [{ t: '', s: 7 }, ...lista.map((_, i) => ({ t: String(i + 1), s: 2 }))],
          [{ t: '', s: 7 }, ...lista.flatMap(() => [{ t: 'DESDE' }, { t: 'HASTA' }])]
        ]
      }),
    NOTE('Área, tipo de dosímetro y cargo se registran con los códigos del catálogo del servicio de dosimetría. Cada trabajador firma en la casilla del periodo al recibir su dosímetro nuevo y entregar el anterior.'),
    SIGN([{ ...c.firmas.osr, role: 'RESPONSABLE' }])
  ];
  return { title: 'Recambio de dosímetros personales', kind: 'sgc', landscape: true, blocks };
}

function docBitacoraEquipos(c) {
  const filas = c.eq.map((e, i) => [{ t: String(i + 1), align: 'c' }, e.tipo || '', e.marca || 'NR', e.tuboMarca || 'NR', e.modelo || 'NR', e.tuboModelo || 'NR', e.serie || 'NR', e.tuboSerie || 'NR', { t: e.anio || '', align: 'c' }, { t: e.anioTubo || '', align: 'c' }, { t: e.anioInst || '', align: 'c' }]);
  const blocks = [
    cabeceraInstitucion(c),
    T(['N.°', 'Tipo de equipo', 'Equipo', 'Tubo', 'Equipo', 'Tubo', 'Equipo', 'Tubo', 'Equipo', 'Tubo', 'Año de instalación'],
      filas.length ? filas : [['1', '', '', '', '', '', '', '', '', '', '']],
      { widths: [4, 15, 10, 10, 10, 10, 10, 10, 7, 7, 7], small: true, pre: [[{ t: '', s: 2 }, { t: 'MARCA', s: 2 }, { t: 'MODELO', s: 2 }, { t: 'SERIE', s: 2 }, { t: 'AÑO DE FABRIC.', s: 2 }, { t: '' }]] }),
    NOTE('NR: no registra en la placa de identificación.'),
    SIGN([c.firmas.osr])
  ];
  return { title: 'Bitácora de equipos', kind: 'sgc', landscape: true, blocks };
}

function docLicenciaInst(c) {
  const { I } = c;
  const autorizados = c.eqAct.filter(e => e.enLicencia !== 'No');
  const validez = (() => { const a = parseFecha(I.licenciaExp), b = parseFecha(I.licenciaCad); return a && b ? `${Math.round((b - a) / (365.25 * 86400000))} años` : '4 años'; })();
  const blocks = [
    Ps('LICENCIA INSTITUCIONAL - OPERACIÓN - C', { align: 'c', bold: true }),
    KV([
      ['Código', ph(I.licencia, 'Código de licencia')],
      ['Validez', validez],
      ['Fecha de expedición', I.licenciaExp ? fCorta(I.licenciaExp) : '[fecha]'],
      ['Fecha de expiración', I.licenciaCad ? `${fCorta(I.licenciaCad)} (${estadoVigencia(I.licenciaCad).toLowerCase()})` : '[fecha]']
    ]),
    cabeceraInstitucion(c),
    Ps('Esta instalación está **AUTORIZADA** para el uso de:'),
    T(['Equipos generadores de radiación ionizante', 'Campo', 'kV máximo', 'mA máximo'], [['Rayos X', c.P.mayus, { t: I.kvMax ? I.kvMax + ' kV' : '', align: 'c' }, { t: I.maMax || '', align: 'c' }]], { widths: [34, 34, 16, 16], small: true }),
    Ps(`El servicio de ${c.P.corto} de ${ph(I.nombreComercial || I.razonSocial, 'Institución')} está autorizado para dar servicio con los siguientes equipos:`, { align: 'j' }),
    T(['N.°', 'Tipo', 'Equipo', 'Tubo', 'Equipo', 'Tubo', 'Equipo', 'Tubo'],
      (autorizados.length ? autorizados : [{}]).map((e, i) => [{ t: String(i + 1), align: 'c' }, e.tipo || '', e.marca || '', e.tuboMarca || '', e.modelo || '', e.tuboModelo || '', e.serie || '', e.tuboSerie || '']),
      { widths: [5, 19, 12, 12, 13, 13, 13, 13], small: true, pre: [[{ t: '', s: 2 }, { t: 'MARCA', s: 2 }, { t: 'MODELO', s: 2 }, { t: 'SERIE', s: 2 }]] }),
    NOTE('Transcripción de la licencia institucional vigente para control interno. Los equipos que no constan en la licencia deben regularizarse ante la Autoridad Reguladora antes de su uso.'),
    SIGN([c.firmas.osr])
  ];
  return { title: 'Bitácora de licencia institucional', kind: 'sgc', blocks };
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
  if (!d) return '';
  const tpl = (c.M.plantilla || '{TIPO}-{SIGLAS}-{PRAC}-PR-OSR-{AÑO}-{N}').toUpperCase();
  return tpl.replace(/\{TIPO\}/g, d.tipo).replace(/\{SIGLAS\}/g, (c.M.siglas || '').trim().toUpperCase())
    .replace(/\{PRAC\}/g, PRAC_COD[c.S.practica]).replace(/\{AÑO\}/g, c.anio).replace(/\{N\}/g, '01')
    .replace(/-{2,}/g, '-').replace(/^-|-$/g, '');
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
  const { V } = c;
  const salas = [...new Set(c.epp.map(e => e.sala).filter(Boolean))];
  const col = (s) => COLORES_SALA[salas.indexOf(s) % COLORES_SALA.length] || null;
  const desc = (e) => `${e.tipo || '[Tipo]'}${e.espesor ? ', ' + e.espesor + ' mm Pb Eq.' : ''}${e.talla ? ', talla ' + e.talla : ''}`;
  const factura = (e) => [e.factura || 'N/R', e.proveedor ? `(${e.proveedor})` : ''].filter(Boolean).join(' ');
  const filas = c.epp.map(e => [{ t: e.codigo || '', fill: col(e.sala), bold: true, align: 'c' }, desc(e), { t: factura(e), align: 'c' }, { t: e.cantidad || '1', align: 'c' }, { t: e.sala || '', fill: col(e.sala), align: 'c' }]);
  const resumen = salas.map(s => {
    const deSala = c.epp.filter(e => e.sala === s);
    const n = (re) => deSala.filter(e => re.test(e.tipo || '')).reduce((a, e) => a + (parseInt(e.cantidad, 10) || 1), 0);
    const del = n(/Delantal|Mandil|Chaleco|dos piezas/i), cuello = n(/Collar|Chaleco plomado con collarín/i), gon = n(/gonadal/i);
    const necesitaGon = c.S.practica === 'medico';
    return [s, { t: String(del), align: 'c' }, { t: String(cuello), align: 'c' }, { t: necesitaGon ? String(gon) : '—', align: 'c' }, (() => { const ok = del >= 2 && cuello >= 2 && (!necesitaGon || gon >= 1); return { t: ok ? 'Cumple' : 'Completar', align: 'c', fill: ok ? 'C6E0B4' : 'F8CBAD' }; })()];
  });
  const facturas = (c.S.facturas || []).filter(f => f.numero || f.producto);
  const num = (v) => { const n = parseFloat(String(v || '').replace(',', '.')); return isNaN(n) ? 0 : n; };
  const money = (n) => n ? n.toFixed(2).replace('.', ',') : '';
  const totF = facturas.reduce((a, f) => [a[0] + num(f.subtotal), a[1] + num(f.iva), a[2] + (num(f.total) || num(f.subtotal) + num(f.iva))], [0, 0, 0]);
  const obs = String(V.obsEpp || '').split('\n').map(x => x.trim()).filter(Boolean);
  const blocks = [
    { t: 'kv4', rows: [['N.° de hoja', V.invHoja || '1', 'Fecha', fLarga(V.invFecha || c.fecha)], ['Realizado por', [c.R.osrProfesion ? c.R.osrProfesion.slice(0, 4) + '.' : '', c.R.osrNombre].filter(Boolean).join(' ') || '[Nombre]', 'Departamento', V.invDepto || `${c.I.sede || c.I.nombreComercial || ''} - ${c.rolOSR}`.replace(/^ - /, '')]] },
    T(['Código interno', 'Descripción del artículo', 'N.° de factura / precio de compra', 'Cantidad', 'Ubicación'], filas.length ? filas : [['', '', '', '', '']], { widths: [17, 33, 22, 9, 19], small: true }),
    ...(obs.length ? [Ps('**Observaciones:**'), L(obs)] : []),
    Ps('Requisito mínimo (Norma Técnica, num. 5.4 lit. a): delantales de 0,5 a 0,7 mm Pb cuando cubren solo el frente o 0,25 mm cuando cubren completamente los costados del tórax y la pelvis; collarín tiroideo y protectores gonadales de 0,5 mm Pb; al menos dos prendas de cada tipo por sala.', { align: 'j' }),
    ...(resumen.length ? [T(['Sala', 'Mandiles', 'Collarines', 'Protectores gonadales', 'Mínimo por sala'], resumen, { widths: [32, 15, 15, 18, 20], small: true })] : []),
    ...(facturas.length ? [
      H('Resumen de facturas'),
      T(['Fecha', 'N.° factura', 'Proveedor', 'Producto', 'Subtotal', 'IVA', 'Total'],
        [...facturas.map(f => [{ t: fCorta(f.fecha), align: 'c' }, { t: f.numero || '', align: 'c' }, f.proveedor || '', f.producto || '', { t: money(num(f.subtotal)), align: 'c' }, { t: money(num(f.iva)), align: 'c' }, { t: money(num(f.total) || num(f.subtotal) + num(f.iva)), align: 'c' }]),
          ['', '', '', { t: 'Total', bold: true }, { t: money(totF[0]), align: 'c', bold: true }, { t: money(totF[1]), align: 'c', bold: true }, { t: money(totF[2]), align: 'c', bold: true }]],
        { widths: [11, 16, 18, 27, 9, 9, 10], small: true })
    ] : []),
    SIGN([{ label: 'Administración', name: V.invAdmin || '[Nombre]', role: 'Administración' }, { ...c.firmas.osr }])
  ];
  const conImg = facturas.filter(f => f.img);
  if (conImg.length) {
    blocks.push(PB(), H('Anexo: facturas de compra'));
    conImg.forEach(f => blocks.push({ t: 'img', img: f.img, maxH: 200, caption: `Factura ${f.numero || ''}${f.proveedor ? ' – ' + f.proveedor : ''}${f.fecha ? ' – ' + fCorta(f.fecha) : ''}` }));
  }
  return { title: 'Inventario de equipo de protección radiológica', kind: 'sgc', blocks };
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
  const lista = cronogramaActual(c);
  const blocks = [];
  lista.forEach((x, i) => {
    blocks.push(Ps(`Capacitación ${i + 1}: ${x.tema}`, { bold: true }));
    blocks.push({ t: 'kv4', rows: [['Fecha', fLarga(x.fecha), 'Horario', `${x.horaIni || ''} a ${x.horaFin || ''}`], ['Capacitador', x.capacitador || [c.R.osrTitulo, c.R.osrNombre].filter(Boolean).join(' ') || c.rolOSR, 'Carga horaria', `${horasEntre(x.horaIni, x.horaFin) || ''} h`], ['Dirigido a', x.dirigido || 'POE', 'Modalidad', x.obs || 'Presencial']] });
    const filas = (c.poe.length ? c.poe : [{}, {}, {}]).map((p, j) => [String(j + 1), p.cedula || '', p.nombre || '', '', '']);
    blocks.push(T(['N.º', 'Cédula', 'Nombres completos', 'Calificación', 'Firma'], filas, { widths: [6, 18, 40, 14, 22], small: true, tall: true }));
    blocks.push(SIGN([{ name: x.capacitador || c.firmas.osr.name, role: 'Capacitador' }, { ...c.firmas.osr, role: 'Responsable del registro' }].filter((y, k, arr) => k === 0 || !c.mismaPersona(y, arr[0]))));
    if (i < lista.length - 1) blocks.push(PB());
  });
  return { title: 'Registro de capacitaciones', kind: 'sgc', blocks };
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
    { t: 'big', text: 'RAYOS X\nPROHIBIDO EL INGRESO A PERSONAS NO AUTORIZADAS', sub: 'Zona controlada · Norma Técnica MERNNR-MERNNR-2022-0011-AM, num. 5.2 lit. d)' },
    PB(),
    { t: 'big', text: 'SE PROHÍBE LA ENTRADA CUANDO LA LUZ ESTÉ ENCENDIDA', sub: 'Colocar junto a la señalización luminosa roja, sobre la puerta de acceso (num. 10.2.4)' },
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
  { id: 'OF-RESP', tipo: 'OF-ENT', grupo: 'Oficios', aplica: () => true, build: docOficioRespuesta, nota: 'Respuesta al oficio de notificación' },
  { id: 'OF-DISP', tipo: 'OF-DSP', grupo: 'Oficios', aplica: (c) => c.S.disp.some(d => d.nc), build: docOficioDisposiciones, nota: 'Respuesta al informe de inspección' },
  { id: 'OF-BAJA', tipo: 'OF-BAJ', grupo: 'Oficios', aplica: (c) => c.eqBaja.length > 0, build: docOficioBaja, nota: 'Requisito II.9' },
  { id: 'DEC-MAX', tipo: 'DCL-RL', grupo: 'Declaraciones y nombramientos', aplica: () => true, build: docDeclaracionMaxima, nota: 'Requisito I.4' },
  { id: 'NOM-OSR', tipo: 'NOM-OSR', grupo: 'Declaraciones y nombramientos', aplica: (c) => !!c.R.osrAplica, build: docNombramientoOSR, nota: 'Requisito I.7' },
  { id: 'DES-MED', tipo: 'DES-RPP', grupo: 'Declaraciones y nombramientos', aplica: () => true, build: docDesignacionMedico, nota: 'Requisito I.8' },
  { id: 'DEC-EMB', tipo: 'PRO-EMB', grupo: 'Planes y procedimientos', aplica: () => true, build: docEmbrion, nota: 'Requisito I.5' },
  { id: 'FUN-RESP', tipo: 'MAT-FUN', grupo: 'Planes y procedimientos', aplica: () => true, build: docFunciones, nota: 'Requisito I.12' },
  { id: 'PLAN-CAP', tipo: 'PLN-CAP', grupo: 'Planes y procedimientos', aplica: () => true, build: docPlanCapacitacion, nota: 'Requisito I.11' },
  { id: 'PROC-TEC', tipo: 'PRO-TEC', grupo: 'Planes y procedimientos', aplica: () => true, build: docProcTecnicos, nota: 'Requisito I.15' },
  { id: 'PROC-PRES', tipo: 'PRO-PRE', grupo: 'Planes y procedimientos', aplica: () => true, build: docPrescripcion, nota: 'Requisito I.16' },
  { id: 'PROC-JUST', tipo: 'PRO-JUS', grupo: 'Planes y procedimientos', aplica: () => true, build: docJustificacion, nota: 'Requisito I.33' },
  { id: 'PROC-DOS', tipo: 'PRO-DOS', grupo: 'Planes y procedimientos', aplica: () => true, build: docDosimetria, nota: 'Disposiciones de dosimetría' },
  { id: 'PROC-SEG', tipo: 'PRO-SEG', grupo: 'Planes y procedimientos', aplica: (c) => c.S.practica === 'intervencionista', build: docSeguimientoPaciente, nota: 'Propio de intervencionismo' },
  { id: 'INF-DEL', tipo: 'INF-EPP', grupo: 'Informes y listados', aplica: () => true, build: docInformeDelantales, nota: 'Requisito I.18' },
  { id: 'NOM-POE', tipo: 'BT-POE', grupo: 'Bitácoras y control del POE', aplica: () => true, build: docBitacoraPOE, nota: 'Requisito I.13' },
  { id: 'CHL-POE', tipo: 'CHL', grupo: 'Bitácoras y control del POE', aplica: () => true, build: docChecklistPOE, nota: 'Control interno de expedientes del POE' },
  { id: 'REC-DOS', tipo: 'RCB-DOS', grupo: 'Bitácoras y control del POE', aplica: () => true, build: docRecambio, nota: 'Requisitos I.9 y I.26' },
  { id: 'BT-EQ', tipo: 'BT-EQ', grupo: 'Bitácoras y control del POE', aplica: () => true, build: docBitacoraEquipos, nota: 'Requisito I.24' },
  { id: 'BT-LIC', tipo: 'BT-LIC', grupo: 'Bitácoras y control del POE', aplica: () => true, build: docLicenciaInst, nota: 'Requisito I.22' },
  { id: 'LIST-EQ', tipo: 'LST-EQ', grupo: 'Informes y listados', aplica: () => true, build: docListadoEquipos, nota: 'Requisito II.8' },
  { id: 'LISTA-M', tipo: 'LM-DOC', grupo: 'Informes y listados', aplica: () => true, build: docListaMaestra, nota: 'Requisito II.1' },
  { id: 'MATRIZ', tipo: 'MTZ-REQ', grupo: 'Informes y listados', aplica: () => true, build: docMatriz, nota: 'Control interno' },
  { id: 'REG-LIC', tipo: 'REG-LIC', grupo: 'Registros', aplica: () => true, build: docRegLicencias, nota: 'Requisito I.22' },
  { id: 'REG-OSR', tipo: 'REG-OSR', grupo: 'Registros', aplica: (c) => !!c.R.osrAplica, build: docRegOSR, nota: 'Requisito I.23' },
  { id: 'REG-EQ', tipo: 'REG-EQ', grupo: 'Registros', aplica: () => true, build: docRegEquipos, nota: 'Requisito I.24' },
  { id: 'REG-EPP', tipo: 'REG-EPP', grupo: 'Registros', aplica: () => true, build: docRegEpp, nota: 'Requisito I.25' },
  { id: 'REG-DOS', tipo: 'REG-DOS', grupo: 'Registros', aplica: () => true, build: docRegDosimetria, nota: 'Requisito I.26' },
  { id: 'REG-MED', tipo: 'REG-MED', grupo: 'Registros', aplica: () => true, build: docRegMedico, nota: 'Requisito I.27' },
  { id: 'REG-INC', tipo: 'REG-INC', grupo: 'Registros', aplica: () => true, build: docRegIncidentes, nota: 'Requisito I.28' },
  { id: 'REG-INSP', tipo: 'REG-INS', grupo: 'Registros', aplica: () => true, build: docRegInspecciones, nota: 'Requisito I.29' },
  { id: 'REG-CAP', tipo: 'REG-CAP', grupo: 'Registros', aplica: () => true, build: docRegCapacitacion, nota: 'Requisito I.30' },
  { id: 'CONS-INF', tipo: 'FOR-CI', grupo: 'Formatos y rótulos', aplica: () => true, build: docConsentimiento, nota: 'Requisito I.17' },
  { id: 'ROTULOS', tipo: 'ROT-SEN', grupo: 'Formatos y rótulos', aplica: () => true, build: docRotulos, nota: 'Requisitos II.2 y II.3' }
];

/* El código de cada documento sale de la plantilla de codificación del expediente */
DOCS.forEach(d => { const f = d.build; d.build = (c) => Object.assign(f(c), { code: codigoDoc(c, d.id) }); });

/* Alertas técnicas que una OSR revisaría antes de enviar */
function revisarExpediente(c) {
  const a = [];
  const { I, R, V } = c;
  const ev = estadoVigencia(I.licenciaCad);
  if (I.licenciaCad && ev !== 'Vigente') a.push({ nivel: ev === 'Caducada' ? 'alta' : 'media', txt: `Licencia institucional ${ev.toLowerCase()} (${fCorta(I.licenciaCad)}).` });
  c.poe.forEach(p => {
    const e = estadoVigencia(p.licCad);
    const falt = DOCS_POE.filter(d => /No posee|Falta/i.test((p.docs || {})[d.k] || '')).map(d => d.t.toLowerCase());
    if (falt.length) a.push({ nivel: 'media', txt: `${p.nombre}: falta ${falt.join(', ')}.` });
    if (/por revisar/i.test(p.observacion || '')) a.push({ nivel: 'media', txt: `${p.nombre}: la fecha de expiración de la licencia en su bitácora no es válida; corríjala.` });
    if (!p.codigo && !p.licencia) a.push({ nivel: 'media', txt: `${p.nombre}: falta el número de licencia ocupacional.` });
    else if (e === 'Caducada' || e === 'Por caducar') a.push({ nivel: e === 'Caducada' ? 'alta' : 'media', txt: `${p.nombre}: licencia ocupacional ${e.toLowerCase()} (${fCorta(p.licCad)}). La renovación se solicita con 90 días de anticipación (Reglamento, Art. 33).` });
    const dm = diasHasta(p.certMed);
    if (!p.certMed) a.push({ nivel: 'media', txt: `${p.nombre}: sin fecha de certificado médico.` });
    else if (dm < -365) a.push({ nivel: 'alta', txt: `${p.nombre}: certificado médico con más de un año (${fCorta(p.certMed)}).` });
  });
  const necesitaOSR = c.eqAct.length >= 4 && c.eqAct.some(e => TIPOS_OSR.test(e.tipo || ''));
  const categoria2 = c.eqAct.some(e => /Angiógrafo/.test(e.tipo || ''));
  if (categoria2 && !R.osrAplica) a.push({ nivel: 'alta', txt: 'La angiografía y la hemodinamia son prácticas de categoría 2 (Anexo I): la instalación debe nombrar un OSR (Art. 5, num. 5.1 lit. d). Active la opción en Responsables.' });
  else if (necesitaOSR && !R.osrAplica) a.push({ nivel: 'alta', txt: `La instalación tiene ${c.eqAct.length} equipos y al menos uno de tipo tomógrafo, arco en C, litotriptor o telecomandado: debe contar con OSR (Art. 5, num. 5.1 lit. g). Active la opción en Responsables.` });
  if (R.osrAplica && R.osrCedula) {
    const doble = c.poe.find(p => (p.cedula || '') === R.osrCedula && p.categoria !== 'osr');
    if (doble) a.push({ nivel: 'media', txt: `${doble.nombre} figura como OSR y también como ${doble.funcion || 'operador'}: el OSR no puede ejercer doble función dentro de una misma práctica (Anexo II, indicaciones generales).` });
  }
  if (c.S.practica === 'intervencionista') {
    if (!c.epp.some(e => /Lente|Gafa/i.test(e.tipo || ''))) a.push({ nivel: 'media', txt: 'Intervencionismo: no hay lentes plomados registrados (0,2 mm Pb, num. 5.4 lit. b).' });
    if (!c.epp.some(e => /Guante/i.test(e.tipo || ''))) a.push({ nivel: 'baja', txt: 'Intervencionismo: no hay guantes de compresión de 0,25 mm Pb registrados (num. 5.4 lit. b).' });
    if (!c.epp.some(e => /Gorro/i.test(e.tipo || ''))) a.push({ nivel: 'baja', txt: 'Intervencionismo: no hay gorro plomado registrado para el médico intervencionista (num. 5.4 lit. b).' });
  }
  c.epp.forEach(p => { if (p.fechaCaducidad && diasHasta(p.fechaCaducidad) < 0) a.push({ nivel: 'media', txt: `${p.codigo || p.tipo}: fecha de caducidad vencida (${fCorta(p.fechaCaducidad)}).` }); });
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
