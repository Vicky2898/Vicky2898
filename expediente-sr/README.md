# Expediente de Seguridad Radiológica

Herramienta para preparar, por práctica, toda la documentación que solicita la Dirección de Licenciamiento y Protección Radiológica del Ministerio de Energía y Minas (MEM) en el oficio de *Notificación y solicitud de requisitos – Inspección de seguridad radiológica*, y para responder a los *Informes de inspección documental* con disposiciones.

Prácticas incluidas:

- Radiodiagnóstico médico
- Radiología intervencionista
- Radiodiagnóstico odontológico

## Importar sus bitácoras de Excel

El botón **Importar bitácoras (Excel)** lee directamente los formatos de la OSR y llena los expedientes:

- *BITÁCORA DE EQUIPOS* (equipo y tubo: marca, modelo, serie, año de fabricación e instalación)
- *LICENCIA INSTITUCIONAL - OPERACIÓN - C* (código, fechas, kV y mA máximos, equipos autorizados)
- *BITÁCORA DE POE* (médicos, tecnólogos y OSR con licencia, código, renovaciones, fechas y observaciones)
- *RECAMBIO DE DOSÍMETROS PERSONALES* (apellidos, nombres, códigos de área, tipo y cargo, fechas de contrato y periodicidad)

Se agrupa por RUC, práctica y sede (según el nombre de la hoja). Antes de importar se elige si cada grupo va al expediente abierto o a uno nuevo. Lo que ya está lleno no se sobrescribe; equipos y personas se unen por serie y por cédula.

## Cómo se usa

1. Abra `index.html` en Chrome, Edge o Firefox. Necesita internet la primera vez para cargar las librerías de exportación.
2. Arriba elija la práctica. Cada institución puede tener un expediente por práctica; use **Duplicar para otra práctica** para no volver a escribir los datos de la institución.
3. Llene las secciones en orden: institución (con logo y sello), responsables y servicios, personal expuesto, equipos, prendas de protección y datos del oficio del MEM.
4. En **Lista de verificación** marque qué requisitos adjunta, cuáles no aplican y cuáles están en trámite. Eso alimenta el oficio de entrega.
5. En **Documentos** revise la vista previa y descargue cada documento en Word, PDF o Excel, o todos juntos en un archivo .zip.

Los datos se guardan en el navegador. Use **Respaldo** para descargar el expediente en un archivo `.json` y **Restaurar** para abrirlo en otra computadora.

## Documentos que genera

| Código | Documento | Requisito del oficio |
|---|---|---|
| OF-01 | Oficio de entrega de requisitos | Respuesta al oficio |
| OF-02 | Oficio de cumplimiento de disposiciones | Respuesta al informe de inspección |
| OF-03 | Oficio de destino final de equipos | II.9 |
| DC-01 | Declaración de Máximo Responsable de la Seguridad Radiológica | I.4 |
| DC-02 | Nombramiento y aceptación del OSR | I.7 |
| DC-03 | Designación del responsable de la protección del paciente | I.8 |
| PR-01 | Protección del embrión y feto en trabajadoras expuestas | I.5 |
| PR-02 | Asignación de funciones y responsabilidades | I.12 |
| PL-01 | Plan anual de capacitación y entrenamiento | I.11 |
| PR-03 | Procedimientos técnicos de exploración radiológica | I.15 |
| PR-04 | Procedimiento de prescripción de estudios | I.16 |
| PR-05 | Justificación en pacientes embarazadas y pediátricos | I.33 |
| PR-06 | Vigilancia dosimétrica e investigación de dosis | Disposiciones de dosimetría |
| PR-07 | Seguimiento de pacientes con dosis elevadas en piel (solo intervencionismo) | — |
| IN-01 | Informe de integridad del blindaje de prendas de protección | I.18 |
| LS-01 | Nómina del POE | I.13 |
| LS-02 | Listado de equipos | II.8 |
| LS-03 | Matriz de cumplimiento de requisitos | Control interno |
| LM-01 | Lista maestra de documentos | II.1 |
| RG-01 a RG-09 | Registros de licencias, OSR, equipos, prendas, dosimetría, controles médicos, incidentes, inspecciones y capacitaciones | I.22 a I.30 |
| FO-01 | Consentimiento informado | I.17 |
| FO-02 | Rótulos de señalización para imprimir | II.2 y II.3 |

Los códigos siguen la plantilla `{TIPO}-{SIGLAS}-{PRAC}-PR-OSR-{AÑO}-{N}` (por ejemplo `BT-POE-QCA2-RM-PR-OSR-2026-01`), que se cambia en *Responsables y servicios → Codificación de documentos*, junto con el estilo de encabezado (ficha o tabla de control) y el color institucional.

Formatos propios de la OSR incluidos: bitácora de POE, bitácora de equipos, bitácora de licencia institucional, recambio de dosímetros por periodos y check list de documentos del POE con colores (celeste: médico responsable, verde: OSR, naranja: falta de documentos).

## Revisión automática

