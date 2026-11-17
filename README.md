# Doscientos Club · Ping-pong

Demo local para un club con ocho pistas. Suscripción mensual con **reservas
ilimitadas incluidas**, sin pagar por partida. Sin backend, Supabase, APIs ni
servicios de identidad externos. Todo se conserva en `localStorage` del navegador utilizado.

## Arranque

- Requisitos: Node.js 22.12+ o una versión LTS posterior compatible con Vite y pnpm.
- Desde `clients/pingpong`, ejecutar `pnpm install` y `pnpm dev`.
- Abrir **http://localhost:5188**.
- Comprobaciones: `pnpm quality` (TypeScript, lint, tests, build y archivos PWA).
- Comprobar archivos PWA después de compilar: `pnpm verifyPwa`.
- Con la preview arrancada: `pnpm verifyPreview` comprueba todos los archivos por HTTP.
- Iconos reproducibles: `node scripts/generate-icons.mjs`.

## Probar los perfiles

Sin sesión, cualquier ruta redirige a `/login`, donde se elige la cuenta. Con sesión,
`/` abre el calendario y `/login` redirige a `/`. Las URLs no utilizan `#`; Vercel
sirve la aplicación también al abrir o recargar una ruta directamente.
Los perfiles de ejemplo siguen
sin contraseña hasta configurarla en **Menú de usuario → Ajustes de cuenta**.
Las cuentas nuevas y las invitaciones requieren contraseña local. El menú permite
cambiar de perfil y cerrar sesión sin borrar los datos del club.

| Perfil                             | Qué permite probar                                                               |
| ---------------------------------- | -------------------------------------------------------------------------------- |
| Alba, Marcos, Lucía y otros socios | Cuota actual pagada, reserva guiada y documentos propios.                        |
| Hugo                               | Cuota pendiente: bloqueo y activación con pago simulado; admite simular rechazo. |
| Elena                              | Baja lógica: acceso bloqueado, historial conservado.                             |
| Álex · Administración              | Calendario, crear/editar reservas, socios, cuotas, horarios y cierres.           |
| Cuenta nueva                       | Alta con contraseña local y cuota pendiente antes de reservar.                   |

Los datos iniciales se generan tomando como referencia la fecha del primer
arranque. Al pasar de mes, las cuotas caducan de verdad: no hay renovación
automática ni se regeneran datos para aparentar pagos.

## Suscripciones y reservas

- Cuota inicial: **Cuota general · 39 €/mes natural**. Administración puede crear
  varias cuotas con nombre y precio en **Configuración → Cuotas**.
- **Nuevo socio**, **Invitar usuario** y el registro **Crear cuenta local** permiten
  elegir cuota. El selector muestra nombre e importe mensual; la primera aparece
  preseleccionada. Administración puede cambiarla desde la ficha del socio.
  **Socios → Accesos y roles** permite reasignarla a cualquier usuario, también
  a administradores y usuarios de baja, antes de eliminar una cuota sin uso.
- Todas las cuotas ofrecen **reservas ilimitadas** por ahora. No hay cupos,
  modalidades por número de reservas ni restricciones diferentes entre cuotas;
  esas reglas quedan fuera del alcance actual.
- Los pagos nuevos usan el precio de la cuota asignada. Cambiar su nombre/precio
  o la cuota del socio no modifica pagos anteriores ni invalida un mes ya pagado;
  no genera cargos, prorrateos ni devoluciones automáticos.
- Debe quedar al menos una cuota, con nombres únicos e importes entre 1 y 1.000 €.
  Solo pueden eliminarse cuotas sin usuarios asignados, incluidos usuarios de baja
  y administradores. Los administradores no necesitan pagar cuota para acceder.
- La cuota del mes actual habilita el acceso y la creación de reservas futuras,
  incluso de fechas de otros meses, según disponibilidad. No hay cupo por socio.
- Cada reserva ocupa una pista durante una hora. No genera un pago adicional.
- Reserva guiada: **día → hora → pista libre → confirmar**. Puedes volver atrás o
  cambiar cualquier dato desde el resumen. Las horas completas y pistas ocupadas
  están deshabilitadas; cambiar de fecha limpia las selecciones anteriores.
- Una reserva de 18:00 a 19:00 permite reservar la misma pista a las 19:00,
  sin bloqueo adicional. La disponibilidad se vuelve a comprobar al guardar.
