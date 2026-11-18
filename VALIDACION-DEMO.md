# Cierre de validación de Doscientos Club

## Alcance

Demo exclusivamente local: ocho pistas, reservas de 60 minutos, cuota mensual,
cuentas y contraseñas locales, contabilidad e importes ficticios. No se necesita backend
ni credenciales externas. No introducir datos personales, bancarios o contraseñas reales.

El desarrollo funcional está implementado. **La aceptación en navegador y
dispositivos reales sigue pendiente**; los tests con jsdom no la sustituyen.

## Comprobaciones reproducibles

Desde `clients/pingpong`:

1. `pnpm install` si faltan dependencias.
2. `pnpm quality`: TypeScript, lint, tests, build y verificación de archivos PWA.
3. `pnpm preview --host 127.0.0.1 --port 5188 --strictPort`.
4. En otra terminal, `pnpm verifyPreview`. Si se usa otro puerto, pasar su URL
   completa: `pnpm verifyPreview http://127.0.0.1:5190/`.

El smoke test HTTP comprueba contenido y tipo de todos los archivos de la build,
incluidos fuentes, iconos, chunks y service worker. Detecta previews obsoletas y
archivos que devuelven el HTML de la aplicación en lugar de su contenido real.
También comprueba que las rutas directas sirven la aplicación.
**No prueba instalación, caché offline ni renderizado.**

## Cobertura automatizada

Última ejecución: `pnpm quality` correcto (195/195 tests en 36 archivos, TypeScript, lint,
build y archivos PWA). Preview HTTP local: cinco rutas y 21 archivos correctos.
La build avisa de un chunk principal de unos 753 kB minificados; no bloquea
la compilación ni sustituye las comprobaciones manuales siguientes.
Vite también avisa de una importación sin extensión en su configuración para
el futuro valor predeterminado `configLoader: 'native'`.

Las pruebas comprueban Doscientos Club en cabeceras, títulos de ruta y
comprobantes. La verificación PWA valida el nombre Doscientos Club y el nombre
corto Doscientos, además del título y la descripción de `index.html`.

| Área                                    | Evidencia                                                          | Límite                                                       |
| --------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------ |
| Reservas, cuotas, socios y permisos     | Tests de dominio, servicio y flujos completos con repositorio real | Identidad y pagos simulados por diseño                       |
| Ajustes recibidos de otra pestaña       | `src/app/synchronization.test.tsx`                                 | Evento `storage` simulado                                    |
| Conflictos al guardar ajustes           | `club-service.test.ts` y `domain/settings.test.ts`                 | Web Locks simulado en jsdom                                  |
| Instalación y ayuda iOS/Android         | `src/app/install-button.test.tsx`                                  | API de instalación simulada                                  |
| Actualización y errores PWA             | `features/pwa/pwa-update-notice.test.tsx`                          | Registro del service worker simulado                         |
| HTML e impresión de comprobantes        | Tests de `features/payments`                                       | Descarga y `window.print` interceptados; no se genera un PDF |
| Datos fiscales y conservación histórica | `club/application/billing.test.ts` y `app/billing.test.tsx`        | Repositorio real en jsdom; sin certificación fiscal          |
| Archivos de producción                  | `scripts/verify-build.mjs` y `scripts/verify-preview.mjs`          | Validación estática y HTTP, no navegador                     |
| Caché y transacciones locales           | `local-repository.test.ts` y `club-queries.test.ts`                | Sin benchmark de volumen ni dispositivos físicos             |
| Reloj y renders estables                | `src/app/club-clock.test.tsx`                                      | Temporizadores, visibilidad y foco simulados                 |
| Botones, tooltips y avatares            | `src/shared/ui/controls.test.tsx`                                  | Componentes reales con teclado en jsdom, sin revisión visual |
| Disponibilidad indexada                 | `features/club/domain/availability.test.ts`                        | Equivalencia de reglas, no medición de latencia              |
| Pestañas accesibles                     | `src/shared/ui/tabs.test.tsx`                                      | Teclado y ARIA en jsdom; lector de pantalla físico pendiente |
| Borradores y módulos administrativos    | `src/app/tabbed-admin.test.tsx`                                    | Servicio/repositorio real; sin revisión visual/táctil        |

Cuotas múltiples: `features/club/application/subscription-plans.test.ts` y
`features/club/infrastructure/schema-plans.test.ts` verifican catálogo, selección,
cobros, conflictos y migración sin reescritura destructiva. `src/app/subscription-plans.test.tsx`
comprueba ajustes, altas/invitaciones/registro, importe del pago y previsión contable
con servicio y repositorio reales en jsdom, sin acreditar revisión visual/táctil física.

Instalación: las 10 pruebas de `src/app/install-button.test.tsx` cubren ayuda sin API,
evento tardío, permiso de un solo uso, cancelación, errores, exclusión de acciones
simultáneas, confirmación por `appinstalled`, conservación de datos locales, teclado,
contención/retorno del foco y detección de Safari instalado. Las APIs del navegador
se simulan; no acreditan instalación física ni caché offline real.

