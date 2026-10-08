/* Dibuja los documentos en cuatro salidas: vista previa HTML, Word (.docx), PDF y Excel (.xlsx).
   Dos estilos de encabezado: «ficha» (logo, título y tabla de control en la primera página)
   y «control» (tabla de control repetida en cada página). */

const COLOR_TEXTO = '1F2A33';

/* ---------- utilidades comunes ---------- */

function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
/* Divide un texto con **negrita** en segmentos */
function segmentos(text) {
  const out = [];
  String(text == null ? '' : text).split(/(\*\*[^*]+\*\*)/g).forEach(p => {
    if (!p) return;
    if (p.startsWith('**') && p.endsWith('**')) out.push({ text: p.slice(2, -2), bold: true });
    else out.push({ text: p, bold: false });
  });
  return out;
}
const plano = (t) => String(t == null ? '' : t).replace(/\*\*/g, '');
/* Una celda puede ser texto o { t, fill, bold, align } */
const cTxt = (x) => (x && typeof x === 'object') ? (x.t == null ? '' : x.t) : (x == null ? '' : x);
const cFill = (x) => (x && typeof x === 'object' && x.fill) ? x.fill.replace('#', '') : null;
const cBold = (x) => !!(x && typeof x === 'object' && x.bold);

function richHTML(text) {
  return segmentos(text).map(s => s.bold ? `<strong>${esc(s.text)}</strong>` : esc(s.text)).join('').replace(/\n/g, '<br>');
}
function hexRGB(h) { h = (h || '1F4E79').replace('#', ''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) || 0); }
function rgbHex(a) { return a.map(v => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase(); }
function tinte(h, f) { return rgbHex(hexRGB(h).map(v => v + (255 - v) * f)); }

function estilo(c) {
  const col = (c.M.color || '1F4E79').replace('#', '').toUpperCase();
  return { col, claro: tinte(col, 0.86), muyClaro: tinte(col, 0.93), ficha: (c.M.estilo || 'ficha') === 'ficha' };
}

let _trebol = null;
function trebolPNG() {
  if (_trebol) return _trebol;
  const S = 600, cv = document.createElement('canvas');
  cv.width = S; cv.height = S;
  const g = cv.getContext('2d');
  const m = 30, top = 40, base = S - 50;
  g.lineJoin = 'round';
  g.beginPath(); g.moveTo(S / 2, top); g.lineTo(S - m, base); g.lineTo(m, base); g.closePath();
  g.fillStyle = '#FFD200'; g.fill(); g.lineWidth = 34; g.strokeStyle = '#111111'; g.stroke();
  const cx = S / 2, cy = base - (base - top) / 3 + 6, r0 = 22;
  g.fillStyle = '#111111';
  g.beginPath(); g.arc(cx, cy, r0, 0, Math.PI * 2); g.fill();
  [90, 210, 330].forEach(a => {
    const a1 = (a - 30) * Math.PI / 180, a2 = (a + 30) * Math.PI / 180;
    g.beginPath(); g.arc(cx, cy, r0 * 5, a1, a2); g.arc(cx, cy, r0 * 1.5, a2, a1, true); g.closePath(); g.fill();
  });
  _trebol = { data: cv.toDataURL('image/png'), w: S, h: S };
  return _trebol;
}

function encabezadoInfo(doc, c) {
  return {
    inst: c.I.razonSocial || '[Razón social]',
    comercial: c.I.nombreComercial || '',
    code: doc.code,
    version: c.M.version || '01',
    fecha: fCorta(c.fecha),
    title: doc.title,
    subtitle: doc.subtitle || ''
  };
}
/* Tabla de control de la ficha (estilo de declaración) */
function filasFicha(doc, c) {
  const e = encabezadoInfo(doc, c);
  return [
    ['Código', e.code, 'Versión', e.version],
    ['Fecha de emisión', fLarga(c.fecha), 'Práctica', c.P.nombre],
    ['Elaborado por', c.rolOSR, 'Aprobado por', 'Representante Legal / Licenciatario']
  ];
}
function pieSgc(doc, c) {
  const inst = [c.I.nombreComercial, c.I.razonSocial].filter(Boolean).join(' / ');
  return `${doc.title} | ${inst}`;
}
function pieCarta(c) {
  return [c.I.direccion, c.I.ciudad, c.I.telefono ? 'Telf. ' + c.I.telefono : '', c.I.correo].filter(Boolean).join(' · ');
}

/* ================================================================ HTML */

function renderHTML(doc, c) {
  const e = encabezadoInfo(doc, c), st = estilo(c);
  const logo = c.I.logo ? `<img class="d-logo" src="${c.I.logo.data}" alt="Logo">` : '<div class="d-logo d-logo-vacio">LOGO</div>';
  let head = '';
  if (doc.kind === 'sgc' && st.ficha) {
    head = `<div class="d-ficha">${logo}<div class="d-ficha-t" style="color:#${st.col}">${esc(e.title.toUpperCase())}</div>${e.subtitle ? `<div class="d-ficha-s">${esc(e.subtitle)}</div>` : ''}
      <table class="d-t d-fichat"><tbody>${filasFicha(doc, c).map(r => `<tr><th style="background:#${st.claro}">${esc(r[0])}</th><td>${esc(r[1])}</td><th style="background:#${st.claro}">${esc(r[2])}</th><td>${esc(r[3])}</td></tr>`).join('')}</tbody></table></div>`;
  } else if (doc.kind === 'sgc') {
    head = `<table class="d-head"><tr>
      <td class="d-head-logo" rowspan="2">${logo}</td>
      <td class="d-head-inst">${esc(e.inst)}</td>
      <td class="d-head-meta">Código: <b>${esc(e.code)}</b></td></tr>
      <tr><td class="d-head-title" style="background:#${st.muyClaro}">${esc(e.title.toUpperCase())}</td>
      <td class="d-head-meta">Versión: ${esc(e.version)}<br>Fecha: ${esc(e.fecha)}</td></tr></table>`;
  } else if (doc.kind === 'carta') {
    head = `<div class="d-carta-head" style="border-color:#${st.col}">${logo}<div><b>${esc(e.inst)}</b>${e.comercial ? `<br><span>${esc(e.comercial)}</span>` : ''}</div></div>`;
  }
  const body = doc.blocks.map(b => blockHTML(b, c, st)).join('');
  const pie = doc.kind === 'carta' ? `<div class="d-pie">${esc(pieCarta(c))}</div>` : (doc.kind === 'sgc' ? `<div class="d-pie">${esc(pieSgc(doc, c))} | Página 1</div>` : '');
  return `<div class="d-page ${doc.landscape ? 'd-land' : ''} d-${doc.kind}">${head}<div class="d-body">${body}</div>${pie}</div>`;
}

function celdaHTML(x, tag = 'td') {
  const f = cFill(x);
  const style = f ? ` style="background:#${f}"` : '';
  const t = richHTML(cTxt(x));
  return `<${tag}${style}${x && x.align === 'c' ? ' class="a-c"' : ''}>${cBold(x) ? `<b>${t}</b>` : t}</${tag}>`;
}

function blockHTML(b, c, st) {
  switch (b.t) {
    case 'h': return `<h4 class="d-h" style="color:#${st.col}">${esc(b.text)}</h4>`;
    case 'p': return `<p class="d-p ${b.align ? 'a-' + b.align : ''} ${b.bold ? 'd-b' : ''}">${richHTML(b.text)}</p>`;
    case 'note': return `<p class="d-note">${richHTML(b.text)}</p>`;
    case 'lines': return `<p class="d-p d-lines">${b.items.map(esc).join('<br>')}</p>`;
    case 'space': return '<div class="d-sp"></div>';
    case 'pb': return '<div class="d-pb" aria-hidden="true"><span>salto de página</span></div>';
    case 'list': {
      const tag = b.ordered ? 'ol' : 'ul';
      return `<${tag} class="d-list">${b.items.map(i => `<li>${richHTML(i)}</li>`).join('')}</${tag}>`;
    }
    case 'table': {
      const cols = b.widths ? `<colgroup>${b.widths.map(w => `<col style="width:${w}%">`).join('')}</colgroup>` : '';
      const th = `style="background:#${st.col};color:#fff"`;
      const pre = (b.pre || []).map(r => `<tr>${r.map(x => `<th colspan="${x.s || 1}" ${x.t ? th : 'class="d-th-vacio"'}>${esc(x.t || '')}</th>`).join('')}</tr>`).join('');
      return `<div class="d-tw"><table class="d-t ${b.small ? 'd-small' : ''} ${b.tall ? 'd-tall' : ''}">${cols}<thead>${pre}<tr>${b.head.map(h => `<th ${th}>${esc(h)}</th>`).join('')}</tr></thead><tbody>${b.rows.map(r => `<tr>${r.map(x => celdaHTML(x)).join('')}</tr>`).join('')}</tbody></table></div>`;
    }
    case 'kv':
      return `<div class="d-tw"><table class="d-t d-kv ${b.tall ? 'd-tall' : ''}"><tbody>${b.rows.map(r => `<tr><th style="background:#${st.claro}">${esc(r[0])}</th><td>${richHTML(r[1])}</td></tr>`).join('')}</tbody></table></div>`;
    case 'sign':
      return `<div class="d-sign">${b.items.map(s => `<div class="d-sig">${s.label ? `<div class="d-sig-l">${esc(s.label)}:</div>` : ''}<div class="d-sig-space">${s.sello && c.I.sello ? `<img src="${c.I.sello.data}" alt="Sello">` : ''}</div><div class="d-sig-line"></div>${s.top ? `<div class="d-sig-n">${esc(s.top)}</div>` : ''}<div class="${s.top ? 'd-sig-r' : 'd-sig-n'}">${esc(s.name || '')}</div><div class="d-sig-r">${esc(s.role || '').replace(/\n/g, '<br>')}</div>${s.ced ? `<div class="d-sig-r">C.I. ${esc(s.ced)}</div>` : ''}</div>`).join('')}</div>`;
    case 'big':
      return `<div class="d-big"><div>${esc(b.text).replace(/\n/g, '<br>')}</div>${b.sub ? `<small>${esc(b.sub)}</small>` : ''}</div>`;
    case 'trebol':
      return `<div class="d-trebol"><img src="${trebolPNG().data}" alt="Símbolo de radiación"></div>`;
    case 'legend':
      return `<div class="d-legend"><b>Leyenda:</b>${b.items.map(i => `<div>${i.fill ? `<span class="d-sw" style="background:#${i.fill}"></span>` : ''}${esc(i.t)}</div>`).join('')}</div>`;
    default: return '';
  }
}

/* ================================================================ WORD */

function anchoContenidoTwips(landscape) {
  return landscape ? 16838 - 2 * 1134 : 11906 - 2 * 1134;
}

function imgDims(img, maxW, maxH) {
  const r = Math.min(maxW / img.w, maxH / img.h);
  return { width: Math.round(img.w * r), height: Math.round(img.h * r) };
}

async function buildDocx(doc, c) {
  const D = window.docx;
  const { Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, ImageRun, Header, Footer, PageNumber, BorderStyle, ShadingType, PageBreak, PageOrientation, VerticalAlign, TableLayoutType } = D;
  const st = estilo(c);
  const W = anchoContenidoTwips(doc.landscape);
  const e = encabezadoInfo(doc, c);
  const borde = { style: BorderStyle.SINGLE, size: 4, color: '7A8894' };
  const bordes = { top: borde, bottom: borde, left: borde, right: borde };
  const sinBorde = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  const sinBordes = { top: sinBorde, bottom: sinBorde, left: sinBorde, right: sinBorde, insideHorizontal: sinBorde, insideVertical: sinBorde };

  const runs = (text, o = {}) => {
    const lines = String(text == null ? '' : text).split('\n');
    const out = [];
    lines.forEach((ln, i) => {
      segmentos(ln).forEach(s => out.push(new TextRun({ text: s.text, bold: s.bold || o.bold, size: o.size, italics: o.italics, color: o.color })));
      if (i < lines.length - 1) out.push(new TextRun({ text: '', break: 1 }));
    });
    return out;
  };
  const al = (a) => ({ j: AlignmentType.JUSTIFIED, c: AlignmentType.CENTER, r: AlignmentType.RIGHT, l: AlignmentType.LEFT })[a] || AlignmentType.LEFT;
  const par = (text, o = {}) => new Paragraph({ children: runs(text, o), alignment: al(o.align), spacing: { after: o.after == null ? 120 : o.after, line: 276 }, keepNext: o.keepNext });

  const celda = (content, wTw, o = {}) => new TableCell({
    children: Array.isArray(content) ? content : [par(content, { size: o.size, bold: o.bold, after: 0, align: o.align, color: o.color })],
    width: { size: wTw, type: WidthType.DXA },
    shading: o.fill ? { type: ShadingType.CLEAR, color: 'auto', fill: o.fill } : undefined,
    margins: { top: 50, bottom: 50, left: 80, right: 80 },
    verticalAlign: o.valign || VerticalAlign.TOP,
    rowSpan: o.rowSpan,
    columnSpan: o.span,
    borders: o.borders || bordes
  });

  const tabla = (head, rows, widths, o = {}) => {
    const n = head ? head.length : rows[0].length;
    const ws = (widths || Array(n).fill(100 / n)).map(p => Math.round(W * p / 100));
    const size = o.small ? 16 : 18;
    const trs = [];
    (o.pre || []).forEach(r => {
      let k = 0;
      trs.push(new TableRow({ tableHeader: true, children: r.map(x => { const s = x.s || 1; const w = ws.slice(k, k + s).reduce((a, b) => a + b, 0); k += s; return celda(x.t || '', w, { bold: true, align: 'c', fill: x.t ? st.col : undefined, color: 'FFFFFF', size, span: s > 1 ? s : undefined, valign: VerticalAlign.CENTER }); }) }));
    });
    if (head) trs.push(new TableRow({ tableHeader: true, children: head.map((h, i) => celda(h, ws[i], { bold: true, fill: st.col, color: 'FFFFFF', size, align: 'c', valign: VerticalAlign.CENTER })) }));
    rows.forEach(r => trs.push(new TableRow({ height: o.tall ? { value: 420, rule: 'atLeast' } : undefined, children: r.map((x, i) => celda(plano(cTxt(x)), ws[i], { size, bold: (o.kv && i === 0) || cBold(x), fill: cFill(x) || (o.kv && i % 2 === 0 ? st.claro : undefined), align: x && x.align })) })));
    return new Table({ rows: trs, width: { size: W, type: WidthType.DXA }, columnWidths: ws, layout: TableLayoutType.FIXED });
  };

  const firmaCelda = (s, wTw) => {
    const kids = [];
    if (s.label) kids.push(par(s.label + ':', { size: 16, bold: true, after: 0 }));
    if (s.sello && c.I.sello) {
      kids.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ data: c.I.sello.data, transformation: imgDims(c.I.sello, 110, 80) })] }));
    } else {
      kids.push(new Paragraph({ children: [], spacing: { before: 700 } }));
    }
    kids.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '______________________________', size: 18 })], spacing: { after: 0 } }));
    if (s.top) kids.push(par(s.top, { bold: true, size: 18, align: 'c', after: 0 }));
    if (s.name) kids.push(par(s.name, { bold: !s.top, size: 18, align: 'c', after: 0 }));
    kids.push(par(s.role || '', { size: 16, align: 'c', after: 0 }));
    if (s.ced) kids.push(par('C.I. ' + s.ced, { size: 16, align: 'c', after: 0 }));
    return celda(kids, wTw, { borders: sinBordes });
  };

  const children = [];
  if (doc.kind === 'sgc' && st.ficha) {
    children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: e.title.toUpperCase(), bold: true, size: 30, color: st.col })] }));
    if (e.subtitle) children.push(par(e.subtitle, { align: 'c', italics: true, size: 18, color: '4A5560' }));
    children.push(tabla(null, filasFicha(doc, c), [20, 30, 20, 30], { kv: true }));
    children.push(new Paragraph({ children: [], spacing: { after: 120 } }));
  }
  doc.blocks.forEach((b, bi) => {
    const sig = doc.blocks[bi + 1];
    switch (b.t) {
      case 'p': children.push(par(b.text, { align: b.align, bold: b.bold, keepNext: !!(sig && sig.t === 'sign') })); break;
      case 'h': children.push(new Paragraph({ children: [new TextRun({ text: b.text, bold: true, size: 22, color: st.col })], spacing: { before: 220, after: 100 }, keepNext: true })); break;
      case 'note': children.push(par(b.text, { italics: true, size: 16, color: '4A5560' })); break;
      case 'lines': children.push(par(b.items.join('\n'), { after: 120 })); break;
      case 'space': children.push(new Paragraph({ children: [] })); break;
      case 'pb': children.push(new Paragraph({ children: [new PageBreak()] })); break;
      case 'list':
        b.items.forEach((it, i) => children.push(new Paragraph({
          children: [new TextRun({ text: b.ordered ? `${i + 1}. ` : '•  ' }), ...runs(it)],
          alignment: AlignmentType.JUSTIFIED, indent: { left: 400, hanging: 300 }, spacing: { after: 80, line: 276 }
        })));
        break;
      case 'table': children.push(tabla(b.head, b.rows, b.widths, b)); children.push(new Paragraph({ children: [], spacing: { after: 60 } })); break;
      case 'kv': children.push(tabla(null, b.rows.map(r => [r[0], r[1]]), [38, 62], { kv: true, tall: b.tall })); children.push(new Paragraph({ children: [], spacing: { after: 60 } })); break;
      case 'legend':
        children.push(par('Leyenda:', { bold: true, size: 16, after: 40 }));
        b.items.forEach(i => children.push(new Paragraph({ spacing: { after: 20 }, children: [...(i.fill ? [new TextRun({ text: '     ', shading: { type: ShadingType.CLEAR, color: 'auto', fill: i.fill } }), new TextRun({ text: '  ' })] : []), new TextRun({ text: i.t, size: 16 })] })));
        children.push(new Paragraph({ children: [] }));
        break;
      case 'sign': {
        const porFila = Math.min(3, b.items.length) || 1;
        for (let i = 0; i < b.items.length; i += porFila) {
          const grupo = b.items.slice(i, i + porFila);
          const w = Math.round(W / porFila);
          const celdas = grupo.map(s => firmaCelda(s, w));
          while (celdas.length < porFila) celdas.push(celda('', w, { borders: sinBordes }));
          children.push(new Table({ rows: [new TableRow({ cantSplit: true, children: celdas })], width: { size: W, type: WidthType.DXA }, columnWidths: Array(porFila).fill(w), borders: sinBordes, layout: TableLayoutType.FIXED }));
        }
        children.push(new Paragraph({ children: [] }));
        break;
      }
      case 'big':
        children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 600, after: 300 }, children: runs(b.text, { bold: true, size: 72 }) }));
        if (b.sub) children.push(par(b.sub, { align: 'c', size: 28 }));
        break;
      case 'trebol': {
        const t = trebolPNG();
        children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ data: t.data, transformation: { width: 300, height: 300 } })] }));
        break;
      }
    }
  });

  /* Encabezado */
  const headerKids = [];
  if (doc.kind === 'sgc' && st.ficha) {
    if (c.I.logo) headerKids.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ data: c.I.logo.data, transformation: imgDims(c.I.logo, 130, 50) })] }));
  } else if (doc.kind === 'sgc') {
    const w1 = Math.round(W * 0.18), w3 = Math.round(W * 0.26), w2 = W - w1 - w3;
    const logoCell = c.I.logo
      ? [new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ data: c.I.logo.data, transformation: imgDims(c.I.logo, 90, 52) })] })]
      : [new Paragraph({ children: [] })];
    headerKids.push(new Table({
      width: { size: W, type: WidthType.DXA }, columnWidths: [w1, w2, w3], layout: TableLayoutType.FIXED,
      rows: [
        new TableRow({ children: [celda(logoCell, w1, { rowSpan: 2, valign: VerticalAlign.CENTER }), celda(e.inst, w2, { bold: true, align: 'c', size: 20, valign: VerticalAlign.CENTER }), celda('Código: ' + e.code, w3, { size: 16 })] }),
        new TableRow({ children: [celda(e.title.toUpperCase(), w2, { bold: true, align: 'c', size: 18, fill: st.muyClaro, valign: VerticalAlign.CENTER }), celda([par(`Versión: ${e.version}`, { size: 16, after: 0 }), par(`Fecha: ${e.fecha}`, { size: 16, after: 0 }), new Paragraph({ children: [new TextRun({ size: 16, children: ['Página ', PageNumber.CURRENT, ' de ', PageNumber.TOTAL_PAGES] })] })], w3)] })
      ]
    }));
    headerKids.push(new Paragraph({ children: [] }));
  } else if (doc.kind === 'carta') {
    const kids = [];
    if (c.I.logo) kids.push(new ImageRun({ data: c.I.logo.data, transformation: imgDims(c.I.logo, 120, 55) }));
    headerKids.push(new Paragraph({ children: kids }));
    headerKids.push(par(e.inst + (e.comercial ? '\n' + e.comercial : ''), { size: 16, color: '4A5560', after: 0 }));
  }
  const footerKids = [];
  if (doc.kind === 'carta') {
    footerKids.push(par(pieCarta(c), { size: 14, align: 'c', color: '4A5560', after: 0 }));
    footerKids.push(new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ size: 14, color: '4A5560', children: [PageNumber.CURRENT, '/', PageNumber.TOTAL_PAGES] })] }));
  } else if (doc.kind === 'sgc') {
    footerKids.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ size: 14, color: '4A5560', italics: true, children: [pieSgc(doc, c) + ' | Página ', PageNumber.CURRENT, ' de ', PageNumber.TOTAL_PAGES] })] }));
  } else {
    footerKids.push(new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ size: 14, color: '4A5560', children: [e.code + ' · ', PageNumber.CURRENT, '/', PageNumber.TOTAL_PAGES] })] }));
  }

  const d = new D.Document({
    creator: c.I.razonSocial || '',
    title: doc.title,
    styles: { default: { document: { run: { font: 'Arial', size: 20, color: COLOR_TEXTO } } } },
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838, orientation: doc.landscape ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT }, margin: { top: 1134, bottom: 1000, left: 1134, right: 1134, header: 450, footer: 400 } } },
      headers: { default: new Header({ children: headerKids.length ? headerKids : [new Paragraph({ children: [] })] }) },
      footers: { default: new Footer({ children: footerKids }) },
      children
    }]
  });
  return D.Packer.toBlob(d);
}