- Administración: pulsa un hueco libre o **Nueva reserva**, selecciona un socio
  con cuota al día y confirma. Pulsa una reserva futura → **Modificar reserva**
  para cambiar día, hora, pista o titular sin perderla si hay un conflicto.
- En **Configuración → Copiar horarios**, copia las franjas entre días.
  Los cambios solo se aplican al pulsar **Guardar cambios**; puedes descartarlos.
- Si otra pestaña modifica los ajustes mientras editas, se conserva tu borrador y
  se bloquea el guardado obsoleto. **Descartar** carga los ajustes actuales.
- Cancelar antes del inicio libera la pista y no modifica la cuota.
- En Pagos, el administrador elige periodo y registra o anula cuotas; anular
  conserva el comprobante y, si es del mes actual, bloquea acceso al socio.
- Cambiar horarios o dar de baja a alguien no cancela sus reservas automáticamente.
  El calendario conserva reservas fuera del horario y permite reprogramarlas o cancelarlas.
- Tras confirmar una reserva se puede descargar un archivo de calendario `.ics`.
  Usa la zona horaria local del navegador, igual que las reservas de la demo; el
  archivo descargado no se actualiza cuando la reserva se modifica o cancela.
- Los documentos se consultan, descargan en HTML o imprimen/guardan como PDF
  mediante el diálogo del navegador. Son ficticios, **sin validez fiscal**.

## Correo de confirmación preparado, no activado

- `server/notifications/reservation-confirmation.ts` contiene un adaptador de Resend
  para un futuro servidor: prepara el correo y adjunta una invitación iCalendar
  `REQUEST` con destinatario, organizador, identificador estable y horas UTC.
  No forma parte de la aplicación cliente ni expone un endpoint; actualmente no se
  envían correos, aunque se configure una clave en el navegador.
- Para activarlo hará falta un backend con autenticación y autorización reales,
  persistencia compartida y una cola transaccional con reintentos y deduplicación.
  El servidor deberá obtener la reserva y el correo del socio desde datos fiables,
  no aceptar destinatarios o reservas arbitrarias del navegador. Debe guardar la
  clave de Resend exclusivamente en el servidor y usar un remitente de dominio
  verificado. La clave de idempotencia de Resend solo protege durante 24 horas.
- La reserva deberá guardar la zona horaria del club y las fechas reales antes de
  invocar el adaptador. También quedan pendientes las actualizaciones y cancelaciones
  de invitaciones, la gestión de entregas fallidas y la comprobación con clientes de
  correo/calendario. Resend aceptando el correo no garantiza su entrega y cada cliente
  decide si añade automáticamente la cita o pide confirmación al destinatario.

## Filtros e historial

- **Mis reservas** (próximas/canceladas) e **Historial de partidas** permiten combinar
  pista y rango de fechas de la reserva. Los extremos son inclusivos; también se
  puede indicar solo Desde o Hasta. **Limpiar filtros** recupera la lista completa.
- **Mis pagos** y los **Comprobantes** administrativos combinan búsqueda, periodo de
  la cuota, estado y rango de **fecha de pago** en el huso local. El periodo cubierto
  y el día del pago son filtros distintos. **Ver historial completo** quita el periodo;
  **Limpiar filtros de pagos** elimina todos los filtros del historial.
- Los tres listados muestran 12, 24 o 48 registros por página, con primera/anterior/
  siguiente/última y contador anunciado de resultados/página. Cambiar filtros vuelve
  a la primera página; cancelar o recibir cambios ajusta la página si deja de existir.
  Las estadísticas se calculan antes de paginar, no sobre los registros visibles.
- Filtros y paginación solo afectan a la consulta en pantalla: no borran ni modifican
  `localStorage`. El renderizado queda limitado a una página; el filtrado y la ordenación
  siguen siendo locales y no eliminan el coste de leer el documento completo.

## Datos fiscales y comprobantes

- **Configuración → Datos fiscales** permite guardar NIF, razón social y dirección
  completa del emisor. Completa los tres campos o déjalos vacíos; comparte borrador,
  guardado, descarte y protección ante conflictos con los demás ajustes.
- Los formularios de alta, invitación y ficha de socio incluyen **DNI/NIE** y
  **dirección postal**. Son opcionales para conservar los flujos y datos existentes;
  si se informa un DNI/NIE se valida su formato y letra. El NIF del emisor se valida
  por formato, no por titularidad. Incluye CP, localidad, provincia y país en la dirección.