Listados: `src/shared/ui/pagination.test.tsx` limita el renderizado de 10.000 registros
y verifica teclado/foco, tamaños, extremos, borrado de datos y reinicio con filtros.
`src/app/history-lists.test.tsx` usa repositorio real con 1.000 partidas, rangos/pistas,
cancelación en otra página, comprobantes filtrados, totales completos y ausencia de
escrituras al filtrar. `tabbed-admin.test.tsx` conserva filtros de fecha entre pestañas.
Estas pruebas no son un benchmark de rendimiento ni una revisión visual en dispositivos.

Presentación de reservas: `src/app/booking-flows.test.tsx` recorre todos los pasos
sin duraciones redundantes, comprueba los datos etiquetados de la confirmación y
verifica que solo se crea una reserva, sin alterar los pagos. Las tarjetas conservan
su estado y acceso al detalle. jsdom no verifica distribución ni tamaños físicos.

## Aceptación manual pendiente

Registrar navegador, versión, sistema, fecha y resultado en cada bloque.
Usar un perfil de navegador de prueba para no tocar datos de otras demos.

### Móvil y escritorio

- [ ] Probar a 320, 390, 768 y 1440 px: sin desbordamiento horizontal general,
      textos cortados ni botones tapados. El calendario puede desplazarse horizontalmente.
- [ ] Completar día → hora → pista → confirmación con ratón y en pantalla táctil.
- [ ] Comprobar tarjetas y confirmación con fecha/horario legibles, sin insignias
      de duración; revisar cabeceras con acción a ancho completo e indicadores en móvil.
- [ ] A 320 px, combinar fechas y pista sin desbordamientos y abrir la cancelación:
      los botones Mantener/Sí, cancelar deben quedar apilados y ser fáciles de pulsar.
- [ ] En 320 px, desplazar la tira de días sin mover horizontalmente la página;
      comprobar que el día seleccionado sigue visible al cambiar de semana.
- [ ] Verificar botones de reserva sobre la navegación inferior, sin solapes,
      con el área segura del iPhone y con texto ampliado al 200 %.
- [ ] Tras desplazarse por las horas, cambiar de paso: el título enfocado debe
      quedar visible, sin ocultarse bajo la cabecera ni detrás de las acciones.
- [ ] Abrir y cancelar desde «Próxima reserva»; comprobar su actualización y los
      filtros Próximas/Canceladas en la navegación móvil.
- [ ] Comprobar navegación por teclado, foco del modal, Escape y retorno del foco.
- [ ] En reservas e historial, combinar pista y Desde/Hasta; probar una sola fecha,
      rango invertido y cero resultados. Limpiar filtros y recorrer páginas con teclado.
- [ ] En pagos, combinar periodo, fecha de pago, búsqueda y estado; abrir comprobantes
      en otra página y comprobar que los totales no varían al paginar. Probar 12/24/48.
- [ ] A 320 px y con texto ampliado, revisar los campos de fecha y botones de paginación;
      comprobar con lector de pantalla los anuncios del rango de resultados/página.
- [ ] Recorrer las pestañas de Configuración, Socios, Contabilidad y Pagos con
      flechas, Inicio, Fin y Tab/Mayús+Tab; comprobar el foco y el anuncio con lector de pantalla.
- [ ] En móvil, desplazar la barra de pestañas sin desplazar la página. Editar
      horarios/cuota/cierres, alternar secciones y guardar o descartar el borrador completo.
- [ ] Conservar búsqueda/filtros y parámetros contables sin guardar al alternar
      pestañas. Abrir un movimiento nuevo y «Ver historial completo»: debe verse el módulo adecuado.
- [ ] Verificar tooltips con ratón/teclado y áreas táctiles de los controles compartidos.
- [ ] Activar movimiento reducido y comprobar que el asistente sigue siendo usable.
- [ ] Como administrador, crear/reprogramar/cancelar y editar/copiar/descartar horarios.
- [ ] Probar perfil de baja, cuota pendiente, rechazo de pago y alta de cuenta local.
- [ ] Con cuota pendiente, comprobar que no se puede crear una reserva, pero sí cancelar
      una próxima y consultar historial y comprobantes propios.
- [ ] En un perfil de navegador desechable, abrir **Configuración → Reiniciar demo**.
      Conservar primero los datos y comprobar que no cambian; después confirmar el
      reinicio y verificar selección de perfil, dos cuotas, reservas y gastos de ejemplo.
- [ ] Invitar un socio y un administrador, entrar con contraseña temporal y cambiarla
      desde Ajustes de cuenta sin necesidad de tener cuota pagada.
- [ ] Guardar el código de recuperación, cerrar sesión y recuperar con él; comprobar
      que no sirve una segunda vez. Probar el restablecimiento administrativo sin código.
