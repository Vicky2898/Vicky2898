/* Interfaz: expedientes guardados en el navegador, formularios, tablas editables y exportación. */

const CLAVE = 'expedienteSR.v1';

function estadoVacio(practica = 'medico') {
  return {
    id: 'exp' + Date.now().toString(36),
    practica,
    ejemplo: false,
    inst: { razonSocial: '', nombreComercial: '', sede: '', ruc: '', establecimiento: '', tipoEstab: '', actividad: '', licencia: '', licenciaExp: '', licenciaCad: '', kvMax: '', maMax: '', repEmpresa: '', repLegal: '', repCedula: '', repCargo: 'Gerente General', repProfesion: '', repTelefono: '', repCorreo: '', direccion: '', parroquia: '', referencia: '', ciudad: '', provincia: '', codPostal: '', telefono: '', correo: '', logo: null, sello: null },
    resp: Object.assign({ osrAplica: practica === 'intervencionista', osrTitulo: '', osrNombre: '', osrProfesion: '', osrCedula: '', osrAut: '', osrAutCad: '', osrLicencia: '', osrTelefono: '', osrCorreo: '', medTitulo: '', medNombre: '', medCedula: '', medEspecialidad: '', medLicencia: '', medLicCad: '' }, (typeof BD !== 'undefined' && BD.perfil) || {}),
    serv: { dosEmpresa: '', dosLicencia: '', dosTipo: 'OSL', dosPeriodo: 'Bimestral', dosInicio: '', dosVigencia: '', mantEmpresa: '', mantLicencia: '', mantVigencia: '', labMedico: '', eqPrueba: '', modoPrueba: 'Radiografía', fechaPruebaEpp: '' },
    oficio: { autoridad: 'Ministerio de Ambiente y Energía', direccionMEM: 'Dirección de Licenciamiento y Protección Radiológica', numero: '', fecha: '', tramite: '', tecnicoTitulo: 'Especialista', tecnicoNombre: '', tecnicoCargo: 'Técnico de Licenciamiento y Protección Radiológica', numResp: '', numDisp: '', numBaja: '', informeNum: '', informeFecha: '', plazo: '90' },
    meta: { siglas: '', plantilla: '{TIPO}-{SIGLAS}-{PRAC}-PR-OSR-{AÑO}-{N}', estilo: 'ficha', color: '#1F4E79', version: '01', fechaEmision: hoyISO(), anioPlan: String(new Date().getFullYear()), ubicacion: 'Archivo físico y digital' },
    poe: [], equipos: [], epp: [], disp: [], check: {}
  };
}

function estadoEjemplo() {
  const s = estadoVacio('medico');
  s.ejemplo = true;
  s.id = 'ejemplo';
  Object.assign(s.inst, { razonSocial: 'IMAGEN DIAGNÓSTICA EJEMPLO S.A.', nombreComercial: 'Centro de Imágenes Ejemplo', ruc: '0999999999001', licencia: 'G-0000', licenciaCad: '2026-12-15', repLegal: 'María Fernanda Ejemplo Torres', repCedula: '0900000001', repCargo: 'Gerente General', direccion: 'Av. Ejemplo 123 y Calle Modelo', ciudad: 'Guayaquil', provincia: 'Guayas', codPostal: '090101', telefono: '04 000 0000', correo: 'contacto@ejemplo.ec' });
  Object.assign(s.resp, { osrAplica: true, osrTitulo: 'Magíster', osrNombre: 'Ana Lucía Muestra Vera', osrCedula: '0900000002', osrAut: 'OSR-000', osrAutCad: '2027-03-01', osrLicencia: 'G-0001', osrTelefono: '099 000 0000', osrCorreo: 'osr@ejemplo.ec', medTitulo: 'Doctor', medNombre: 'Carlos Andrés Modelo Ruiz', medCedula: '0900000003', medEspecialidad: 'médico especialista en imagenología', medLicencia: 'G-0002', medLicCad: '2027-06-30' });
  Object.assign(s.serv, { dosEmpresa: 'Laboratorio de Dosimetría Ejemplo', dosLicencia: 'LD-000', dosVigencia: '2026-12-31', mantEmpresa: 'Servicios Biomédicos Ejemplo Cía. Ltda.', mantLicencia: 'M-000', mantVigencia: '2026-11-30', labMedico: 'Centro de Salud Ocupacional Ejemplo', eqPrueba: 'Rayos X convencional fijo, serie 0000A1', fechaPruebaEpp: '2026-02-10' });
  Object.assign(s.oficio, { numero: 'MEM-DLPR-2026-0000-OF', fecha: '2026-03-10', tramite: '0000-EJEMPLO', tecnicoTitulo: 'Especialista', tecnicoNombre: 'Nombre del Técnico Ejemplo', numResp: 'IDE-SR-2026-001' });
  Object.assign(s.meta, { siglas: 'IDE' });
  Object.assign(s.inst, { establecimiento: '1', tipoEstab: 'Oficina / Abierto', actividad: 'Q869021 - Actividades de laboratorios de radiología (Rayos X) y otros centros de diagnóstico por imagen.', licenciaExp: '2022-12-16', kvMax: '150', maMax: '1000' });
  s.resp.osrProfesion = 'Tecnóloga médica';
  s.serv.dosInicio = '2026-06-05'; s.serv.dosVigencia = '2027-06-05';
  const X = { ci: 'X', ci18: 'N/A', cv: 'X', t3: 'X', t4: 'N/A', senescyt: 'X', acess: 'X', lic: 'X', certs: 'X', dosAnt: 'X', med: 'X' };
  s.poe = [
    { apellidos: 'Modelo Ruiz', nombres: 'Carlos Andrés', categoria: 'medico', cedula: '0900000003', licencia: '0900000003', codigo: 'Q-0002', ren: '1', act: '0', expedicion: '2023-06-30', licCad: '2027-06-30', profesion: 'Médico especialista en Imagenología', cargo: 'Imagenólogo', campo: 'Radiodiagnóstico Médico', observacion: '', certMed: '2026-01-20', dosimetro: 'D-02', docs: { ...X, t4: 'X' } },
    { apellidos: 'Prueba Gómez', nombres: 'Luis Esteban', categoria: 'tecnologo', cedula: '0900000004', licencia: '0900000004', codigo: 'Q-0003', ren: '2', act: '0', expedicion: '2022-11-06', licCad: '2026-11-05', profesion: 'Licenciado en Radiología', cargo: 'Técnico en imagen', campo: 'Radiodiagnóstico Médico', observacion: 'Renovación en curso.', certMed: '2025-08-14', dosimetro: 'D-03', docs: { ...X, med: 'No posee' } },
    { apellidos: 'Muestra Vera', nombres: 'Ana Lucía', categoria: 'osr', cedula: '0900000002', licencia: '0900000002', codigo: 'OSR-000', ren: '0', act: '0', expedicion: '2023-03-02', licCad: '2027-03-01', profesion: 'Tecnóloga médica', cargo: 'Oficial de Seguridad Radiológica', campo: 'Radiodiagnóstico Médico', observacion: '', certMed: '2026-01-20', dosimetro: 'D-01', docs: { ...X } }
  ];
  s.equipos = [
    { tipo: 'Rayos X convencional fijo', marca: 'SHIMADZU', modelo: 'RADspeed', serie: '0000A1', tuboMarca: 'SHIMADZU', tuboModelo: '0.6/1.2P324DK-85', tuboSerie: '0000T1', anio: '2019', anioTubo: '2019', anioInst: '2020', enLicencia: 'Sí', sala: 'Sala 1', uso: 'Diagnóstico general', estado: 'Funcionando', mantFecha: '2026-02-10' },
    { tipo: 'Rayos X portátil', marca: 'FUJIFILM', modelo: 'FDR Nano', serie: '0000B2', tuboMarca: 'FUJIFILM', tuboModelo: 'NR', tuboSerie: '', anio: '2021', sala: 'Hospitalización', uso: 'Hospitalización (portátil)', estado: 'Funcionando', mantFecha: '2026-02-10' },
    { tipo: 'Tomógrafo computarizado', marca: 'GE', modelo: 'Revolution ACT', serie: '0000C3', tuboMarca: 'GE', tuboModelo: 'Performix 40 Plus', tuboSerie: '0000T3', anio: '2020', sala: 'Sala de tomografía', uso: 'Tomografía', estado: 'Funcionando', mantFecha: '2025-07-01' }
  ];
  s.epp = [
    { codigo: 'DP-01', tipo: 'Delantal plomado frontal', espesor: '0,5', marca: 'Infab', talla: 'M', sala: 'Sala 1', estado: 'Bueno', fechaPrueba: '2026-02-10', kv: '80', mas: '5', defectos: 'Ninguno', resultado: 'Apta' },
    { codigo: 'DP-02', tipo: 'Delantal plomado frontal', espesor: '0,5', marca: 'Infab', talla: 'L', sala: 'Sala 1', estado: 'Bueno', fechaPrueba: '2026-02-10', kv: '80', mas: '5', defectos: 'Ninguno', resultado: 'Apta' },
    { codigo: 'CT-01', tipo: 'Collarín tiroideo', espesor: '0,5', marca: 'Infab', talla: 'U', sala: 'Sala 1', estado: 'Bueno', fechaPrueba: '2026-02-10', kv: '70', mas: '4', defectos: 'Ninguno', resultado: 'Apta' },
    { codigo: 'CT-02', tipo: 'Collarín tiroideo', espesor: '0,5', marca: 'Infab', talla: 'U', sala: 'Sala 1', estado: 'Regular', fechaPrueba: '2026-02-10', kv: '70', mas: '4', defectos: 'Fisura de 20 mm² en zona central', resultado: 'No apta' }
  ];
  return s;
}