Antes de descargar, la sección Documentos muestra observaciones como licencias caducadas o por caducar, certificados médicos con más de un año, equipos sin mantenimiento en los últimos 12 meses, prendas no aptas o con espesor insuficiente, y si la instalación debe contar con OSR según el Art. 5 de la Norma Técnica.

## Formatos de la OSR incorporados

- **Plan de capacitación anual** con el formato de cronograma (fecha, tema, hora de inicio y fin, carga horaria, dirigido a, observaciones), datos de la institución y del responsable, y firmas del representante legal y del responsable. Se edita en la sección *Capacitación*; hay una propuesta automática basada en el Anexo III, numeral 17.
- **Informe de integridad del blindaje del EPR** con las cuatro pruebas (fecha de expiración, evaluación funcional, inspección del blindaje con atenuación e integridad, valoración estética), tabla de tomas radiográficas con las imágenes cargadas, conclusiones calculadas y recomendaciones.
- **Inventario de EPR** con código interno, descripción, factura/proveedor, cantidad y ubicación coloreada por sala, observaciones, resumen de facturas y anexo con los escaneos.

## Manual, levantamiento y vigilancia del POE

- **Manual de Seguridad Radiológica** con la estructura completa del Anexo V (carátula, datos generales, antecedentes, objetivo, justificación, ubicación, instalaciones y equipos, flujo, elementos de seguridad, zonas, sistema de gestión, evaluación de la seguridad con matriz de riesgo, exposición ocupacional, del público y médica, emergencias con seis casos y clausura). Cita los códigos de los demás documentos del expediente.
- **Informe de levantamiento radiométrico** según el Anexo VII con el método del protocolo ARCAL XLIX (TP-002 a TP-006): parámetros de operación, simulador y distancia de medición por modalidad; carga de trabajo W = NR × It / 60 (mA·min/semana); lectura × factor de calibración × factor de conversión, en µSv/mA·min, por W × U × T y 50 semanas; criterio ARCAL XX (0,10 mSv/semana en área controlada y 0,01 en área libre) o restricciones institucionales; capas hemirreductoras adicionales m = 1,44 ln R cuando un punto no cumple, y prueba de radiación de fuga de la coraza (LR = Lo × If / Ie, tolerancia 1 mGy/h a 1 m; 0,25 en intraoral).
- **Memoria de cálculo de blindaje** según el Anexo VI con la metodología del NCRP 147: transmisión requerida B = P·d² / (K·U·N·T), espesores de plomo y concreto con la ecuación de Archer, ladrillo por equivalencia de densidad, verificación de la barrera existente (material principal más plomo adicional), ejemplo desarrollado de la barrera más exigente, tabla de resultados del Anexo VI, datos de tomografía (nCTDI100, mAs, DLP) y tiempos de intervencionismo. Incluye una biblioteca verificada contra el NCRP 147 (kerma sin blindaje por paciente de las tablas 4.5 y 4.7, Wnorm, preblindaje de la Tabla 4.6, factores de uso de la Tabla 4.4, ocupación de la Tabla 4.1, pacientes por semana de la Tabla 4.3, distancias de 0,3 m, 1,7 m y 0,5 m y concreto de 2,4 g/cm³). Los parámetros α, β y γ de las tablas B.1 y C.1 se registran a mano. Las salas odontológicas remiten al NCRP 145.
- **Informe de interpretación dosimétrica** por trabajador (límite legal, restricción institucional, nivel de investigación por periodo) con constancia de información al POE.
- **Certificado de aptitud médica laboral**, prellenado para el médico ocupacional.
- **Registro de asistencia** a capacitaciones con el formato de la OSR.

## Base normativa

- Reglamento de Seguridad Radiológica, Decreto Supremo N.º 3640 (R.O. 891, 8 de agosto de 1979).
- Acuerdo Ministerial MERNNR-MERNNR-2022-0011-AM (R.O. Cuarto Suplemento N.º 11, 25 de febrero de 2022), Norma Técnica para las Actividades de Licenciamiento y Operación en Radiología Intervencionista, Radiodiagnóstico Médico, Odontológico y Veterinario.

Citas verificadas contra los textos: límites de dosis (num. 5.2 lit. a), feto 1 mSv (6.1.1 lit. c), trabajadora gestante (5.2 lit. b y Reglamento Art. 112 lit. e), prendas (5.4 lit. a y b), dosimetría de cristalino y extremidades en intervencionismo (Art. 11 lit. a), responsabilidades del personal (5.8.1 a 5.8.4, 10.3.4, 16.5.1), funciones del OSR (Anexo III), categorías de riesgo (Anexo I), comunicación trimestral de dosis (Reglamento Art. 7 lit. b), venta o arrendamiento de equipos (Art. 70) y actualización de licencia por baja de equipos (4.3.2). El trébol de los rótulos es magenta sobre amarillo (Reglamento Art. 6).

Los valores de técnica radiográfica de los procedimientos son referenciales; cada instalación debe ajustarlos a su equipo y receptor de imagen.
