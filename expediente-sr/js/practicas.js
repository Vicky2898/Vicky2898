/* Contenido técnico por práctica: tipos de equipo, prendas, protocolos,
   temas de capacitación y lista de requisitos del Ministerio de Energía y Minas. */

const NORMA = 'Acuerdo Ministerial MERNNR-MERNNR-2022-0011-AM';
const NORMA_LARGA = 'Norma Técnica para las Actividades de Licenciamiento y Operación en Radiología Intervencionista, Radiodiagnóstico Médico, Odontológico y Veterinario (Acuerdo Ministerial MERNNR-MERNNR-2022-0011-AM)';
const REGLAMENTO = 'Reglamento de Seguridad Radiológica (Decreto Supremo N.º 3640, R.O. N.º 891 de 8 de agosto de 1979)';

const TEMAS_COMUNES = [
  { tema: 'Física de las radiaciones y producción de rayos X', contenido: 'Naturaleza de la radiación ionizante, interacción con la materia, componentes del tubo de rayos X, influencia del kV y del mAs en la dosis y en la imagen.', horas: 2 },
  { tema: 'Efectos biológicos de las radiaciones ionizantes', contenido: 'Efectos deterministas y estocásticos, radiosensibilidad de tejidos, riesgo en embarazo y en población pediátrica.', horas: 2 },
  { tema: 'Marco regulatorio ecuatoriano', contenido: 'Reglamento de Seguridad Radiológica (D.S. 3640), Norma Técnica MERNNR-MERNNR-2022-0011-AM, obligaciones del licenciatario y del POE, licencias e inspecciones.', horas: 2 },
  { tema: 'Principios de protección radiológica', contenido: 'Justificación, optimización y limitación de dosis. Tiempo, distancia y blindaje. Límites de dosis ocupacional y del público. Clasificación de zonas.', horas: 2 },
  { tema: 'Vigilancia dosimétrica personal', contenido: 'Uso correcto del dosímetro, almacenamiento, recambio, lectura del reporte, nivel de investigación de 1,5 mSv/mes y procedimiento de investigación.', horas: 1 },
  { tema: 'Prendas de protección radiológica', contenido: 'Selección según la tarea, colocación, cuidado, almacenamiento en colgadores y prueba anual de integridad del blindaje.', horas: 1 },
  { tema: 'Protección del paciente embarazado y pediátrico', contenido: 'Pregunta sistemática de embarazo, justificación, alternativas sin radiación ionizante, protocolos pediátricos e inmovilización.', horas: 2 },
  { tema: 'Actuación ante incidentes y accidentes radiológicos', contenido: 'Identificación de eventos, cadena de comunicación, registro, notificación a la Autoridad Reguladora. Ejercicio práctico (simulacro de mesa).', horas: 2 }
];

