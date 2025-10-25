# Inventario de funcionalidades del editor hidráulico legado

Este documento resume las capacidades observadas en el editor existente en `resources/ts/components` y el estado centralizado en `resources/ts/state/store.ts`. Sirve como referencia para garantizar la paridad funcional durante la migración al nuevo diseñador.

## Selección e interacción
- Selección de nodos (`junction`, `tank`, `pump`) y tuberías mediante clic o toque, reflejada en el store `selection`.
- Arrastre de nodos con *snap* a la retícula (`GRID_SIZE`) y actualización inmediata de coordenadas.
- Indicadores visuales de selección: bordes resaltados, etiquetas y estados activos.
- Gestión de estado seleccionado al crear nuevos elementos (`addJunction`, `addPipe`) o eliminarlos (`removeNode`, `removePipe`).

## Edición de nodos
- Actualización puntual de propiedades físicas y geométricas vía `updateNode`, incluyendo:
  - Posición y elevaciones.
  - Parámetros específicos de tanques (dimensiones, nivel de fluido) y bombas (rotación, curva característica, potencia, etc.).
  - Demandas de consumo en nodos tipo `junction`.
- Validaciones contextuales (por ejemplo, bombas no se eliminan accidentalmente).

## Edición de tuberías
- Creación de tuberías entre nodos existentes con `addPipe`, evitando conexiones circulares triviales.
- Actualización de propiedades hidráulicas (`diameter`, `length`, `roughness`, `flowRate`, `minorLossK`).
- Eliminación segura de tuberías (`removePipe`).

## Cómputo hidráulico
- Recomputo instantáneo del motor en `computeHydraulics` tras cada cambio (nodos, tuberías y parámetros globales).
- Persistencia en el store de `results` y `alerts` para consumo por paneles de resultados y validaciones.
- Ajuste de parámetros globales (fluido, unidades, presión ambiente) mediante acciones dedicadas.

## Validaciones y alertas
- Panel de validación (`ValidationPanel`) que consume `alerts` del motor y los presenta con severidades.
- Indicadores visuales y textuales para ayudar a corregir el modelo.

## Exportación e importación
- Panel de modelo (`ModelIOPanel`) con soporte para:
  - Copiar el JSON actual al portapapeles.
  - Cargar un modelo pegado manualmente tras validar con Zod (`parseSystemModel`).
  - Persistencia local de diseños (localStorage) con carga y eliminación posterior.
- Panel de exportación (`ExportPanel`) con utilidades para generar imágenes y PDF (`html-to-image`, `pdfmake`).

## Fórmulas y diagnósticos
- Panel de fórmulas (`FormulaPanel`) para visualizar ecuaciones relevantes con KaTeX.
- Panel de manómetros (`ManometerPanel`) que representa alturas piezométricas y pérdidas.

## Barra de herramientas
- Creación rápida de nodos y tuberías, reset del modelo, atajos para importar/exportar.
- Visualización del estado actual (unidades, fluido seleccionado) y acciones rápidas.

## Persistencia y utilidades
- Funciones auxiliares en `resources/ts/utils` para exportar imágenes/PDF y formatear resultados.
- Generación de identificadores robustos (`crypto.randomUUID` como primera opción).

Este inventario debe mantenerse actualizado mientras se traslada funcionalidad al nuevo diseñador React modular.