- Cada pago nuevo conserva una copia del emisor, destinatario e IVA del momento.
  Cambiar ajustes o socios no reescribe comprobantes anteriores. Los documentos
  antiguos muestran los datos ausentes; no se rellenan con información actual.
- Descarga, vista previa e impresión comparten una plantilla local: identificación,
  emisor/destinatario, concepto, cantidad, precio neto, base imponible, IVA y total.
  Si un pago antiguo no guardó el tipo de IVA, aparece **No consta**, no un 0 % inventado.
- Los datos incompletos se advierten de forma explícita; no se bloquean pagos simulados.
  La presentación y el desglose **no otorgan validez fiscal**: no hay emisión fiscal,
  VERI*FACTU, comprobación censal ni facturas rectificativas. Usa solo datos ficticios:
  `localStorage` no es una base de datos cifrada ni un sistema legal de facturación.

## Contabilidad e invitaciones

- **Contabilidad** es exclusiva de administración: cuotas cobradas incorporadas
  una sola vez, gráfico de seis meses, gastos/facturas e ingresos externos manuales.
- Los importes se guardan en céntimos. Cada movimiento admite IVA incluido,
  deducibilidad, fecha de documento, fecha de cobro/pago y estado pendiente/pagado.
  Editar comprueba la revisión; anular conserva el registro y lo excluye de totales.
- Resultado = ingresos sin IVA menos gastos sin IVA deducible. El IVA no
  deducible forma parte del gasto. Saldo = saldo inicial global más cobros menos
  pagos hasta fin de mes. Se usa el estado actual, no una reconstrucción histórica.
- El saldo inicial es anterior al primer movimiento. El IVA de nuevas cuotas
  es configurable y se congela por pago; los pagos antiguos mantienen 0 %.
  Las cuotas no se cargan automáticamente: la previsión mensual no es ingreso.
  La previsión suma el precio de la cuota asignada a cada socio activo, no un precio único.
- Exportaciones CSV independientes de movimientos y resumen mensual, con UTF-8,
  importes decimales y protección contra fórmulas de hojas de cálculo.
  Son de demostración: **no son facturas fiscales ni declaraciones tributarias**.
- **Socios → Invitar usuario** crea una cuenta local con email, contraseña temporal,
  cuota y rol. No envía correo ni funciona en otro dispositivo. Comparte el acceso fuera
  de la aplicación. **Accesos y roles** permite cambiar roles y restablecer acceso;
  nunca se permite eliminar el último administrador activo mediante un cambio de rol.
- Las contraseñas usan PBKDF2-SHA-256 (210.000 iteraciones, sal aleatoria).
  Cambiarlas invalida sesiones anteriores. Al crear/configurar una contraseña se
  muestra una sola vez un código de recuperación, de un uso y válido un año.
  Guárdalo fuera del navegador. Si no lo tienes, administración puede establecer
  una nueva contraseña temporal. Recuperar consume el código; genera otro cambiando
  la contraseña desde tu cuenta. No se envían emails de recuperación.
- La sesión se conserva al recargar y se comparte entre pestañas del mismo origen;
  cerrar sesión o cambiar de cuenta se sincroniza. Las cuentas siguen siendo una
  simulación local: quien controla el navegador puede modificar datos, roles y sesión.
  **No uses contraseñas personales reales.** Se requiere HTTPS o localhost para Web Crypto.

## Secciones de administración

- **Configuración:** Horarios, Cierres, Cuotas y Datos fiscales. El mismo borrador abarca las cuatro
  pestañas; **Guardar cambios** y **Descartar** se aplican a todas ellas.
- **Socios:** listado y filtros separados de Accesos y roles.
- **Contabilidad:** Resumen, Movimientos y Parámetros. Los filtros y los parámetros
  pendientes se conservan al cambiar de pestaña; cada módulo mantiene su guardado.
- **Pagos:** Cuotas y Comprobantes; comparten búsqueda y periodo. **Ver historial
  completo** abre Comprobantes sin limitar el periodo. La vista del socio sigue siendo simple.
- `Tab` y `Mayús+Tab` entran y salen del grupo; flechas izquierda/derecha cambian
  de pestaña; `Inicio`/`Fin` van a la primera/última. Solo el panel activo es accesible.
  En móvil la barra se desplaza horizontalmente, con controles de al menos 44 px.
