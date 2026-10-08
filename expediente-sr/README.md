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

## Base normativa

- Reglamento de Seguridad Radiológica, Decreto Supremo N.º 3640 (R.O. 891, 8 de agosto de 1979).
- Acuerdo Ministerial MERNNR-MERNNR-2022-0011-AM, Norma Técnica para las Actividades de Licenciamiento y Operación en Radiología Intervencionista, Radiodiagnóstico Médico, Odontológico y Veterinario.

Los valores de técnica radiográfica de los procedimientos son referenciales; cada instalación debe ajustarlos a su equipo y receptor de imagen.
