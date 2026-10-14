/* Memoria de cálculo de blindaje (Anexo VI de la Norma Técnica) con la metodología del NCRP 147.
   Se carga después de manual.js y registra su documento en DOCS.

   Transmisión requerida:      B = P · d² / (K · U · N · T)
   Espesor (ajuste de Archer): x = 1 / (α·γ) · ln[(B^-γ + β/α) / (1 + β/α)]
   Transmisión de un espesor:  B(x) = [(1 + β/α) · e^(α·γ·x) − β/α]^(-1/γ)
   Los valores de K, α, β y γ se toman de las tablas del NCRP 147 y se registran en la tabla de parámetros. */

const BL_MATERIALES = ['Concreto', 'Ladrillo', 'Plomo', 'Vidrio plomado', 'Puerta plomada', 'Bloque', 'Otro (mm Pb equivalente)'];
const BL_ZONAS = ['ZC', 'ZNC'];
const esPlomo = (m) => /plomo|plomad|Pb/i.test(m || '');

function archerEspesor(B, a, b, g) {
  if (B == null || !(a > 0) || !(g > 0) || b == null) return null;
  if (B >= 1) return 0;
  const r = b / a;
  return Math.max(0, Math.log((Math.pow(B, -g) + r) / (1 + r)) / (a * g));
}

function archerTransmision(x, a, b, g) {
  if (!(a > 0) || !(g > 0) || b == null) return null;
  if (!x) return 1;
  const r = b / a;
  return Math.pow((1 + r) * Math.exp(a * g * x) - r, -1 / g);
}

const blNum = (v) => { const n = nivel(v); return n == null ? null : n; };

function blParametro(c, nombre) {
  const p = (c.S.blParams || []).find(x => x.nombre && x.nombre === nombre) || {};
  const f = (k) => blNum(p[k]);
  return { nombre: p.nombre || '', K: f('k'), pb: [f('aPb'), f('bPb'), f('gPb')], co: [f('aCo'), f('bCo'), f('gCo')], prePb: f('prePb') || 0, preCo: f('preCo') || 0, fuente: p.fuente || '' };
}

function blSalaDe(c, nombre) { return (c.S.blSalas || []).find(s => s.sala === nombre) || {}; }

// Kerma sin blindaje por semana a 1 m (mGy/semana): K × N, o para TC Σ κ × DLP × N
function blKN(sala, prm) {
  const kc = blNum(sala.ctKappaCab), dc = blNum(sala.ctDlpCab), nc = blNum(sala.ctNCab);
  const kb = blNum(sala.ctKappaCue), db = blNum(sala.ctDlpCue), nb = blNum(sala.ctNCue);
  if (/tomo/i.test(sala.modalidad || '') && ((kc && dc && nc) || (kb && db && nb))) {
    return { KN: (kc && dc && nc ? kc * dc * nc : 0) + (kb && db && nb ? kb * db * nb : 0), ct: true };
  }
  const N = blNum(sala.n);
  return { KN: prm.K != null && N ? prm.K * N : null, ct: false };
}

