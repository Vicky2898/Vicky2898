/* Manual de Seguridad Radiológica (Anexo V), informe de levantamiento radiométrico (Anexo VII),
   informe de interpretación dosimétrica, formato de aptitud médica y registro de asistencia.
   Se carga después de documentos.js y registra sus documentos en DOCS. */

const NOM_NORMA = 'Norma Técnica para las Actividades de Licenciamiento y Operación en Radiología Intervencionista, Radiodiagnóstico Médico, Odontológico y Veterinario';
const restriccionPOE = (c) => nivel(c.M.restriccionPOE) || 6;
const restriccionPublico = (c) => nivel(c.M.restriccionPublico) || 1;
const num2 = (n, d = 2) => (n == null || isNaN(n)) ? '—' : Number(n).toFixed(d).replace('.', ',');
const marca = (b) => b ? '[X]' : '[  ]';
const codigos = (c, ids) => ids.map(id => codigoDoc(c, id)).filter(Boolean).join(', ');

/* ================================================================ MANUAL (ANEXO V) */

function zonasDeLaInstalacion(c) {
  const salas = [...new Set(c.eqAct.map(e => e.sala).filter(Boolean))];
  const controladas = salas.length ? salas : c.eqAct.map(e => e.tipo);
  return {
    controladas,
    supervisadas: c.M.zonasSupervisadas || 'Consola de mando, pasillo de acceso a las salas, vestidores externos y sala de espera inmediata'
  };
}

function riesgosPractica(c) {
  const r = [
    ['Ingreso de una persona a la sala durante la exposición', 'Exposición no planificada del POE o de un miembro del público', 2, 2, 'Señalización luminosa y rótulos en la puerta, puerta cerrada durante la exposición, visión directa del paciente desde la consola', 'Verificar la luz roja en cada jornada; recordar el procedimiento en la capacitación anual'],
    ['Exposición de un paciente equivocado o de un estudio no prescrito', 'Dosis innecesaria al paciente', 2, 2, 'Verificación de la identidad con dos datos y de la prescripción documentada', 'Doble verificación antes del disparo; registro e investigación del incidente'],
    ['Paciente embarazada no identificada', 'Dosis al embrión o feto', 3, 2, 'Pregunta sistemática de embarazo, rótulo informativo, procedimiento de justificación', 'Estimación de la dosis fetal por el responsable de protección radiológica e información a la paciente'],
    ['Falla del temporizador o del interruptor de exposición', 'Exposición prolongada del paciente y de quienes estén en la sala', 3, 1, 'Mantenimiento preventivo y control de calidad anual por empresa autorizada; interruptores de emergencia', 'Cortar la alimentación del equipo, retirarlo de servicio y notificar al servicio técnico'],
    ['Deterioro del blindaje de las prendas plomadas', 'Dosis del POE mayor a la esperada', 2, 2, 'Prueba anual de integridad con imágenes de al menos 60 kVp; almacenamiento en percha', 'Retiro y reposición de la prenda no apta'],
    ['Modificación o deterioro de las barreras estructurales', 'Dosis al público en áreas adyacentes', 2, 1, 'Memoria de cálculo de blindaje y levantamiento radiométrico', 'Nuevo levantamiento radiométrico después de cualquier modificación'],
    ['Uso incorrecto, olvido o pérdida del dosímetro', 'Registro dosimétrico que no representa la exposición real', 1, 3, 'Almacenamiento fuera de la zona controlada, capacitación sobre el uso del dosímetro', 'Investigación y asignación de una dosis estimada al periodo'],
    ['Repetición de estudios por error técnico', 'Dosis innecesaria al paciente', 1, 3, 'Tablas de técnicas, control automático de exposición calibrado, procedimientos técnicos firmados', 'Análisis periódico de rechazo y repetición de imágenes']
  ];
  if (c.S.practica === 'intervencionista') {
    r.push(['Procedimiento prolongado o complejo con Ka,r mayor a 5 Gy', 'Lesión cutánea en el paciente (efecto determinista)', 4, 2, 'Indicador de dosis en consola, aviso en voz alta desde 3 Gy, cambio de angulación', 'Información al paciente y control a las 2 a 4 semanas']);
    r.push(['Trabajo sin mampara suspendida o sin lentes plomados', 'Dosis elevada en cristalino del médico intervencionista', 3, 2, 'Mampara cielítica, cortina bajo la mesa, lentes de 0,2 mm Pb, dosímetro de cristalino', 'Supervisión del OSR y revisión de la dosis de cristalino']);
  }
  if (c.tiene(/Tomógrafo computarizado/)) r.push(['Uso de un protocolo de adulto en un paciente pediátrico', 'Dosis innecesaria al paciente pediátrico', 3, 1, 'Protocolos por edad y peso revisados periódicamente (num. 13.1.5)', 'Revisión de CTDIvol y DLP antes de cada adquisición']);
  if (c.S.practica === 'odontologico') r.push(['Operador o acompañante sosteniendo el receptor intraoral', 'Exposición de la mano al haz directo', 2, 2, 'Uso obligatorio de posicionadores', 'Capacitación y supervisión del responsable']);
  return r;
}

function nivelRiesgo(s, p) {
  const v = s * p;
  if (v >= 9) return { t: `Alto (${v})`, fill: 'F8CBAD', align: 'c' };
  if (v >= 5) return { t: `Medio (${v})`, fill: 'FFE699', align: 'c' };
  return { t: `Bajo (${v})`, fill: 'C6E0B4', align: 'c' };
}