- Cambiar de pestaña no guarda ni pierde los borradores. Se conservan mientras
  permanezcas en esa pantalla; navegar a otra ruta no equivale a guardarlos.

## Instalar como aplicación

La PWA se genera en producción: ejecutar `pnpm build` y `pnpm preview`.
Usar la URL mostrada por Vite. Servir siempre en la raíz del dominio.

- **Instalar app** abre un diálogo con instrucciones manuales siempre disponibles.
  Si el navegador emite `beforeinstallprompt`, se habilita **Instalar en este dispositivo**,
  también si el evento llega con el diálogo abierto. Solo ese botón abre el permiso nativo.
- Chrome/Edge en Android o escritorio: usar ese botón o el menú del navegador.
- iPhone/iPad: abrir en Safari → Compartir → Añadir a pantalla de inicio.
- Cada permiso nativo se consume una sola vez; tras cancelar o fallar siguen disponibles
  las instrucciones. Aceptar la solicitud no confirma la instalación: se espera `appinstalled`.
- Es una PWA, no un APK ni un instalador descargable. No se usan servicios QR externos
  ni se añaden dependencias para generar QR; el QR local queda fuera de este cambio.
- Requiere **HTTPS o localhost**. Una dirección HTTP de la red local no ofrece
  las mismas capacidades de instalación y service worker.
- Tras cargar la build y activar el service worker, los archivos quedan
  disponibles offline. El modo de desarrollo no registra service worker.
- Las actualizaciones ofrecen confirmación antes de recargar.
- El diálogo no modifica `localStorage`. Instalar no sincroniza datos entre dispositivos
  ni sustituye una copia de seguridad; no cambia la precaché ni los requisitos offline.

## Datos y límites de la demo

- No introducir datos personales ni bancarios reales.
- Los datos no se comparten entre dispositivos ni perfiles de navegador. Se
  pierden si se borran los datos del sitio; instalar la PWA no es una copia de seguridad.
- Las pestañas se sincronizan. Web Locks evita dobles reservas entre ellas;
  cuando no está disponible, se avisa de usar una única pestaña.
- Las horas corresponden al huso local del dispositivo.
- Se pueden probar todos los roles; esto **no es autenticación ni seguridad real**.
  La autorización de producción debe ejecutarse en servidor.
- Para empezar de cero, cerrar otras pestañas y eliminar únicamente las claves
  `spin-club:database:v2`, `spin-club:profile` y `spin-club:session:v1` desde el almacenamiento del sitio.
  Esto elimina los cambios locales de la demo y vuelve a generar los ejemplos.
- La marca es Doscientos Club. Las claves internas anteriores y el evento de
  sincronización se conservan por compatibilidad: renombrarlos perdería el acceso
  a los datos existentes. No se modifican socios, pagos ni comprobantes guardados.
- Los datos con cuota única se adaptan al leer: **Cuota general** conserva el precio
  configurado y se asigna a los usuarios existentes. No se regeneran datos ni se
  modifican importes históricos. La lectura no reescribe el documento; el catálogo
  se conserva en el siguiente cambio guardado.

## Arquitectura y verificación

React + TypeScript + Tailwind CSS 4. `app/app.tsx` solo compone los proveedores;
layout y rutas están separados. Cada funcionalidad agrupa sus componentes y hooks,
y `shared/ui` concentra las piezas visuales reutilizables. Los tokens viven en
`theme.css`; el CSS global se limita a base e impresión.

Botones, enlaces, tooltips y avatares usan `@doscientos/ui`, sin peticiones externas
en ejecución. El repositorio reutiliza snapshots inmutables y evita escrituras
sin cambios; las consultas se cachean por datos, perfil y mes. El reloj se mantiene
separado del contexto principal y la disponibilidad usa índices memoizados.

Ver [PLAN-TECNICO.md](./PLAN-TECNICO.md): decisiones, módulos, adaptación futura
a backend y resultados de validación. Los tests de UI usan DOM simulado con
el repositorio local real; no sustituyen una revisión visual ni la instalación
en dispositivos físicos.

El checklist reproducible de aceptación visual, PWA/offline, dos pestañas e impresión
está en [VALIDACION-DEMO.md](./VALIDACION-DEMO.md). Las pruebas físicas pendientes
están identificadas expresamente; no se consideran verificadas por compilar.