function calcularBarrera(c, br) {
  const M = c.M;
  const sala = blSalaDe(c, br.sala);
  const prm = blParametro(c, br.param);
  const primaria = /primaria/i.test(br.tipo || '');
  const U = primaria ? (fraccion(br.u) ?? 1) : 1;
  const T = fraccion(br.t) ?? 1;
  const d = blNum(br.d);
  const P = br.zona === 'ZC' ? (blNum(M.blPc) ?? 0.1) : (blNum(M.blPnc) ?? 0.02);
  const { KN, ct } = blKN(sala, prm);
  const B = (KN && d) ? P * d * d / (KN * U * T) : null;
  const xPb = B == null ? null : Math.max(0, (archerEspesor(B, ...prm.pb) ?? NaN) - (primaria ? prm.prePb : 0));
  const xCo = B == null ? null : Math.max(0, (archerEspesor(B, ...prm.co) ?? NaN) - (primaria ? prm.preCo : 0));
  const rc = blNum(M.blDensConcreto) || 2.35, rl = blNum(M.blDensLadrillo) || 1.8;
  const xLad = xCo == null || isNaN(xCo) ? null : xCo * rc / rl;
  // Transmisión de la barrera existente: material principal (en concreto equivalente o plomo) × plomo adicional
  const ex = blNum(br.existente) || 0, exPb = blNum(br.plomoAdic) || 0;
  let pbTotal = exPb, coTotal = 0;
  if (esPlomo(br.material)) pbTotal += ex;
  else if (/ladrillo|bloque/i.test(br.material || '')) coTotal = ex * rl / rc;
  else coTotal = ex;
  const preB = primaria ? (archerTransmision(prm.prePb, ...prm.pb) ?? 1) : 1;
  const Bpb = archerTransmision(pbTotal, ...prm.pb), Bco = archerTransmision(coTotal, ...prm.co);
  const Bex = (Bpb != null && Bco != null) ? Bpb * Bco * preB : null;
  const sinExistente = !ex && !exPb;
  const cumple = (B == null || Bex == null || isNaN(xPb) || sinExistente) ? null : Bex <= B * 1.0001;
  return { P, U, T, d, KN, ct, B, xPb: isNaN(xPb) ? null : xPb, xCo: isNaN(xCo) ? null : xCo, xLad, Bex, cumple, primaria, prm, rc, rl };
}

const mm = (v, dec = 1) => v == null ? '—' : num2(v, dec);