function docManual(c) {
  const { I, R, P, S, M } = c;
  const z = zonasDeLaInstalacion(c);
  const interv = S.practica === 'intervencionista';
  const odont = S.practica === 'odontologico';
  const salasTxt = z.controladas.join(', ') || '[salas de rayos X]';
  const equipos = c.eqAct.map((e, i) => [{ t: String(i + 1), align: 'c' }, e.tipo || '', e.marca || 'NR', e.modelo || 'NR', e.serie || 'NR', `${e.tuboMarca || 'NR'} / ${e.tuboSerie || 'NR'}`, e.sala || '', e.uso || '']);
  const riesgos = riesgosPractica(c).map((r, i) => [{ t: String(i + 1), align: 'c' }, r[0], r[1], { t: String(r[2]), align: 'c' }, { t: String(r[3]), align: 'c' }, nivelRiesgo(r[2], r[3]), r[4], r[5]]);
  const fmt = (ids) => codigos(c, ids);
  const blocks = [
    H('1. Carátula'),
    KV([
      ['Institución / razón social', ph(I.razonSocial, 'Razón social')],
      ['Nombre comercial', I.nombreComercial || 'No aplica'],
      ['Práctica', P.nombre],
      ['Fecha de presentación', fLarga(M.manualFecha || c.fecha)],
      ['N.º de revisión', M.manualRevision || M.version || '01'],
      ['Elaborado por', `${[R.osrTitulo, R.osrNombre].filter(Boolean).join(' ') || '[Nombre]'}, ${R.osrProfesion || ''} – ${c.rolOSR}${R.osrAut ? ', autorización ' + R.osrAut : ''}${R.osrAutCad ? ' vigente hasta ' + fCorta(R.osrAutCad) : ''}`],
      ['Representante legal', I.repEmpresa ? `${I.repEmpresa} (Rep.: ${ph(I.repLegal, 'Nombre')}, C.I. ${I.repCedula || '[cédula]'})` : `${ph(I.repLegal, 'Nombre')}, C.I. ${I.repCedula || '[cédula]'}`]
    ]),
    SIGN([{ ...c.firmas.rep, label: 'Representante legal' }, { ...c.firmas.osr, label: 'Elaborado por' }]),
    NOTE('El Anexo V exige que el profesional que elabora el manual (especialista en protección radiológica, físico médico, físico, biofísico u OSR con autorización vigente) tenga capacitación en el área de aplicación y experiencia de al menos un año.'),
    PB(),
    H('2. Datos generales'),
    KV([
      ['Razón social', ph(I.razonSocial, 'Razón social')],
      ['Nombre comercial', I.nombreComercial || 'No aplica'],
      ['RUC', ph(I.ruc, 'RUC')],
      ['Representante legal', I.repEmpresa ? `${I.repEmpresa} (Rep.: ${ph(I.repLegal, 'Nombre')})` : ph(I.repLegal, 'Representante legal')],
      [c.rolOSR, [R.osrTitulo, R.osrNombre].filter(Boolean).join(' ') || '[Nombre]'],
      ['Cédula', R.osrCedula || '[Cédula]'],
      ['N.º de autorización / caducidad', R.osrAut ? `${R.osrAut} / ${R.osrAutCad ? fCorta(R.osrAutCad) : '[caducidad]'}` : 'No aplica'],
      ['Práctica', P.nombre],
      ['Dirección', ph(I.direccion, 'Dirección')],
      ['Ciudad – provincia', `${ph(I.ciudad, 'Ciudad')} – ${ph(I.provincia, 'Provincia')}`],
      ['Teléfono', ph(I.telefono, 'Teléfono')],
      ['Código postal', I.codPostal || '[Código postal]']
    ]),
    H('3. Antecedentes'),
    Ps(`${ph(I.razonSocial, 'Razón social')}${I.nombreComercial ? ` (${I.nombreComercial})` : ''} presta servicios de ${P.corto} en ${ubicacion(c)}, con ${c.eqAct.length || '[n]'} ${c.eqAct.length === 1 ? 'equipo generador' : 'equipos generadores'} de radiación ionizante${I.licencia ? ` amparados en la licencia institucional tipo C ${I.licencia}${I.licenciaCad ? ', vigente hasta el ' + fLarga(I.licenciaCad) : ''}` : ''}. El servicio cuenta con ${c.poe.length || '[n]'} personas ocupacionalmente expuestas con licencia personal tipo A.`, { align: 'j' }),
    Ps(`Este manual se elabora conforme al Anexo V de la ${NOM_NORMA} (Acuerdo Ministerial MERNNR-MERNNR-2022-0011-AM) y al Reglamento de Seguridad Radiológica (D.S. 3640). El numeral 5.5 lit. b) de la Norma dispone que las prácticas de categoría 1 y 2 cumplan lo establecido en el manual y lleven los registros de su ejecución.`, { align: 'j' }),
    H('4. Objetivo'),
    Ps(`Establecer las normas, procedimientos y responsabilidades que garantizan que la práctica de ${P.corto} de la institución se desarrolle con el menor riesgo razonablemente posible para el personal ocupacionalmente expuesto, los pacientes, sus acompañantes y el público, cumpliendo los principios de justificación, optimización y limitación de dosis.`, { align: 'j' }),
    H('5. Justificación'),
    Ps(M.manualJustificacion || `La práctica de ${P.corto} es indispensable para el diagnóstico${interv ? ' y el tratamiento mínimamente invasivo' : ''} de los pacientes que atiende la institución. El beneficio clínico de cada estudio supera el detrimento asociado a la exposición, siempre que el estudio esté prescrito, se justifique de forma individual y se realice con técnicas optimizadas.`, { align: 'j' }),
    H('6. Ubicación dentro de la instalación'),
    Ps(M.manualUbicacion || `El servicio funciona en ${ph(I.direccion, 'Dirección')}. Las salas con equipos generadores de radiación ionizante (${salasTxt}) se ubican de forma que sus puertas de acceso den a áreas de circulación controlada del servicio. El plano a escala de la instalación, con las áreas colindantes, se adjunta como anexo.`, { align: 'j' }),
    H('7. Descripción de las instalaciones'),
    Ps(`Cada sala cuenta con barreras estructurales de acuerdo con el diseño de blindaje, puerta con blindaje, señalización con el símbolo internacional de radiación y la leyenda «Rayos X», luz roja de advertencia sobre la puerta y consola de mando con visión directa del paciente.`, { align: 'j' }),
    Ps('7.1. Fuentes de radiación / equipos generadores', { bold: true }),
    T(['N.°', 'Tipo', 'Marca', 'Modelo', 'Serie', 'Tubo (marca / serie)', 'Ubicación', 'Uso'], equipos.length ? equipos : [['', '', '', '', '', '', '', '']], { widths: [4, 16, 11, 12, 12, 17, 14, 14], small: true }),
    ...(I.kvMax || I.maMax ? [Ps(`Valores máximos autorizados en la licencia: ${I.kvMax ? I.kvMax + ' kV' : ''}${I.kvMax && I.maMax ? ' y ' : ''}${I.maMax ? I.maMax + ' mA' : ''}.`)] : []),
    H('8. Flujo tecnológico y ubicación de equipos'),
    Ps(M.manualFlujo || `El paciente ingresa por recepción, donde se verifica la prescripción; espera en la sala de espera, que es zona libre; pasa al vestidor y luego a la sala de rayos X acompañado por el operador. El POE accede a la sala por la misma puerta y se ubica en la consola de mando, detrás de la barrera, durante la exposición. Al terminar, el paciente sale por el mismo recorrido. El plano con el flujo de pacientes y del POE se adjunta como anexo.`, { align: 'j' }),
    H('9. Descripción de los elementos de seguridad'),
    L([
      'Señalización en la parte exterior de cada puerta con el símbolo internacional de radiación ionizante y las leyendas «Rayos X» y de prohibición de ingreso a personas no autorizadas (num. 5.2 lit. d).',
      'Luz roja sobre la puerta con la advertencia «Se prohíbe la entrada cuando la luz esté encendida», accionada durante la exposición (num. 10.2.4).',
      'Rótulos para pacientes, acompañantes y embarazadas en un lugar visible (num. 5.2 lit. f).',
      'Puertas blindadas que se mantienen cerradas durante las exposiciones (num. 5.2 lit. c y e).',
      'Consola de mando con visión directa del paciente y comunicación verbal (num. 6.1.3 lit. e).',
      `Elementos de protección radiológica: ${c.epp.length ? [...new Set(c.epp.map(e => tipoCorto(e.tipo)))].join(', ').toLowerCase() : '[inventario de EPR]'}, según el inventario ${fmt(['REG-EPP'])}.`,
      ...(interv ? ['Cortinas plomadas bajo la mesa, mampara móvil y cielítica (num. 10.1 lit. i); interruptores manuales para interrumpir la irradiación dentro de la sala (num. 10.2.5).'] : [])
    ]),
    H('10. Clasificación de zonas'),
    T(['Zona', 'Ubicación', 'Criterio'], [
      [{ t: 'Controlada', bold: true, fill: 'F8CBAD' }, salasTxt, 'Interior de las salas de irradiación. Se requieren medidas de protección específicas y acceso restringido al POE y al paciente.'],
      [{ t: 'Supervisada', bold: true, fill: 'FFE699' }, z.supervisadas, 'Se vigilan las condiciones de exposición; ninguna persona debe recibir más que el límite de dosis del público (num. 6.1.4 lit. c).'],
      [{ t: 'Libre', bold: true, fill: 'C6E0B4' }, M.zonasLibres || 'Recepción, sala de espera general, oficinas y demás áreas del establecimiento', 'Sin restricciones por radiación.']
    ], { widths: [14, 36, 50], small: true }),
    Ps('10.1. Normas generales de seguridad', { bold: true }),
    L([
      'Solo el personal con licencia personal tipo A vigente opera los equipos (num. 5.3 lit. c).',
      'Toda exposición requiere prescripción documentada y justificación (num. 5.1 lit. k).',
      'El POE porta su dosímetro durante toda la jornada (Reglamento, Art. 5).',
      'Se colima al área de interés y se usan los parámetros de los procedimientos técnicos firmados.',
      'Cualquier falla, incidente o condición insegura se comunica de inmediato al responsable de protección radiológica.'
    ]),
    Ps('10.2. Normas generales y acceso para zonas controladas', { bold: true }),
    L([
      'Durante la exposición solo permanecen en la sala el paciente y, cuando sea indispensable, el personal estrictamente necesario con sus prendas de protección.',
      'Las puertas permanecen cerradas y la luz roja encendida mientras el generador está activo.',
      'No permanecen personas en los vestidores internos durante la operación del equipo, y la sala se usa para un solo paciente a la vez (num. 6.1.3 lit. c y f).',
      'Un acompañante solo ingresa si el paciente lo necesita, con delantal y collarín, fuera del haz directo; nunca una persona gestante (num. 6.1.4 lit. b).'
    ]),
    Ps('10.3. Normas generales y acceso para zonas supervisadas', { bold: true }),
    L([
      'Las personas cuya presencia no es indispensable permanecen fuera de la zona controlada durante la operación del equipo (num. 6.1.4 lit. a).',
      'La consola de mando se mantiene despejada y con visión directa de la sala.',
      'El levantamiento radiométrico verifica que en estas zonas no se supere el límite de dosis del público.'
    ]),
    H('11. Sistema de gestión'),
    Ps(`11.1. **Declaración del representante legal.** El representante legal reconoce expresamente que es el máximo responsable de la seguridad radiológica en el documento ${fmt(['DEC-MAX'])}. Las responsabilidades de todo el personal constan en ${fmt(['FUN-RESP'])}, con la aceptación de cada trabajador.`, { align: 'j' }),
    Ps(`11.2. **Política de seguridad radiológica.** ${M.manualPolitica || `${ph(I.nombreComercial || I.razonSocial, 'La institución')} declara que la seguridad radiológica de sus trabajadores, de los pacientes y del público es un asunto de la más alta prioridad. Ningún objetivo asistencial o económico justifica una exposición innecesaria. La institución provee los recursos para cumplir la normativa, mantiene a su personal capacitado y promueve que cualquier persona reporte sin temor las condiciones inseguras.`}`, { align: 'j' }),
    Ps('11.3. **Estructura organizacional y líneas de comunicación.**', { align: 'j' }),
    T(['Nivel', 'Cargo', 'Comunica a', 'Asuntos de seguridad'], [
      ['1', 'Representante legal / licenciatario', 'Autoridad Reguladora', 'Licencias, notificaciones, recursos y decisiones sobre incidentes'],
      ['2', c.rolOSR, 'Representante legal', 'Dosimetría, vigilancia médica, capacitación, registros, inspecciones, incidentes'],
      ['3', P.tituloResp, 'OSR y representante legal', 'Justificación, protocolos, dosis de pacientes, incidentes clínicos'],
      ['4', odont ? 'Odontólogos y tecnólogos operadores' : 'Tecnólogos y licenciados en radiología', 'OSR y médico responsable', 'Fallas del equipo, repeticiones, incidentes, uso de dosímetros y prendas'],
      ['5', interv ? 'Enfermería, anestesiología e instrumentación' : 'Personal de apoyo y administrativo', 'OSR', 'Condiciones inseguras, acompañamiento de pacientes, señalización']
    ], { widths: [8, 28, 22, 42], small: true }),
    Ps('11.4. **Programa de monitoreo y verificación.**', { align: 'j' }),
    T(['Parámetro', 'Frecuencia', 'Responsable', 'Registro'], [
      ['Dosimetría personal', c.V.dosPeriodo || 'Bimestral', c.rolOSR, fmt(['REG-DOS', 'REC-DOS', 'INF-DOS'])],
      ['Mantenimiento preventivo y correctivo', 'Anual como mínimo (num. 5.6 lit. a)', 'Empresa autorizada', fmt(['REG-EQ'])],
      ['Control de calidad de los equipos', 'Anual como mínimo (num. 5.6 lit. b)', 'Empresa autorizada', 'Informes técnicos de control de calidad'],
      ['Levantamiento radiométrico', 'Anual y después de cualquier modificación', c.rolOSR, fmt(['LEV-RAD'])],
      ['Integridad del blindaje del EPR', 'Cada 12 meses (num. 5.4 lit. a)', c.rolOSR, fmt(['INF-DEL'])],
      ['Señalización, luz roja y comunicación con el paciente', 'Mensual', c.rolOSR, 'Lista de verificación interna'],
      ['Vigencia de licencias y autorizaciones', 'Trimestral', c.rolOSR, fmt(['NOM-POE', 'REG-LIC'])],
      ['Vigilancia médica del POE', 'Anual (Reglamento, Art. 112)', 'Médico ocupacional', fmt(['REG-MED', 'FOR-APT'])],
      ['Capacitación', 'Según el plan anual', c.rolOSR, fmt(['PLAN-CAP', 'REG-CAP'])]
    ], { widths: [30, 25, 20, 25], small: true }),
    Ps('11.5. **Programa de evaluación sistemática.** Se realiza una auditoría interna anual, a cargo del responsable de protección radiológica, con la lista de verificación de requisitos del Oficio de inspección y de esta norma. Las inspecciones de la Autoridad Reguladora se consideran auditorías externas y sus disposiciones se registran y cierran en el registro de inspecciones.', { align: 'j' }),
    Ps('11.6. **Programa de mejora continua.** Cada no conformidad de una auditoría, inspección, incidente o investigación de dosis genera una acción correctiva con responsable y plazo. El responsable de protección radiológica verifica su eficacia y lo informa al representante legal (Anexo III, num. 21).', { align: 'j' }),
    Ps(`11.7. **Plan de clausura.** Se describe en la sección 17 de este manual.`, { align: 'j' }),
    H('12. Evaluación de la seguridad'),
    Ps('La evaluación se realiza con un análisis preliminar de peligros: para cada suceso iniciador se estima la severidad (S, de 1 a 4) y la probabilidad (P, de 1 a 4); el producto define el nivel de riesgo. Se describen las barreras existentes y las medidas preventivas y correctivas (num. 12.1 a 12.5 del Anexo V).', { align: 'j' }),
    T(['N.°', 'Suceso iniciador', 'Consecuencia potencial', 'S', 'P', 'Riesgo', 'Barreras existentes', 'Medidas preventivas / correctivas'], riesgos, { widths: [4, 17, 15, 4, 4, 9, 24, 23], small: true }),
    NOTE('Severidad: 1 leve, 2 moderada, 3 grave, 4 muy grave. Probabilidad: 1 improbable, 2 poco probable, 3 probable, 4 frecuente. Riesgo bajo: 1 a 4; medio: 5 a 8; alto: 9 a 16.'),
    H('13. Exposición ocupacional'),
    Ps('13.1. **Límites de dosis** (Norma Técnica, num. 5.2 lit. a):', { align: 'j' }),
    T(['Magnitud', 'POE', 'Público'], [
      ['Dosis efectiva', '20 mSv/año promediados en 5 años, sin superar 50 mSv en un año', '1 mSv/año'],
      ['Dosis equivalente en cristalino', '20 mSv/año promediados en 5 años, sin superar 50 mSv en un año', '—'],
      ['Extremidades o piel', '500 mSv/año', '—'],
      ['Embrión o feto (num. 6.1.1 lit. c)', '1 mSv durante la gestación', '—']
    ], { widths: [30, 50, 20], small: true }),
    Ps(`13.2. **Restricciones de dosis.** Como meta de optimización, la institución adopta una restricción de **${num2(restriccionPOE(c), 1)} mSv/año** de dosis efectiva para el POE y de **${num2(restriccionPublico(c), 1)} mSv/año** para los miembros del público en las áreas colindantes. Superar la restricción no constituye una infracción, pero obliga a revisar las condiciones de trabajo.`, { align: 'j' }),
    Ps('13.3. **Monitoreo por puesto de trabajo.**', { align: 'j' }),
    T(['Puesto', 'Exposición', 'Dosimetría', 'Prendas'], [
      [P.tituloResp, interv ? 'Junto al paciente durante la fluoroscopia' : 'Ocasional en la sala', interv ? 'Cuerpo entero, cristalino y extremidades' : 'Cuerpo entero', interv ? 'Delantal, collarín, lentes, gorro, guantes' : 'Delantal y collarín cuando permanece en la sala'],
      [odont ? 'Odontólogo operador' : 'Tecnólogo / licenciado', odont ? 'Disparo desde la barrera o a 2 m' : 'Consola; ocasional junto al paciente en portátiles', interv ? 'Cuerpo entero y cristalino' : 'Cuerpo entero', 'Delantal y collarín cuando permanece en la sala'],
      ...(interv ? [['Enfermería y anestesia', 'Junto al paciente', 'Cuerpo entero', 'Delantal, collarín y lentes']] : []),
      [c.rolOSR, 'Ocasional', 'Cuerpo entero', 'Según la tarea']
    ], { widths: [24, 28, 24, 24], small: true }),
    Ps(`13.4. **Vigilancia dosimétrica.** Se realiza con un laboratorio autorizado (${c.V.dosEmpresa || '[laboratorio]'}), con recambio ${String(c.V.dosPeriodo || 'bimestral').toLowerCase()}, según el procedimiento ${fmt(['PROC-DOS'])} y los formatos ${fmt(['REC-DOS', 'REG-DOS', 'INF-DOS'])}.`, { align: 'j' }),
    Ps('13.5. **Estimación de dosis en exposiciones accidentales y de emergencia.** Para una persona en el haz directo, el kerma en aire se estima con el rendimiento del tubo obtenido en el último control de calidad: K = Y(d) × mAs × (d₀/d)², donde Y es el rendimiento en mGy/mAs a la distancia de referencia d₀. Para una persona expuesta a radiación dispersa se toma, como aproximación conservadora, el 0,1 % del kerma de entrada del paciente a 1 m, corregido por el inverso del cuadrado de la distancia (NCRP 147). Cuando la persona portaba dosímetro, se solicita su lectura extraordinaria al laboratorio.', { align: 'j' }),
    Ps(`13.6. **Procedimiento para dosis que sobrepasan el nivel de investigación** (1,5 mSv en un mes): se aplica el capítulo 6 del procedimiento ${fmt(['PROC-DOS'])}; la conclusión se documenta en el informe de interpretación dosimétrica ${fmt(['INF-DOS'])}.`, { align: 'j' }),
    Ps(`13.7. **Uso del dosímetro.** El dosímetro se porta a la altura del tórax, bajo el delantal cuando se usa${interv ? '; el de cristalino a la altura de los ojos y el de extremidades en la mano dominante' : ''}. Al terminar la jornada queda almacenado en la institución fuera de la zona controlada (num. 6.1.2 lit. c).`, { align: 'j' }),
    Ps(`13.8. **Personas embarazadas.** Se aplica el documento ${fmt(['DEC-EMB'])}: notificación, reasignación a labores sin contacto directo con radiación (Reglamento, Art. 112 lit. e) y control de la dosis al feto bajo 1 mSv.`, { align: 'j' }),
    Ps(`13.9 a 13.11. **Capacitaciones.** El programa anual para el POE consta en ${fmt(['PLAN-CAP'])}. Para los empleados que no forman parte del POE (recepción, limpieza, administración, seguridad) se imparte cada año una sesión de una hora sobre el significado de la señalización, la prohibición de ingresar a las salas con la luz encendida y a quién reportar una situación anómala.`, { align: 'j' }),
    Ps('13.12. **Registros.**', { align: 'j' }),
    T(['Registro', 'Formato'], [
      ['13.12.1. Historial dosimétrico', fmt(['REG-DOS', 'REC-DOS', 'INF-DOS'])],
      ['13.12.2. Vigilancia de la salud', fmt(['REG-MED', 'FOR-APT'])],
      ['13.12.3. Capacitaciones y entrenamientos', fmt(['PLAN-CAP', 'REG-CAP'])],
      ['13.12.4. Licencias y autorizaciones', fmt(['REG-LIC', 'NOM-POE', 'BT-LIC'])],
      ['13.12.5. Levantamientos radiométricos', fmt(['LEV-RAD'])],
      ['13.12.6. Dosis que sobrepasan el nivel de investigación', `${fmt(['INF-DOS'])} y anexos de investigación`]
    ], { widths: [45, 55], small: true }),
    H('14. Exposición del público'),
    Ps(`14.1. **Programa de monitoreo del área.** El levantamiento radiométrico (${fmt(['LEV-RAD'])}) se realiza cada año y después de cualquier cambio de equipo o de la instalación, en puntos ubicados en la consola, puertas, ventanas y áreas colindantes. Los resultados se comparan con la restricción de ${num2(restriccionPublico(c), 1)} mSv/año para el público.`, { align: 'j' }),
    Ps('14.2. **Protección de familiares, personas próximas y voluntarios.** Solo ingresa a la sala un acompañante cuando el paciente no puede colaborar. El operador le entrega delantal y collarín, le indica dónde ubicarse fuera del haz directo y le explica la exposición. No puede ser una persona gestante ni menor de 18 años, y su participación se registra en la hoja del estudio.', { align: 'j' }),
    H('15. Exposición médica'),
    Ps(interv
      ? `15.1. **Procedimiento para estudios de radiología intervencionista.** Se aplican los protocolos de ${fmt(['PROC-TEC'])}, el registro de parámetros dosimétricos del paciente (Art. 10.1 lit. e) y el seguimiento de dosis elevadas en piel ${fmt(['PROC-SEG'])}.`
      : '15.1. **Procedimiento para estudios de radiología intervencionista.** No aplica a esta práctica.', { align: 'j' }),
    Ps(`15.2. **Consentimiento informado.** Formato ${fmt(['CONS-INF'])}; el representante legal verifica que el profesional informó al paciente sobre beneficios y riesgos (num. 5.1 lit. n).`, { align: 'j' }),
    Ps('15.3. **Recomendaciones para evitar exposiciones innecesarias.**', { align: 'j' }),
    L([
      'Revisar los estudios previos del paciente antes de repetir uno similar.',
      'Rechazar las solicitudes sin justificación clínica y preferir métodos sin radiación ionizante cuando respondan la misma pregunta.',
      'Verificar la identidad, la región y la proyección antes de cada disparo.',
      'Analizar cada repetición y su causa.'
    ]),
    Ps(`15.4. **Optimización de la protección del paciente.** Colimación al área de interés, técnicas de los procedimientos ${fmt(['PROC-TEC'])}, protección gonadal a menos de 5 cm del campo (num. 6.1.3 lit. h), protocolos pediátricos y comparación periódica de las dosis con niveles de referencia.`, { align: 'j' }),
    Ps(`15.4.1. **Protocolo para mujeres embarazadas.** Procedimiento ${fmt(['PROC-JUST'])} (num. 6.1.3 lit. g e i).`, { align: 'j' }),
    Ps('15.5. **Consideraciones operacionales. 15.5.1. Aceptación y puesta en marcha del equipo.** Antes del uso clínico de un equipo nuevo, reemplazado o con cambio de tubo: notificar a la Autoridad Reguladora y actualizar la licencia (num. 4.3.1); realizar las pruebas de aceptación y el control de calidad inicial con empresa autorizada según los Protocolos de Control de Calidad para Radiodiagnóstico en América Latina y el Caribe (num. 5.3 lit. e); realizar el levantamiento radiométrico; capacitar al personal en su uso y archivar la documentación técnica del fabricante (num. 5.3 lit. f).', { align: 'j' }),
    Ps('15.6. **Registros.**', { align: 'j' }),
    T(['Registro', 'Formato'], [
      ['15.6.1. Mantenimientos', `${fmt(['REG-EQ'])} e informes de la empresa autorizada`],
      ['15.6.2. Equipos y tubos de rayos X', fmt(['REG-EQ', 'BT-EQ', 'LIST-EQ'])],
      ['15.6.3. Pacientes y dosis del paciente', interv ? `${fmt(['PROC-SEG'])} y sistema de registro de estudios` : 'Sistema de registro de estudios e indicadores de dosis del equipo']
    ], { widths: [45, 55], small: true }),
    H('16. Emergencias'),
    Ps(`16.1. **Investigación de exposiciones médicas no intencionales y accidentales.** Todo evento se registra en ${fmt(['REG-INC'])}. El responsable de protección radiológica estima la dosis, identifica las causas, define acciones correctivas e informa al representante legal; cuando corresponde, se notifica por escrito a la Autoridad Reguladora.`, { align: 'j' }),
    Ps('16.2. **Procedimientos por tipo de suceso.**', { align: 'j' })
  ];
  const casos = [
    ['Exposición de un paciente equivocado o de una región no prescrita', 'Detener el estudio, informar al médico responsable y al paciente.', 'Con los parámetros registrados (kV, mAs, distancia) y el rendimiento del tubo.', 'Representante legal; Autoridad Reguladora si la dosis es significativa.', 'Reforzar la verificación de identidad con dos datos.'],
    ['Exposición de una paciente embarazada no identificada', 'Informar al médico responsable; no repetir exposiciones.', 'Dosis al útero según la región expuesta y la técnica; el OSR la documenta.', 'Médico tratante y paciente; representante legal.', 'Revisar el cumplimiento de la pregunta de embarazo y la rotulación.'],
    ['Falla del equipo: la exposición no se interrumpe', 'Accionar el interruptor de emergencia o cortar la alimentación; retirar a las personas.', 'Tiempo de exposición estimado × tasa de kerma del equipo.', 'Servicio técnico autorizado, representante legal y Autoridad Reguladora.', 'Equipo fuera de servicio hasta la reparación y el control de calidad.'],
    ['Ingreso de una persona a la sala durante la exposición', 'Suspender la exposición; identificar a la persona.', 'Distancia y tiempo de permanencia; lectura extraordinaria del dosímetro si lo portaba.', 'Representante legal.', 'Revisar la luz roja, los rótulos y el cierre de la puerta.'],
    [interv ? 'Dosis elevada en piel en un procedimiento intervencionista' : 'Repeticiones excesivas o dosis superior a la esperada', interv ? 'Registrar Ka,r, PKA y tiempo; informar al paciente.' : 'Suspender nuevas repeticiones; revisar técnica y equipo.', interv ? 'Indicadores del equipo; dosis pico en piel si está disponible.' : 'Suma de las exposiciones realizadas.', interv ? 'Médico tratante; Autoridad Reguladora si se confirma una lesión.' : 'Médico responsable.', interv ? 'Seguimiento a las 2 a 4 semanas; revisión de la técnica.' : 'Revisión de tablas de técnicas y control de calidad.'],
    ['Incendio, inundación o sismo que afecte la sala', 'Apagar el equipo y desconectar la alimentación; evacuar según el plan institucional.', 'No aplica, salvo que el equipo quede energizado.', 'Representante legal; Autoridad Reguladora si el equipo resulta dañado.', 'Inspección técnica y control de calidad antes de reanudar el uso.']
  ];
  casos.forEach((k, i) => {
    blocks.push(Ps(`Caso ${i + 1}: ${k[0]}`, { bold: true }));
    blocks.push(KV([['Acciones inmediatas', k[1]], ['Estimación de dosis', k[2]], ['Notificación', k[3]], ['Acciones correctivas', k[4]]]));
  });
  blocks.push(
    H('17. Procedimiento de clausura de la instalación'),
    L([
      'Notificar por escrito a la Autoridad Reguladora la suspensión definitiva de los equipos en el término de 15 días (num. 5.1 lit. p).',
      'Definir el destino final de cada equipo y tubo de rayos X: venta, donación o traslado a una institución licenciada, notificando el contrato dentro de 15 días (Reglamento, Art. 70); o baja con acta de chatarrización e inutilización del tubo.',
      'Solicitar la actualización de la licencia por baja de equipos o, si se dan de baja todos, la extinción de la licencia y el cierre del expediente (num. 4.3.2).',
      `Comunicar la salida del POE y entregar a cada trabajador su historial dosimétrico (Reglamento, Art. 133), conservando los registros al menos 30 años (num. 5.1 lit. r).`,
      'Retirar la señalización solo cuando los equipos hayan salido de la instalación.'
    ], true),
    H('Anexos'),
    L(['Plano a escala de la instalación con zonas, flujo y ubicación de equipos.', 'Licencia institucional y licencias personales vigentes.', 'Autorización de OSR.', 'Informes de mantenimiento, control de calidad y levantamiento radiométrico.', 'Formatos de registro citados en este manual.']),
    aprobaciones(c)
  );
  return { title: 'Manual de Seguridad Radiológica', subtitle: `Práctica de ${P.corto} – Anexo V de la Norma Técnica`, kind: 'sgc', blocks };
}

