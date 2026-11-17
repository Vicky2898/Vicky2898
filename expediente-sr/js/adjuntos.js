/* Archivos propios de la institución adjuntos a los requisitos del expediente
   (consentimientos con el modelo del MSP, contratos, certificados, fotografías, etc.).
   Los datos del archivo (nombre, tipo, requisito) se guardan con el expediente; el contenido
   se guarda en IndexedDB de este navegador porque no cabe en localStorage. El respaldo .json
   incluye el contenido para llevarlo a otro equipo. */

const ADJ_DB = 'expedienteSR.adjuntos';
const ADJ_MAX = 25 * 1024 * 1024;
let _adjDB = null;

function adjAbrir() {
  if (_adjDB) return _adjDB;
  _adjDB = new Promise((ok, mal) => {
    try {
      const r = indexedDB.open(ADJ_DB, 1);
      r.onupgradeneeded = () => r.result.createObjectStore('archivos', { keyPath: 'id' });
      r.onsuccess = () => ok(r.result);
      r.onerror = () => mal(r.error || new Error('IndexedDB no disponible'));
    } catch (e) { mal(e); }
  });
  _adjDB.catch(() => { _adjDB = null; });
  return _adjDB;
}

async function adjOperar(modo, fn) {
  const db = await adjAbrir();
  return new Promise((ok, mal) => {
    const tx = db.transaction('archivos', modo);
    const req = fn(tx.objectStore('archivos'));
    tx.oncomplete = () => ok(req ? req.result : undefined);
    tx.onerror = () => mal(tx.error);
    tx.onabort = () => mal(tx.error || new Error('Operación cancelada (¿espacio insuficiente?)'));
  });
}
const adjGuardarBlob = (id, blob) => adjOperar('readwrite', st => st.put({ id, blob }));
const adjLeerBlob = async (id) => { const r = await adjOperar('readonly', st => st.get(id)); return r ? r.blob : null; };
const adjBorrarBlob = (id) => adjOperar('readwrite', st => st.delete(id));

/* Agrega archivos a un requisito del expediente y devuelve los que no se pudieron guardar */
async function adjAgregar(s, req, files) {
  if (!s.adjuntos) s.adjuntos = [];
  const errores = [];
  for (const f of files) {
    if (f.size > ADJ_MAX) { errores.push(`${f.name}: supera 25 MB`); continue; }
    const id = 'adj' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    try {
      await adjGuardarBlob(id, f);
      s.adjuntos.push({ id, req, nombre: f.name, tipo: f.type || '', tamano: f.size, fecha: new Date().toISOString().slice(0, 10) });
    } catch (e) { errores.push(`${f.name}: ${e.message || 'no se pudo guardar'}`); }
  }
  return errores;
}

async function adjQuitar(s, id) {
  s.adjuntos = (s.adjuntos || []).filter(a => a.id !== id);
  try { await adjBorrarBlob(id); } catch (e) { /* ya no existía */ }
}

async function adjBorrarExpediente(s) {
  for (const a of (s.adjuntos || [])) { try { await adjBorrarBlob(a.id); } catch (e) { /* nada */ } }
}

const adjDeReq = (s, req) => (s.adjuntos || []).filter(a => a.req === req);
const adjTamano = (n) => n >= 1048576 ? (n / 1048576).toFixed(1).replace('.', ',') + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';
const adjNombreSeguro = (n) => String(n || 'archivo').replace(/[\\/:*?"<>|]+/g, '_').slice(0, 120);

/* Para el respaldo: el contenido de cada archivo en base64 */
async function adjParaRespaldo(s) {
  const out = [];
  for (const a of (s.adjuntos || [])) {
    const blob = await adjLeerBlob(a.id).catch(() => null);
    if (!blob) continue;
    const buf = new Uint8Array(await blob.arrayBuffer());
    let bin = '';
    for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
    out.push({ ...a, datos: btoa(bin) });
  }
  return out;
}

/* Al restaurar: vuelve a guardar el contenido con identificadores nuevos */
async function adjDesdeRespaldo(n, lista) {
  n.adjuntos = [];
  let perdidos = 0;
  for (const a of (lista || [])) {
    if (!a.datos) { perdidos++; continue; }
    const bin = atob(a.datos), buf = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
    const id = 'adj' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    try { await adjGuardarBlob(id, new Blob([buf], { type: a.tipo || '' })); n.adjuntos.push({ id, req: a.req, nombre: a.nombre, tipo: a.tipo, tamano: a.tamano, fecha: a.fecha }); }
    catch (e) { perdidos++; }
  }
  return perdidos;
}