/* ---------- persistencia ---------- */
let BD = { actual: null, lista: {} };
function cargarBD() {
  try {
    const raw = localStorage.getItem(CLAVE);
    if (raw) BD = JSON.parse(raw);
  } catch (e) { /* almacenamiento no disponible */ }
  if (!BD.lista || !Object.keys(BD.lista).length) {
    const ej = estadoEjemplo();
    BD = { actual: ej.id, lista: { [ej.id]: ej } };
  }
  if (!BD.lista[BD.actual]) BD.actual = Object.keys(BD.lista)[0];
  Object.values(BD.lista).forEach(normalizar);
}
function normalizar(s) {
  const base = estadoVacio(s.practica);
  if (s.meta && !s.meta.siglas && s.meta.prefijo && s.meta.prefijo !== 'SR') s.meta.siglas = s.meta.prefijo;
  (s.poe || []).forEach(p => {
    if (!p.docs) p.docs = {};
    if (!p.apellidos && !p.nombres && p.nombre) Object.assign(p, dividirNombre(p.nombre));
    if (!p.categoria) p.categoria = p.autOsr ? 'osr' : 'tecnologo';
    if (!p.cargo && p.funcion) p.cargo = p.funcion;
  });
  ['inst', 'resp', 'serv', 'oficio', 'meta'].forEach(k => { s[k] = Object.assign({}, base[k], s[k] || {}); });
  ['poe', 'equipos', 'epp', 'disp'].forEach(k => { if (!Array.isArray(s[k])) s[k] = []; });
  if (!s.check) s.check = {};
}
let tGuardar = null;
function guardar() {
  clearTimeout(tGuardar);
  tGuardar = setTimeout(() => {
    try { localStorage.setItem(CLAVE, JSON.stringify(BD)); marcarGuardado(true); }
    catch (e) { marcarGuardado(false); }
  }, 350);
}
const S = () => BD.lista[BD.actual];

/* ---------- descargas ---------- */
let _descargas;
function capacidadDescargas() {
  if (_descargas === undefined) {
    _descargas = (window.claude && typeof window.claude.use === 'function') ? window.claude.use('downloads').catch(() => null) : Promise.resolve(null);
  }
  return _descargas;
}
async function guardarArchivo(nombre, blob) {
  const dl = await capacidadDescargas();
  if (dl) {
    try { await dl.save({ filename: nombre, data: blob }); aviso(`Listo: ${nombre}`); }
    catch (e) {
      if (e && e.code === 'declined') aviso('Descarga cancelada.');
      else if (e && e.code === 'rate_limited') aviso('Hay otra descarga esperando confirmación.');
      else aviso('No se pudo descargar en esta vista. Abra la herramienta en el navegador.', true);
    }
    return;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = nombre;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  aviso(`Descargado: ${nombre}`);
}
function nombreArchivo(doc) {
  const inst = (S().inst.nombreComercial || S().inst.razonSocial || 'institucion').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w]+/g, '_').replace(/^_|_$/g, '').slice(0, 30);
  const tit = doc.title.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w]+/g, '_').slice(0, 50);
  return `${doc.code}_${tit}_${inst}`;
}

/* ---------- avisos ---------- */
let tAviso;
function aviso(txt, error) {
  const el = document.getElementById('aviso');
  el.textContent = txt; el.classList.toggle('err', !!error); el.hidden = false;
  clearTimeout(tAviso); tAviso = setTimeout(() => { el.hidden = true; }, 3800);
}
function marcarGuardado(ok) {
  const el = document.getElementById('guardado');
  el.textContent = ok ? 'Guardado en este navegador' : 'Sin guardar: el navegador bloquea el almacenamiento. Use «Respaldo».';
  el.classList.toggle('err', !ok);
}

/* ---------- definición de formularios ---------- */
const PROVINCIAS = ['Azuay', 'Bolívar', 'Cañar', 'Carchi', 'Chimborazo', 'Cotopaxi', 'El Oro', 'Esmeraldas', 'Galápagos', 'Guayas', 'Imbabura', 'Loja', 'Los Ríos', 'Manabí', 'Morona Santiago', 'Napo', 'Orellana', 'Pastaza', 'Pichincha', 'Santa Elena', 'Santo Domingo de los Tsáchilas', 'Sucumbíos', 'Tungurahua', 'Zamora Chinchipe'];