/* ================================================================ LEVANTAMIENTO RADIOMÉTRICO (ANEXO VII) */

const T_OPCIONES = ['1', '1/2', '1/5', '1/8', '1/20', '1/40'];
const fraccion = (v) => { const s = String(v || '').trim(); if (s.includes('/')) { const [a, b] = s.split('/').map(Number); return b ? a / b : null; } return nivel(s); };

function calcularPunto(lev, p, c) {
  const mAs = nivel(lev.mas) || ((nivel(lev.ma) || 0) * (nivel(lev.tiempo) || 0)) || null;
  const t = nivel(lev.tiempo);
  const lectura = nivel(p.lectura);
  const fondo = nivel(lev.fondo) || 0;
  let dDisparo = null;
  if (lectura != null) {
    if (/h/.test(p.unidad || '')) dDisparo = t ? Math.max(0, (lectura - fondo) * t / 3600) : null;
    else dDisparo = Math.max(0, lectura - (t ? fondo * t / 3600 : 0));
  }
  const W = (nivel(lev.pacientes) || 0) * (nivel(lev.masPaciente) || 0);
  const U = fraccion(p.u) ?? 1, T = fraccion(p.t) ?? 1;
  const semanal = (dDisparo != null && mAs && W) ? dDisparo / mAs * W * U * T / 1000 : null;
  const anual = semanal != null ? semanal * 50 : null;
  const controlada = /Controlada/i.test(p.zona || '');
  const criterio = controlada ? restriccionPOE(c) : restriccionPublico(c);
  return { dDisparo, semanal, anual, criterio, cumple: anual == null ? null : anual <= criterio, W, mAs, U, T };
}

