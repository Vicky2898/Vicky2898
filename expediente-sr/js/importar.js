/* Lee las bitácoras de Excel de la OSR (equipos, licencia institucional, POE y recambio de dosímetros)
   y las convierte en datos del expediente. Reconoce cada bloque por su título y sus etiquetas. */

const TITULOS_IMPORT = [
  { re: /^BIT[AÁ]CORA DE EQUIPOS/i, tipo: 'equipos' },
  { re: /^LICENCIA INSTITUCIONAL/i, tipo: 'licencia' },
  { re: /^BIT[AÁ]CORA DE POE/i, tipo: 'poe' },
  { re: /^RECAMBIO DE DOS[IÍ]METROS/i, tipo: 'recambio' }
];

const sinTildes = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '');
const normal = (s) => sinTildes(s).toUpperCase().replace(/\s+/g, ' ').trim().replace(/\s*[:.]+$/, '').trim();

function valorCelda(v) {
  if (v == null) return '';
  if (v instanceof Date) return v;
  if (typeof v === 'object') {
    if (v.result !== undefined) return valorCelda(v.result);
    if (v.richText) return v.richText.map(t => t.text).join('');
    if (v.text !== undefined) return valorCelda(v.text);
    if (v.error) return '';
    return '';
  }
  return v;
}
const txt = (v) => (v instanceof Date ? isoUTC(v) : String(v == null ? '' : v)).trim();
function isoUTC(d) { return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`; }
function aISO(v) {
  if (v instanceof Date) return isoUTC(v);
  const s = String(v || '').trim();
  let m = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(s);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  return m ? m[0] : '';
}
/* Año de fabricación: los formatos lo guardan como fecha de mes/año o como número */
function aAnio(v) {
  if (v instanceof Date) return `${String(v.getUTCMonth() + 1).padStart(2, '0')}/${v.getUTCFullYear()}`;
  return txt(v);
}

function practicaDeTexto(t) {
  const n = normal(t);
  if (/ODONTO/.test(n) && !/MEDIC/.test(n)) return 'odontologico';
  if (/INTERVENC/.test(n)) return 'intervencionista';
  if (/RADIODIAGN|MEDIC/.test(n)) return 'medico';
  return '';
}
const ETIQUETAS = {
  'INSTITUCION': 'institucion', 'RAZON SOCIAL': 'razon', 'NOMBRE COMERCIAL': 'comercial', 'RUC': 'ruc',
  'REPRESENTANTE LEGAL': 'rep', 'PRACTICA': 'practica', 'DIRECCION': 'direccion', 'PROVINCIA': 'provincia',
  'CIUDAD': 'ciudad', 'TELEFONO': 'telefono', 'CODIGO': 'codigo', 'VALIDEZ': 'validez',
  'FECHA DE EXPEDICION': 'expedicion', 'FECHA DE EXPIRACION': 'expiracion', 'FECHA INICIO CONTRATO': 'inicio',
  'FECHA FIN CONTRATO': 'fin', 'RESPONSABLE': 'responsable', 'FECHA DE ACTUALIZACION': 'actualizacion'
};

function hojaAMatriz(ws) {
  const m = [];
  ws.eachRow({ includeEmpty: true }, (row, r) => {
    const fila = [];
    row.eachCell({ includeEmpty: true }, (cell, cIdx) => { fila[cIdx] = (cell.isMerged && cell.master && cell.master.address !== cell.address) ? '' : valorCelda(cell.value); });
    m[r] = fila;
  });
  return m;
}

function leerEtiquetas(m, r0, r1) {
  const kv = {};
  for (let r = r0; r <= r1; r++) {
    const fila = m[r] || [];
    for (let c = 1; c < fila.length; c++) {
      if (typeof fila[c] !== 'string' || !fila[c].includes(':')) continue;
      const k = ETIQUETAS[normal(fila[c])];
      if (!k || kv[k]) continue;
      for (let d = c + 1; d < fila.length; d++) {
        const v = fila[d];
        if (v !== '' && v != null && !(typeof v === 'string' && ETIQUETAS[normal(v)])) { kv[k] = v; break; }
        if (typeof v === 'string' && ETIQUETAS[normal(v)]) break;
      }
    }
  }
  return kv;
}

/* Tabla de equipos con encabezado de dos filas (MARCA / MODELO / SERIE … sobre EQUIPO / TUBO) */
function leerTablaEquipos(m, r0, r1) {
  let hr = -1;
  for (let r = r0; r <= r1; r++) {
    const f = (m[r] || []).map(normal);
    if (f.includes('MARCA') && f.some(x => /^TIPO/.test(x))) { hr = r; break; }
  }
  if (hr < 0) return [];
  const h = (m[hr] || []).map(normal), sub = (m[hr + 1] || []).map(normal);
  const col = (re) => h.findIndex(x => re.test(x || ''));
  const cTipo = col(/^TIPO/), cN = col(/^N/);
  const par = (re) => { const c = col(re); if (c < 0) return [-1, -1]; return /TUBO/.test(sub[c] || '') ? [c + 1, c] : [c, c + 1]; };
  const [mE, mT] = par(/^MARCA/), [moE, moT] = par(/^MODELO/), [sE, sT] = par(/^SERIE/), [aE, aT] = par(/^ANO DE FABRIC/);
  const cInst = col(/INSTALACION/);
  const out = [];
  for (let r = hr + 2; r <= r1; r++) {
    const f = m[r] || [];
    const tipo = txt(f[cTipo]);
    if (!tipo) { if (txt(f[cN]) || out.length === 0) continue; else break; }
    const v = (c) => c > 0 ? txt(f[c]) : '';
    out.push({
      tipoOriginal: tipo, marca: v(mE), tuboMarca: v(mT) || (mT === mE + 1 && !v(mT) ? '' : ''), modelo: v(moE), tuboModelo: v(moT),
      serie: v(sE), tuboSerie: v(sT), anio: aE > 0 ? aAnio(f[aE]) : '', anioTubo: aT > 0 ? aAnio(f[aT]) : '', anioInst: cInst > 0 ? aAnio(f[cInst]) : ''
    });
  }
  return out;
}

const TIPOS_EQUIPO_IMPORT = [
  [/MOVIL|PORTATIL|RODABLE/, 'Rayos X portátil'], [/MAMOG/, 'Mamógrafo'], [/DENSITOM/, 'Densitómetro óseo'],
  [/TOMOGRAF.*(CONICO|CBCT)|CBCT/, 'Tomógrafo de haz cónico (CBCT)'], [/TOMOGRAF/, 'Tomógrafo computarizado'],
  [/TELECOMAND/, 'Telecomandado'], [/ARCO EN C/, 'Arco en C'], [/ANGIO/, 'Angiógrafo monoplano'], [/FLUORO/, 'Fluoroscopio'],
  [/LITOTRI/, 'Litotriptor'], [/CEFALO/, 'Panorámico-cefalométrico'], [/PANORAM/, 'Panorámico'], [/PERIAPICAL|INTRAORAL/, 'Intraoral (periapical)'],
  [/CONVENCIONAL|RAYOS X/, 'Rayos X convencional fijo']
];
function tipoEquipo(t) { const n = normal(t); const x = TIPOS_EQUIPO_IMPORT.find(([re]) => re.test(n)); return x ? x[1] : t; }

function dividirNombre(full) {
  const w = String(full || '').trim().split(/\s+/);
  if (w.length < 3) return { apellidos: w[0] || '', nombres: w.slice(1).join(' ') };
  return { apellidos: w.slice(0, w.length - 2).join(' '), nombres: w.slice(-2).join(' ') };
}

function leerPOE(m, r0, r1) {
  const out = [];
  let cat = 'tecnologo', cols = null;
  for (let r = r0; r <= r1; r++) {
    const f = m[r] || [];
    const unido = normal(f.filter(x => typeof x === 'string').join(' '));
    if (/MEDICOS RADIOLOGOS|ESPECIALISTAS:/.test(unido)) { cat = 'medico'; cols = null; continue; }
    if (/LICENCIADOS|TECNOLOGOS/.test(unido)) { cat = 'tecnologo'; cols = null; continue; }
    if (/OFICIAL DE SEGURIDAD RADIOLOGICA:/.test(unido)) { cat = 'osr'; cols = null; continue; }
    if (/ODONTOLOGOS:/.test(unido)) { cat = 'odontologo'; cols = null; continue; }
    const h = f.map(normal);
    if (h.includes('NOMBRE') && h.some(x => /^CEDULA/.test(x || ''))) {
      cols = {};
      h.forEach((x, i) => {
        if (!x) return;
        if (x === 'NOMBRE') cols.nombre = i; else if (/^CEDULA/.test(x)) cols.cedula = i; else if (/^LICENCIA N/.test(x)) cols.licencia = i;
        else if (x === 'CODIGO') cols.codigo = i; else if (/^REN/.test(x)) cols.ren = i; else if (/^ACT/.test(x)) cols.act = i;
        else if (/^EXPEDI/.test(x)) cols.expedicion = i; else if (/^EXPIRA/.test(x)) cols.licCad = i; else if (/^PROFESION/.test(x)) cols.profesion = i;
        else if (/^CARGO/.test(x)) cols.cargo = i; else if (/^CAMPO/.test(x)) cols.campo = i; else if (/^OBSERVACION/.test(x)) cols.observacion = i;
      });
      continue;
    }
    if (cols && txt(f[cols.nombre]) && /\d{6,}/.test(txt(f[cols.cedula])) && !/:\s*$/.test(txt(f[cols.nombre]))) {
      const g = (k) => cols[k] ? f[cols[k]] : '';
      const nom = dividirNombre(txt(g('nombre')));
      const exp = g('licCad');
      out.push({
        ...nom, categoria: cat, cedula: txt(g('cedula')), licencia: txt(g('licencia')), codigo: txt(g('codigo')),
        ren: txt(g('ren')), act: g('act') instanceof Date ? '0' : txt(g('act')), expedicion: aISO(g('expedicion')), licCad: aISO(exp),
        observacion: [txt(g('observacion')), !aISO(exp) && txt(exp) ? `Fecha de expiración por revisar: ${txt(exp)}` : ''].filter(Boolean).join(' '),
        profesion: txt(g('profesion')), cargo: txt(g('cargo')), campo: txt(g('campo'))
      });
    } else if (cols && !txt(f[cols.nombre]) && out.length && r > r0 && !f.some(x => txt(x))) {
      cols = cols; /* fila en blanco entre secciones */
    }
  }
  return out;
}

function leerRecambio(m, r0, r1) {
  let hr = -1;
  for (let r = r0; r <= r1; r++) {
    const f = (m[r] || []).map(normal);
    if (f.includes('APELLIDOS') && f.includes('NOMBRES')) { hr = r; break; }
  }
  if (hr < 0) return { personas: [], fechas: [] };
  const h = (m[hr] || []).map(normal);
  const ci = (re) => h.findIndex(x => re.test(x || ''));
  const cAp = ci(/^APELLIDOS/), cNo = ci(/^NOMBRES/), cDoc = ci(/^DOCUMENTO/), cAr = ci(/^AREA/), cTi = ci(/^TIPO DE DOSIMETRO/), cCa = ci(/^CARGO/);
  /* Fechas de recambio: primera fila con fechas bajo DESDE/HASTA */
  const fechas = [];
  for (let r = hr + 1; r <= Math.min(r1, hr + 4); r++) {
    const f = m[r] || [];
    const ds = f.map((v, i) => [i, v]).filter(([, v]) => v instanceof Date);
    if (ds.length >= 2) { ds.forEach(([, v]) => fechas.push(isoUTC(v))); break; }
  }
  const personas = [];
  for (let r = hr + 1; r <= r1; r++) {
    const f = m[r] || [];
    const ap = txt(f[cAp]), no = txt(f[cNo]), doc = txt(f[cDoc]);
    if (!ap && !no) continue;
    if (!/\d{6,}/.test(doc)) continue;
    personas.push({ apellidos: ap, nombres: no, cedula: doc, area: txt(f[cAr]), tipoDos: txt(f[cTi]), cargoDos: txt(f[cCa]) });
  }
  return { personas, fechas };
}

/* Analiza un libro y devuelve los bloques encontrados */
async function analizarLibro(buffer, nombreArchivo) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const bloques = [];
  wb.worksheets.forEach(ws => {
    const m = hojaAMatriz(ws);
    const inicios = [];
    m.forEach((fila, r) => {
      if (!fila) return;
      for (let c = 1; c < Math.min(fila.length, 6); c++) {
        const t = typeof fila[c] === 'string' ? fila[c].trim() : '';
        const x = t && TITULOS_IMPORT.find(x => x.re.test(sinTildes(t).toUpperCase()) || x.re.test(t.toUpperCase()));
        if (x) { inicios.push({ r, tipo: x.tipo }); break; }
      }
    });
    /* En las hojas de resumen («FECHAS DE LICENCIAS…») no hay título reconocible: se ignoran */
    inicios.forEach((ini, i) => {
      const r0 = ini.r, r1 = i + 1 < inicios.length ? inicios[i + 1].r - 1 : m.length - 1;
      const kv = leerEtiquetas(m, r0, r1);
      const sitio = ws.name.replace(/^(EQUIPOS|LIC\.?\s*INST\.?|LICEN\.?\s*POE|RECAM\.?\s*DOSIM\.?)\s*/i, '').replace(/\(\d+\)/, '').trim();
      let practica = practicaDeTexto(kv.practica || '');
      if (!practica) {
        for (let r = r0; r <= Math.min(r1, r0 + 25); r++) { const p = practicaDeTexto(((m[r] || []).filter(x => typeof x === 'string').join(' '))); if (p && /RADIOD|RADIOL|ODONTO/.test(normal((m[r] || []).join(' ')))) { practica = p; break; } }
      }
      const b = { hoja: ws.name, archivo: nombreArchivo, sitio, tipo: ini.tipo, practica: practica || 'medico', kv, equipos: [], poe: [], recambio: null };
      if (ini.tipo === 'equipos' || ini.tipo === 'licencia') b.equipos = leerTablaEquipos(m, r0, r1);
      if (ini.tipo === 'licencia') {
        for (let r = r0; r <= r1; r++) {
          const f = (m[r] || []).map(normal);
          const ck = f.findIndex(x => /^KV MAXIMO/.test(x || '')), cm = f.findIndex(x => /^MA MAXIMO/.test(x || ''));
          if (ck > 0) { const sig = m[r + 1] || []; b.kvMax = txt(sig[ck]).replace(/\s*kV/i, ''); b.maMax = txt(sig[cm]); break; }
        }
      }
      if (ini.tipo === 'poe') b.poe = leerPOE(m, r0, r1);
      if (ini.tipo === 'recambio') b.recambio = leerRecambio(m, r0, r1);
      const tieneDatos = b.equipos.length || b.poe.length || (b.recambio && b.recambio.personas.length) || (ini.tipo === 'licencia' && kv.codigo);
      if (tieneDatos) bloques.push(b);
    });
  });
  return bloques;
}

const ruc10 = (b) => txt(b.kv.ruc).replace(/\D/g, '').slice(0, 10);
const instNorm = (b) => normal(b.kv.razon || b.kv.institucion || '').replace(/[^A-Z0-9]/g, '').slice(0, 10);

/* Agrupa bloques de la misma institución, práctica y sede.
   Primero los que traen RUC; luego los que solo traen nombre (recambios) se unen por nombre de institución. */
function agruparBloques(bloques) {
  const grupos = [];
  const buscar = (fn) => grupos.find(fn);
  bloques.filter(b => ruc10(b)).forEach(b => {
    let g = buscar(x => x.ruc === ruc10(b) && x.practica === b.practica && x.sitio === normal(b.sitio));
    if (!g) { g = { ruc: ruc10(b), practica: b.practica, sitio: normal(b.sitio), bloques: [] }; grupos.push(g); }
    g.bloques.push(b);
  });
  bloques.filter(b => !ruc10(b)).forEach(b => {
    const n = instNorm(b);
    const candidatos = grupos.filter(x => x.practica === b.practica && n && x.bloques.some(y => instNorm(y) === n));
    let g = candidatos.find(x => x.sitio === normal(b.sitio)) || candidatos[0];
    if (!g) { g = { ruc: '', practica: b.practica, sitio: normal(b.sitio), bloques: [] }; grupos.push(g); }
    g.bloques.push(b);
  });
  return grupos.map(g => ({ clave: `${g.ruc}|${g.practica}|${g.sitio}`, bloques: g.bloques }));
}

function resumenGrupo(gr) {
  const kv = Object.assign({}, ...gr.bloques.map(b => b.kv));
  const eqs = gr.bloques.filter(b => b.tipo === 'equipos').reduce((a, b) => a + b.equipos.length, 0) || gr.bloques.filter(b => b.tipo === 'licencia').reduce((a, b) => a + b.equipos.length, 0);
  const poe = Math.max(0, ...gr.bloques.map(b => b.poe.length + (b.recambio ? b.recambio.personas.length : 0)));
  return {
    inst: txt(kv.comercial || kv.razon || kv.institucion || 'Sin nombre'),
    razon: txt(kv.razon || kv.institucion || ''),
    ruc: txt(kv.ruc),
    practica: gr.bloques[0].practica,
    sitio: gr.bloques[0].sitio,
    direccion: txt(kv.direccion),
    tipos: [...new Set(gr.bloques.map(b => ({ equipos: 'bitácora de equipos', licencia: 'licencia institucional', poe: 'bitácora de POE', recambio: 'recambio de dosímetros' })[b.tipo]))],
    nEquipos: eqs, nPOE: poe,
    licencia: txt((gr.bloques.find(b => b.tipo === 'licencia') || { kv: {} }).kv.codigo || '')
  };
}

/* Vuelca un grupo sobre un expediente (rellena lo vacío, agrega equipos y personas sin duplicar) */
function aplicarGrupo(S, gr) {
  const llenar = (obj, k, v) => { if (v && !String(obj[k] || '').trim()) obj[k] = v; };
  const n = { equipos: 0, poe: 0 };
  gr.bloques.forEach(b => {
    const kv = b.kv;
    const razon = txt(kv.razon || kv.institucion).replace(/\s+-\s+.*$/, '');
    llenar(S.inst, 'razonSocial', razon);
    llenar(S.inst, 'nombreComercial', txt(kv.comercial));
    llenar(S.inst, 'ruc', txt(kv.ruc));
    llenar(S.inst, 'direccion', txt(kv.direccion));
    llenar(S.inst, 'provincia', txt(kv.provincia));
    llenar(S.inst, 'ciudad', txt(kv.ciudad));
    llenar(S.inst, 'telefono', txt(kv.telefono));
    const rep = txt(kv.rep);
    if (rep) {
      if (/C[IÍ]A\.?\s*LTDA|S\.?\s*A\.?$|CORP/i.test(rep)) llenar(S.inst, 'repEmpresa', rep);
      else llenar(S.inst, 'repLegal', rep.replace(/^(Dra?\.|Ing\.|Lcda?\.|Od\.)\s*/i, ''));
    }
    if (b.tipo === 'licencia') {
      const cod = txt(kv.codigo);
      const exp = aISO(kv.expedicion), cad = aISO(kv.expiracion);
      /* Si hay varias licencias para la misma sede, se queda la más reciente */
      if (cod && (!S.inst.licenciaCad || (cad && cad > S.inst.licenciaCad))) { S.inst.licencia = cod; S.inst.licenciaExp = exp; S.inst.licenciaCad = cad; }
      llenar(S.inst, 'kvMax', b.kvMax); llenar(S.inst, 'maMax', b.maMax);
    }
    const marcarLic = b.tipo === 'licencia';
    b.equipos.forEach(e => {
      const ya = S.equipos.find(x => (x.serie && x.serie === e.serie) || (x.tuboSerie && e.tuboSerie && x.tuboSerie === e.tuboSerie));
      if (ya) {
        ['marca', 'tuboMarca', 'modelo', 'tuboModelo', 'tuboSerie', 'anio', 'anioTubo', 'anioInst'].forEach(k => llenar(ya, k, e[k]));
        if (marcarLic) ya.enLicencia = 'Sí';
        return;
      }
      /* Si el bloque de licencia trae un equipo que ya no está en la bitácora, se registra igual para revisión */
      S.equipos.push({ tipo: tipoEquipo(e.tipoOriginal), marca: e.marca, modelo: e.modelo, serie: e.serie, tuboMarca: e.tuboMarca, tuboModelo: e.tuboModelo, tuboSerie: e.tuboSerie, anio: e.anio, anioTubo: e.anioTubo, anioInst: e.anioInst, sala: '', uso: '', estado: b.tipo === 'licencia' && gr.bloques.some(x => x.tipo === 'equipos') ? 'Fuera de servicio' : 'Funcionando', enLicencia: marcarLic ? 'Sí' : '', mantFecha: '' });
      n.equipos++;
    });
    const unirPersona = (p) => {
      const ced = (p.cedula || '').replace(/\D/g, '');
      let ya = S.poe.find(x => ced && (x.cedula || '').replace(/\D/g, '') === ced);
      if (!ya) ya = S.poe.find(x => normal((x.apellidos || '') + (x.nombres || '')) === normal((p.apellidos || '') + (p.nombres || '')));
      if (ya) { Object.keys(p).forEach(k => { if (p[k] && (k === 'apellidos' || k === 'nombres' || !String(ya[k] || '').trim())) ya[k] = p[k]; }); return; }
      S.poe.push(Object.assign({ docs: {} }, p)); n.poe++;
    };
    b.poe.forEach(unirPersona);
    if (b.recambio) {
      b.recambio.personas.forEach(unirPersona);
      const f = b.recambio.fechas;
      llenar(S.serv, 'dosInicio', aISO(kv.inicio) || f[0]);
      llenar(S.serv, 'dosVigencia', aISO(kv.fin) || '');
      if (f.length >= 2) {
        const meses = Math.round((parseFecha(f[1]) - parseFecha(f[0]) + 86400000) / (30.44 * 86400000));
        if (!S.serv.dosPeriodoFijado) S.serv.dosPeriodo = meses >= 3 ? 'Trimestral' : (meses === 2 ? 'Bimestral' : 'Mensual');
      }
    }
  });
  /* El OSR importado pasa a la sección de responsables si está vacía */
  const osr = S.poe.find(p => p.categoria === 'osr');
  if (osr) {
    S.resp.osrAplica = true;
    llenar(S.resp, 'osrNombre', [osr.nombres, osr.apellidos].filter(Boolean).join(' '));
    llenar(S.resp, 'osrCedula', osr.cedula); llenar(S.resp, 'osrAut', osr.codigo); llenar(S.resp, 'osrAutCad', osr.licCad);
    llenar(S.resp, 'osrProfesion', osr.profesion ? osr.profesion.charAt(0) + osr.profesion.slice(1).toLowerCase() : '');
  }
  const med = S.poe.find(p => p.categoria === 'medico');
  if (med) { llenar(S.resp, 'medNombre', [med.nombres, med.apellidos].filter(Boolean).join(' ')); llenar(S.resp, 'medCedula', med.cedula); llenar(S.resp, 'medLicencia', med.codigo || med.licencia); llenar(S.resp, 'medLicCad', med.licCad); llenar(S.resp, 'medEspecialidad', med.profesion); }
  return n;
}