const PRACTICAS = {
  medico: {
    id: 'medico',
    nombre: 'Radiodiagnóstico médico',
    corto: 'radiodiagnóstico médico',
    mayus: 'RADIODIAGNÓSTICO MÉDICO',
    profResp: 'médico especialista en imagenología',
    tituloResp: 'Médico especialista responsable de la protección del paciente',
    operador: 'Tecnólogo médico en imagenología',
    prescriptor: 'médico',
    tiposEquipo: ['Rayos X convencional fijo', 'Rayos X portátil', 'Telecomandado', 'Fluoroscopio', 'Arco en C', 'Tomógrafo computarizado', 'Mamógrafo', 'Densitómetro óseo', 'Litotriptor'],
    tiposEpp: ['Delantal plomado frontal', 'Delantal plomado envolvente', 'Collarín tiroideo', 'Kit de protectores gonadales', 'Protector gonadal', 'Guantes plomados', 'Mampara plomada móvil', 'Delantal plomado pediátrico'],
    usos: ['Diagnóstico general', 'Emergencia', 'Hospitalización (portátil)', 'Quirófano', 'Estudios contrastados', 'Tomografía', 'Mamografía'],
    temas: [
      { tema: 'Optimización de técnicas radiográficas', contenido: 'Tablas de técnicas, control automático de exposición, colimación, distancia foco-imagen y criterios para evitar repeticiones.', horas: 2 },
      { tema: 'Protección radiológica en estudios portátiles y en quirófano', contenido: 'Distancia mínima de 2 m, uso de mampara y delantal, aviso verbal antes del disparo, protección de pacientes vecinos.', horas: 1 },
      { tema: 'Control de calidad básico del equipo', contenido: 'Pruebas de constancia, reconocimiento de fallas, rechazo de imágenes y comunicación con la empresa de mantenimiento.', horas: 1 }
    ],
    temasSi: [
      { si: /Tomógrafo/, tema: 'Dosimetría del paciente en tomografía', contenido: 'CTDIvol, DLP, modulación de corriente, protocolos pediátricos y niveles de referencia para diagnóstico.', horas: 2 },
      { si: /Telecomandado|Fluoroscopio|Arco en C/, tema: 'Buenas prácticas en fluoroscopia', contenido: 'Fluoroscopia pulsada, retención de última imagen, tiempo de fluoroscopia, posición del personal respecto al tubo.', horas: 1 }
    ],
    dosis: [
      ['Radiografía de extremidades', '0,001 mSv', 'Menos de 1 día'],
      ['Radiografía de tórax', '0,1 mSv', '10 días'],
      ['Radiografía de abdomen', '0,7 mSv', '3 meses'],
      ['Radiografía de columna lumbar', '1,4 mSv', '6 meses'],
      ['Mamografía', '0,4 mSv', '7 semanas'],
      ['Tomografía de cráneo', '2 mSv', '8 meses'],
      ['Tomografía de abdomen y pelvis', '10 mSv', '3 años']
    ],
    riesgos: [
      'La dosis de radiación de un estudio de diagnóstico es baja y se ajusta a la contextura de cada paciente. El riesgo de producir un efecto perjudicial a largo plazo es muy pequeño y es menor que el beneficio de obtener un diagnóstico oportuno.',
      'En mujeres embarazadas el feto es más sensible a la radiación; por eso es indispensable que informe si está embarazada o si existe la posibilidad de estarlo antes del estudio.',
      'Cuando el estudio requiere medio de contraste, el profesional le explicará por separado los riesgos asociados a esa sustancia.'
    ]
  },

  intervencionista: {
    id: 'intervencionista',
    nombre: 'Radiología intervencionista',
    corto: 'radiología intervencionista',
    mayus: 'RADIOLOGÍA INTERVENCIONISTA',
    profResp: 'médico especialista intervencionista',
    tituloResp: 'Médico especialista responsable de la protección del paciente',
    operador: 'Tecnólogo médico en imagenología',
    prescriptor: 'médico',
    tiposEquipo: ['Angiógrafo monoplano', 'Angiógrafo biplano', 'Arco en C', 'Arco en C quirúrgico (móvil)', 'Litotriptor', 'Tomógrafo computarizado'],
    tiposEpp: ['Delantal plomado envolvente', 'Delantal plomado de dos piezas (chaleco y falda)', 'Collarín tiroideo', 'Gafas plomadas', 'Mampara suspendida de techo', 'Faldón plomado de mesa', 'Mampara plomada móvil', 'Gorro plomado', 'Kit de protectores gonadales'],
    usos: ['Hemodinamia', 'Neurointervencionismo', 'Intervencionismo periférico', 'Electrofisiología', 'Quirófano', 'CPRE / Gastroenterología'],
    temas: [
      { tema: 'Dosis en piel del paciente y efectos deterministas', contenido: 'Kerma en el punto de referencia (Ka,r), producto kerma-área (PKA), umbrales de lesión cutánea, niveles de notificación durante el procedimiento y seguimiento del paciente.', horas: 2 },
      { tema: 'Protección del personal en sala de intervencionismo', contenido: 'Mampara suspendida, faldón de mesa, gafas plomadas, protección del cristalino (límite de 20 mSv/año), posición respecto al tubo y uso de dos dosímetros.', horas: 2 },
      { tema: 'Optimización de la fluoroscopia y adquisiciones', contenido: 'Fluoroscopia pulsada de baja tasa, colimación, filtros en cuña, magnificación, distancia tubo-paciente y detector-paciente, angulaciones extremas.', horas: 2 }
    ],
    temasSi: [],
    dosis: [
      ['Coronariografía diagnóstica', '7 mSv', '2 años'],
      ['Angioplastia coronaria', '15 mSv', '5 años'],
      ['Arteriografía periférica', '5 a 10 mSv', '2 a 3 años'],
      ['Embolización', '10 a 50 mSv', '3 a 15 años']
    ],
    riesgos: [
      'El procedimiento utiliza rayos X para guiar los catéteres dentro del cuerpo. La dosis depende de la complejidad del caso y de su duración, y el equipo médico la mantiene tan baja como permita el objetivo clínico.',
      'En procedimientos largos o complejos puede presentarse enrojecimiento de la piel en la zona por donde ingresó el haz de rayos X. En casos poco frecuentes puede aparecer caída temporal del vello, descamación o, de forma excepcional, una lesión que requiera tratamiento. Si su procedimiento supera los niveles de vigilancia, se le indicará y se programará un control.',
      'Debe informar si está embarazada o si existe la posibilidad de estarlo, y si le han realizado otros procedimientos con rayos X en los últimos meses.',
      'Los riesgos propios del procedimiento (punción, medio de contraste, sedación) se explican en el consentimiento clínico correspondiente.'
    ]
  },

  odontologico: {
    id: 'odontologico',
    nombre: 'Radiodiagnóstico odontológico',
    corto: 'radiodiagnóstico odontológico',
    mayus: 'RADIODIAGNÓSTICO ODONTOLÓGICO',
    profResp: 'odontólogo',
    tituloResp: 'Odontólogo responsable de la protección del paciente',
    operador: 'Odontólogo operador',
    prescriptor: 'odontólogo',
    tiposEquipo: ['Intraoral (periapical)', 'Intraoral portátil', 'Panorámico', 'Panorámico-cefalométrico', 'Tomógrafo de haz cónico (CBCT)'],
    tiposEpp: ['Chaleco plomado con collarín', 'Delantal plomado frontal', 'Collarín tiroideo', 'Delantal plomado pediátrico', 'Mampara plomada móvil'],
    usos: ['Diagnóstico intraoral', 'Diagnóstico extraoral', 'Ortodoncia', 'Implantología', 'Endodoncia'],
    temas: [
      { tema: 'Técnicas intraorales y uso de posicionadores', contenido: 'Técnica de paralelismo y bisectriz, posicionadores, colimación rectangular, tiempos de exposición con sensor digital y criterios de repetición.', horas: 2 },
      { tema: 'Protección del paciente en radiografía extraoral', contenido: 'Posicionamiento en panorámica y cefalometría, uso de chaleco sin collarín cuando interfiere, selección de protocolo según edad y contextura.', horas: 1 }
    ],
    temasSi: [
      { si: /CBCT/, tema: 'Tomografía de haz cónico: justificación y campo de visión', contenido: 'Indicaciones, selección del FOV mínimo, protocolos de baja dosis y diferencias de dosis frente a la radiografía convencional.', horas: 2 }
    ],
    dosis: [
      ['Radiografía periapical o de aleta de mordida', '0,005 mSv', 'Menos de 1 día'],
      ['Radiografía panorámica', '0,01 a 0,02 mSv', '1 a 3 días'],
      ['Radiografía cefalométrica', '0,005 mSv', 'Menos de 1 día'],
      ['Tomografía de haz cónico (CBCT)', '0,02 a 0,2 mSv', '3 días a 3 semanas']
    ],
    riesgos: [
      'Las radiografías dentales utilizan dosis muy bajas, comparables con la radiación natural que una persona recibe en uno o pocos días. El riesgo asociado es mínimo frente al beneficio de un diagnóstico correcto.',
      'Durante la toma se le colocará un chaleco plomado para proteger el tórax y la tiroides cuando no interfiera con la imagen.',
      'Si está embarazada o cree estarlo, infórmelo. El embarazo no impide una radiografía dental necesaria, pero el profesional valorará si puede postergarse.'
    ]
  }
};