function docMemoriaBlindaje(c) {
  const { I, R, P, M } = c;
  const salas = (c.S.blSalas || []).filter(s => s.sala);
  const barreras = (c.S.blBarreras || []).filter(b => b.punto || b.descripcion);
  const params = (c.S.blParams || []).filter(p => p.nombre);
  const interv = c.S.practica === 'intervencionista';
  const calc = barreras.map(b => ({ b, r: calcularBarrera(c, b) }));
  const Pc = blNum(M.blPc) ?? 0.1, Pnc = blNum(M.blPnc) ?? 0.02;
  const rc = blNum(M.blDensConcreto) || 2.35, rl = blNum(M.blDensLadrillo) || 1.8;
  const elaborador = `${[R.osrTitulo, R.osrNombre].filter(Boolean).join(' ') || '[Nombre]'}${R.osrProfesion ? ', ' + R.osrProfesion : ''}${R.osrAut ? ' – autorización de OSR ' + R.osrAut : ''}`;
  const blocks = [
    H('Carátula'),
    KV([
      ['Institución', ph(I.razonSocial, 'Razón social') + (I.nombreComercial ? ` (${I.nombreComercial})` : '')],
      ['Sala(s) para la(s) que se realiza el cálculo', salas.map(s => s.sala).join(', ') || '[Sala]'],
      ['Profesional que elabora la memoria', elaborador],
      ['Fecha de presentación', fLarga(M.blFecha || c.fecha)],
      ['N.º de revisión', M.blRevision || '01']
    ]),
    SIGN([{ ...c.firmas.rep, label: 'Representante legal' }, { ...c.firmas.osr, label: 'Elaborado por' }]),
    PB(),
    H('1. Datos generales'),
    Ps('1.1. Datos de la instalación', { bold: true }),
    KV([
      ['Razón social', ph(I.razonSocial, 'Razón social')],
      ['Nombre comercial', I.nombreComercial || 'No aplica'],
      ['RUC', ph(I.ruc, 'RUC')],
      ['Representante legal', I.repEmpresa ? `${I.repEmpresa} (Rep.: ${ph(I.repLegal, 'Nombre')})` : ph(I.repLegal, 'Representante legal')],
      ['Dirección', ph(I.direccion, 'Dirección')],
      ['Provincia / ciudad', `${ph(I.provincia, 'Provincia')} / ${ph(I.ciudad, 'Ciudad')}`],
      ['Correo electrónico', ph(I.correo, 'Correo')],
      ['Teléfono', ph(I.telefono, 'Teléfono')],
      ['Código postal', I.codPostal || '[Código postal]']
    ]),
    Ps('1.2. Datos del profesional que elabora el cálculo', { bold: true }),
    KV([
      ['Nombre completo', [R.osrTitulo, R.osrNombre].filter(Boolean).join(' ') || '[Nombre]'],
      ['N.° licencia personal / autorización de OSR', [R.osrLicencia || R.osrCedula, R.osrAut].filter(Boolean).join(' / ') || '[N.º]'],
      ['Vigencia', R.osrAutCad ? fCorta(R.osrAutCad) : '[Vigencia]'],
      ['Correo electrónico', R.osrCorreo || '[Correo]'],
      ['Teléfono', R.osrTelefono || '[Teléfono]']
    ]),
    Ps('1.3. Información específica', { bold: true }),
    KV([
      ['Práctica', P.nombre],
      ['Tipo de equipo (categoría)', salas.map(s => { const e = c.eq.find(x => x.serie && x.serie === s.serie) || {}; return `${s.sala}: ${e.tipo || s.modalidad || '[tipo]'}${s.categoria ? ` (categoría ${s.categoria})` : ''}`; }).join('; ') || '[Tipo de equipo]'],
      ['Ubicación en la institución', salas.map(s => `${s.sala}: ${s.ubicacion || '[ubicación]'}`).join('; ') || '[Ubicación]']
    ]),
    H('2. Objetivo de la memoria de cálculo'),
    Ps(M.blObjetivo || `Determinar el espesor de blindaje que necesitan las barreras primarias y secundarias de ${salas.length > 1 ? 'las salas' : 'la sala'} ${salas.map(s => s.sala).join(', ') || '[sala]'} para que la dosis semanal en las áreas colindantes no supere los objetivos de diseño del NCRP 147 para zonas controladas y no controladas, y verificar si los materiales existentes o proyectados cumplen ese requisito con la carga de trabajo prevista.`, { align: 'j' }),
    H('3. Justificación de la práctica'),
    Ps(M.blJustificacion || M.manualJustificacion || `La institución requiere ${P.corto} para el diagnóstico${interv ? ' y el tratamiento guiado por imagen' : ''} de los pacientes que atiende; el beneficio clínico de estos estudios supera el detrimento asociado a la exposición, siempre que se apliquen la optimización y los límites de dosis que exige la Norma Técnica. Un blindaje bien dimensionado protege al personal y al público sin restringir el uso de las áreas vecinas.`, { align: 'j' }),
    H('4. Descripción del equipo')
  ];
  if (!salas.length) blocks.push(Ps('[Registre al menos una sala en la sección Memoria de blindaje.]'));
  salas.forEach(s => {
    const e = c.eq.find(x => x.serie && x.serie === s.serie) || {};
    blocks.push(Ps(s.sala, { bold: true }));
    blocks.push(T(['Tipo de equipo', 'Marca', 'Modelo', 'Serie', 'kV máx. de diseño', 'mA máx. de diseño'], [[e.tipo || s.modalidad || '[tipo]', e.marca || 'NR', e.modelo || 'NR', e.serie || s.serie || 'NR', { t: s.kvMax || I.kvMax || '[kV]', align: 'c' }, { t: s.maMax || I.maMax || '[mA]', align: 'c' }]], { widths: [24, 16, 18, 14, 14, 14], small: true }));
  });
  blocks.push(H('5. Plano a escala del servicio'));
  salas.forEach(s => { if (s.plano) blocks.push({ t: 'img', img: s.plano, maxH: 160, caption: `Plano de ${s.sala}: barreras identificadas con mayúsculas en sentido horario, zonas controlada y no controlada, flujo de pacientes y POE` }); });
  blocks.push(Ps(`El plano en formato ${M.blFormatoPlano || 'A3'} se adjunta como anexo y contiene:`, { align: 'j' }));
  blocks.push(L([
    'La sala de rayos X en estudio y las áreas colindantes, firmado por un arquitecto o ingeniero civil.',
    `La descripción de los materiales de construcción y del acabado de las superficies${M.blMateriales ? `: ${M.blMateriales}` : ''}.`,
    'La identificación de los puntos de cálculo (barreras) con letras mayúsculas en sentido horario.',
    'La delimitación de las zonas controlada y no controlada.',
    'El flujo tecnológico y la ubicación del equipo, con el desplazamiento de pacientes y POE desde el ingreso hasta la sala.',
    `Los elementos de control de acceso y de protección radiológica: ${M.blElementos || 'luz roja de advertencia sobre la puerta, rótulos con el símbolo de radiación, puerta plomada y ventana plomada en la consola'}.`
  ], true));
  blocks.push(
    H('6. Fundamento teórico'),
    Ps('a) Conceptos básicos', { bold: true }),
    Ps('El blindaje estructural reduce la radiación que atraviesa paredes, piso, techo, puertas y ventanas hasta un valor que no supere el objetivo de diseño (P) en el punto de interés, ubicado a 0,3 m de la cara exterior de la barrera. Se distinguen las **barreras primarias**, sobre las que incide el haz útil, y las **secundarias**, que solo reciben radiación dispersa por el paciente y radiación de fuga de la coraza del tubo.', { align: 'j' }),
    Ps('El cálculo combina la **carga de trabajo** (número de pacientes por semana, N), el **kerma en aire sin blindaje por paciente a 1 m** (K) según el tipo de sala, el **factor de uso** (U, fracción de la carga de trabajo en que el haz primario apunta a la barrera), el **factor de ocupación** (T, fracción del tiempo en que la persona más expuesta permanece en el área) y la **distancia** (d) desde la fuente o el isocentro hasta el punto de cálculo.', { align: 'j' }),
    Ps('b) Consideraciones para el cálculo', { bold: true }),
    L([
      `Protocolo: NCRP Report No. 147, Structural Shielding Design for Medical X-Ray Imaging Facilities (2004), con los valores de sus tablas.`,
      `Objetivos de diseño (P): ${num2(Pc, 2)} mGy/semana de kerma en aire para zonas controladas (ZC) y ${num2(Pnc, 2)} mGy/semana para zonas no controladas (ZNC).`,
      'Factores de ocupación y de uso según las tablas del NCRP 147, ajustados a la ocupación real de cada área colindante.',
      'Para las barreras secundarias se usa U = 1 y la suma de radiación dispersa y de fuga incluida en el kerma secundario por paciente.',
      ...(params.some(p => blNum(p.prePb) || blNum(p.preCo)) ? ['En las barreras primarias se descuenta el preblindaje que aportan la mesa, la rejilla y el receptor de imagen.'] : []),
      `Ladrillo: el espesor se obtiene por equivalencia de densidad con el concreto (ρ concreto = ${num2(rc, 2)} g/cm³; ρ ladrillo = ${num2(rl, 2)} g/cm³), x ladrillo = x concreto × ρ concreto / ρ ladrillo${M.blLadrilloNota ? `. ${M.blLadrilloNota}` : ''}.`
    ]),
    Ps('c) Metodología de cálculo', { bold: true }),
    Ps('Para cada barrera se calcula la transmisión requerida:', { align: 'j' }),
    Ps('B = P · d² / (K · U · N · T)', { bold: true, align: 'c' }),
    Ps('y el espesor de material que la produce con la ecuación de ajuste de Archer, cuyos parámetros α, β y γ dependen del material y del espectro de la sala (tablas del NCRP 147):', { align: 'j' }),
    Ps('x = [1 / (α · γ)] · ln[(B^-γ + β/α) / (1 + β/α)]', { bold: true, align: 'c' }),
    Ps('Para verificar una barrera existente se calcula su transmisión con la forma inversa, B(x) = [(1 + β/α) · e^(α·γ·x) − β/α]^(-1/γ), multiplicando la del material principal por la del plomo adicional si lo hubiera, y se compara con la transmisión requerida: la barrera cumple si su transmisión es igual o menor.', { align: 'j' })
  );
  if (salas.some(s => /tomo/i.test(s.modalidad || ''))) blocks.push(Ps('En tomografía computarizada el kerma secundario semanal a 1 m del isocentro se estima a partir del producto dosis-longitud: K = κ × DLP × N, con κ diferente para estudios de cabeza y de cuerpo según el NCRP 147.', { align: 'j' }));
  // d) ejemplo con la barrera que requiere mayor blindaje
  const conDato = calc.filter(x => x.r.xPb != null);
  const peor = conDato.sort((a, b) => (b.r.xPb || 0) - (a.r.xPb || 0))[0];
  blocks.push(Ps('d) Ejemplo de cálculo (barrera que requiere mayor blindaje)', { bold: true }));
  if (peor) {
    const { b, r } = peor;
    const [aP, bP, gP] = r.prm.pb, [aC, bC, gC] = r.prm.co;
    blocks.push(Ps(`Barrera **${b.punto}** – ${b.descripcion || 'sin descripción'}: barrera ${r.primaria ? 'primaria' : 'secundaria'} de ${b.sala}, hacia una ${b.zona === 'ZC' ? 'zona controlada' : 'zona no controlada'}.`, { align: 'j' }));
    blocks.push(KV([
      ['Objetivo de diseño P', `${num2(r.P, 2)} mGy/semana`],
      ['Distancia d', `${num2(r.d, 2)} m`],
      [r.ct ? 'Kerma semanal sin blindaje a 1 m (Σ κ × DLP × N)' : `K × N (${r.prm.nombre})`, `${num2(r.KN, 2)} mGy/semana${r.ct ? '' : ` (K = ${num2(r.prm.K, 4)} mGy/paciente; N = ${blSalaDe(c, b.sala).n || '[N]'} pacientes/semana)`}`],
      ['U / T', `${num2(r.U, 2)} / ${b.t || '1'}`],
      ['Transmisión requerida', `B = ${num2(r.P, 2)} × ${num2(r.d, 2)}² / (${num2(r.KN, 2)} × ${num2(r.U, 2)} × ${b.t || '1'}) = ${r.B < 0.001 ? r.B.toExponential(3).replace('.', ',') : num2(r.B, 4)}`],
      ['Plomo (α, β, γ)', `${num2(aP, 4)}; ${num2(bP, 4)}; ${num2(gP, 4)} mm⁻¹ → x = ${mm(r.xPb, 2)} mm Pb${r.primaria && r.prm.prePb ? ` (descontado el preblindaje de ${num2(r.prm.prePb, 2)} mm)` : ''}`],
      ['Concreto (α, β, γ)', aC ? `${num2(aC, 4)}; ${num2(bC, 4)}; ${num2(gC, 4)} mm⁻¹ → x = ${mm(r.xCo)} mm de concreto` : 'Sin parámetros registrados'],
      ['Ladrillo (equivalencia de densidad)', r.xLad != null ? `${mm(r.xCo)} × ${num2(r.rc, 2)} / ${num2(r.rl, 2)} = ${mm(r.xLad)} mm` : '—'],
      ['Barrera existente', `${b.existente || '0'} mm de ${(b.material || 'material').toLowerCase()}${blNum(b.plomoAdic) ? ` + ${b.plomoAdic} mm Pb` : ''} → B = ${r.Bex == null ? '—' : r.Bex.toExponential(3).replace('.', ',')} → ${r.cumple == null ? 'sin verificar' : (r.cumple ? 'cumple' : 'no cumple')}`]
    ]));
  } else blocks.push(Ps('[Registre las barreras y los parámetros K, α, β y γ del NCRP 147 para desarrollar el ejemplo.]'));
  // e) resultados
  blocks.push(Ps('e) Resultados', { bold: true }));
  const filas = calc.map(({ b, r }) => [
    b.descripcion || '', { t: b.punto || '', align: 'c', bold: true }, { t: r.primaria ? 'Primaria' : 'Secundaria', align: 'c' }, { t: [b.material, blNum(b.plomoAdic) ? `+ ${b.plomoAdic} mm Pb` : ''].filter(Boolean).join(' '), align: 'c' },
    { t: r.d ? num2(r.d * 1000, 0) : '—', align: 'c' }, { t: b.t || '1', align: 'c' }, { t: r.primaria ? (b.u || '1') : '1', align: 'c' }, { t: b.zona || '', align: 'c' },
    { t: mm(r.xCo), align: 'c' }, { t: mm(r.xPb, 2), align: 'c' }, { t: mm(r.xLad), align: 'c' }, { t: b.existente || '—', align: 'c' },
    { t: r.cumple == null ? '—' : (r.cumple ? 'SÍ' : 'NO'), align: 'c', bold: true, fill: r.cumple == null ? null : (r.cumple ? 'C6E0B4' : 'F8CBAD') }
  ]);
  blocks.push(T(['Descripción del punto de cálculo', 'Punto', 'Tipo de barrera', 'Tipo de material', 'Distancia isocentro–punto (mm)', 'T', 'U', 'Zona (ZC/ZNC)', 'Espesor calc. concreto (mm)', 'Espesor calc. plomo (mm)', 'Espesor calc. ladrillo (mm)', 'Espesor existente (mm)', 'Cumple SÍ/NO'],
    filas.length ? filas : [['', '', '', '', '', '', '', '', '', '', '', '', '']], { widths: [16, 5, 8, 10, 8, 5, 5, 6, 8, 7, 8, 7, 7], small: true }));
  // f) tomografía
  const ct = salas.filter(s => /tomo/i.test(s.modalidad || ''));
  if (ct.length) {
    blocks.push(Ps('f) Datos de tomografía computarizada', { bold: true }));
    blocks.push(T(['Sala', 'nCTDI100 cabeza (mGy/mAs)', 'nCTDI100 cuerpo (mGy/mAs)', 'mAs cabeza', 'mAs cuerpo', 'DLP cabeza (mGy·cm)', 'DLP cuerpo (mGy·cm)', 'Estudios/semana cabeza / cuerpo'],
      ct.map(s => [s.sala, { t: s.ctNctdiCab || '—', align: 'c' }, { t: s.ctNctdiCue || '—', align: 'c' }, { t: s.ctMasCab || '—', align: 'c' }, { t: s.ctMasCue || '—', align: 'c' }, { t: s.ctDlpCab || '—', align: 'c' }, { t: s.ctDlpCue || '—', align: 'c' }, { t: `${s.ctNCab || '—'} / ${s.ctNCue || '—'}`, align: 'c' }]), { small: true }));
  }
  // g) intervencionismo
  const tiempos = salas.flatMap(s => String(s.intTiempos || '').split('\n').map(l => l.trim()).filter(Boolean).map(l => { const [tipo, t] = l.split(/[:=;]/); return [s.sala, (tipo || '').trim(), { t: (t || '').trim() || '—', align: 'c' }]; }));
  if (interv || tiempos.length) {
    blocks.push(Ps(`${ct.length ? 'g' : 'f'}) Tiempo promedio por tipo de intervención`, { bold: true }));
    blocks.push(T(['Sala', 'Tipo de intervención', 'Tiempo promedio de fluoroscopia (min)'], tiempos.length ? tiempos : [['', '[Coronariografía, angioplastia, embolización…]', '']], { widths: [25, 50, 25], small: true }));
  }
  // conclusiones
  const no = calc.filter(x => x.r.cumple === false), sin = calc.filter(x => x.r.cumple == null);
  blocks.push(H('7. Conclusiones'));
  blocks.push(L([
    calc.length
      ? (no.length
        ? `Las barreras ${no.map(x => x.b.punto).join(', ')} no alcanzan el blindaje requerido. Antes de operar el equipo se debe reforzarlas hasta al menos el espesor calculado (por ejemplo, con lámina de plomo adicional) y presentar la memoria actualizada.`
        : (sin.length < calc.length ? `Todas las barreras verificadas cumplen con el blindaje requerido para la carga de trabajo prevista y los objetivos de diseño del NCRP 147.` : '[Complete los espesores existentes para concluir.]'))
      : '[Registre las barreras.]',
    ...(sin.length && calc.length ? [`${sin.length} ${sin.length === 1 ? 'barrera no tiene' : 'barreras no tienen'} datos suficientes para la verificación (parámetros del NCRP 147, distancia, carga de trabajo o espesor existente).`] : []),
    'La Autoridad Reguladora aprueba la memoria solo si todas las barreras cumplen con el blindaje calculado. Una vez construido o reforzado el blindaje, se verificará con un levantamiento radiométrico.',
    'Cualquier cambio de equipo, de carga de trabajo o del uso de las áreas colindantes obliga a revisar este cálculo.'
  ]));
  blocks.push(
    H('8. Siglas y abreviaciones'),
    T(['Sigla', 'Significado'], [
      ['B', 'Transmisión de la barrera'], ['d', 'Distancia de la fuente o isocentro al punto de cálculo'], ['DLP', 'Producto dosis-longitud'], ['K', 'Kerma en aire sin blindaje por paciente a 1 m'], ['N', 'Número de pacientes por semana'],
      ['nCTDI100', 'Índice de dosis en TC normalizado por mAs'], ['NCRP', 'National Council on Radiation Protection and Measurements'], ['OSR', 'Oficial de Seguridad Radiológica'], ['P', 'Objetivo de diseño (mGy/semana)'], ['POE', 'Personal ocupacionalmente expuesto'],
      ['T', 'Factor de ocupación'], ['U', 'Factor de uso'], ['ZC / ZNC', 'Zona controlada / zona no controlada'], ['α, β, γ', 'Parámetros de ajuste de Archer para la transmisión']
    ].map(r => [{ t: r[0], bold: true }, r[1]]), { widths: [20, 80], small: true }),
    H('9. Referencias bibliográficas'),
    L([
      'National Council on Radiation Protection and Measurements. NCRP Report No. 147: Structural Shielding Design for Medical X-Ray Imaging Facilities. Bethesda, 2004.',
      'Ministerio de Energía y Recursos Naturales No Renovables. Acuerdo Ministerial MERNNR-MERNNR-2022-0011-AM, Norma Técnica para las Actividades de Licenciamiento y Operación en Radiología Intervencionista, Radiodiagnóstico Médico, Odontológico y Veterinario. Registro Oficial, Cuarto Suplemento N.º 11, 25 de febrero de 2022.',
      'Reglamento de Seguridad Radiológica, Decreto Supremo N.º 3640. Registro Oficial N.º 891, 8 de agosto de 1979.',
      'Archer BR, Thornby JI, Bushong SC. Diagnostic X-ray shielding design based on an empirical model of photon attenuation. Health Physics 44(5):507-517, 1983.'
    ]),
    H('10. Anexos'),
    L(['Plano a escala en formato A1 o A3.', 'Tablas del NCRP 147 utilizadas.', 'Hoja técnica del equipo.', 'Copia de la autorización de OSR o de la licencia personal de quien elabora la memoria.'])
  );
  if (params.length) {
    blocks.push(Ps('Parámetros utilizados (tablas del NCRP 147)', { bold: true }));
    blocks.push(T(['Conjunto', 'K (mGy/paciente a 1 m)', 'Plomo α', 'Plomo β', 'Plomo γ', 'Concreto α', 'Concreto β', 'Concreto γ', 'Preblindaje Pb / concreto (mm)', 'Fuente'],
      params.map(p => [p.nombre, { t: p.k || '—', align: 'c' }, { t: p.aPb || '—', align: 'c' }, { t: p.bPb || '—', align: 'c' }, { t: p.gPb || '—', align: 'c' }, { t: p.aCo || '—', align: 'c' }, { t: p.bCo || '—', align: 'c' }, { t: p.gCo || '—', align: 'c' }, { t: `${p.prePb || '0'} / ${p.preCo || '0'}`, align: 'c' }, p.fuente || 'NCRP 147']), { widths: [18, 9, 8, 8, 8, 8, 8, 8, 10, 15], small: true }));
  }
  return { title: 'Memoria de cálculo de blindaje', subtitle: `Contenido según el Anexo VI de la Norma Técnica; metodología NCRP 147`, kind: 'sgc', landscape: true, blocks };
}

(function () {
  registrarDoc({ id: 'MEM-BLI', tipo: 'MEM-BLI', grupo: 'Informes y listados', aplica: () => true, build: docMemoriaBlindaje, nota: 'Anexo VI · requisito I.31 (categoría 1, 2, móviles, telecomandados y TC)' }, 'LEV-RAD');
  const req = REQUISITOS.find(r => r.id === 'I-31');
  if (req && !req.doc) req.doc = ['MEM-BLI'];
})();
