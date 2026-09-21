# Plantilla de auditoría — Seguridad radiológica

Herramienta HTML interactiva (`index.html`) para auditar el cumplimiento documental de instalaciones de **radiodiagnóstico médico** y/o **radiología intervencionista** (RX, TAC, DMO, mamografía, RM), basada en el checklist de inspección de seguridad radiológica.

No requiere instalación ni servidor: se abre directamente en el navegador (doble clic sobre `index.html`), o se puede publicar en GitHub Pages.

## Qué hace

- **Datos de la instalación**: razón social, representante legal, RUC, ubicación, responsable médico, OSR, etc.
- **Práctica y equipos**: casillas para marcar qué práctica (radiodiagnóstico y/o intervencionismo) y qué equipos tiene la instalación, ya que no todas cuentan con lo mismo.
- **Checklist de 72 ítems en 11 secciones** (carpeta legal, POE/OSR, dosimetría, vigilancia médica, capacitación, documentación técnica, mantenimiento, procedimientos/consentimientos, EPR, blindajes/radiometría, registros operativos). Cada ítem se marca como **Cumple / No cumple / Pendiente / N.A.**
- **Observación y responsable por ítem**: un campo para registrar el motivo del incumplimiento (por ejemplo, si falta el documento 4 — declaración del representante legal — se anota por qué no se pudo presentar) y otro para indicar quién tiene a cargo el trámite pendiente.
- **Cálculo automático del % de cumplimiento** (excluye los ítems marcados N.A.), con panel resumen, avance de la auditoría y desglose por sección.
- **Generar informe**: botón de impresión con una vista lista para PDF, incluyendo bloque de firmas.
- **Exportar / importar datos (JSON)**: para guardar la auditoría de una instalación y retomarla después, o auditar varias instalaciones por separado.

Los datos se guardan automáticamente en el navegador (localStorage) mientras se completa el formulario; el archivo JSON exportado es la forma confiable de conservar o compartir una auditoría específica.

## Fuente

Basada en los requisitos documentales de inspección solicitados por la Autoridad Reguladora (Ley de la Comisión Ecuatoriana de Energía Atómica, Decreto Supremo Nro. 3640 — Reglamento de Seguridad Radiológica, y Acuerdo Ministerial MERNNR-MERNNR-2022-0011-AM).