const F_INST = [
  { k: 'inst.razonSocial', l: 'Razón social', span: 2 },
  { k: 'inst.nombreComercial', l: 'Nombre comercial / identificación visual', span: 2 },
  { k: 'inst.ruc', l: 'RUC', ph: '13 dígitos' },
  { k: 'inst.sede', l: 'Sede / sucursal', ph: 'Urdesa' },
  { k: 'inst.establecimiento', l: 'N.º de establecimiento (RUC)' },
  { k: 'inst.tipoEstab', l: 'Tipo de establecimiento / estado', ph: 'Oficina / Abierto', span: 2 },
  { k: 'inst.actividad', l: 'Actividad económica (CIIU)', ph: 'Q869021 - Actividades de laboratorios de radiología…', span: 4 },
  { k: 'inst.direccion', l: 'Dirección', span: 2 },
  { k: 'inst.referencia', l: 'Referencia', span: 2 },
  { k: 'inst.provincia', l: 'Provincia', type: 'select', opts: PROVINCIAS },
  { k: 'inst.ciudad', l: 'Cantón / ciudad' },
  { k: 'inst.parroquia', l: 'Parroquia' },
  { k: 'inst.codPostal', l: 'Código postal' },
  { k: 'inst.telefono', l: 'Teléfono' },
  { k: 'inst.correo', l: 'Correo electrónico', span: 2 }
];
const F_LIC = [
  { k: 'inst.licencia', l: 'Licencia institucional (código)', ph: 'MEER N° G - 0000' },
  { k: 'inst.licenciaExp', l: 'Fecha de expedición', type: 'date' },
  { k: 'inst.licenciaCad', l: 'Fecha de expiración', type: 'date' },
  { k: 'inst.kvMax', l: 'kV máximo autorizado' },
  { k: 'inst.maMax', l: 'mA máximo autorizado' }
];
const F_REP = [
  { k: 'inst.repEmpresa', l: 'Representante legal persona jurídica (si aplica)', ph: 'Ej.: MEDICALMANAGEMENT CIA. LTDA.', span: 2, help: 'Déjelo vacío si el representante legal es una persona natural.' },
  { k: 'inst.repLegal', l: 'Nombre del representante', span: 2 },
  { k: 'inst.repCedula', l: 'Cédula / pasaporte' },
  { k: 'inst.repCargo', l: 'Cargo' },
  { k: 'inst.repProfesion', l: 'Profesión' },
  { k: 'inst.repTelefono', l: 'Teléfono' },
  { k: 'inst.repCorreo', l: 'Correo', span: 2 }
];
const F_OSR = [
  { k: 'resp.osrTitulo', l: 'Título abreviado (Biof., Lcdo., Mgs.)' },
  { k: 'resp.osrNombre', l: 'Nombre completo', span: 2 },
  { k: 'resp.osrProfesion', l: 'Profesión', ph: 'Biofísica' },
  { k: 'resp.osrCedula', l: 'Cédula' },
  { k: 'resp.osrLicencia', l: 'Licencia ocupacional N.º' },
  { k: 'resp.osrAut', l: 'Autorización OSR N.º', when: s => s.resp.osrAplica },
  { k: 'resp.osrAutCad', l: 'Caducidad de la autorización', type: 'date', when: s => s.resp.osrAplica },
  { k: 'resp.osrTelefono', l: 'Teléfono' },
  { k: 'resp.osrCorreo', l: 'Correo' }
];
const F_MED = [
  { k: 'resp.medTitulo', l: 'Título (Dr., Dra., Od.)' },
  { k: 'resp.medNombre', l: 'Nombre completo', span: 2 },
  { k: 'resp.medCedula', l: 'Cédula' },
  { k: 'resp.medEspecialidad', l: 'Especialidad o profesión', span: 2 },
  { k: 'resp.medLicencia', l: 'Licencia tipo A N.º' },
  { k: 'resp.medLicCad', l: 'Caducidad de la licencia', type: 'date' }
];
const F_SERV = [
  { k: 'serv.dosEmpresa', l: 'Empresa de dosimetría', span: 2 },
  { k: 'serv.dosLicencia', l: 'Licencia de la empresa' },
  { k: 'serv.dosTipo', l: 'Tipo de dosímetro', type: 'select', opts: ['OSL', 'TLD', 'Película'] },
  { k: 'serv.dosPeriodo', l: 'Periodo de recambio', type: 'select', opts: ['Mensual', 'Bimestral', 'Trimestral'] },
  { k: 'serv.dosInicio', l: 'Inicio del contrato', type: 'date' },
  { k: 'serv.dosVigencia', l: 'Fin del contrato', type: 'date' },
  { k: 'serv.mantEmpresa', l: 'Empresa de mantenimiento', span: 2 },
  { k: 'serv.mantLicencia', l: 'Licencia de la empresa' },
  { k: 'serv.mantVigencia', l: 'Vigencia del contrato', type: 'date' },
  { k: 'serv.labMedico', l: 'Centro de salud ocupacional', span: 2 }
];
const F_META = [
  { k: 'meta.siglas', l: 'Siglas de la institución', ph: 'QCA2', help: 'Se usan en los códigos de documento' },
  { k: 'meta.plantilla', l: 'Plantilla de código', span: 2, help: 'Ej.: BT-POE-QCA2-RM-PR-OSR-2026-01. Use {TIPO}, {SIGLAS}, {PRAC}, {AÑO}, {N}' },
  { k: 'meta.estilo', l: 'Estilo de encabezado', type: 'select', opts: ['ficha', 'control'], help: 'ficha: título y tabla de control al inicio · control: tabla en cada página' },
  { k: 'meta.color', l: 'Color institucional', type: 'color' },
  { k: 'meta.version', l: 'Versión de los documentos' },
  { k: 'meta.fechaEmision', l: 'Fecha de emisión', type: 'date' },
  { k: 'meta.anioPlan', l: 'Año del plan y registros' },
  { k: 'meta.ubicacion', l: 'Ubicación del archivo', span: 2 }
];
const F_OFICIO = [
  { k: 'oficio.autoridad', l: 'Autoridad reguladora', span: 2 },
  { k: 'oficio.direccionMEM', l: 'Dirección a la que se responde', span: 2 },
  { k: 'oficio.numero', l: 'Oficio del MEM N.º', ph: 'MEM-DLPR-2025-0000-OF', span: 2 },
  { k: 'oficio.fecha', l: 'Fecha del oficio', type: 'date' },
  { k: 'oficio.tramite', l: 'Trámite N.º' },
  { k: 'oficio.tecnicoTitulo', l: 'Título del técnico', ph: 'Especialista / Magíster' },
  { k: 'oficio.tecnicoNombre', l: 'Nombre del técnico', span: 2 },
  { k: 'oficio.tecnicoCargo', l: 'Cargo del técnico', span: 2 },
  { k: 'oficio.numResp', l: 'N.º del oficio de respuesta', ph: 'SIGLAS-SR-2025-001', span: 2 }
];
const F_INFORME = [
  { k: 'oficio.informeNum', l: 'Informe / oficio N.º', span: 2 },
  { k: 'oficio.informeFecha', l: 'Fecha del informe', type: 'date' },
  { k: 'oficio.plazo', l: 'Plazo (días hábiles)' },
  { k: 'oficio.numDisp', l: 'N.º del oficio de cumplimiento', span: 2 },
  { k: 'oficio.numBaja', l: 'N.º del oficio de destino de equipos', span: 2 }
];

const ESTADOS_EQ = ['Funcionando', 'Fuera de servicio', 'En reparación', 'Dado de baja', 'Vendido', 'Donado', 'Trasladado'];