function docLevantamiento(c) {
  const { I, R } = c;
  const levs = (c.S.levantamientos || []).filter(l => l.sala);
  const V = c.V;
  const blocks = [
    H('1. Datos generales'),
    Ps('1.1. Datos de la instalación', { bold: true }),
    KV([
      ['Razón social', ph(I.razonSocial, 'Razón social')],
      ['Nombre comercial', I.nombreComercial || 'No aplica'],
      ['RUC', ph(I.ruc, 'RUC')],
      ['Dirección', ph(I.direccion, 'Dirección')],
      ['Representante legal', I.repEmpresa ? `${I.repEmpresa} (Rep.: ${ph(I.repLegal, 'Nombre')})` : ph(I.repLegal, 'Representante legal')],
      ['Correo electrónico', ph(I.correo, 'Correo')],
      ['Teléfono', ph(I.telefono, 'Teléfono')],
      ['Provincia / ciudad', `${ph(I.provincia, 'Provincia')} / ${ph(I.ciudad, 'Ciudad')}`],
      ['Código postal', I.codPostal || '[Código postal]'],
      ['Sala(s) evaluada(s)', levs.map(l => l.sala).join(', ') || '[Sala]']
    ]),
    Ps('1.2. Datos del profesional que elabora el levantamiento', { bold: true }),
    KV([
      ['Nombre completo', [R.osrTitulo, R.osrNombre].filter(Boolean).join(' ') || '[Nombre]'],
      ['N.° licencia personal / autorización de OSR', [R.osrLicencia || R.osrCedula, R.osrAut].filter(Boolean).join(' / ') || '[N.º]'],
      ['Vigencia', R.osrAutCad ? fCorta(R.osrAutCad) : '[Vigencia]'],
      ['Correo electrónico', R.osrCorreo || '[Correo]'],
      ['Teléfono', R.osrTelefono || '[Teléfono]']
    ]),
    H('2. Objetivo del levantamiento radiométrico'),
    Ps('Medir las tasas de dosis en las barreras y áreas colindantes de las salas de rayos X para detectar posibles fugas o debilidades del blindaje estructural, y verificar que las dosis estimadas para el personal ocupacionalmente expuesto y el público no superen las restricciones y límites establecidos (Norma Técnica, Art. 3, definición de levantamiento radiométrico; num. 6.1.4 lit. d).', { align: 'j' }),
    H('7. Instrumentación utilizada y calibración'),
    KV([
      ['Tipo de detector', V.levInstTipo || 'Cámara de ionización'],
      ['Marca / modelo', `${V.levInstMarca || '[marca]'} / ${V.levInstModelo || '[modelo]'}`],
      ['N.° de serie', V.levInstSerie || '[serie]'],
      ['Rango de medida', V.levInstRango || '[rango]'],
      ['Fecha de la última calibración', V.levInstCal ? fCorta(V.levInstCal) : '[fecha]'],
      ['Laboratorio de calibración / certificado', `${V.levInstLab || '[laboratorio]'}${V.levInstCert ? ' / ' + V.levInstCert : ''}`]
    ]),
    ...(V.levInstCal && diasHasta(V.levInstCal) < -365 ? [NOTE('La calibración del instrumento tiene más de un año; conviene recalibrarlo antes del próximo levantamiento.')] : [])
  ];
  if (!levs.length) blocks.push(Ps('[Registre al menos una sala en la sección Levantamiento radiométrico.]'));
  const resumen = [];
  levs.forEach((lev, k) => {
    const e = c.eq.find(x => x.serie && x.serie === lev.serie) || {};
    const puntos = (c.S.levPuntos || []).filter(p => p.sala === lev.sala && (p.punto || p.descripcion));
    const n = k + 1;
    blocks.push(PB(), H(`Sala ${n}: ${lev.sala}`));
    blocks.push(Ps(`3. Descripción del equipo`, { bold: true }));
    blocks.push(KV([
      ['Tipo', e.tipo || '[tipo]'],
      ['Energía / valores máximos', `${lev.kvMax || I.kvMax || '[kV máx]'} kV; ${lev.maMax || I.maMax || '[mA máx]'} mA`],
      ['Uso', e.uso || '[uso]']
    ]));
    blocks.push(Ps(`4. Plano a escala de la instalación`, { bold: true }));
    if (lev.plano) blocks.push({ t: 'img', img: lev.plano, maxH: 150, caption: `Croquis de la sala ${lev.sala} con los puntos de medición, zonas y flujo de pacientes y POE` });
    else blocks.push(Ps('El plano a escala de la instalación y sus alrededores, con el equipo, la consola, los detalles estructurales de las paredes, la ocupación de las salas adyacentes, la delimitación de zonas y el flujo de pacientes y POE, se adjunta como anexo.', { align: 'j' }));
    blocks.push(Ps(`5. Identificación del equipo`, { bold: true }));
    blocks.push(T(['', 'Marca', 'Modelo', 'Serie'], [[{ t: 'Equipo', bold: true }, e.marca || 'NR', e.modelo || 'NR', e.serie || lev.serie || 'NR'], [{ t: 'Tubo', bold: true }, e.tuboMarca || 'NR', e.tuboModelo || 'NR', e.tuboSerie || 'NR']], { widths: [16, 28, 28, 28], small: true }));
    const W = (nivel(lev.pacientes) || 0) * (nivel(lev.masPaciente) || 0);
    blocks.push(Ps(`6. Carga de trabajo y factores de uso`, { bold: true }));
    blocks.push(Ps(`Carga de trabajo máxima estimada: **${lev.pacientes || '[n]'} pacientes por semana** con un promedio de **${lev.masPaciente || '[n]'} mAs por paciente**, es decir W = ${W ? num2(W, 0) : '[W]'} mAs/semana (${W ? num2(W / 60, 1) : '[ ]'} mA·min/semana). Los factores de uso (U) de las barreras hacia donde puede dirigirse el haz primario y los factores de ocupación (T) de las áreas colindantes se tomaron del NCRP 147 y constan en la tabla de resultados.`, { align: 'j' }));
    blocks.push(Ps(`8. Factores de operación utilizados`, { bold: true }));
    blocks.push({ t: 'kv4', rows: [['Tensión', `${lev.kv || '[kV]'} kVp`, 'Corriente', `${lev.ma || '[mA]'} mA`], ['Tiempo', `${lev.tiempo || '[s]'} s`, 'Producto', `${lev.mas || (nivel(lev.ma) && nivel(lev.tiempo) ? num2(nivel(lev.ma) * nivel(lev.tiempo), 1) : '[mAs]')} mAs`], ['Dirección del haz', lev.direccion || '[dirección]', 'Tamaño de campo', lev.campo || '[campo]'], ['Maniquí / dispersor', lev.maniqui || '[maniquí]', 'Fondo ambiental', `${lev.fondo || '[ ]'} µSv/h`]] });
    const filas = puntos.map(p => {
      const r = calcularPunto(lev, p, c);
      resumen.push({ sala: lev.sala, p, r });
      return [{ t: p.punto || '', align: 'c', bold: true }, p.descripcion || '', { t: p.distancia || '', align: 'c' }, p.barrera || '', { t: p.zona || '', align: 'c' }, { t: `${p.u || '1'} / ${p.t || '1'}`, align: 'c' }, { t: r.dDisparo == null ? '—' : num2(r.dDisparo, 3), align: 'c' }, { t: r.anual == null ? '—' : num2(r.anual, 3), align: 'c' }, { t: num2(r.criterio, 1), align: 'c' }, { t: r.cumple == null ? '—' : (r.cumple ? 'Sí' : 'No'), align: 'c', bold: true, fill: r.cumple == null ? null : (r.cumple ? 'C6E0B4' : 'F8CBAD') }, p.obs || ''];
    });
    blocks.push(Ps(`9 y 10. Lecturas y estimación de equivalentes de dosis ambiente`, { bold: true }));
    blocks.push(Ps('La dosis medida es la lectura neta por exposición en el punto, descontado el fondo. La dosis calculada anual se obtiene como H = (D / mAs de la técnica) × W × U × T × 50 semanas, y se compara con la restricción para el POE en zonas controladas y con la restricción para el público en las demás.', { align: 'j' }));
    blocks.push(T(['Punto', 'Descripción del punto de medición', 'Distancia (m)', 'Barrera', 'Zona', 'U / T', 'Dosis medida (µSv por disparo)', 'Dosis calculada (mSv/año)', 'Criterio (mSv/año)', 'Cumple', 'Observaciones'], filas.length ? filas : [['', '', '', '', '', '', '', '', '', '', '']], { widths: [6, 19, 7, 10, 9, 7, 10, 10, 8, 6, 8], small: true }));
  });
  const noCumplen = resumen.filter(x => x.r.cumple === false);
  const sinDato = resumen.filter(x => x.r.cumple == null);
  const maxAnual = Math.max(0, ...resumen.map(x => x.r.anual || 0));
  blocks.push(
    H('11. Conclusiones y recomendaciones'),
    L([
      resumen.length
        ? (noCumplen.length
          ? `En ${noCumplen.length} ${noCumplen.length === 1 ? 'punto' : 'puntos'} (${noCumplen.map(x => `${x.sala}: ${x.p.punto}`).join(', ')}) la dosis anual estimada supera el criterio aplicable. Se debe reforzar el blindaje de esas barreras o restringir la ocupación, y repetir el levantamiento después de la intervención.`
          : `En los ${resumen.length - sinDato.length} puntos evaluados la dosis anual estimada no supera el criterio aplicable; el máximo estimado fue ${num2(maxAnual, 3)} mSv/año. El blindaje estructural es adecuado para la carga de trabajo declarada.`)
        : '[Registre los puntos de medición.]',
      ...(sinDato.length ? [`${sinDato.length} ${sinDato.length === 1 ? 'punto no tiene' : 'puntos no tienen'} datos suficientes para el cálculo (lectura, técnica o carga de trabajo).`] : []),
      `Criterios aplicados: ${num2(restriccionPOE(c), 1)} mSv/año en zona controlada (restricción institucional para el POE, inferior al límite de 20 mSv/año) y ${num2(restriccionPublico(c), 1)} mSv/año en zonas supervisadas y libres (límite de dosis del público, Norma Técnica num. 5.2 lit. a).`,
      'Repetir el levantamiento cada año y siempre que se modifique la instalación, se cambie el equipo o el tubo, o aumente de forma significativa la carga de trabajo.',
      'Mantener la señalización, la luz roja y las puertas cerradas durante las exposiciones.'
    ]),
    H('12. Responsable del levantamiento'),
    SIGN([{ ...c.firmas.osr, label: `Fecha: ${fLarga(c.V.levFecha || c.fecha)}` }, { ...c.firmas.rep, label: 'Representante legal' }]),
    H('13. Referencias bibliográficas'),
    L([
      'Ministerio de Energía y Recursos Naturales No Renovables. Acuerdo Ministerial MERNNR-MERNNR-2022-0011-AM, Norma Técnica para las Actividades de Licenciamiento y Operación en Radiología Intervencionista, Radiodiagnóstico Médico, Odontológico y Veterinario. Registro Oficial, Cuarto Suplemento N.º 11, 25 de febrero de 2022.',
      'Reglamento de Seguridad Radiológica, Decreto Supremo N.º 3640. Registro Oficial N.º 891, 8 de agosto de 1979.',
      'National Council on Radiation Protection and Measurements. NCRP Report No. 147: Structural Shielding Design for Medical X-Ray Imaging Facilities. Bethesda, 2004.',
      'Organismo Internacional de Energía Atómica. Protección radiológica y seguridad de las fuentes de radiación: Normas básicas internacionales de seguridad. Colección de Normas de Seguridad N.º GSR Part 3. Viena, 2016.'
    ])
  );
  return { title: 'Informe de levantamiento radiométrico', subtitle: 'Contenido según el Anexo VII de la Norma Técnica', kind: 'sgc', landscape: true, blocks };
}