- [ ] Registrar gasto deducible/no deducible e ingreso pendiente; editar, cobrar y anular.
      Comprobar gráfico, meses, saldo, IVA y CSV en una hoja de cálculo real.
- [ ] En Configuración → Cuotas, añadir dos cuotas con distinto nombre/precio, alternar
      pestañas y guardar/descartar. Probar nombres repetidos, precios inválidos y borrado
      de una cuota sin usuarios; una cuota asignada debe impedir su eliminación.
- [ ] Elegir cuota en Nuevo socio, Invitar usuario y Crear cuenta local sin sesión.
      Recargar y comprobar la asignación, el importe del pago y la previsión contable.
- [ ] En Socios → Accesos y roles, reasignar cuotas de socios, usuarios de baja y
      administradores; comprobar que una cuota sin usuarios ya se puede eliminar.
- [ ] Cambiar nombre/precio o la cuota de un socio con el mes pagado: el acceso y el
      comprobante anterior se conservan, sin cargos adicionales. Comprobar HTML e impresión.
- [ ] Con una copia de datos antiguos, comprobar que la cuota única se conserva como
      Cuota general con su importe y sin pérdida de reservas, usuarios ni pagos.

### PWA y offline

- [ ] Cargar la **build de producción** por localhost o HTTPS, esperar a que el
      service worker esté activado y confirmar que controla la página.
- [ ] En Chrome/Edge, instalar, abrir desde el icono y comprobar el modo standalone.
- [ ] Abrir «Instalar app» antes de que esté disponible la instalación directa: las
      instrucciones siguen visibles y el botón se habilita cuando el navegador la ofrece.
      Probar aceptación/cancelación, teclado, anuncio de estado y retorno del foco al cerrar.
- [ ] En Safari de iOS/iPadOS, Compartir → Añadir a pantalla de inicio; abrir desde
      el icono y comprobar que no se vuelve a ofrecer instalar.
- [ ] Tras la carga inicial y activación, desconectar la red y recargar. Abrir la
      reserva guiada, cambiar cuentas y consultar pagos y contabilidad: también deben cargar los chunks.
- [ ] Crear/cancelar una reserva offline, cerrar/reabrir la app y verificar persistencia.
- [ ] Reconectar y comprobar que los datos locales siguen intactos.
- [ ] Publicar una nueva build de prueba local: comprobar aviso de versión,
      «Después» sin recarga y «Actualizar» conservando los datos.

Una URL HTTP de una IP de la red local no equivale a localhost en otro dispositivo:
para instalar y probar offline en un móvil físico, hace falta un origen HTTPS.

### Dos pestañas reales

- [ ] Abrir dos pestañas del mismo origen. Cambiar de cuenta y cerrar sesión debe
      sincronizar la identidad en ambas pestañas. Restablecer la contraseña invalida sesiones previas.
- [ ] Reservar la misma pista/franja casi a la vez: solo una confirma; la otra
      muestra el conflicto y permite elegir otra pista.
- [ ] Cancelar una reserva y comprobar que se libera en la otra pestaña sin recargar.
- [ ] Anular la cuota de Alba desde administración: su pestaña deja de permitir
      nuevas reservas, pero conserva el acceso a sus reservas y comprobantes.
- [ ] Abrir Configuración en ambas: un cambio guardado actualiza la pestaña sin
      editar. Si tiene borrador, se conserva, se avisa y no se permite sobrescribirlo.
- [ ] Pulsar «Descartar» en el conflicto y comprobar que se cargan los ajustes actuales.

### Descarga e impresión

- [ ] Descargar un comprobante pagado y otro anulado; abrir los HTML sin conexión.
- [ ] Verificar periodo, importe, titular, estado y aviso «SIN VALIDEZ FISCAL».
- [ ] Configurar emisor ficticio y DNI/NIE/dirección del socio; registrar un pago y
      comprobar ambos bloques fiscales, cantidad, precio neto, base, IVA y total.
- [ ] Modificar emisor, dirección del socio e IVA; comprobar que el documento
      anterior conserva su snapshot y que los nuevos pagos usan los datos actuales.
- [ ] Abrir documentos anteriores sin datos fiscales/IVA: deben advertir las ausencias,
      no inventar un emisor ni un tipo impositivo, y conservar el total histórico.
- [ ] Revisar nombres y direcciones largos a 320 px y en A4/PDF: sin recortes; la tabla
      puede desplazarse horizontalmente en móvil, no el documento completo.
- [ ] Usar «Imprimir / PDF»: solo debe aparecer el documento, sin menú ni overlay,
      con texto legible y sin contenido cortado. Guardar y abrir el PDF generado.
- [ ] Cerrar el diálogo de impresión sin que se alteren pagos o reservas.

## Fuera del alcance de esta demo

Backend, autenticación real, sincronización entre dispositivos, pagos reales,
facturación fiscal y despliegue público. No son tareas pendientes de implementación
de la demo local. La instalación física y la aceptación visual no se declaran
completadas hasta ejecutar el checklist anterior.