const CAT_OPTS = CATEGORIAS_POE.map(x => x.t);
function colsPOE() {
  return [
    { k: 'apellidos', l: 'Apellidos', w: 150 },
    { k: 'nombres', l: 'Nombres', w: 140 },
    { k: 'cedula', l: 'Cédula', w: 110 },
    { k: 'categoria', l: 'Categoría', type: 'select', opts: CAT_OPTS, map: CATEGORIA_POR_NOMBRE, w: 230 },
    { k: 'profesion', l: 'Profesión', w: 180 },
    { k: 'cargo', l: 'Cargo', w: 150 },
    { k: 'campo', l: 'Campo de aplicación', w: 180 },
    { k: 'licencia', l: 'Licencia N.º', w: 110, ph: 'Cédula' },
    { k: 'codigo', l: 'Código (Q-, LOA, G-)', w: 110 },
    { k: 'ren', l: 'Ren.', w: 55 },
    { k: 'act', l: 'Act.', w: 55 },
    { k: 'expedicion', l: 'Expedición', type: 'date', w: 140 },
    { k: 'licCad', l: 'Expira', type: 'date', w: 140 },
    { k: 'observacion', l: 'Observación / trámite', type: 'textarea', w: 240 }
  ];
}
function colsPOEDos() {
  return [
    { k: 'apellidos', l: 'Apellidos', w: 150, ro: true },
    { k: 'certMed', l: 'Certificado médico', type: 'date', w: 140 },
    { k: 'dosimetro', l: 'Código del dosímetro', w: 120 },
    { k: 'area', l: 'Área (código)', w: 90, ph: DOS_AREA[S().practica] },
    { k: 'tipoDos', l: 'Tipo de dosímetro (código)', w: 110, ph: DOS_TIPO },
    { k: 'cargoDos', l: 'Cargo (código)', w: 90, ph: '10 / 15 / 1' }
  ];
}
function colsPOEDocs() {
  return [{ k: 'apellidos', l: 'Apellidos', w: 150, ro: true }, ...DOCS_POE.map(d => ({ k: 'docs.' + d.k, l: d.t, type: 'select', opts: VALORES_DOC_POE, w: 95 }))];
}
function colsEquipos() {
  const P = PRACTICAS[S().practica];
  return [
    { k: 'tipo', l: 'Tipo', type: 'select', opts: P.tiposEquipo, w: 190 },
    { k: 'marca', l: 'Marca equipo', w: 120 },
    { k: 'modelo', l: 'Modelo equipo', w: 120 },
    { k: 'serie', l: 'Serie equipo', w: 110 },
    { k: 'tuboMarca', l: 'Marca tubo', w: 110 },
    { k: 'tuboModelo', l: 'Modelo tubo (insert)', w: 140 },
    { k: 'tuboSerie', l: 'Serie tubo (insert)', w: 120 },
    { k: 'anio', l: 'Año fab. equipo', w: 90 },
    { k: 'anioTubo', l: 'Año fab. tubo', w: 90 },
    { k: 'anioInst', l: 'Año instalación', w: 90 },
    { k: 'enLicencia', l: 'En la licencia', type: 'select', opts: ['Sí', 'No'], w: 90 },
    { k: 'sala', l: 'Ubicación', w: 120 },
    { k: 'uso', l: 'Uso', type: 'select', opts: P.usos, w: 160 },
    { k: 'estado', l: 'Estado', type: 'select', opts: ESTADOS_EQ, w: 140 },
    { k: 'mantFecha', l: 'Último mant. / CC', type: 'date', w: 140 },
    { k: 'destinoFecha', l: 'Fecha de destino final', type: 'date', w: 140, when: r => /baja|Vendido|Donado|Trasladado/.test(r.estado || '') },
    { k: 'destinoDoc', l: 'Respaldo del destino', w: 180, when: r => /baja|Vendido|Donado|Trasladado/.test(r.estado || '') }
  ];
}
function colsEpp() {
  const P = PRACTICAS[S().practica];
  return [
    { k: 'codigo', l: 'Código', w: 80 },
    { k: 'tipo', l: 'Tipo', type: 'select', opts: P.tiposEpp, w: 210 },
    { k: 'espesor', l: 'mm Pb', w: 70 },
    { k: 'marca', l: 'Marca', w: 110 },
    { k: 'talla', l: 'Talla', w: 60 },
    { k: 'sala', l: 'Sala', w: 110 },
    { k: 'estado', l: 'Estado', type: 'select', opts: ['Bueno', 'Regular', 'Malo'], w: 100 },
    { k: 'fechaPrueba', l: 'Última prueba', type: 'date', w: 140 },
    { k: 'kv', l: 'kV', w: 60 },
    { k: 'mas', l: 'mAs', w: 60 },
    { k: 'defectos', l: 'Defectos encontrados', w: 200 },
    { k: 'resultado', l: 'Resultado', type: 'select', opts: ['Apta', 'No apta'], w: 100 }
  ];
}
const COLS_DISP = [
  { k: 'nc', l: 'No conformidad (copie del informe)', type: 'textarea', w: 320 },
  { k: 'accion', l: 'Acción ejecutada', type: 'textarea', w: 320 },
  { k: 'anexo', l: 'Anexo', w: 110 }
];

/* ---------- utilidades de formulario ---------- */
function getPath(o, path) { return path.split('.').reduce((a, k) => (a == null ? a : a[k]), o); }
function setPath(o, path, v) { const ks = path.split('.'); const last = ks.pop(); ks.reduce((a, k) => a[k], o)[last] = v; }