/* ================================================================ INTERPRETACIÓN DOSIMÉTRICA */

function mesesPeriodo(c) { return /bimestral/i.test(c.V.dosPeriodo || '') ? 2 : (/trimestral/i.test(c.V.dosPeriodo || '') ? 3 : 1); }

function docInterpretacionDosis(c) {
  const { V } = c;
  const meses = mesesPeriodo(c);
  const nInv = 1.5 * meses;
  const restr = restriccionPOE(c);
  const tipoPer = meses === 2 ? 'Bimestral' : (meses === 3 ? 'Trimestral' : 'Mensual');
  const gente = c.poe.length ? c.poe : [{ nombre: '', cedula: '' }];
  const blocks = [];
  gente.forEach((p, i) => {
    const dp = nivel(p.dosisPeriodo), da = nivel(p.dosisAnual) ?? dp, dt = nivel(p.dosisTotal) ?? da;
    const hay = dp != null;
    const inv = hay && dp >= nInv, supR = da != null && da > restr, supL = da != null && da > 20;
    blocks.push(Ps(`POE ${i + 1}: ${p.nombre || '[Nombre]'}`, { bold: true }));
    blocks.push(Ps(`En cumplimiento del Art. 7 lit. b) del Reglamento de Seguridad Radiológica, que obliga al empleador a informar al personal la dosis de radiación recibida durante su trabajo evaluada por el dosímetro personal, y del numeral 6.1.1 lit. e) de la Norma Técnica, y con base en el reporte de ${V.dosEmpresa || '[laboratorio]'}, se interpreta la dosis del Personal Ocupacionalmente Expuesto considerando: límite de dosis ocupacional de 20 mSv/año; restricción institucional de ${num2(restr, 1)} mSv/año; nivel de investigación de 1,5 mSv/mes (${num2(nInv, 1)} mSv por periodo ${tipoPer.toLowerCase()}).`, { align: 'j' }));
    blocks.push(Ps('1. Datos del POE', { bold: true }));
    blocks.push(KV([['Nombres y apellidos', p.nombre || ''], ['Cédula de identidad', p.cedula || ''], ['Código de dosímetro', p.dosimetro || ''], ['Cargo', p.funcion || p.profesion || ''], ['Área / servicio', `${c.P.nombre} (${c.I.razonSocial || ''}${c.I.nombreComercial ? ' – ' + c.I.nombreComercial : ''})`], ['Laboratorio de dosimetría', V.dosEmpresa || ''], ['Magnitud reportada', 'Hp(10)']]));
    blocks.push(Ps('2. Datos del reporte dosimétrico', { bold: true }));
    blocks.push(KV([['Periodo de control evaluado', `${V.dosPerDesde ? fCorta(V.dosPerDesde) : '[desde]'} al ${V.dosPerHasta ? fCorta(V.dosPerHasta) : '[hasta]'}`], ['Tipo de periodo', `${tipoPer}${V.dosCiclo ? ' (ciclo ' + V.dosCiclo + ')' : ''}`], ['Dosis del periodo Hp(10)', hay ? `${num2(dp, 3)} mSv` : '[dosis]'], ['Dosis acumulada anual Hp(10)', da != null ? `${num2(da, 3)} mSv` : '[dosis]'], ['Dosis acumulada total', dt != null ? `${num2(dt, 3)} mSv` : '[dosis]'], ['Reporte del laboratorio', `${V.dosReporte || ''}${V.dosFechaReporte ? ' del ' + fCorta(V.dosFechaReporte) : ''}`], ['Fecha de interpretación', fCorta(V.dosFechaInterp || c.fecha)]]));
    blocks.push(Ps('3. Cálculos de apoyo', { bold: true }));
    blocks.push(T(['Criterio', 'Cálculo', 'Resultado'], [
      ['Límite legal (20 mSv/año)', `(${da != null ? num2(da, 3) : 'D'} / 20) × 100`, { t: da != null ? `${num2(da / 20 * 100)} %` : '—', align: 'c' }],
      [`Restricción institucional (${num2(restr, 1)} mSv/año)`, `(${da != null ? num2(da, 3) : 'D'} / ${num2(restr, 1)}) × 100`, { t: da != null ? `${num2(da / restr * 100)} %` : '—', align: 'c' }],
      ['Margen restante', `Hasta ${num2(restr, 1)} y hasta 20 mSv/año`, { t: da != null ? `${num2(restr - da, 3)} mSv / ${num2(20 - da, 3)} mSv` : '—', align: 'c' }]
    ], { widths: [35, 40, 25], small: true }));
    blocks.push(Ps('4. Evaluación por niveles', { bold: true }));
    blocks.push(T(['Nivel', 'Resultado'], [
      [`Nivel de investigación (${num2(nInv, 1)} mSv/periodo)`, { t: `${marca(hay && !inv)} No activa investigación    ${marca(inv)} Sí activa investigación`, fill: inv ? 'F8CBAD' : (hay ? 'C6E0B4' : null) }],
      [`Restricción institucional (${num2(restr, 1)} mSv/año)`, { t: `${marca(da != null && !supR)} No supera    ${marca(supR)} Sí supera`, fill: supR ? 'FFE699' : (da != null ? 'C6E0B4' : null) }],
      ['Límite legal (20 mSv/año)', { t: `${marca(da != null && !supL)} No supera    ${marca(supL)} Sí supera`, fill: supL ? 'F8CBAD' : (da != null ? 'C6E0B4' : null) }]
    ], { widths: [40, 60], small: true }));
    blocks.push(Ps('5. Conclusión', { bold: true }));
    blocks.push(Ps(hay
      ? (inv || supL
        ? `La dosis del periodo (${num2(dp, 3)} mSv) ${inv ? 'activa el nivel de investigación' : ''}${inv && supL ? ' y la dosis anual ' : ''}${supL ? 'supera el límite legal' : ''}. **Se inicia la investigación dosimétrica** según el procedimiento ${codigoDoc(c, 'PROC-DOS')} y se implementan medidas correctivas inmediatas.`
        : `La dosis del periodo (${num2(dp, 3)} mSv) es menor que el nivel de investigación y la dosis acumulada anual (${num2(da, 3)} mSv) ${supR ? 'supera la restricción institucional, por lo que se revisan las condiciones de trabajo' : 'se mantiene por debajo de la restricción institucional y del límite legal'}. **Se mantiene el seguimiento dosimétrico rutinario.**`)
      : '[Registre la dosis del periodo en Personal expuesto → Dosimetría y salud.]', { align: 'j' }));
    blocks.push(Ps('6. Recomendaciones y acciones', { bold: true }));
    blocks.push(LINES([
      `${marca(hay && !inv)} Continuar el seguimiento dosimétrico rutinario.`,
      `${marca(true)} Reforzar el uso correcto del dosímetro personal (tórax, bajo el delantal cuando aplique).`,
      `${marca(true)} Mantener las medidas de optimización: tiempo, distancia y blindaje.`,
      `${marca(inv || supL)} Realizar la investigación dosimétrica del periodo.`,
      `${marca(inv || supL)} Implementar medidas correctivas inmediatas y seguimiento especial.`
    ]));
    blocks.push(Ps('7. Constancia de información al POE', { bold: true }));
    blocks.push(Ps('El trabajador fue informado de su dosis y de su interpretación respecto del límite legal, la restricción institucional y el nivel de investigación.', { align: 'j' }));
    blocks.push(SIGN([{ ...c.firmas.osr, label: 'Elaborado por', role: `${c.rolOSR}\nFecha: ${fCorta(V.dosFechaInterp || c.fecha)}` }, { name: p.nombre || '', role: 'POE informado(a)\nFecha:', ced: p.cedula, label: 'Recibido' }]));
    if (i < gente.length - 1) blocks.push(PB());
  });
  blocks.push(NOTE('Abreviaturas: POE, personal ocupacionalmente expuesto; mSv, milisievert; Hp(10), dosis equivalente personal a 10 mm de profundidad.'));
  return { title: 'Informe de interpretación dosimétrica del POE', kind: 'sgc', blocks };
}

