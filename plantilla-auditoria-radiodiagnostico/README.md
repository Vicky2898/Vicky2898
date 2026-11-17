# Plantilla de auditoría — Seguridad radiológica

Herramienta HTML interactiva (`index.html`) para auditar el cumplimiento documental de instalaciones de **radiodiagnóstico médico** y/o **radiología intervencionista** (RX, TAC, DMO, mamografía, RM), basada en el checklist de inspección de seguridad radiológica.

No requiere instalación ni servidor: se abre directamente en el navegador (doble clic sobre `index.html`), o se puede publicar en GitHub Pages.

## Qué hace

- **Datos de la instalación**: dirigido a, tipo de instalación (pública/privada), razón social, representante legal, RUC, ubicación, médico radiólogo/imagenólogo del área, OSR, etc.
- **Práctica y equipos**: casillas para marcar qué práctica (radiodiagnóstico y/o intervencionismo) y qué equipos tiene la instalación, ya que no todas cuentan con lo mismo.
- **Checklist de 72 ítems en 11 secciones** (carpeta legal, POE/OSR, dosimetría, vigilancia médica, capacitación, documentación técnica, mantenimiento, procedimientos/consentimientos, EPR, blindajes/radiometría, registros operativos). Cada ítem se marca como **Cumple / No cumple / Pendiente / N.A.**
- **Observación y responsable por ítem**: un campo para registrar el motivo del incumplimiento (por ejemplo, si falta el documento 4 — declaración del representante legal — se anota por qué no se pudo presentar) y otro para indicar quién tiene a cargo el trámite pendiente.
- **Cálculo automático del % de cumplimiento** (excluye los ítems marcados N.A. y Pendiente), con panel resumen, avance de la auditoría y desglose por sección.
- **Sello institucional**: se puede cargar una imagen (PNG/JPG) del sello de la instalación; aparece en grande en la portada y junto a la firma del OSR del informe generado. Es opcional y se guarda junto con el resto de la auditoría.
- **Descargar informe (PDF)**: genera un PDF con diseño de informe institucional (portada con banda de color y sello, ficha técnica, tarjetas de resumen, insignias de estado por ítem, firma del OSR y cuadro de elaborado/revisado/aprobado) directamente en el navegador, con [jsPDF](https://github.com/parallax/jsPDF) y las tipografías Archivo / Source Sans 3 / IBM Plex Mono incluidas en el propio archivo — no depende de internet ni del diálogo de impresión. Es la forma recomendada de generar el informe.
- **Descargar informe (HTML)**: misma tipografía, tamaños, anillo grande de % de cumplimiento y texto justificado que el PDF (usa Google Fonts si hay internet, con una alternativa del sistema si no la hay); útil si se quiere editar o visualizar antes de imprimir.
- **Descargar informe (Word)**: el mismo contenido del informe (ficha técnica, resumen, secciones/ítems, firma del OSR y cuadro de elaborado/revisado/aprobado) en un archivo `.rtf` que Word, LibreOffice y Google Docs abren de forma nativa y totalmente editable — pensado para ajustar la redacción a mano antes de entregarlo, ya que la plantilla no puede "humanizar" el texto por sí sola.
- **Exportar / importar datos (JSON)**: para guardar la auditoría de una instalación y retomarla después, o auditar varias instalaciones por separado.

Los datos se guardan automáticamente en el navegador (localStorage) mientras se completa el formulario; el archivo JSON exportado es la forma confiable de conservar o compartir una auditoría específica.

## Matriz de responsabilidades OSR / Gerencia / Médico / POE

`matriz-responsabilidades-osr.xlsx` es un libro de Excel aparte (una hoja por práctica: radiodiagnóstico médico, radiología intervencionista y radiodiagnóstico odontológico) que retoma los mismos 72 ítems del checklist — incluyendo los que son generales para todas las prácticas, no solo los específicos de equipo — y le asigna a cada uno quién es responsable de cumplirlo: **GG** (Gerencia General / representante legal), **DM** (director médico / médico responsable), **OSR** (Oficial de Seguridad Radiológica) o **POE** (personal ocupacionalmente expuesto) — con columnas en blanco de tiempo de ejecución, recursos, estado del proceso y observaciones para completar por instalación. Está basado en el formato de la hoja de actividades del OSR que ya usa la institución, para poder mostrarle a las autoridades qué depende del área de imagen/OSR y qué depende de administración, gerencia o dirección.

## Fuente

Basada en los requisitos documentales de inspección solicitados por la Autoridad Reguladora (Ley de la Comisión Ecuatoriana de Energía Atómica, Decreto Supremo Nro. 3640 — Reglamento de Seguridad Radiológica, y Acuerdo Ministerial MERNNR-MERNNR-2022-0011-AM).