/* ================================================================ PDF */

function buildPDF(doc, c) {
  const { jsPDF } = window.jspdf;
  const st = estilo(c);
  const COL = hexRGB(st.col), CLARO = hexRGB(st.claro);
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: doc.landscape ? 'l' : 'p' });
  const PW = pdf.internal.pageSize.getWidth(), PH = pdf.internal.pageSize.getHeight();
  const ML = 20, MR = 20;
  const ficha = doc.kind === 'sgc' && st.ficha;
  const TOP = doc.kind === 'sgc' ? (ficha ? (c.I.logo ? 30 : 18) : 42) : (doc.kind === 'carta' ? 34 : 20);
  const BOT = doc.kind === 'rotulo' ? 16 : 20;
  const CW = PW - ML - MR;
  const FS = 10, LH = 4.9;
  let y = TOP;
  const e = encabezadoInfo(doc, c);
  pdf.setTextColor(31, 42, 51);
  pdf.setLineHeightFactor(1.25);

  const nueva = () => { pdf.addPage(); y = TOP; };
  const espacio = (h) => { if (y + h > PH - BOT) nueva(); };

  function rich(text, x, ancho, o = {}) {
    const size = o.size || FS, lh = o.lh || LH * size / FS;
    pdf.setFontSize(size);
    if (o.color) pdf.setTextColor(...o.color);
    const palabras = [];
    String(text == null ? '' : text).split('\n').forEach((ln, li, arr) => {
      segmentos(ln).forEach(s => s.text.split(/(\s+)/).forEach(w => { if (w && !/^\s+$/.test(w)) palabras.push({ w, b: s.bold || o.bold, it: o.italic }); }));
      if (li < arr.length - 1) palabras.push({ br: true });
    });
    const fuente = (p) => pdf.setFont('helvetica', p.b ? (p.it ? 'bolditalic' : 'bold') : (p.it ? 'italic' : 'normal'));
    const medir = (p) => { fuente(p); return pdf.getTextWidth(p.w); };
    fuente({});
    const esp = pdf.getTextWidth(' ');
    let linea = [], ancholinea = 0;
    const dibujar = (ultima) => {
      espacio(lh);
      const total = linea.reduce((a, p) => a + p.ancho, 0);
      const huecos = linea.length - 1;
      let sep = esp, xx = x;
      if (o.align === 'j' && !ultima && huecos > 0) sep = (ancho - total) / huecos;
      else if (o.align === 'c') xx = x + (ancho - total - esp * huecos) / 2;
      else if (o.align === 'r') xx = x + ancho - total - esp * huecos;
      linea.forEach(p => { fuente(p); pdf.text(p.w, xx, y + lh * 0.75); xx += p.ancho + sep; });
      y += lh;
      linea = []; ancholinea = 0;
    };
    palabras.forEach(p => {
      if (p.br) { dibujar(true); return; }
      p.ancho = medir(p);
      const extra = linea.length ? esp : 0;
      if (ancholinea + extra + p.ancho > ancho && linea.length) dibujar(false);
      linea.push(p); ancholinea += (linea.length > 1 ? esp : 0) + p.ancho;
    });
    if (linea.length) dibujar(true);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(31, 42, 51);
  }

  function tabla(head, rows, widths, o = {}) {
    const n = head ? head.length : rows[0].length;
    const ws = widths || Array(n).fill(100 / n);
    const colStyles = {};
    ws.forEach((w, i) => { colStyles[i] = { cellWidth: CW * w / 100 }; });
    if (o.kv) [0, 2].forEach(i => { if (colStyles[i]) { colStyles[i].fontStyle = 'bold'; colStyles[i].fillColor = CLARO; } });
    const headRows = [];
    (o.pre || []).forEach(r => headRows.push(r.map(x => ({ content: x.t || '', colSpan: x.s || 1, styles: x.t ? { halign: 'center' } : { fillColor: [255, 255, 255] } }))));
    if (head) headRows.push(head);
    pdf.autoTable({
      startY: y,
      head: headRows.length ? headRows : undefined,
      body: rows.map(r => r.map(x => {
        const f = cFill(x);
        const styles = {};
        if (f) styles.fillColor = hexRGB(f);
        if (cBold(x)) styles.fontStyle = 'bold';
        if (x && x.align === 'c') styles.halign = 'center';
        return { content: plano(cTxt(x)), styles };
      })),
      margin: { left: ML, right: MR, top: TOP, bottom: BOT },
      theme: 'grid',
      styles: { font: 'helvetica', fontSize: o.small ? 7.5 : 8.5, cellPadding: 1.4, textColor: [31, 42, 51], lineColor: [122, 136, 148], lineWidth: 0.2, valign: 'top', overflow: 'linebreak', minCellHeight: o.tall ? 7.5 : 0 },
      headStyles: { fillColor: COL, textColor: [255, 255, 255], fontStyle: 'bold', valign: 'middle', halign: 'center' },
      columnStyles: colStyles,
      rowPageBreak: 'avoid'
    });
    y = pdf.lastAutoTable.finalY + 4;
  }

  function firmas(items) {
    const porFila = Math.min(3, items.length) || 1;
    for (let i = 0; i < items.length; i += porFila) {
      const grupo = items.slice(i, i + porFila);
      const colW = CW / porFila;
      const alto = 30 + Math.max(...grupo.map(s => (s.role || '').split('\n').length + (s.top ? 1 : 0) + (s.ced ? 1 : 0))) * 3.8;
      espacio(alto);
      grupo.forEach((s, k) => {
        const x0 = ML + k * colW, cx = x0 + colW / 2;
        let yy = y;
        if (s.label) { pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.text(s.label + ':', x0 + 3, yy + 3); }
        if (s.sello && c.I.sello) {
          const d = imgDims(c.I.sello, 32, 22);
          pdf.addImage(c.I.sello.data, 'PNG', cx - d.width / 2, yy + 2, d.width, d.height);
        }
        yy += 20;
        pdf.setDrawColor(40, 40, 40); pdf.setLineWidth(0.3);
        pdf.line(cx - colW * 0.38, yy, cx + colW * 0.38, yy);
        yy += 4;
        pdf.setFontSize(8.5);
        if (s.top) { pdf.setFont('helvetica', 'bold'); pdf.splitTextToSize(s.top, colW - 6).forEach(l => { pdf.text(l, cx, yy, { align: 'center' }); yy += 3.8; }); }
        if (s.name) { pdf.setFont('helvetica', s.top ? 'normal' : 'bold'); pdf.splitTextToSize(s.name, colW - 6).forEach(l => { pdf.text(l, cx, yy, { align: 'center' }); yy += 3.8; }); }
        pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7.8);
        (s.role || '').split('\n').forEach(r => pdf.splitTextToSize(r, colW - 6).forEach(l => { pdf.text(l, cx, yy, { align: 'center' }); yy += 3.5; }));
        if (s.ced) pdf.text('C.I. ' + s.ced, cx, yy, { align: 'center' });
      });
      y += alto;
    }
    pdf.setFontSize(FS); pdf.setFont('helvetica', 'normal');
  }

  if (ficha) {
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(15); pdf.setTextColor(...COL);
    pdf.splitTextToSize(e.title.toUpperCase(), CW).forEach(l => { pdf.text(l, PW / 2, y + 5, { align: 'center' }); y += 7; });
    pdf.setTextColor(31, 42, 51);
    if (e.subtitle) { y += 1; rich(e.subtitle, ML, CW, { align: 'c', italic: true, size: 9, color: [74, 85, 96] }); }
    y += 3;
    tabla(null, filasFicha(doc, c), [20, 30, 20, 30], { kv: true, small: true });
    y += 2;
  }

  doc.blocks.forEach((b, bi) => {
    const sig = doc.blocks[bi + 1];
    if ((b.t === 'p' || b.t === 'note') && sig && sig.t === 'sign') espacio(LH * 2 + 40);
    switch (b.t) {
      case 'h': espacio(26); y += 2; rich(b.text, ML, CW, { bold: true, size: 10.5, color: COL }); y += 1.2; break;
      case 'p': rich(b.text, ML, CW, { align: b.align, bold: b.bold }); y += 2.2; break;
      case 'note': rich(b.text, ML, CW, { size: 8, italic: true, align: 'j' }); y += 2; break;
      case 'lines': b.items.forEach(t => rich(t, ML, CW, {})); y += 2; break;
      case 'space': y += 3; break;
      case 'pb': nueva(); break;
      case 'list':
        b.items.forEach((it, i) => {
          espacio(LH);
          pdf.setFontSize(FS); pdf.setFont('helvetica', 'normal');
          pdf.text(b.ordered ? `${i + 1}.` : '•', ML + 2, y + LH * 0.75);
          rich(it, ML + 7, CW - 7, { align: 'j' });
          y += 1;
        });
        y += 1.5;
        break;
      case 'table': tabla(b.head, b.rows, b.widths, b); break;
      case 'kv': tabla(null, b.rows.map(r => [r[0], r[1]]), [38, 62], { kv: true, tall: b.tall }); break;
      case 'legend': {
        espacio(6 + b.items.length * 4.5);
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.text('Leyenda:', ML, y + 3); y += 5;
        pdf.setFont('helvetica', 'normal');
        b.items.forEach(i => {
          let x = ML;
          if (i.fill) { pdf.setFillColor(...hexRGB(i.fill)); pdf.rect(ML, y, 6, 3, 'F'); x += 8; }
          pdf.text(i.t, x, y + 2.6); y += 4.5;
        });
        y += 2; pdf.setFontSize(FS);
        break;
      }
      case 'sign': y += 2; firmas(b.items); break;
      case 'big': {
        pdf.setFont('helvetica', 'bold');
        let size = 40;
        let lines;
        do { pdf.setFontSize(size); lines = b.text.split('\n').flatMap(t => pdf.splitTextToSize(t, CW)); size -= 2; } while (lines.length * size * 0.5 > PH * 0.45 && size > 18);
        const lh = (size + 2) * 0.45;
        y = Math.max(y, doc.blocks[0] === b ? PH * 0.25 : y + 6);
        lines.forEach(l => { pdf.text(l, PW / 2, y, { align: 'center' }); y += lh; });
        if (b.sub) { pdf.setFont('helvetica', 'normal'); pdf.setFontSize(14); y += 4; pdf.splitTextToSize(b.sub, CW).forEach(l => { pdf.text(l, PW / 2, y, { align: 'center' }); y += 6; }); }
        pdf.setFontSize(FS); pdf.setFont('helvetica', 'normal');
        break;
      }
      case 'trebol': {
        const t = trebolPNG(), s = doc.landscape ? 70 : 90;
        pdf.addImage(t.data, 'PNG', PW / 2 - s / 2, y + 6, s, s);
        y += s + 18;
        break;
      }
    }
  });

  /* Encabezado y pie en todas las páginas */
  const total = pdf.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    pdf.setPage(i);
    pdf.setDrawColor(122, 136, 148); pdf.setLineWidth(0.25); pdf.setTextColor(31, 42, 51);
    if (ficha) {
      if (c.I.logo) { const d = imgDims(c.I.logo, 45, 16); pdf.addImage(c.I.logo.data, 'PNG', PW / 2 - d.width / 2, 9, d.width, d.height); }
    } else if (doc.kind === 'sgc') {
      const y0 = 12, h = 24, w1 = CW * 0.18, w3 = CW * 0.26, w2 = CW - w1 - w3;
      pdf.rect(ML, y0, CW, h);
      pdf.line(ML + w1, y0, ML + w1, y0 + h);
      pdf.line(ML + w1 + w2, y0, ML + w1 + w2, y0 + h);
      pdf.line(ML + w1, y0 + h / 2, ML + CW, y0 + h / 2);
      if (c.I.logo) { const d = imgDims(c.I.logo, w1 - 4, h - 4); pdf.addImage(c.I.logo.data, 'PNG', ML + (w1 - d.width) / 2, y0 + (h - d.height) / 2, d.width, d.height); }
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9.5);
      const li = pdf.splitTextToSize(e.inst, w2 - 4).slice(0, 2);
      li.forEach((l, k) => pdf.text(l, ML + w1 + w2 / 2, y0 + 5 + k * 4 + (li.length === 1 ? 2 : 0), { align: 'center' }));
      pdf.setFontSize(8.5);
      const lt = pdf.splitTextToSize(e.title.toUpperCase(), w2 - 4).slice(0, 2);
      lt.forEach((l, k) => pdf.text(l, ML + w1 + w2 / 2, y0 + h / 2 + 5 + k * 3.8 + (lt.length === 1 ? 2 : 0), { align: 'center' }));
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7.5);
      const xm = ML + w1 + w2 + 2;
      pdf.text(pdf.splitTextToSize(`Código: ${e.code}`, w3 - 3)[0], xm, y0 + 4.5);
      pdf.text(`Versión: ${e.version}`, xm, y0 + 9);
      pdf.text(`Fecha: ${e.fecha}`, xm, y0 + h / 2 + 4.5);
      pdf.text(`Página ${i} de ${total}`, xm, y0 + h / 2 + 9);
    } else if (doc.kind === 'carta') {
      let x = ML;
      if (c.I.logo) { const d = imgDims(c.I.logo, 40, 16); pdf.addImage(c.I.logo.data, 'PNG', ML, 10, d.width, d.height); x = ML + d.width + 4; }
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.text(pdf.splitTextToSize(e.inst, PW - MR - x)[0], PW - MR, 15, { align: 'right' });
      if (e.comercial) { pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.text(e.comercial, PW - MR, 19, { align: 'right' }); }
      pdf.setDrawColor(...COL); pdf.line(ML, 28, PW - MR, 28);
    }
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7.2); pdf.setTextColor(74, 85, 96); pdf.setDrawColor(122, 136, 148);
    if (doc.kind === 'carta') {
      pdf.line(ML, PH - 16, PW - MR, PH - 16);
      pdf.splitTextToSize(pieCarta(c), CW - 20).slice(0, 2).forEach((l, k) => pdf.text(l, PW / 2, PH - 12 + k * 3.5, { align: 'center' }));
      pdf.text(`${i}/${total}`, PW - MR, PH - 12, { align: 'right' });
    } else if (doc.kind === 'sgc') {
      pdf.setFont('helvetica', 'italic');
      const t = pdf.splitTextToSize(`${pieSgc(doc, c)} | Página ${i} de ${total}`, CW)[0];
      pdf.text(t, PW / 2, PH - 10, { align: 'center' });
    } else {
      pdf.text(`${e.code} · ${i}/${total}`, PW - MR, PH - 8, { align: 'right' });
    }
  }
  return pdf.output('blob');
}

