# Memorando Nro. MEM-DLPR-2024-0087-ME

Quito, D.M., 2 de febrero de 2024. Dirección de Licenciamiento y Protección Radiológica (DLPR), Ministerio de Energía y Minas.
Asunto: Disposiciones para revisión de Informes de Levantamientos Radiométricos y realización de monitoreos radiológicos.
Anexo citado: mem-danct-2024-0056-me-1.pdf (criterio técnico de la Dirección de Aplicaciones Nucleares y Cooperación Técnica, DANCT).

Resumen de lo dispuesto para salas con equipos de 70 a 150 kV:

**A. Equipamiento**
- Óptimo: cámara de ionización de 1800 cc (recomendación del IAEA-TECDOC-1958).
- Segunda opción: detector tipo cámara de ionización de volumen mínimo 250 cc.
- En ambos casos, adjuntar las especificaciones técnicas del equipamiento.
- Si el equipo no pertenece al profesional ni a la instalación, debe constar el documento suscrito de préstamo, alquiler, etc.

**B. Calibración**
- Certificado de calibración vigente emitido por la SCAN–DANCT o un laboratorio primario, secundario o terciario de calibraciones dosimétricas, calibrado en H*(10) o kerma en aire (calidades ISO 4037).

**C. Consideraciones en el informe (cámara de 250 cc o más)**
- Si el tiempo de respuesta del detector es mayor que la duración del haz: modo integración con varios disparos; la lectura se divide para el número de disparos; el informe incluye el proceso de medición y el registro fotográfico.
- Tomografía, arcos en C y angiógrafos: aumentar la duración de la exposición (varios segundos o minutos) por encima del tiempo de respuesta, reportar los tiempos de exposición y el registro fotográfico; no es necesario el modo integración.
- Los detectores deben tener tiempo muerto y tiempo de respuesta menores que la duración del haz.

**D. Generalidades**
- Mismo criterio para los monitoreos en las inspecciones de seguridad radiológica.
- Aplica a las solicitudes de revisión ingresadas desde el 2 de febrero de 2023 (así dice el documento, fechado en 2024).
- Los informes de levantamiento se presentan cada 4 años, en cada renovación de la licencia institucional.

Implementado en `js/manual.js` (`observacionesInstrumento`, `modoMedicion`) y en la sección *Levantamiento radiométrico* de la herramienta.