/* ================================================================ APTITUD MÉDICA */

function edadDe(iso) { const d = parseFecha(iso); if (!d) return ''; const h = new Date(); let e = h.getFullYear() - d.getFullYear(); if (h < new Date(h.getFullYear(), d.getMonth(), d.getDate())) e--; return `${e} años`; }

function docAptitudMedica(c) {
  const gente = c.poe.length ? c.poe : [{}];
  const equipos = [...new Set(c.eqAct.map(e => tipoCorto(e.tipo) === e.tipo ? e.tipo : e.tipo))].join(', ') || '[equipos]';
  const tiposEpp = [...new Set(c.epp.map(e => tipoCorto(e.tipo)))];
  const tiene = (t) => tiposEpp.includes(t);
  const blocks = [];
  gente.forEach((p, i) => {
    const prim = !p.certMed;
    blocks.push(Ps(`Trabajador ${i + 1}: ${p.nombre || '[Nombre]'}`, { bold: true }));
    blocks.push(Ps('1. Fundamento normativo y alcance', { bold: true }));
    blocks.push(Ps('Formato para documentar la evaluación médica preocupacional, periódica anual, de reintegro, por cambio de puesto o posterior a un evento de posible sobreexposición del personal ocupacionalmente expuesto a radiaciones ionizantes:', { align: 'j' }));
    blocks.push(L([
      'Reglamento de Seguridad Radiológica (D.S. 3640), Art. 112: examen médico antes de iniciar tareas en el campo de las radiaciones y examen médico anual.',
      'Norma Técnica MERNNR-MERNNR-2022-0011-AM, num. 5.1 lit. s) y Art. 8 lit. f): vigilancia médica preocupacional y anual, con registro de la aptitud para trabajar con radiaciones ionizantes.',
      'Decreto Ejecutivo 2393, Reglamento de Seguridad y Salud de los Trabajadores, Art. 62: exámenes médicos de ingreso y periódicos para trabajadores expuestos a radiaciones ionizantes.'
    ]));
    blocks.push(NOTE('Los marcadores tumorales no son indicadores específicos de exposición ocupacional a radiación ionizante. La aptitud se basa en la evaluación clínica integral, el historial laboral, la dosimetría y los exámenes de laboratorio (biometría hemática completa y recuento plaquetario).'));
    blocks.push(Ps('2. Datos de identificación', { bold: true }));
    blocks.push({ t: 'kv4', rows: [
      ['Institución / razón social', c.I.razonSocial || '', 'RUC', c.I.ruc || ''],
      ['Servicio / área', c.P.nombre, 'Ciudad', c.I.ciudad || ''],
      ['Nombres y apellidos', p.nombre || '', 'Cédula', p.cedula || ''],
      ['Cargo / puesto', p.funcion || p.profesion || '', 'Fecha de nacimiento', p.fechaNac ? fLarga(p.fechaNac) : ''],
      ['Edad', edadDe(p.fechaNac), 'Teléfono / correo', [p.telefono, p.correo].filter(Boolean).join(' / ')],
      ['Fecha de evaluación', '', 'Código del trabajador', String(i + 1).padStart(3, '0')]
    ] });
    blocks.push(Ps('3. Tipo de evaluación y exposición ocupacional', { bold: true }));
    blocks.push(LINES([
      `${marca(prim)} Preocupacional   ${marca(!prim)} Periódica anual   [  ] Reintegro laboral   [  ] Cambio de puesto   [  ] Post-evento / posible sobreexposición   [  ] Retiro / salida`
    ]));
    blocks.push(KV([
      ['Práctica', `${marca(c.S.practica === 'medico')} Radiodiagnóstico médico   ${marca(c.S.practica === 'intervencionista')} Radiología intervencionista   ${marca(c.S.practica === 'odontologico')} Radiodiagnóstico odontológico`],
      ['Equipos asociados', equipos],
      ['Dosímetro personal', p.dosimetro ? `[X] Sí – N.° ${p.dosimetro}` : '[  ] Sí   [  ] No'],
      ['EPP radiológico', `${marca(tiene('Mandil'))} Mandil plomado   ${marca(tiene('Collarín'))} Protector tiroideo   ${marca(tiene('Lentes'))} Gafas plomadas   ${marca(tiene('Protector gonadal'))} Protector gonadal`],
      ['Dosis ocupacional revisada', `Último periodo: ${p.dosisPeriodo ? num2(nivel(p.dosisPeriodo), 3) + ' mSv' : '____'}   Acumulada anual: ${p.dosisAnual ? num2(nivel(p.dosisAnual), 3) + ' mSv' : '____'}`]
    ]));
    blocks.push(Ps('4. Anamnesis ocupacional y examen clínico', { bold: true }));
    blocks.push(KV([['Antecedentes relevantes', ''], ['Síntomas actuales', ''], ['Signos vitales', 'TA: ____ mmHg   FC: ____ lpm   FR: ____ rpm   SatO2: ____ %   T: ____ °C   IMC: ____'], ['Examen físico general', ''], ['Gestación (solo personal femenino, confidencial)', '[  ] No aplica   [  ] No   [  ] Sí, semanas: ____   [  ] Lo declara solo al médico ocupacional']], { tall: true }));
    blocks.push(Ps('5. Exámenes de laboratorio', { bold: true }));
    blocks.push(T(['Examen / parámetro', 'Resultado', 'Unidad', 'Rango de referencia', 'Normal / alterado', 'Observaciones'], [
      ['Hemoglobina', '', 'g/dL', '', '', ''], ['Hematocrito', '', '%', '', '', ''], ['Leucocitos totales', '', '/mm³', '', '', ''], ['Neutrófilos', '', '%', '', '', ''], ['Linfocitos', '', '%', '', '', ''], ['Plaquetas', '', '/mm³', '', '', ''], ['Volumen plaquetario medio', '', 'fL', '', '', '']
    ], { widths: [24, 13, 10, 18, 15, 20], small: true, tall: true }));
    blocks.push(Ps('6. Dictamen de aptitud médica', { bold: true }));
    blocks.push(LINES(['[  ] APTO PARA TRABAJAR CON RADIACIÓN IONIZANTE   [  ] APTO CON RESTRICCIONES   [  ] NO APTO TEMPORAL   [  ] NO APTO']));
    blocks.push(KV([['Restricciones / recomendaciones', 'Uso del dosímetro en toda la jornada laboral.'], ['Próximo control', '________   Periodicidad: [X] anual   [  ] semestral'], ['Derivación', '[  ] No   [  ] Sí, especialidad: __________']], { tall: true }));
    blocks.push(Ps('7. Constancia de información, confidencialidad y firmas', { bold: true }));
    blocks.push(Ps('El trabajador declara haber recibido información sobre los riesgos asociados a las radiaciones ionizantes, la obligación de usar el dosímetro personal, las medidas de protección radiológica, el reporte inmediato de incidentes y los controles médicos periódicos. Autoriza el uso institucional del dictamen de aptitud, conservando la confidencialidad de la historia clínica.', { align: 'j' }));
    blocks.push(SIGN([{ name: c.V.medOcupNombre || '', role: `Médico ocupacional\nRegistro: ${c.V.medOcupRegistro || '________'}` }, { name: p.nombre || '', role: 'Personal ocupacionalmente expuesto', ced: p.cedula }, { ...c.firmas.osr, role: `${c.rolOSR} (recepción)` }]));
    if (i < gente.length - 1) blocks.push(PB());
  });
  return { title: 'Certificado de aptitud médica laboral del POE', subtitle: 'Vigilancia médica ocupacional para trabajo con equipos generadores de radiación ionizante', kind: 'sgc', blocks };
}