/* Tipos de equipo que, sumados a 4 o más equipos, obligan a contar con OSR (Art. 5, lit. g) */
const TIPOS_OSR = /Angiógrafo|Tomógrafo computarizado|Arco en C|Litotriptor|Telecomandado/;

/* Protocolos técnicos. `si` limita el protocolo a instalaciones que tienen ese tipo de equipo. */
const PROTOCOLOS = {
  medico: [
    {
      nombre: 'Radiografía de tórax PA y lateral',
      si: /convencional/,
      params: [['Tórax PA', '110 a 125', '2 a 4', '180', 'Con rejilla, inspiración sostenida'], ['Tórax lateral', '115 a 125', '4 a 8', '180', 'Lado izquierdo contra el detector']],
      pasos: [
        'Retirar collares, sostenes con broches y cualquier objeto metálico del cuello y tórax. Entregar bata.',
        'Paciente de pie frente al detector, mentón apoyado, hombros rotados hacia adelante y dorso de las manos sobre las caderas para desplazar las escápulas.',
        'Centrar el rayo a nivel de T7 y colimar a los campos pulmonares, incluyendo ángulos costofrénicos.',
        'Indicar inspiración profunda y exponer con la respiración sostenida.',
        'Para la lateral, elevar los brazos sobre la cabeza y mantener el plano sagital paralelo al detector.'
      ],
      calidad: 'Diez arcos costales posteriores visibles sobre el diafragma, apófisis espinosas equidistantes de los extremos claviculares y ángulos costofrénicos incluidos.'
    },
    {
      nombre: 'Radiografía de tórax con equipo portátil',
      si: /portátil/,
      params: [['Tórax AP en cama', '85 a 100', '2 a 4', '100 a 120', 'Detector detrás del paciente, cabecera elevada si es posible']],
      pasos: [
        'Confirmar con enfermería la identidad del paciente y la posibilidad de embarazo.',
        'Solicitar que salgan del cubículo las personas que no sean necesarias. A los pacientes vecinos que no puedan movilizarse, mantenerlos a más de 2 m del tubo o interponer la mampara móvil.',
        'Si un acompañante o miembro del personal debe sostener al paciente, entregarle delantal y collarín y ubicarlo fuera del haz directo.',
        'El operador se coloca a no menos de 2 m del tubo, con delantal, y anuncia en voz alta el disparo.',
        'Colimar al área de interés; nunca abrir el colimador al tamaño completo del detector por comodidad.'
      ],
      calidad: 'Ausencia de rotación, campos pulmonares completos y vías, sondas o catéteres identificables.'
    },
    {
      nombre: 'Radiografía de abdomen simple',
      si: /convencional|portátil/,
      params: [['Abdomen AP en decúbito', '75 a 80', '20 a 30', '100', 'Con rejilla, en espiración'], ['Abdomen AP de pie', '75 a 85', '25 a 35', '100', 'Incluir cúpulas diafragmáticas']],
      pasos: [
        'Preguntar a toda paciente en edad fértil por la posibilidad de embarazo y registrar la respuesta en la solicitud.',
        'Paciente en decúbito supino, plano sagital medio centrado en la mesa.',
        'Centrar a nivel de las crestas ilíacas y colimar desde el diafragma hasta la sínfisis del pubis.',
        'En varones, colocar protector gonadal cuando no interfiera con la región de estudio.',
        'Exponer en espiración sostenida.'
      ],
      calidad: 'Visualización de la línea del psoas, contorno renal y sínfisis del pubis, sin rotación de la pelvis.'
    },
    {
      nombre: 'Radiografía de columna lumbar AP y lateral',
      si: /convencional/,
      params: [['Columna lumbar AP', '75 a 80', '25 a 40', '100', 'Rodillas flexionadas'], ['Columna lumbar lateral', '85 a 90', '40 a 60', '100', 'Colimación estrecha']],
      pasos: [
        'Confirmar la ausencia de embarazo en mujeres en edad fértil.',
        'Para la AP, paciente en decúbito supino con rodillas flexionadas para reducir la lordosis; centrar a nivel de L3.',
        'Para la lateral, decúbito lateral con almohadilla en la cintura para alinear la columna; centrar en L3 y colimar en sentido anteroposterior.',
        'Colocar protector gonadal en varones cuando no se superponga a la región de interés.'
      ],
      calidad: 'Cuerpos vertebrales de T12 a S1 incluidos, espacios intervertebrales abiertos en la lateral.'
    },
    {
      nombre: 'Radiografía de pelvis y cadera',
      si: /convencional|portátil/,
      params: [['Pelvis AP', '75 a 80', '20 a 30', '100', 'Rotación interna de 15° de los pies'], ['Cadera axial', '75 a 85', '25 a 40', '100', 'Según la condición del paciente']],
      pasos: [
        'Preguntar por embarazo y registrar la respuesta.',
        'Paciente en decúbito supino, rotar internamente los pies 15° salvo sospecha de fractura.',
        'Centrar en el punto medio entre las espinas ilíacas anterosuperiores y la sínfisis.',
        'Usar protector gonadal en varones si no interfiere; en mujeres normalmente interfiere con la región de estudio.'
      ],
      calidad: 'Ambos trocánteres menores apenas visibles, agujeros obturadores simétricos.'
    },
    {
      nombre: 'Radiografía de extremidades',
      si: /convencional|portátil/,
      params: [['Mano, muñeca, pie', '50 a 60', '2 a 4', '100', 'Sin rejilla'], ['Codo, tobillo', '55 a 65', '3 a 6', '100', 'Sin rejilla'], ['Rodilla, hombro', '65 a 75', '6 a 12', '100', 'Con rejilla si el espesor supera 10 cm']],
      pasos: [
        'Colocar delantal plomado al paciente cubriendo tronco y gónadas.',
        'Posicionar la extremidad sobre el detector y colimar a la región solicitada, con al menos dos proyecciones ortogonales.',
        'En pacientes pediátricos, inmovilizar con dispositivos o con el acompañante protegido con delantal.'
      ],
      calidad: 'Articulaciones adyacentes incluidas cuando corresponda, trabeculado óseo nítido.'
    },
    {
      nombre: 'Radiografía de cráneo y senos paranasales',
      si: /convencional/,
      params: [['Cráneo PA / lateral', '70 a 80', '15 a 25', '100', 'Con rejilla'], ['Senos paranasales (Waters)', '70 a 80', '12 a 20', '100', 'Paciente de pie si es posible']],
      pasos: [
        'Retirar aretes, pinzas de cabello, prótesis dentales removibles y gafas.',
        'Colocar collarín tiroideo cuando no interfiera con la proyección.',
        'Alinear el plano sagital medio y la línea orbitomeatal según la proyección; colimar a la región de interés.'
      ],
      calidad: 'Sin rotación (órbitas simétricas), estructuras óseas definidas.'
    },
    {
      nombre: 'Estudios contrastados con fluoroscopia',
      si: /Telecomandado|Fluoroscopio/,
      params: [['Fluoroscopia pulsada', '70 a 110 (automático)', 'CAE', '—', 'Baja tasa de pulsos'], ['Imagen de documentación', 'Automático', 'CAE', '—', 'Usar la última imagen retenida cuando sea suficiente']],
      pasos: [
        'Verificar la preparación del paciente y la ausencia de embarazo.',
        'Activar fluoroscopia pulsada de baja tasa y la función de retención de la última imagen.',
        'Mantener el tiempo de fluoroscopia al mínimo y colimar al órgano de estudio.',
        'El personal que permanece en la sala usa delantal y collarín y se ubica detrás de la mampara.',
        'Al finalizar, registrar el tiempo de fluoroscopia y el producto dosis-área en el informe.'
      ],
      calidad: 'Opacificación adecuada del órgano de estudio con el menor número de imágenes.'
    },
    {
      nombre: 'Mamografía',
      si: /Mamógrafo/,
      params: [['Craneocaudal', '25 a 32', 'CAE', 'Fija', 'Compresión firme'], ['Mediolateral oblicua', '26 a 32', 'CAE', 'Fija', 'Incluir músculo pectoral']],
      pasos: [
        'Explicar a la paciente la necesidad de la compresión para reducir dosis y mejorar la imagen.',
        'Trabajar con control automático de exposición y verificar el espesor comprimido mostrado por el equipo.',
        'Registrar la dosis glandular media que reporta el equipo.'
      ],
      calidad: 'Pezón de perfil, músculo pectoral hasta la línea del pezón en la oblicua, sin pliegues.'
    },
    {
      nombre: 'Tomografía computarizada',
      si: /Tomógrafo/,
      params: [['Cráneo simple', '120', 'Modulación automática', '—', 'Comparar CTDIvol con el nivel de referencia'], ['Tórax / abdomen', '100 a 120', 'Modulación automática', '—', 'Ajustar kV a la contextura'], ['Pediátrico', '80 a 100', 'Protocolo por peso', '—', 'Nunca usar protocolo de adulto']],
      pasos: [
        'Confirmar justificación del estudio y ausencia de embarazo.',
        'Centrar al paciente en el isocentro del gantry; un mal centrado aumenta la dosis con la modulación automática.',
        'Limitar el rango de barrido a la región solicitada y evitar fases innecesarias.',
        'Seleccionar el protocolo según edad y peso; en niños usar siempre protocolo pediátrico.',
        'Registrar CTDIvol y DLP del estudio.'
      ],
      calidad: 'Ruido aceptable para el diagnóstico, cobertura anatómica completa y sin repeticiones.'
    },
    {
      nombre: 'Densitometría ósea',
      si: /Densitómetro/,
      params: [['Columna lumbar y cadera', 'Según equipo', 'Según equipo', '—', 'Dosis muy baja']],
      pasos: ['Verificar calibración diaria con el fantoma del fabricante.', 'Retirar objetos metálicos de la región de interés.', 'Posicionar según el protocolo del fabricante.'],
      calidad: 'Región de interés correctamente delimitada y sin artefactos.'
    },
    {
      nombre: 'Uso del arco en C en quirófano',
      si: /Arco en C/,
      params: [['Fluoroscopia pulsada', 'Automático', 'CAE', '—', 'Tubo bajo la mesa']],
      pasos: [
        'Todo el personal en sala usa delantal y collarín. Quien no participa directamente se ubica a más de 2 m.',
        'Colocar el tubo bajo la mesa y el intensificador lo más cerca posible del paciente.',
        'Usar fluoroscopia pulsada y retener la última imagen en lugar de disparos adicionales.',
        'El operador del arco anuncia cada disparo. Las manos del cirujano no deben quedar en el haz directo.',
        'Registrar el tiempo de fluoroscopia en el parte operatorio.'
      ],
      calidad: 'Imagen suficiente para el control quirúrgico con el menor tiempo de fluoroscopia.'
    }
  ],

  intervencionista: [
    {
      nombre: 'Preparación de la sala y verificación previa',
      params: null,
      pasos: [
        'Verificar el funcionamiento del equipo, de la señalización luminosa y del indicador de dosis (Ka,r y PKA).',
        'Comprobar que la mampara suspendida, el faldón de mesa y las prendas de protección estén disponibles y en buen estado.',
        'Todo el personal que permanecerá en la sala se coloca delantal, collarín, gafas plomadas y su dosímetro personal.',
        'Confirmar la identidad del paciente, la prescripción, el consentimiento informado y la ausencia de embarazo.',
        'Revisar si el paciente tuvo procedimientos con fluoroscopia en los últimos 60 días, para evitar irradiar de nuevo la misma zona de piel.'
      ],
      calidad: 'Lista de verificación completa antes de iniciar.'
    },
    {
      nombre: 'Cateterismo cardíaco diagnóstico (coronariografía)',
      si: /Angiógrafo|Arco en C/,
      params: [['Fluoroscopia de baja dosis', '7,5 pps', 'Navegación del catéter']] ,
      paramsHead: ['Modo', 'Frecuencia', 'Uso'],
      pasos: [
        'Iniciar con fluoroscopia pulsada de baja dosis (7,5 pulsos por segundo).',
        'Mantener el tubo bajo la mesa, el detector lo más cerca posible del tórax del paciente y la mesa a la mayor altura que permita trabajar.',
        'Colimar al área cardíaca y usar filtros en cuña sobre el pulmón.',
        'Evitar angulaciones craneales o caudales pronunciadas y alternar las proyecciones para no concentrar la dosis en la misma zona de piel.',
        'Limitar el número de series de cine a las necesarias para el diagnóstico; preferir la retención de la última imagen para documentar.',
        'Al finalizar, registrar tiempo de fluoroscopia, Ka,r, PKA y número de series.'
      ],
      calidad: 'Visualización completa del árbol coronario con el menor número de series.'
    },
    {
      nombre: 'Angioplastia coronaria (intervención coronaria percutánea)',
      si: /Angiógrafo|Arco en C/,
      params: [['Fluoroscopia de baja dosis', '7,5 pps', 'Avance de guías y balones'], ['Fluoroscopia normal', '15 pps', 'Solo cuando la calidad lo exija'], ['Cine', '7,5 a 15 fps', 'Documentación de resultado']],
      paramsHead: ['Modo', 'Frecuencia', 'Uso'],
      pasos: [
        'Aplicar todas las medidas del cateterismo diagnóstico.',
        'El técnico o la enfermera informa en voz alta al operador cuando el Ka,r acumulado llegue a 3 Gy y luego cada 1 Gy adicional.',
        'En procedimientos prolongados, cambiar la angulación del haz para distribuir la dosis en la piel.',
        'El personal se ubica del lado del detector en las proyecciones laterales, porque la radiación dispersa es mayor del lado del tubo.',
        'Al finalizar, registrar los indicadores de dosis y aplicar el procedimiento de seguimiento si se superan los niveles de vigilancia.'
      ],
      calidad: 'Resultado del procedimiento documentado sin series redundantes.'
    },
    {
      nombre: 'Arteriografía periférica, cerebral y embolización',
      si: /Angiógrafo/,
      params: [['Fluoroscopia de baja dosis', '4 a 7,5 pps', 'Navegación'], ['Angiografía por sustracción digital', '2 a 3 fps', 'Adquisición diagnóstica'], ['Roadmap', 'Según equipo', 'Sustituye fluoroscopia repetida']],
      paramsHead: ['Modo', 'Frecuencia', 'Uso'],
      pasos: [
        'Planificar las proyecciones antes de adquirir para reducir series repetidas.',
        'Usar la menor tasa de imágenes que permita seguir el bolo de contraste.',
        'Colimar estrictamente y usar filtros en cuña en zonas de bajo espesor.',
        'En neurointervencionismo, proteger el cristalino del paciente evitando que quede en el haz directo cuando la proyección lo permita.',
        'Registrar los indicadores de dosis al finalizar.'
      ],
      calidad: 'Opacificación vascular suficiente con el menor número de series.'
    },
    {
      nombre: 'Procedimientos guiados con arco en C (CPRE, ortopedia, urología, marcapasos)',
      si: /Arco en C/,
      params: [['Fluoroscopia pulsada', 'Mínima disponible', 'Guía del procedimiento'], ['Última imagen retenida', '—', 'Documentación']],
      paramsHead: ['Modo', 'Frecuencia', 'Uso'],
      pasos: [
        'Todo el personal en sala usa delantal y collarín; quien no participa se aleja más de 2 m.',
        'Tubo bajo la mesa e intensificador lo más cerca posible del paciente.',
        'Evitar la magnificación electrónica salvo que sea imprescindible.',
        'El operador del arco anuncia cada disparo y nadie mantiene las manos en el haz directo.',
        'Registrar el tiempo de fluoroscopia y los indicadores de dosis disponibles.'
      ],
      calidad: 'Guía suficiente del procedimiento con el menor tiempo de fluoroscopia.'
    }
  ],

  odontologico: [
    {
      nombre: 'Radiografía periapical, técnica de paralelismo',
      si: /Intraoral/,
      params: [['Incisivos superiores', '60 a 70', '0,20 a 0,25'], ['Caninos y premolares superiores', '60 a 70', '0,25 a 0,32'], ['Molares superiores', '60 a 70', '0,32 a 0,40'], ['Incisivos inferiores', '60 a 70', '0,16 a 0,20'], ['Premolares inferiores', '60 a 70', '0,20 a 0,25'], ['Molares inferiores', '60 a 70', '0,25 a 0,32']],
      paramsHead: ['Región', 'kV', 'Tiempo (s) con película E/F'],
      nota: 'Tiempos referenciales para 7 mA y cono de 20 cm. Con sensor digital o placa de fósforo se reducen entre 30 % y 50 %. Ajustar con la tabla del fabricante.',
      pasos: [
        'Revisar la historia clínica y confirmar que la radiografía está justificada.',
        'Preguntar a las pacientes por la posibilidad de embarazo y anotar la respuesta.',
        'Colocar al paciente el chaleco plomado con collarín tiroideo.',
        'Usar posicionador para que la película o el sensor quede paralelo al eje mayor del diente; el paciente no sostiene el receptor con el dedo.',
        'Alinear el cono perpendicular al receptor; si el equipo lo permite, usar colimación rectangular.',
        'El operador se ubica a no menos de 2 m del tubo, entre 90° y 135° respecto de la dirección del haz, o detrás de la barrera, y realiza el disparo.'
      ],
      calidad: 'Corona y ápice completos con 3 mm de margen periapical, sin elongación ni acortamiento.'
    },
    {
      nombre: 'Radiografía periapical, técnica de bisectriz',
      si: /Intraoral/,
      params: null,
      pasos: [
        'Aplicar la técnica solo cuando la anatomía impida usar el posicionador de paralelismo.',
        'Dirigir el haz perpendicular a la bisectriz del ángulo formado por el eje del diente y el receptor.',
        'Mantener las mismas medidas de protección que en la técnica de paralelismo.'
      ],
      calidad: 'Longitud dentaria comparable con la real.'
    },
    {
      nombre: 'Radiografía de aleta de mordida (bite-wing) y oclusal',
      si: /Intraoral/,
      params: [['Aleta de mordida', '60 a 70', '0,20 a 0,32'], ['Oclusal', '65 a 70', '0,30 a 0,50']],
      paramsHead: ['Proyección', 'kV', 'Tiempo (s) con película E/F'],
      pasos: [
        'Colocar la aleta o el posicionador y pedir al paciente que muerda suavemente.',
        'Angulación vertical de +5° a +10° para aleta de mordida.',
        'Chaleco plomado con collarín y operador a 2 m o detrás de la barrera.'
      ],
      calidad: 'Puntos de contacto abiertos y crestas óseas visibles.'
    },
    {
      nombre: 'Radiografía panorámica',
      si: /Panorámico/,
      params: [['Adulto', '64 a 74', '8 a 10', '13 a 16'], ['Niño', '60 a 66', '6 a 8', 'Programa pediátrico']],
      paramsHead: ['Paciente', 'kV', 'mA', 'Tiempo (s)'],
      pasos: [
        'Retirar aretes, cadenas, prótesis removibles, piercings y gafas.',
        'Colocar chaleco plomado sin collarín, porque el collarín se superpone a la mandíbula.',
        'Posicionar con el plano de Frankfort horizontal, el plano sagital medio centrado y los incisivos en la ranura del bloque de mordida.',
        'Pedir que apoye la lengua contra el paladar y que no se mueva durante el recorrido.',
        'Seleccionar el programa según edad y contextura; el operador sale de la sala o se ubica detrás de la barrera.'
      ],
      calidad: 'Arcadas completas, sin sombra de lengua sobre los ápices superiores y sin ensanchamiento de dientes anteriores.'
    },
    {
      nombre: 'Radiografía cefalométrica lateral',
      si: /cefalométrico/,
      params: [['Lateral de cráneo', '70 a 85', '10', 'Según programa']],
      paramsHead: ['Proyección', 'kV', 'mA', 'Tiempo (s)'],
      pasos: [
        'Fijar la cabeza con los olivas en los conductos auditivos y el plano de Frankfort horizontal.',
        'Usar collarín tiroideo cuando no oculte las vértebras cervicales que se requieren para el análisis.',
        'Colimar a la región craneofacial necesaria.'
      ],
      calidad: 'Superposición de bordes mandibulares y perfil blando visible.'
    },
    {
      nombre: 'Tomografía de haz cónico (CBCT)',
      si: /CBCT/,
      params: [['Campo pequeño (1 a 3 dientes)', '85 a 90', 'Protocolo de baja dosis'], ['Campo mediano (una arcada)', '85 a 90', 'Protocolo estándar'], ['Campo grande', '90 a 100', 'Solo si el diagnóstico lo exige']],
      paramsHead: ['Campo de visión', 'kV', 'Protocolo'],
      pasos: [
        'Justificar el estudio: la CBCT no sustituye a la radiografía convencional como examen de rutina.',
        'Seleccionar el menor campo de visión que cubra la zona de interés.',
        'Colocar chaleco plomado con collarín cuando no interfiera con el campo.',
        'El operador permanece fuera de la sala durante la adquisición.'
      ],
      calidad: 'Volumen completo de la región de interés sin artefactos de movimiento.'
    }
  ]
};