/* ================================================================ EXCEL */

function agregarHojaExcel(wb, doc, c, usados) {
  const st = estilo(c);
  let nombre = doc.code.replace(/[\\/*?:[\]]/g, '-').slice(0, 31);
  let k = 2;
  while (usados.has(nombre)) nombre = (doc.code.slice(0, 27) + '_' + k++);
  usados.add(nombre);
  const ws = wb.addWorksheet(nombre, { pageSetup: { paperSize: 9, orientation: doc.landscape ? 'landscape' : 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0, margins: { left: 0.5, right: 0.5, top: 0.6, bottom: 0.6, header: 0.3, footer: 0.3 } } });
  ws.views = [{ showGridLines: false }];
  const tablas = doc.blocks.filter(b => b.t === 'table');
  const nCols = Math.max(4, ...tablas.map(t => t.head.length));
  const anchoTotal = doc.landscape ? 150 : 100;
  const base = tablas.find(t => t.head.length === nCols);
  const pct = base && base.widths ? base.widths : null;
  for (let i = 1; i <= nCols; i++) ws.getColumn(i).width = Math.max(6, Math.round(pct ? anchoTotal * pct[i - 1] / 100 : anchoTotal / nCols));
  if (base && !pct) {
    const fijo = base.head.filter(h => /^N\.?º?°?$/.test(h)).length;
    const resto = (anchoTotal - fijo * 6) / (nCols - fijo || 1);
    base.head.forEach((h, i) => { ws.getColumn(i + 1).width = /^N\.?º?°?$/.test(h) ? 6 : Math.max(8, Math.round(resto)); });
  }
  const anchoCol = (i) => ws.getColumn(i).width || 10;
  const anchoRango = (a, b) => { let s = 0; for (let i = a; i <= b; i++) s += anchoCol(i); return s; };
  const borde = { style: 'thin', color: { argb: 'FF7A8894' } };
  const bordes = { top: borde, left: borde, bottom: borde, right: borde };
  const alto = (texto, ancho, base = 15) => Math.max(base, Math.ceil(String(texto || '').length / Math.max(1, ancho * 1.1)) * 13 + 4);
  const relleno = (hex) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + hex } });
  const e = encabezadoInfo(doc, c);
  let r = 1;

  if (doc.kind !== 'rotulo') {
    ws.mergeCells(1, 1, 3, 1);
    ws.mergeCells(1, 2, 1, nCols - 1); ws.mergeCells(2, 2, 2, nCols - 1); ws.mergeCells(3, 2, 3, nCols - 1);
    const c1 = ws.getCell(1, 2); c1.value = e.inst; c1.font = { bold: true, size: 12 }; c1.alignment = { horizontal: 'center', vertical: 'middle' };
    const c2 = ws.getCell(2, 2); c2.value = e.title.toUpperCase(); c2.font = { bold: true, size: 12, color: { argb: 'FF' + st.col } }; c2.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    const c3 = ws.getCell(3, 2); c3.value = c.P.nombre; c3.alignment = { horizontal: 'center' }; c3.font = { italic: true, size: 9 };
    ws.getCell(1, nCols).value = 'Código: ' + e.code;
    ws.getCell(2, nCols).value = 'Versión: ' + e.version;
    ws.getCell(3, nCols).value = 'Fecha: ' + e.fecha;
    for (let rr = 1; rr <= 3; rr++) for (let cc = 1; cc <= nCols; cc++) { ws.getCell(rr, cc).border = bordes; if (cc === nCols) { ws.getCell(rr, cc).font = { size: 9 }; ws.getCell(rr, cc).alignment = { wrapText: true, vertical: 'middle' }; } }
    ws.getRow(1).height = 24; ws.getRow(2).height = 30; ws.getRow(3).height = 16;
    if (c.I.logo) {
      const id = wb.addImage({ base64: c.I.logo.data, extension: 'png' });
      const d = imgDims(c.I.logo, Math.max(40, anchoCol(1) * 7 - 6), 62);
      ws.addImage(id, { tl: { col: 0.1, row: 0.15 }, ext: { width: d.width, height: d.height } });
    }
    r = 5;
  }
  const filaTexto = (texto, o = {}) => {
    ws.mergeCells(r, 1, r, nCols);
    const cell = ws.getCell(r, 1);
    cell.value = plano(texto);
    cell.alignment = { wrapText: true, vertical: 'top', horizontal: o.align || 'left' };
    cell.font = { bold: !!o.bold, italic: !!o.italic, size: o.size || 10, color: o.color ? { argb: o.color } : undefined };
    if (o.fill) cell.fill = relleno(o.fill);
    ws.getRow(r).height = o.height || alto(plano(texto), anchoRango(1, nCols), 15);
    r++;
  };

  doc.blocks.forEach(b => {
    switch (b.t) {
      case 'h': r++; filaTexto(b.text, { bold: true, fill: st.muyClaro, color: 'FF' + st.col }); break;
      case 'p': filaTexto(b.text, { bold: b.bold, align: b.align === 'c' ? 'center' : (b.align === 'r' ? 'right' : 'left') }); break;
      case 'note': filaTexto(b.text, { italic: true, size: 9 }); break;
      case 'lines': b.items.forEach(t => filaTexto(t, { height: 15 })); break;
      case 'space': r++; break;
      case 'pb': r += 2; break;
      case 'list': b.items.forEach((it, i) => filaTexto(`${b.ordered ? (i + 1) + '.' : '•'} ${it}`)); break;
      case 'legend':
        filaTexto('Leyenda:', { bold: true, size: 9 });
        b.items.forEach(i => { if (i.fill) ws.getCell(r, 1).fill = relleno(i.fill); const cc = ws.getCell(r, 2); ws.mergeCells(r, 2, r, nCols); cc.value = i.t; cc.font = { size: 9 }; r++; });
        r++;
        break;
      case 'big': r++; filaTexto(b.text, { bold: true, size: 20, align: 'center', height: 30 * (b.text.split('\n').length + 1) }); if (b.sub) filaTexto(b.sub, { align: 'center' }); r++; break;
      case 'trebol': filaTexto('[Símbolo internacional de radiación ionizante]', { align: 'center', italic: true }); break;
      case 'kv':
        b.rows.forEach(([kk, v]) => {
          ws.mergeCells(r, 1, r, 2); ws.mergeCells(r, 3, r, nCols);
          const a = ws.getCell(r, 1), bb = ws.getCell(r, 3);
          a.value = kk; a.font = { bold: true, size: 10 }; a.fill = relleno(st.claro);
          bb.value = plano(v);
          a.alignment = bb.alignment = { wrapText: true, vertical: 'top' };
          for (let cc = 1; cc <= nCols; cc++) ws.getCell(r, cc).border = bordes;
          ws.getRow(r).height = Math.max(b.tall ? 24 : 15, alto(v, anchoRango(3, nCols)), alto(kk, anchoRango(1, 2)));
          r++;
        });
        r++;
        break;
      case 'table': {
        const n = b.head.length;
        const ultimo = (i) => (i === n - 1 && n < nCols) ? nCols : i + 1;
        (b.pre || []).forEach(row => {
          let col = 1;
          row.forEach(x => {
            const s = x.s || 1, fin = col + s - 1 === n && n < nCols ? nCols : col + s - 1;
            if (fin > col) ws.mergeCells(r, col, r, fin);
            const cell = ws.getCell(r, col);
            cell.value = x.t || '';
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            cell.font = { bold: true, size: 9, color: { argb: 'FFFFFFFF' } };
            if (x.t) cell.fill = relleno(st.col);
            for (let cc = col; cc <= fin; cc++) ws.getCell(r, cc).border = bordes;
            col = fin + 1;
          });
          ws.getRow(r).height = 18;
          r++;
        });
        const escribir = (vals, esHead) => {
          let hmax = esHead ? 20 : (b.tall ? 22 : 15);
          vals.forEach((v, i) => {
            const col = i + 1, fin = ultimo(i);
            if (fin > col) ws.mergeCells(r, col, r, fin);
            const cell = ws.getCell(r, col);
            const txt = plano(cTxt(v));
            cell.value = txt;
            cell.alignment = { wrapText: true, vertical: esHead ? 'middle' : 'top', horizontal: esHead || (v && v.align === 'c') ? 'center' : 'left' };
            cell.font = { bold: esHead || cBold(v), size: 9, color: esHead ? { argb: 'FFFFFFFF' } : undefined };
            const f = esHead ? st.col : cFill(v);
            if (f) cell.fill = relleno(f);
            for (let cc = col; cc <= fin; cc++) ws.getCell(r, cc).border = bordes;
            hmax = Math.max(hmax, alto(txt, anchoRango(col, fin)));
          });
          ws.getRow(r).height = hmax;
          r++;
        };
        escribir(b.head, true);
        b.rows.forEach(row => escribir(row, false));
        r++;
        break;
      }
      case 'sign': {
        r++;
        const por = Math.min(3, b.items.length) || 1;
        const span = Math.max(1, Math.floor(nCols / por));
        for (let i = 0; i < b.items.length; i += por) {
          const grupo = b.items.slice(i, i + por);
          const filas = [g => g.label ? g.label + ':' : '', () => '', () => '', () => '______________________', g => g.top || '', g => g.name || '', g => (g.role || '').replace(/\n/g, ' – '), g => g.ced ? 'C.I. ' + g.ced : ''];
          filas.forEach((fn, fi) => {
            if (fi === 4 && !grupo.some(g => g.top)) return;
            grupo.forEach((g, kk) => {
              const c0 = 1 + kk * span, c1 = kk === por - 1 ? nCols : c0 + span - 1;
              if (c1 > c0) ws.mergeCells(r, c0, r, c1);
              const cell = ws.getCell(r, c0);
              cell.value = fn(g);
              cell.alignment = { horizontal: 'center', wrapText: true };
              cell.font = { bold: fi === 0 || fi === 4 || (fi === 5 && !g.top), size: 9 };
            });
            r++;
          });
          r++;
        }
        break;
      }
    }
  });
  ws.headerFooter.oddFooter = `&L${e.code}&C${pieSgc(doc, c).replace(/&/g, '&&')}&RPágina &P de &N`;
  return ws;
}

async function buildXLSX(docs, c) {
  const wb = new ExcelJS.Workbook();
  wb.creator = c.I.razonSocial || '';
  wb.created = new Date();
  const usados = new Set();
  docs.forEach(d => agregarHojaExcel(wb, d, c, usados));
  const buf = await wb.xlsx.writeBuffer();
  return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