/* ================================================================ REGISTRO DE ASISTENCIA */

function docRegistroAsistencia(c) {
  const lista = cronogramaActual(c);
  const lugar = [c.I.nombreComercial || c.I.razonSocial, c.I.direccion].filter(Boolean).join(' – ');
  const blocks = [];
  lista.forEach((x, i) => {
    blocks.push(Ps(`Registro de asistencia: educación en seguridad radiológica`, { bold: true, align: 'c' }));
    blocks.push({ t: 'kv4', rows: [
      ['Tema', x.tema, 'Pág. N.°', `${i + 1}`],
      ['Institución', c.I.nombreComercial || c.I.razonSocial || '', 'Lugar', c.I.direccion || lugar],
      ['Fecha', fCorta(x.fecha), 'Hora', `${x.horaIni || ''} a ${x.horaFin || ''}`]
    ] });
    const gente = c.poe.map((p, j) => [{ t: String(j + 1), align: 'c' }, p.cedula || '', p.nombre || '', p.funcion || p.profesion || '', p.campo || c.P.nombre, p.telefono || '', p.correo || '', '']);
    const total = Math.max(15, gente.length + 3);
    while (gente.length < total) gente.push([{ t: String(gente.length + 1), align: 'c' }, '', '', '', '', '', '', '']);
    blocks.push(T(['N.°', 'Identificación', 'Nombre y apellido', 'Cargo', 'Unidad administrativa', 'Número telefónico', 'Correo electrónico', 'Firma'], gente, { widths: [4, 11, 19, 14, 13, 11, 16, 12], small: true, tall: true }));
    blocks.push(KV([['Observaciones', '']], { tall: true }));
    blocks.push(SIGN([{ name: x.capacitador || c.firmas.osr.name, role: 'Responsable de la capacitación', label: 'Nombre y firma' }]));
    if (i < lista.length - 1) blocks.push(PB());
  });
  return { title: 'Registro de asistencia – capacitaciones', kind: 'sgc', landscape: true, blocks };
}