function campo(f) {
  const s = S();
  if (f.when && !f.when(s)) return '';
  const v = getPath(s, f.k) ?? '';
  const id = 'f-' + f.k.replace('.', '-');
  let ctl;
  if (f.type === 'select') {
    const opts = f.opts.includes(v) || !v ? f.opts : [v, ...f.opts];
    ctl = `<select id="${id}" data-k="${f.k}"><option value="">Seleccione…</option>${opts.map(o => `<option ${o === v ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
  } else if (f.type === 'textarea') {
    ctl = `<textarea id="${id}" data-k="${f.k}" rows="3">${esc(v)}</textarea>`;
  } else {
    ctl = `<input id="${id}" data-k="${f.k}" type="${f.type || 'text'}" value="${esc(v)}" ${f.ph ? `placeholder="${esc(f.ph)}"` : ''} autocomplete="off"${f.type === 'color' ? ' class="color"' : ''}>`;
  }
  return `<label class="campo ${f.span ? 'span' + f.span : ''}" for="${id}"><span>${esc(f.l)}</span>${ctl}${f.help ? `<small>${esc(f.help)}</small>` : ''}</label>`;
}
const grupoCampos = (lista) => `<div class="campos">${lista.map(campo).join('')}</div>`;

function tablaEditable(nombre, cols, filas, textoAgregar) {
  const s = S();
  const head = cols.map(c => `<th style="min-width:${c.w || 120}px">${esc(c.l)}</th>`).join('');
  const cuerpo = filas.map((r, i) => `<tr>${cols.map(c => {
    if (c.when && !c.when(r)) return '<td class="vacio">—</td>';
    let v = getPath(r, c.k) ?? '';
    if (c.map) v = (CATEGORIAS_POE.find(x => x.id === v) || {}).t || v;
    if (c.ro) return `<td class="ro">${esc([v, c.k === 'apellidos' ? r.nombres : ''].filter(Boolean).join(' ')) || '—'}</td>`;
    const a = `data-t="${nombre}" data-i="${i}" data-c="${c.k}" aria-label="${esc(c.l)} fila ${i + 1}"`;
    if (c.type === 'select') {
      const opts = c.opts.includes(v) || !v ? c.opts : [v, ...c.opts];
      return `<td><select ${a}><option value=""></option>${opts.map(o => `<option ${o === v ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select></td>`;
    }
    if (c.type === 'textarea') return `<td><textarea ${a} rows="2">${esc(v)}</textarea></td>`;
    return `<td><input ${a} type="${c.type || 'text'}" value="${esc(v)}"${c.ph ? ` placeholder="${esc(c.ph)}"` : ''}></td>`;
  }).join('')}<td class="acc"><button class="icono" data-del="${nombre}" data-i="${i}" title="Eliminar fila" aria-label="Eliminar fila ${i + 1}">✕</button></td></tr>`).join('');
  return `<div class="tabla-ed"><table><thead><tr>${head}<th class="acc"></th></tr></thead><tbody>${cuerpo || `<tr><td colspan="${cols.length + 1}" class="sin-filas">Todavía no hay filas.</td></tr>`}</tbody></table></div>
    <button class="btn sec" data-add="${nombre}">+ ${esc(textoAgregar)}</button>`;
}

function imagenCampo(clave, titulo, ayuda) {
  const img = S().inst[clave];
  return `<div class="img-campo">
    <div class="img-prev">${img ? `<img src="${img.data}" alt="${esc(titulo)}">` : `<span>Sin ${esc(titulo.toLowerCase())}</span>`}</div>
    <div class="img-acc"><b>${esc(titulo)}</b><small>${esc(ayuda)}</small>
      <label class="btn sec"><input type="file" accept="image/png,image/jpeg,image/webp" data-img="${clave}" hidden>Subir imagen</label>
      ${img ? `<button class="btn link" data-img-quitar="${clave}">Quitar</button>` : ''}</div></div>`;
}

/* ---------- secciones ---------- */
const SECCIONES = [
  { id: 'institucion', t: 'Institución' },
  { id: 'responsables', t: 'Responsables y servicios' },
  { id: 'poe', t: 'Personal expuesto' },
  { id: 'equipos', t: 'Equipos' },
  { id: 'prendas', t: 'Prendas de protección' },
  { id: 'oficio', t: 'Oficio del MEM' },
  { id: 'verificacion', t: 'Lista de verificación' },
  { id: 'documentos', t: 'Documentos' }
];
let seccion = 'documentos';
let subPOE = 'datos';
let docActivo = 'OF-RESP';
let seleccion = null;

function contadores() {
  const s = S();
  return {
    poe: s.poe.length, equipos: s.equipos.length, prendas: s.epp.length,
    oficio: s.disp.filter(d => d.nc).length || '',
    documentos: DOCS.filter(d => d.aplica(crearContexto(s))).length
  };
}

function renderNav() {
  const cnt = contadores();
  document.getElementById('nav').innerHTML = SECCIONES.map((x, i) => `<button class="nav-it ${seccion === x.id ? 'on' : ''}" data-sec="${x.id}" aria-current="${seccion === x.id ? 'page' : 'false'}"><span class="nav-n">${i + 1}</span><span class="nav-t">${x.t}</span>${cnt[x.id] !== undefined && cnt[x.id] !== '' ? `<span class="nav-c">${cnt[x.id]}</span>` : ''}</button>`).join('');
}

function renderPracticas() {
  const s = S();
  document.getElementById('practicas').innerHTML = Object.values(PRACTICAS).map(p => `<button class="pr ${s.practica === p.id ? 'on' : ''}" data-practica="${p.id}" aria-pressed="${s.practica === p.id}">${p.nombre}</button>`).join('');
}

function renderExpedientes() {
  const sel = document.getElementById('expediente');
  sel.innerHTML = Object.values(BD.lista).map(x => `<option value="${x.id}" ${x.id === BD.actual ? 'selected' : ''}>${esc((x.inst.nombreComercial || x.inst.razonSocial || 'Expediente sin nombre') + (x.inst.sede ? ' (' + x.inst.sede + ')' : '') + ' · ' + PRACTICAS[x.practica].nombre)}</option>`).join('');
  document.getElementById('banner-ejemplo').hidden = !S().ejemplo;
}

function renderSeccion() {
  const s = S();
  const el = document.getElementById('contenido');
  const P = PRACTICAS[s.practica];
  let h = '';
  switch (seccion) {
    case 'institucion':
      h = `<h2>Institución</h2><p class="lead">Estos datos aparecen en encabezados, oficios, declaraciones y bitácoras. Tómelos del RUC y de la licencia institucional.</p>
        ${grupoCampos(F_INST)}
        <h3>Representante legal / licenciatario</h3>${grupoCampos(F_REP)}
        <h3>Licencia institucional (tipo C)</h3>${grupoCampos(F_LIC)}
        <h3>Logo y sello</h3><p class="lead">El logo va en el encabezado de cada documento. El sello se coloca junto a la firma del representante legal. Use PNG con fondo transparente para mejor resultado.</p>
        <div class="imgs">${imagenCampo('logo', 'Logo', 'PNG o JPG, horizontal de preferencia')}${imagenCampo('sello', 'Sello', 'PNG con fondo transparente')}</div>`;
      break;
    case 'responsables': {
      const c = crearContexto(s);
      const sugiere = c.eqAct.length >= 4 && c.eqAct.some(e => TIPOS_OSR.test(e.tipo || ''));
      h = `<h2>Responsables y servicios</h2>
        <h3>${s.resp.osrAplica ? 'Oficial de Seguridad Radiológica' : 'Responsable de protección radiológica'}</h3>
        <label class="interruptor"><input type="checkbox" id="osrAplica" ${s.resp.osrAplica ? 'checked' : ''}><span>La instalación cuenta con OSR autorizado</span></label>
        <p class="lead">${sugiere ? '<b class="alerta-txt">Con sus equipos actuales la Norma exige OSR</b> (4 o más equipos con angiógrafo, tomógrafo, arco en C, litotriptor o telecomandado).' : 'Obligatorio cuando hay 4 o más equipos y entre ellos un angiógrafo, tomógrafo, arco en C, litotriptor o telecomandado. Si no aplica, registre a la persona responsable de la instalación.'}</p>
        ${grupoCampos(F_OSR)}
        <div class="perfil"><button class="btn sec" id="btn-perfil-guardar">Guardar como mi perfil de OSR</button>${BD.perfil ? `<button class="btn link" id="btn-perfil-usar">Usar mi perfil (${esc(BD.perfil.osrNombre || '')})</button>` : ''}<small>Su perfil se copia automáticamente en cada expediente nuevo.</small></div>
        <h3>${esc(P.tituloResp)}</h3>${grupoCampos(F_MED)}
        <h3>Servicios contratados</h3>${grupoCampos(F_SERV)}
        <h3>Codificación de documentos</h3>${grupoCampos(F_META)}`;
      break;
    }
    case 'poe':
      h = `<h2>Personal ocupacionalmente expuesto</h2><p class="lead">Con estos datos se arman la bitácora de POE, el check list de documentos, el recambio de dosímetros y los registros de licencias, dosimetría, controles médicos y capacitación. La licencia N.º es la cédula; el código es el que asigna la Autoridad (Q-, LOA, G-).</p>
        <div class="subtabs" role="tablist">${[['datos', 'Datos y licencia'], ['dos', 'Dosimetría y salud'], ['docs', 'Check list de documentos']].map(([k, t]) => `<button role="tab" class="subtab ${subPOE === k ? 'on' : ''}" data-sub="${k}" aria-selected="${subPOE === k}">${t}</button>`).join('')}</div>
        ${tablaEditable('poe', subPOE === 'dos' ? colsPOEDos() : subPOE === 'docs' ? colsPOEDocs() : colsPOE(), s.poe, 'Agregar persona')}
        ${subPOE === 'docs' ? '<p class="lead">X = sí posee · N/A = no aplica · No posee / Falta se marcan en naranja en el check list.</p>' : ''}${subPOE === 'dos' ? '<p class="lead">Los códigos de área, tipo de dosímetro y cargo son los del catálogo de su servicio de dosimetría. Si los deja vacíos se usan los de sus formatos: área 6 (médico) u 8 (odontológico), tipo 7, cargo 10 médico, 15 tecnólogo, 1 OSR, 12 odontólogo.</p>' : ''}`;
      break;
    case 'equipos':
      h = `<h2>Equipos generadores de radiación ionizante</h2><p class="lead">Copie los datos de las placas del equipo y del tubo. Escriba NR cuando la placa no registre el dato. Los equipos marcados como dados de baja, vendidos o trasladados generan el oficio de destino final.</p>
        ${tablaEditable('equipos', colsEquipos(), s.equipos, 'Agregar equipo')}
        <p class="lead">Los procedimientos técnicos se arman según los tipos de equipo registrados. Tipos disponibles para ${esc(P.corto)}: ${esc(P.tiposEquipo.join(', '))}.</p>`;
      break;
    case 'prendas':
      h = `<h2>Prendas y elementos de protección</h2><p class="lead">Se usan para el inventario y para el informe de integridad del blindaje. Mínimo exigido: dos prendas de cada tipo por sala; delantal frontal de 0,5 a 0,7 mm Pb y collarín de 0,5 mm Pb.</p>
        ${tablaEditable('epp', colsEpp(), s.epp, 'Agregar prenda')}
        <h3>Datos de la prueba de integridad</h3>
        ${grupoCampos([{ k: 'serv.eqPrueba', l: 'Equipo usado para la prueba', span: 2, type: 'select', opts: crearContexto(s).eqAct.map(e => `${e.tipo}, serie ${e.serie || 'NR'}`) }, { k: 'serv.modoPrueba', l: 'Modalidad', type: 'select', opts: ['Radiografía', 'Fluoroscopia'] }, { k: 'serv.fechaPruebaEpp', l: 'Fecha de la evaluación', type: 'date' }])}`;
      break;
    case 'oficio':
      h = `<h2>Oficio del Ministerio de Energía y Minas</h2><p class="lead">Datos del oficio de notificación y solicitud de requisitos que recibió la institución.</p>
        ${grupoCampos(F_OFICIO)}
        <h3>Informe de inspección con disposiciones</h3><p class="lead">Si ya recibió un informe con no conformidades, regístrelas aquí para generar el oficio de cumplimiento.</p>
        ${grupoCampos(F_INFORME)}
        ${tablaEditable('disp', COLS_DISP, s.disp, 'Agregar no conformidad')}`;
      break;
    case 'verificacion': {
      const c = crearContexto(s);
      const fila = r => {
        const est = estadoReq(c, r);
        const genera = (r.doc || []).filter(id => { const d = DOCS.find(x => x.id === id); return d && d.aplica(c); });
        return `<tr class="est-${est.replace(/\s/g, '')}"><td class="mono">${r.id}</td><td>${esc(r.txt)}${genera.length ? `<div class="gen">${genera.map(id => `<button class="chip" data-ir="${id}">${esc(codigoDoc(c, id))}</button>`).join('')}</div>` : ''}${r.ext ? '<div class="ext">Documento de la institución</div>' : ''}</td>
          <td><select data-chk="${r.id}" aria-label="Estado ${r.id}">${ESTADOS_REQ.map(e => `<option ${e === est ? 'selected' : ''}>${e}</option>`).join('')}</select></td>
          <td><input data-obs="${r.id}" value="${esc((s.check[r.id] || {}).obs || '')}" placeholder="Observación" aria-label="Observación ${r.id}"></td></tr>`;
      };
      const pend = REQUISITOS.filter(r => estadoReq(c, r) === 'Pendiente').length;
      h = `<h2>Lista de verificación de requisitos</h2><p class="lead">Los 33 requisitos documentales y los 9 de evidencia fotográfica del oficio. El estado que marque aquí aparece en el oficio de entrega. ${pend ? `<b class="alerta-txt">${pend} pendientes.</b>` : 'Todo marcado.'}</p>
        <div class="tabla-ed verif"><table><thead><tr><th>N.º</th><th>Requisito</th><th style="min-width:130px">Estado</th><th style="min-width:200px">Observación</th></tr></thead><tbody>
        <tr class="sub"><td colspan="4">I. Requisitos documentales</td></tr>${REQUISITOS.filter(r => r.id.startsWith('I-')).map(fila).join('')}
        <tr class="sub"><td colspan="4">II. Evidencias</td></tr>${REQUISITOS.filter(r => r.id.startsWith('II-')).map(fila).join('')}
        </tbody></table></div>`;
      break;
    }
    case 'documentos':
      h = renderDocumentos();
      break;
  }
  el.innerHTML = h;
  if (seccion === 'documentos') pintarVista();
}

function renderDocumentos() {
  const s = S();
  const c = crearContexto(s);
  const aplican = DOCS.filter(d => d.aplica(c));
  if (!aplican.find(d => d.id === docActivo)) docActivo = aplican[0].id;
  if (!seleccion) seleccion = new Set(aplican.map(d => d.id));
  const alertas = revisarExpediente(c);
  const orden = { alta: 0, media: 1, baja: 2 };
  alertas.sort((a, b) => orden[a.nivel] - orden[b.nivel]);
  const lista = GRUPOS.map(g => {
    const ds = aplican.filter(d => d.grupo === g);
    if (!ds.length) return '';
    return `<div class="grupo"><div class="grupo-t">${g}</div>${ds.map(d => {
      const r = d.build(c);
      return `<div class="doc-it ${d.id === docActivo ? 'on' : ''}"><input type="checkbox" id="sel-${d.id}" data-sel="${d.id}" ${seleccion.has(d.id) ? 'checked' : ''} aria-label="Incluir ${esc(r.title)}"><button data-doc="${d.id}"><span class="mono">${esc(r.code)}</span><span>${esc(r.title)}</span><small>${esc(d.nota)}</small></button></div>`;
    }).join('')}</div>`;
  }).join('');
  return `<div class="docs-top"><div><h2>Documentos de ${esc(PRACTICAS[s.practica].corto)}</h2><p class="lead">${aplican.length} documentos para esta práctica. Revise la vista previa y descargue en el formato que necesite.</p></div></div>
    ${alertas.length ? `<details class="revision" ${alertas.some(a => a.nivel === 'alta') ? 'open' : ''}><summary><span class="sem sem-${alertas[0].nivel}"></span>Revisión antes de enviar: ${alertas.length} ${alertas.length === 1 ? 'observación' : 'observaciones'}</summary><ul>${alertas.map(a => `<li><span class="sem sem-${a.nivel}"></span>${esc(a.txt)}</li>`).join('')}</ul></details>` : '<div class="revision ok"><span class="sem sem-ok"></span>Sin observaciones en los datos registrados.</div>'}
    <div class="lote">
      <span class="lote-t">${seleccion.size} seleccionados</span>
      <label><input type="checkbox" id="z-docx" checked> Word</label>
      <label><input type="checkbox" id="z-pdf" checked> PDF</label>
      <label><input type="checkbox" id="z-xlsx" checked> Excel</label>
      <button class="btn" id="btn-zip">Descargar seleccionados (.zip)</button>
      <button class="btn sec" id="btn-libro">Libro de registros (.xlsx)</button>
      <button class="btn link" id="btn-todos">${seleccion.size === aplican.length ? 'Quitar todos' : 'Marcar todos'}</button>
    </div>
    <div class="docs">
      <nav class="doc-lista" aria-label="Documentos">${lista}</nav>
      <section class="vista" aria-label="Vista previa">
        <div class="vista-bar"><b id="vista-t"></b><div class="vista-acc"><button class="btn" data-exp="docx">Word</button><button class="btn" data-exp="pdf">PDF</button><button class="btn" data-exp="xlsx">Excel</button></div></div>
        <div class="vista-papel" id="vista"></div>
      </section>
    </div>`;
}

function pintarVista() {
  const c = crearContexto(S());
  const d = DOCS.find(x => x.id === docActivo);
  const r = d.build(c);
  document.getElementById('vista-t').textContent = `${r.code} · ${r.title}`;
  document.getElementById('vista').innerHTML = renderHTML(r, c);
}

function render() {
  renderExpedientes();
  renderPracticas();
  renderNav();
  renderSeccion();
}

/* ---------- exportación ---------- */
function libsListas() {
  const falta = [];
  if (!window.docx) falta.push('Word');
  if (!window.jspdf || !window.jspdf.jsPDF || !window.jspdf.jsPDF.API.autoTable) falta.push('PDF');
  if (!window.ExcelJS) falta.push('Excel');
  if (!window.JSZip) falta.push('ZIP');
  return falta;
}

async function exportarUno(formato) {
  const falta = libsListas();
  const c = crearContexto(S());
  const r = DOCS.find(x => x.id === docActivo).build(c);
  try {
    ocupado(true);
    if (formato === 'docx') { if (falta.includes('Word')) throw new Error('lib'); await guardarArchivo(nombreArchivo(r) + '.docx', await buildDocx(r, c)); }
    if (formato === 'pdf') { if (falta.includes('PDF')) throw new Error('lib'); await guardarArchivo(nombreArchivo(r) + '.pdf', buildPDF(r, c)); }
    if (formato === 'xlsx') { if (falta.includes('Excel')) throw new Error('lib'); await guardarArchivo(nombreArchivo(r) + '.xlsx', await buildXLSX([r], c)); }
  } catch (e) {
    console.error(e);
    aviso(e.message === 'lib' ? 'No cargaron las librerías de exportación. Revise su conexión a internet y recargue la página.' : 'No se pudo generar el archivo: ' + e.message, true);
  } finally { ocupado(false); }
}

async function exportarLote() {
  const falta = libsListas();
  if (falta.length) { aviso('No cargaron las librerías de exportación. Revise su conexión y recargue.', true); return; }
  const fx = { docx: document.getElementById('z-docx').checked, pdf: document.getElementById('z-pdf').checked, xlsx: document.getElementById('z-xlsx').checked };
  if (!fx.docx && !fx.pdf && !fx.xlsx) { aviso('Marque al menos un formato.', true); return; }
  const c = crearContexto(S());
  const docs = DOCS.filter(d => d.aplica(c) && seleccion.has(d.id)).map(d => d.build(c));
  if (!docs.length) { aviso('No hay documentos seleccionados.', true); return; }
  try {
    ocupado(true);
    const zip = new JSZip();
    const carpeta = (n) => zip.folder(n);
    for (const r of docs) {
      const n = nombreArchivo(r);
      if (fx.docx) carpeta('Word').file(n + '.docx', await buildDocx(r, c));
      if (fx.pdf) carpeta('PDF').file(n + '.pdf', buildPDF(r, c));
    }
    if (fx.xlsx) zip.file(`Expediente_${c.pref}_${c.P.id}.xlsx`, await buildXLSX(docs, c));
    const blob = await zip.generateAsync({ type: 'blob' });
    const inst = nombreArchivo({ code: c.pref, title: c.P.nombre });
    await guardarArchivo(`Expediente_${inst}.zip`, blob);
  } catch (e) {
    console.error(e); aviso('No se pudo generar el paquete: ' + e.message, true);
  } finally { ocupado(false); }
}

async function exportarLibro() {
  if (!window.ExcelJS) { aviso('No cargó la librería de Excel. Revise su conexión y recargue.', true); return; }
  const c = crearContexto(S());
  const docs = DOCS.filter(d => d.aplica(c) && (d.grupo === 'Registros' || ['NOM-POE', 'LIST-EQ', 'MATRIZ', 'LISTA-M'].includes(d.id))).map(d => d.build(c));
  try { ocupado(true); await guardarArchivo(`Registros_${nombreArchivo({ code: c.pref, title: c.P.nombre })}.xlsx`, await buildXLSX(docs, c)); }
  catch (e) { console.error(e); aviso('No se pudo generar el libro: ' + e.message, true); }
  finally { ocupado(false); }
}

function ocupado(si) { document.body.classList.toggle('ocupado', si); }

/* ---------- imágenes ---------- */
function leerImagen(file) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => {
      const im = new Image();
      im.onload = () => {
        const max = 700, r = Math.min(1, max / Math.max(im.width, im.height));
        const cv = document.createElement('canvas');
        cv.width = Math.round(im.width * r); cv.height = Math.round(im.height * r);
        cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
        res({ data: cv.toDataURL('image/png'), w: cv.width, h: cv.height });
      };
      im.onerror = () => rej(new Error('No se pudo leer la imagen.'));
      im.src = fr.result;
    };
    fr.onerror = () => rej(new Error('No se pudo leer el archivo.'));
    fr.readAsDataURL(file);
  });
}

/* ---------- eventos ---------- */
function filaVacia(t) {
  if (t === 'poe') return { apellidos: '', nombres: '', cedula: '', categoria: 'tecnologo', profesion: '', cargo: '', campo: PRACTICAS[S().practica].nombre, licencia: '', codigo: '', ren: '0', act: '0', expedicion: '', licCad: '', observacion: '', certMed: '', dosimetro: '', docs: {} };
  if (t === 'equipos') return { tipo: '', marca: '', modelo: '', serie: '', tuboMarca: '', tuboModelo: '', tuboSerie: '', anio: '', anioTubo: '', anioInst: '', enLicencia: 'Sí', sala: '', uso: '', estado: 'Funcionando', mantFecha: '' };
  if (t === 'epp') { const n = S().epp.length + 1; return { codigo: 'PP-' + String(n).padStart(2, '0'), tipo: '', espesor: '0,5', marca: '', talla: '', sala: '', estado: 'Bueno', fechaPrueba: '', kv: '', mas: '', defectos: 'Ninguno', resultado: 'Apta' }; }
  return { nc: '', accion: '', anexo: '' };
}

function quitarEjemplo() {
  const s = S();
  if (s.ejemplo) { s.ejemplo = false; document.getElementById('banner-ejemplo').hidden = true; }
}

function alCambiar(e) {
  const t = e.target;
  const s = S();
  if (t.dataset.k) {
    setPath(s, t.dataset.k, t.value); quitarEjemplo(); guardar();
    if (/razonSocial|nombreComercial/.test(t.dataset.k)) renderExpedientes();
    return;
  }
  if (t.dataset.t) {
    const fila = s[t.dataset.t][+t.dataset.i];
    if (t.dataset.c.startsWith('docs.') && !fila.docs) fila.docs = {};
    const col = t.dataset.c === 'categoria' ? CATEGORIA_POR_NOMBRE[t.value] || t.value : t.value;
    setPath(fila, t.dataset.c, col); quitarEjemplo(); guardar();
    if (e.type === 'change' && t.tagName === 'SELECT') { renderNav(); if (t.dataset.c === 'estado') renderSeccion(); }
    return;
  }
  if (t.dataset.chk) { s.check[t.dataset.chk] = Object.assign({}, s.check[t.dataset.chk], { estado: t.value }); guardar(); if (e.type === 'change') renderSeccion(); return; }
  if (t.dataset.obs) { s.check[t.dataset.obs] = Object.assign({}, s.check[t.dataset.obs], { obs: t.value }); guardar(); return; }
  if (t.id === 'osrAplica') { s.resp.osrAplica = t.checked; seleccion = null; guardar(); renderNav(); renderSeccion(); return; }
  if (t.dataset.sel) { if (t.checked) seleccion.add(t.dataset.sel); else seleccion.delete(t.dataset.sel); document.querySelector('.lote-t').textContent = `${seleccion.size} seleccionados`; return; }
}

async function alClic(e) {
  const b = e.target.closest('button, [data-img]');
  if (!b) return;
  const s = S();
  if (b.dataset.sub) { subPOE = b.dataset.sub; renderSeccion(); return; }
  if (b.dataset.importar !== undefined) { ejecutarImportacion(); return; }
  if (b.dataset.sec) { seccion = b.dataset.sec; renderNav(); renderSeccion(); document.getElementById('contenido').focus({ preventScroll: true }); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
  if (b.dataset.practica) {
    if (s.practica === b.dataset.practica) return;
    s.practica = b.dataset.practica; seleccion = null;
    if (b.dataset.practica === 'intervencionista') s.resp.osrAplica = true;
    guardar(); render(); aviso(`Práctica cambiada a ${PRACTICAS[s.practica].nombre}. Revise que los tipos de equipo y prendas correspondan.`); return;
  }
  if (b.dataset.add) { s[b.dataset.add].push(filaVacia(b.dataset.add)); quitarEjemplo(); guardar(); renderSeccion(); renderNav(); const ult = document.querySelector(`[data-t="${b.dataset.add}"][data-i="${s[b.dataset.add].length - 1}"]`); if (ult) ult.focus(); return; }
  if (b.dataset.del) { s[b.dataset.del].splice(+b.dataset.i, 1); guardar(); renderSeccion(); renderNav(); return; }
  if (b.dataset.doc) { docActivo = b.dataset.doc; document.querySelectorAll('.doc-it').forEach(x => x.classList.toggle('on', x.querySelector('[data-doc]').dataset.doc === docActivo)); pintarVista(); if (window.innerWidth < 900) document.querySelector('.vista').scrollIntoView({ behavior: 'smooth' }); return; }
  if (b.dataset.ir) { docActivo = b.dataset.ir; seccion = 'documentos'; renderNav(); renderSeccion(); return; }
  if (b.dataset.exp) { exportarUno(b.dataset.exp); return; }
  if (b.dataset.imgQuitar) { s.inst[b.dataset.imgQuitar] = null; guardar(); renderSeccion(); return; }
  switch (b.id) {
    case 'btn-zip': exportarLote(); break;
    case 'btn-libro': exportarLibro(); break;
    case 'btn-todos': {
      const c = crearContexto(s); const ap = DOCS.filter(d => d.aplica(c));
      seleccion = seleccion.size === ap.length ? new Set() : new Set(ap.map(d => d.id)); renderSeccion(); break;
    }
    case 'btn-nuevo': {
      const n = estadoVacio(s.practica); BD.lista[n.id] = n; BD.actual = n.id; seleccion = null; seccion = 'institucion'; guardar(); render(); aviso('Expediente nuevo creado.'); break;
    }
    case 'btn-duplicar': {
      const n = JSON.parse(JSON.stringify(s)); n.id = 'exp' + Date.now().toString(36); n.ejemplo = false; n.check = {};
      const otras = Object.keys(PRACTICAS).filter(p => p !== s.practica); n.practica = otras[0];
      BD.lista[n.id] = n; BD.actual = n.id; seleccion = null; guardar(); render();
      aviso(`Copia creada para ${PRACTICAS[n.practica].nombre}. Cambie la práctica arriba si necesita otra.`); break;
    }
    case 'btn-perfil-guardar': {
      BD.perfil = {}; ['osrTitulo', 'osrNombre', 'osrProfesion', 'osrCedula', 'osrLicencia', 'osrAut', 'osrAutCad', 'osrTelefono', 'osrCorreo'].forEach(k => { BD.perfil[k] = s.resp[k]; });
      guardar(); renderSeccion(); aviso('Perfil de OSR guardado. Se usará en los expedientes nuevos.'); break;
    }
    case 'btn-perfil-usar': Object.assign(s.resp, BD.perfil, { osrAplica: true }); guardar(); renderSeccion(); aviso('Datos del perfil copiados.'); break;
    case 'btn-import-cerrar': document.getElementById('panel-import').hidden = true; IMPORT = null; break;
    case 'btn-borrar': document.getElementById('confirmar').hidden = false; break;
    case 'btn-borrar-no': document.getElementById('confirmar').hidden = true; break;
    case 'btn-borrar-si': {
      delete BD.lista[BD.actual];
      if (!Object.keys(BD.lista).length) { const n = estadoVacio('medico'); BD.lista[n.id] = n; }
      BD.actual = Object.keys(BD.lista)[0]; seleccion = null;
      document.getElementById('confirmar').hidden = true; guardar(); render(); aviso('Expediente eliminado.'); break;
    }
    case 'btn-respaldo': {
      const nombre = `Respaldo_${nombreArchivo({ code: 'expediente', title: PRACTICAS[s.practica].nombre })}.json`;
      guardarArchivo(nombre, new Blob([JSON.stringify(s, null, 1)], { type: 'application/json' })); break;
    }
  }
}

async function alArchivo(e) {
  const t = e.target;
  if (t.dataset.img && t.files[0]) {
    try { S().inst[t.dataset.img] = await leerImagen(t.files[0]); quitarEjemplo(); guardar(); renderSeccion(); aviso('Imagen cargada.'); }
    catch (err) { aviso(err.message, true); }
    return;
  }
  if (t.id === 'importar-xlsx' && t.files.length) {
    if (!window.ExcelJS) { aviso('No cargó la librería de Excel. Revise su conexión y recargue.', true); return; }
    try {
      ocupado(true);
      let bloques = [];
      for (const f of t.files) bloques = bloques.concat(await analizarLibro(await f.arrayBuffer(), f.name));
      if (!bloques.length) throw new Error('No se reconoció ninguna bitácora. Se buscan hojas con los títulos BITÁCORA DE EQUIPOS, LICENCIA INSTITUCIONAL, BITÁCORA DE POE o RECAMBIO DE DOSÍMETROS PERSONALES.');
      IMPORT = agruparBloques(bloques);
      mostrarImportacion();
    } catch (err) { console.error(err); aviso(err.message.startsWith('No se') ? err.message : 'No se pudo leer el archivo de Excel: ' + err.message, true); }
    finally { ocupado(false); t.value = ''; }
    return;
  }
  if (t.id === 'restaurar' && t.files[0]) {
    try {
      const txt = await t.files[0].text();
      const n = JSON.parse(txt);
      if (!n.inst || !n.practica || !PRACTICAS[n.practica]) throw new Error('El archivo no es un respaldo de expediente.');
      n.id = 'exp' + Date.now().toString(36); normalizar(n);
      BD.lista[n.id] = n; BD.actual = n.id; seleccion = null; guardar(); render(); aviso('Expediente restaurado.');
    } catch (err) { aviso(err.message.startsWith('El archivo') ? err.message : 'No se pudo leer el respaldo: el archivo está dañado o no es JSON.', true); }
    t.value = '';
  }
}

/* ---------- importación de bitácoras ---------- */
let IMPORT = null;
function destinoPorDefecto(gr) {
  const r = resumenGrupo(gr), s = S();
  const ruc = (r.ruc || '').replace(/\D/g, '').slice(0, 10), rucAct = (s.inst.ruc || '').replace(/\D/g, '').slice(0, 10);
  if (s.ejemplo) return 'nuevo';
  if (ruc && ruc === rucAct && r.practica === s.practica) return 'actual';
  if (!s.inst.razonSocial && !s.equipos.length && !s.poe.length) return 'actual';
  return 'nuevo';
}
function mostrarImportacion() {
  const el = document.getElementById('panel-import');
  el.hidden = false;
  el.innerHTML = `<div><div class="imp-head"><b>Se encontraron ${IMPORT.length} ${IMPORT.length === 1 ? 'grupo' : 'grupos'} de datos</b><span>Revise a dónde va cada uno. Lo que ya está lleno en el expediente no se sobrescribe; los equipos y las personas se agregan sin duplicar (por serie y por cédula).</span></div>
    <div class="tabla-ed"><table><thead><tr><th></th><th>Institución / sede</th><th>Práctica</th><th>Contenido</th><th>Destino</th></tr></thead><tbody>
    ${IMPORT.map((gr, i) => { const r = resumenGrupo(gr); const d = destinoPorDefecto(gr); return `<tr><td><input type="checkbox" id="imp-${i}" checked aria-label="Importar grupo ${i + 1}"></td><td><b>${esc(r.inst)}</b>${r.razon && r.razon !== r.inst ? `<br><small>${esc(r.razon)}</small>` : ''}<br><small>${esc(r.ruc || 'Sin RUC')} · hoja ${esc(gr.bloques.map(b => b.hoja).filter((x, k, a) => a.indexOf(x) === k).join(', '))}</small></td><td>${esc(PRACTICAS[r.practica].nombre)}</td><td><small>${esc(r.tipos.join(', '))}<br>${r.nEquipos} equipos · ${r.nPOE} personas${r.licencia ? ' · licencia ' + esc(r.licencia) : ''}</small></td><td><select id="imp-dest-${i}" aria-label="Destino del grupo ${i + 1}"><option value="nuevo" ${d === 'nuevo' ? 'selected' : ''}>Expediente nuevo</option><option value="actual" ${d === 'actual' ? 'selected' : ''}>Expediente abierto</option></select></td></tr>`; }).join('')}
    </tbody></table></div>
    <div class="imp-acc"><button class="btn" data-importar>Importar seleccionados</button><button class="btn sec" id="btn-import-cerrar">Cancelar</button></div></div>`;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function ejecutarImportacion() {
  if (!IMPORT) return;
  let creados = 0, eq = 0, poe = 0, ultimo = null;
  IMPORT.forEach((gr, i) => {
    if (!document.getElementById('imp-' + i).checked) return;
    let dest;
    if (document.getElementById('imp-dest-' + i).value === 'actual') dest = S();
    else { dest = estadoVacio(gr.bloques[0].practica); dest.id = 'exp' + Date.now().toString(36) + i; dest.inst.sede = gr.bloques[0].sitio.replace(/\.$/, ''); BD.lista[dest.id] = dest; creados++; }
    if (dest.ejemplo) dest.ejemplo = false;
    const n = aplicarGrupo(dest, gr);
    eq += n.equipos; poe += n.poe; ultimo = dest.id;
  });
  if (ultimo) BD.actual = ultimo;
  IMPORT = null; seleccion = null;
  document.getElementById('panel-import').hidden = true;
  guardar(); render();
  aviso(`Importación lista: ${eq} equipos y ${poe} personas${creados ? `, ${creados} ${creados === 1 ? 'expediente nuevo' : 'expedientes nuevos'}` : ''}. Revise los datos antes de generar documentos.`);
}

function iniciar() {
  cargarBD();
  document.addEventListener('input', alCambiar);
  document.addEventListener('change', (e) => { if (e.target.type === 'file') alArchivo(e); else alCambiar(e); });
  document.addEventListener('click', alClic);
  document.getElementById('expediente').addEventListener('change', (e) => { BD.actual = e.target.value; seleccion = null; guardar(); render(); });
  capacidadDescargas();
  render();
  marcarGuardado(true);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