/* Requisitos del oficio de notificación (sección I: 33 numerales, sección II: 9 numerales). */
const REQUISITOS = [
  { id: 'I-1', txt: 'Formulario de solicitud de licencia institucional lleno y firmado', ext: true },
  { id: 'I-2', txt: 'RUC con la actividad económica relacionada con la práctica', ext: true },
  { id: 'I-3', txt: 'Plano de la instalación a escala legible (Art. 17 lit. a)', ext: true },
  { id: 'I-4', txt: 'Declaración del representante legal como Máximo Responsable de la Seguridad Radiológica', doc: ['DEC-MAX'] },
  { id: 'I-5', txt: 'Documento de restricciones adicionales para la protección del embrión o feto', doc: ['DEC-EMB'] },
  { id: 'I-6', txt: 'Licencias ocupacionales tipo A vigentes de todo el POE', ext: true },
  { id: 'I-7', txt: 'Nombramiento y autorización del Oficial de Seguridad Radiológica (en caso de aplicar)', doc: ['NOM-OSR'], cond: true },
  { id: 'I-8', txt: 'Designación del responsable de la protección del paciente y su licencia tipo A', doc: ['DES-MED'] },
  { id: 'I-9', txt: 'Documento de adquisición del servicio de dosimetría personal', ext: true },
  { id: 'I-10', txt: 'Certificados médicos de aptitud del POE basados en exámenes de sangre', ext: true },
  { id: 'I-11', txt: 'Plan anual de capacitación y entrenamiento', doc: ['PLAN-CAP'] },
  { id: 'I-12', txt: 'Asignación de funciones y responsabilidades del personal', doc: ['FUN-RESP'] },
  { id: 'I-13', txt: 'Nómina actualizada del personal ocupacionalmente expuesto', doc: ['NOM-POE'] },
  { id: 'I-14', txt: 'Documentación técnica del fabricante (manuales, especificaciones)', ext: true },
  { id: 'I-15', txt: 'Procedimientos técnicos firmados por el especialista y el personal operador', doc: ['PROC-TEC'] },
  { id: 'I-16', txt: 'Cinco prescripciones de estudios con datos personales', doc: ['PROC-PRES'], ext: true },
  { id: 'I-17', txt: 'Cinco consentimientos informados con datos ofuscados', doc: ['CONS-INF'], ext: true },
  { id: 'I-18', txt: 'Informe de integridad de blindaje de los delantales plomados', doc: ['INF-DEL'] },
  { id: 'I-19', txt: 'Contrato de mantenimiento preventivo y correctivo con empresa licenciada', ext: true },
  { id: 'I-20', txt: 'Informe de mantenimiento y control de calidad de cada equipo', ext: true },
  { id: 'I-21', txt: 'Documentos de procedencia de los equipos', ext: true },
  { id: 'I-22', txt: 'Registro de licencias institucional y ocupacionales', doc: ['REG-LIC'] },
  { id: 'I-23', txt: 'Registro de autorizaciones de OSR (en caso de aplicar)', doc: ['REG-OSR'], cond: true },
  { id: 'I-24', txt: 'Registro de inventario de equipos generadores de radiación ionizante', doc: ['REG-EQ'] },
  { id: 'I-25', txt: 'Registro de inventario de elementos de protección radiológica con fotografías', doc: ['REG-EPP'] },
  { id: 'I-26', txt: 'Registro de reportes de dosimetría personal con recibido', doc: ['REG-DOS'] },
  { id: 'I-27', txt: 'Registro de controles médico laborales del POE', doc: ['REG-MED'] },
  { id: 'I-28', txt: 'Registro de incidentes y accidentes radiológicos', doc: ['REG-INC'] },
  { id: 'I-29', txt: 'Registro de inspecciones de seguridad radiológica', doc: ['REG-INSP'] },
  { id: 'I-30', txt: 'Registro de capacitaciones con certificados', doc: ['REG-CAP'] },
  { id: 'I-31', txt: 'Oficio de aprobación de la memoria técnica de cálculo de blindajes (en caso de aplicar)', ext: true, cond: true },
  { id: 'I-32', txt: 'Oficio de recibido del levantamiento radiométrico', ext: true },
  { id: 'I-33', txt: 'Justificación de la exposición en pacientes embarazadas y pediátricos', doc: ['PROC-JUST'] },
  { id: 'II-1', txt: 'Lista maestra de documentos', doc: ['LISTA-M'] },
  { id: 'II-2', txt: 'Fotografías de la señalización con el símbolo de radiación en las puertas', doc: ['ROTULOS'], ext: true },
  { id: 'II-3', txt: 'Fotografías de la rotulación informativa para pacientes y acompañantes', doc: ['ROTULOS'], ext: true },
  { id: 'II-4', txt: 'Fotografías de la señalización luminosa roja sobre la puerta', ext: true },
  { id: 'II-5', txt: 'Fotografías y facturas de las prendas de protección', ext: true },
  { id: 'II-6', txt: 'Fotografía del lugar de almacenamiento de los dosímetros', ext: true },
  { id: 'II-7', txt: 'Fotografías del sistema de visualización y comunicación con el paciente', ext: true },
  { id: 'II-8', txt: 'Listado de equipos con fotografías de las placas', doc: ['LIST-EQ'], ext: true },
  { id: 'II-9', txt: 'Destino final de equipos dados de baja, vendidos o trasladados (en caso de aplicar)', doc: ['OF-BAJA'], cond: true }
];