/* Registro de documentos nuevos */
(function () {
  const reg = DOCS.find(d => d.id === 'REG-CAP');
  if (reg) { reg.build = (c) => Object.assign(docRegistroAsistencia(c), { code: codigoDoc(c, 'REG-CAP') }); }
  registrarDoc({ id: 'MANUAL', tipo: 'MAN-SR', grupo: 'Planes y procedimientos', aplica: () => true, build: docManual, nota: 'Anexo V · obligatorio en categoría 1 y 2' }, 'PROC-SEG');
  registrarDoc({ id: 'LEV-RAD', tipo: 'INF-LEV', grupo: 'Informes y listados', aplica: () => true, build: docLevantamiento, nota: 'Anexo VII · requisito I.32' }, 'INF-DEL');
  registrarDoc({ id: 'INF-DOS', tipo: 'INF-DOS', grupo: 'Bitácoras y control del POE', aplica: () => true, build: docInterpretacionDosis, nota: 'Reglamento Art. 7 lit. b' }, 'REC-DOS');
  registrarDoc({ id: 'FOR-APT', tipo: 'FOR-APT', grupo: 'Bitácoras y control del POE', aplica: () => true, build: docAptitudMedica, nota: 'Requisito I.10 · para el médico ocupacional' }, 'INF-DOS');
})();
