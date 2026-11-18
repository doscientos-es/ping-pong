# Perception · demo de reservas

## Objetivo y límites

Aplicación responsive para ocho pistas de ping-pong. Toda la información se
genera y persiste en este navegador; no hay backend, Supabase, APIs, analítica,
fuentes remotas ni pagos reales. Los datos iniciales son ficticios.

`localStorage` NO es una frontera de seguridad: cualquiera con acceso al
navegador puede modificarlo. Las comprobaciones de rol y propiedad permiten
demostrar los flujos, pero no sustituyen autorización en servidor.

## Decisiones de producto

- Marca y nombre corto de la PWA: **Perception**.
  Identidad compartida en `src/shared/brand.ts`. Idioma español, formato europeo.
- El cambio de marca conserva las claves de almacenamiento y el evento de
  sincronización existentes para no perder datos ni romper otras pestañas.
- Ocho pistas fijas; duración de reserva de 60 minutos, sin cupo por socio.
- Los socios reservan mediante pasos: **día → hora → pista → confirmar**.
  Las horas completas o pasadas y las pistas ocupadas quedan deshabilitadas.
- Intervalos sin solapamiento: 18:00–19:00 ocupa ese turno; la misma pista
  puede reservarse a las 19:00. No se añade una hora de bloqueo extra.
- **Alcance vigente:** suscripción al club con reservas ilimitadas incluidas.
- Periodos mensuales naturales y catálogo de cuotas con nombre y precio.
  Inicialmente solo existe **Cuota general · 39 €/mes**; administración puede añadir otras.
- Las altas públicas, invitaciones y altas administrativas eligen cuota. Cada usuario
  conserva su `planId`; la ficha del socio permite modificarlo. Los administradores
  tienen una asignación, pero siguen exentos del requisito de pago para acceder.
- Todas las cuotas incluyen reservas ilimitadas. No se implementan todavía cupos
  ni condiciones por modalidad; deberán definirse antes de añadir reglas de reserva.
- El pago es simulado: no se piden tarjetas ni se mueve dinero.
- El pago se asocia al socio y al periodo, nunca a una reserva.
- La cuota del mes actual habilita reservas ilimitadas mientras haya disponibilidad.
- Sin cuota vigente se muestra la pantalla de renovación, no el calendario.
- Selección de cuentas con sesión persistente. Perfiles antiguos sin contraseña
  hasta configurarla; nuevas altas e invitaciones con contraseña local y recuperación
  mediante código de un solo uso. Sin servicio de identidad ni envío de emails.
- La baja es lógica, nunca borra reservas, pagos ni facturas.
- Cancelar una reserva futura libera la pista, sin cobro ni reembolso.
- Se permite cancelar reservas futuras propias; el administrador puede cancelar cualquiera.
- Administración puede crear para socios activos con cuota vigente y reprogramar
  reservas futuras confirmadas. La edición conserva identificador y fecha de creación;
  un conflicto deja intacta la reserva anterior. No genera pagos.
- Horarios semanales con varias franjas y cierres excepcionales por fecha.
- Cambiar horarios no elimina reservas previas: siguen visibles y se advierte al administrador.
- Los horarios se pueden copiar de un día a varios días seleccionados en un borrador,
  descartar o guardar. La barra de guardado permanece accesible al desplazarse.
- Si otra pestaña cambia los ajustes, una pantalla sin editar se actualiza. Un
  borrador abierto se conserva y avisa del conflicto; guardarlo compara la versión
  de partida dentro de la transacción para no sobrescribir cambios nuevos.
- Las horas pertenecen al huso local del dispositivo, sin conversión UTC de fechas civiles.
- Las facturas son documentos imprimibles de demostración, sin validez fiscal.
- Sin notificaciones push, cobros, resultados deportivos ni clasificaciones.

## Arquitectura

- React, TypeScript, Vite y Tailwind CSS 4 con el plugin oficial de Vite; iconos Lucide.
- Transiciones de pasos con Motion y velocidades compartidas; se respeta la
  preferencia de movimiento reducido. No se descargan componentes en ejecución.
- `src/features/club/domain`: entidades y reglas puras, independientes de React.
- `src/features/club/application`: casos de uso y puerto de repositorio asíncrono.
- `src/features/club/infrastructure`: adaptador local y perfiles ficticios.
- Features de reservas, socios, pagos y configuración contienen la UI.
- `features/accounting` y `features/session` separan dominio, casos de uso,
  puertos, adaptadores y UI. Contabilidad se carga bajo demanda, sin librerías de gráficos.
- `src/app`: composición, navegación y proveedores; `src/shared`: UI y formato.
- Un documento local versionado conserva coherencia entre colecciones.
- Escrituras bajo Web Locks, releyendo el documento dentro del bloqueo para
  evitar dobles reservas entre pestañas. Fallback serializado en una pestaña.
- Sincronización entre pestañas por eventos `storage`; cada operación revalida permisos.
- PWA con manifest, iconos locales y service worker generado por `vite-plugin-pwa`.
- Tipografía empaquetada; no se necesitan peticiones de terceros en ejecución.

### Organización de componentes y estilos

- `app/app.tsx` solo compone router, proveedor y límite de errores.
  `club-shell` coordina el layout; `app/layout` contiene sus piezas visuales.
- `app/session-routes.tsx` separa `/login` del área privada y espera a validar
  la sesión antes de mostrarla. Sin perfil redirige a `/login`; con sesión,
  `/login` redirige al calendario. `BrowserRouter` usa URLs sin `#` y Vercel
  reescribe las rutas de aplicación a `index.html` para admitir recargas directas.
- `app/app-routes.tsx` centraliza rutas y navegación por rol. Las rutas restringidas
  y desconocidas redirigen al calendario; el dominio vuelve a comprobar permisos.
- Cada funcionalidad conserva sus componentes y hooks: calendario en
  `features/reservations/calendar`, asistente en `use-booking-flow` y borrador de
  configuración en `use-settings-draft`. Las pantallas componen estas piezas.
- `shared/ui` contiene botones, paneles, modales, avatares, listas y estados de
  feedback. Se reutilizan componentes, no cadenas de estilos copiadas entre pantallas.
- Botones, enlaces, botones con iconos, tooltips y avatares reutilizan `@doscientos/ui`.
  Adaptadores mínimos conservan variantes del club, navegación sin recarga,
  nombres accesibles y objetivos táctiles de 44 px en móvil.
- `shared/ui/tabs.tsx` adapta las pestañas de `@doscientos/ui` (React Aria):
  semántica, identificadores, foco y teclado se delegan en el componente instalado,
  sin dependencias nuevas ni implementación manual de eventos de teclado.
  La barra usa Tailwind y desplazamiento horizontal local; cada grupo tiene nombre accesible.
- Configuración separa Horarios/Cierres/Cuotas/Datos fiscales sin dividir su borrador ni su guardado.
  Socios separa listado/accesos, Contabilidad resumen/movimientos/parámetros y
  Pagos de administración cuotas/comprobantes. Los paneles comparten los casos de uso existentes.
- Los paneles permanecen montados mediante `shouldForceMount` para conservar
  formularios no controlados y estado local. Los inactivos son `inert` y usan
  `display: none` derivado de su estado, fuera del foco y del árbol de accesibilidad.
  Solo cambiar de pestaña conserva el borrador: no se promete conservarlo al salir de la ruta.
- `shared/cn.ts` combina variantes con `tailwind-merge`, permitiendo sobrescribir
  utilidades sin conflictos. `shared/ui.tsx` conserva las exportaciones públicas.
- `theme.css` define colores, tipografías y breakpoints de Tailwind. Los estilos
  visuales viven junto al componente; solo quedan CSS globales de base e impresión.
- La vista del socio prioriza la reserva: cabecera breve, pasos en una fila,
  tarjetas sin ilustraciones y sin alturas mínimas vacías. Fechas desplazables
  dentro de su tira, con objetivos táctiles de al menos 44 px.
- Cabecera, navegación inferior y acciones comparten variables de altura con
  áreas seguras. Al cambiar de paso se enfoca y muestra el título; la selección
  de fecha solo desplaza horizontalmente su tira, no la página.
- `features/pwa` separa el estado de instalación del aviso de actualización.
  Los fallos del navegador ofrecen ayuda o reintento sin promesas rechazadas sin tratar;
  Safari iOS instalado se detecta también mediante `navigator.standalone`.
- El diálogo de instalación conserva la ayuda manual y habilita la acción nativa solo
  tras `beforeinstallprompt`, incluso recibido con el modal abierto. Un permiso se consume
  una sola vez; la instalación se confirma únicamente con `appinstalled`, no con `accepted`.
  Cancelación/aceptación se anuncian como estado y los fallos como alerta. El modal conserva
  navegación por teclado y retorno del foco. No modifica almacenamiento ni service worker,
  no ofrece un APK ficticio ni depende de servicios QR externos o librerías nuevas.
- Convención: reglas de negocio en dominio/casos de uso, estado de interacción en
  hooks y presentación en componentes. Las dependencias externas se inyectan mediante
  `ClubGateway` y `ClubRepository`; la UI no accede directamente a la base local.

### Persistencia y rendimiento

- El repositorio compara el documento almacenado con su caché: solo vuelve a
  parsear y validar si cambian los bytes. Las lecturas son snapshots inmutables
  con referencias estables; los consumidores no deben modificarlos.
- Cada transacción relee dentro del bloqueo, trabaja sobre un borrador aislado
  y hace una única escritura atómica si cambia el contenido. No se escriben ni
  notifican operaciones sin cambios, aunque el esquema reordene propiedades JSON.
  El resultado se clona antes de guardar; un fallo no anuncia un éxito parcial.
- Las consultas reutilizan perfiles y vistas por snapshot, perfil y mes de cuota.
  Cambiar de mes o recibir nuevos datos invalida la caché, incluidos los permisos.
- El reloj tiene su propio contexto; solo actualiza pantallas temporales. Al
  refrescar sin cambios, el contexto principal mantiene sus referencias. Las
  pestañas ocultas no ejecutan el refresco periódico y se actualizan al volver.
- Disponibilidad indexada por fecha/hora y memoizada por datos/reloj; la búsqueda
  del siguiente día libre solo se hace cuando el seleccionado no tiene huecos.
  Calendario y listado de socios usan índices en vez de búsquedas por cada celda/fila.
- Reservas próximas/canceladas, historial de partidas y comprobantes usan
  `shared/use-pagination.ts` y `ui/pagination.tsx`: 12/24/48 resultados renderizados,
  primera/anterior/siguiente/última, contador de estado y vínculo ARIA a los resultados.
  Cambiar perfil/filtros/tipo de lista reinicia la página; las bajas de resultados la
  ajustan antes de renderizar. Se conserva el tamaño al cambiar filtros.
- `shared/date-range.ts` centraliza rangos inclusivos de fechas civiles. Los campos
  compartidos etiquetan ambos extremos y asocian el error si están invertidos.
  Reservas añade pista; comprobantes combina fecha local de pago con periodo/estado/
  búsqueda. Consultas memoizadas y orden estable; los totales no se recortan por página.
  Socios al día se calcula con un conjunto de identificadores, sin cruzar cada socio
  con todos los pagos. Los controles no escriben en el repositorio.
- No se añaden APIs, backend ni servicios externos. `localStorage` sigue teniendo
  coste síncrono proporcional al documento; no se afirma capacidad ilimitada ni
  se han medido tiempos en dispositivos físicos.

## Catálogo de cuotas y compatibilidad local

- `ClubSettings.plans` contiene `{ id, name, priceCents }`; `Member.planId` mantiene
  la referencia. `domain/plans.ts` centraliza búsqueda y validación, sin depender de React.
- Los nombres son únicos sin distinguir mayúsculas ni espacios exteriores, de 2 a 80
  caracteres. Identificadores únicos, importe mensual entero de 100 a 100.000 céntimos.
- Debe quedar al menos una cuota. El servicio impide eliminar una asignada a cualquier
  usuario, también de baja o administrador; comprueba el estado actual dentro del bloqueo.
- El selector compartido en `MemberFields` muestra nombre/precio y conserva la elección
  en edición. El catálogo es público mediante `subscriptionPlans()`, sin exponer datos privados.
  `ClubPlanSelect` se reutiliza en Accesos y roles para reasignar cualquier cuenta,
  incluidos administradores y usuarios de baja, mediante `setMemberPlan` solo administrativo.
  Con varias cuotas el servicio exige selección explícita; con una acepta la omisión
  para compatibilidad de llamadas existentes. La UI siempre envía el identificador.
- El diálogo captura el identificador e importe; el pago revalida ambos frente a la cuota
  asignada. Los nuevos pagos guardan un snapshot de nombre e identificador, además del
  importe y el IVA. Los comprobantes usan ese snapshot, no el nombre vigente del catálogo.
- Cambiar la cuota asignada o sus precios no modifica periodos pagados ni reservas,
  y no dispara cobros, prorrateos ni devoluciones. La previsión contable suma cuotas
  por socio activo; los ingresos reales siguen saliendo únicamente de pagos registrados.
- Se conserva la clave `spin-club:database:v2`. El decodificador acepta el formato anterior
  `settings.priceCents` y lo convierte en **Cuota general**, asignándola a los usuarios
  existentes sin cambiar pagos ni reservas. Leer no escribe; el siguiente cambio efectivo
  guarda el formato nuevo. Documentos incompatibles o referencias inválidas no se sobrescriben.
- La detección de conflictos incluye identificador, nombre, precio y orden de las cuotas.
  La primera cuota aparece preseleccionada en las altas. No hay dependencias nuevas.

## Sustitución por backend

Implementar `ClubRepository` con un backend real e inyectarlo en la composición.
Migrar los casos de uso a operaciones transaccionales del servidor. Para Supabase:
Auth para identidad, RLS por socio/rol, restricción única de pista+fecha+hora,
pagos por socio+periodo, bajas lógicas y facturas en almacenamiento privado.
Añadir proveedor real de suscripciones y webhooks idempotentes para renovar el
acceso. Nunca aceptar como prueba de pago el estado del cliente.
El selector de perfiles es exclusivamente de demostración y se sustituye por Auth.
El contrato transaccional local expresa atomicidad; un adaptador remoto debe
ejecutarla en servidor/RPC, no descargar datos y volver a subir el documento.

## Datos fiscales y documentos locales

- `ClubSettings.issuer` contiene razón social, NIF y dirección completa; es opcional
  para leer versiones anteriores. El dominio valida el conjunto completo o vacío,
  longitudes y formato de NIF. `sameSettings` incluye los tres campos en los conflictos.
- `Member`/`MemberInput` admiten DNI/NIE y dirección opcionales. `domain/billing.ts`
  normaliza identificadores, comprueba la letra del DNI/NIE y limita longitudes.
  Las ediciones por llamadas antiguas que omiten estos campos no borran sus valores.
  `MemberFields` los reutiliza en altas, invitaciones, registro y ficha administrativa.
- `Payment.issuer` y los datos fiscales de `Payment.customer` son snapshots del pago.
  No dependen de los ajustes ni del socio actual. Versión y clave local permanecen
  iguales; el esquema acepta ausencias y conserva nuevos campos sin reescribir al leer.
- `invoice-details.ts` usa el IVA guardado y el cálculo en céntimos de Contabilidad;
  la base más la cuota tributaria conserva exactamente el total. Un IVA histórico
  ausente no se supone conocido, aunque Contabilidad use 0 % como fallback de cálculo.
- Vista previa, impresión y descarga usan `invoiceMarkup` y `invoiceStyles`. El HTML
  de plantilla propia escapa todos los datos persistidos antes de insertarlos; no
  admite HTML del usuario. El archivo autónomo no requiere red e incluye una CSP
  que bloquea scripts y recursos externos. Los estilos se limitan a `.club-invoice`.
- El diseño incluye número, fecha de emisión/pago, periodo, emisor, destinatario,
  concepto, cantidad, precio neto, IVA, base y total. Se advierte de campos ausentes
  sin inventarlos ni bloquear el flujo simulado. No se eliminan avisos de demostración:
  no hay validez fiscal, verificación censal, VERI*FACTU ni documentos rectificativos.
  No introducir datos personales reales en esta demo local sin cifrado de datos.

## Módulos del repositorio

- UI: calendario deportivo y adaptadores de componentes de `@doscientos/ui`.
- PWA: plugin Vite independiente, sin necesidad de integrar un backend.
- Billing/Verifactu: no aplica, solo comprobantes ficticios sin fiscalidad real.
- Supabase/actions: no aplica por requisito explícito de ejecución local.

## Plan de implementación

- [x] Revisar estructura y fijar decisiones y límites.
- [x] Crear proyecto, configuración y dependencias.
- [x] Modelar horarios, suscripción mensual, reservas ilimitadas y documentos.
- [x] Implementar repositorio local, concurrencia y datos iniciales.
- [x] Selección de cuentas, sesión local, contraseñas, invitaciones, roles y recuperación.
- [x] Calendario diario responsive con ocho pistas y confirmación.
- [x] Flujo de socios por pasos, disponibilidad en vivo, resumen editable y foco accesible.
- [x] Alta y edición administrativas desde calendario, sin duplicar lógica de reserva.
- [x] Disponibilidad compartida entre UI y validación transaccional de creación/edición.
- [x] Copia de horarios entre días, conteo de turnos, descarte y guardado accesible.
- [x] Próximas reservas, cancelación e historial.
- [x] Pagos propios y facturas imprimibles/descargables.
- [x] CRUD de socios con bajas lógicas y gestión de accesos locales.
- [x] Contabilidad administrativa, gráficos, IVA estimado, facturas manuales y exportación CSV.
- [x] Control administrativo de cuotas por periodo; registrar/anular pago sin borrar historial.
- [x] Configuración de horarios y cierres.
- [x] Catálogo de cuotas, selección en altas, migración local y cobros por cuota asignada.
- [x] Implementación PWA, iconos y caché offline de archivos.
- [x] Tests de reglas, permisos, persistencia, concurrencia y flujos de UI.
- [x] Separar composición, layout, rutas, hooks y componentes de cada funcionalidad.
- [x] Migrar estilos a Tailwind y retirar hojas de estilos monolíticas.
- [x] Integrar controles de `@doscientos/ui` y optimizar caché, transacciones y reloj.
- [x] Typecheck, lint, tests y build de producción.
- [x] Documentar arranque, perfiles demo y validaciones realizadas.
- [ ] Aceptación visual, teclado y uso táctil en móvil y escritorio.
- [ ] Instalación física en iOS/Android y recarga real sin conexión.
- [ ] Descarga de comprobantes y comprobación del PDF generado en navegador.
- [ ] Sincronización y conflictos con dos pestañas reales.

Estas últimas comprobaciones requieren navegador o dispositivos. El procedimiento
y la evidencia automatizada están en [VALIDACION-DEMO.md](./VALIDACION-DEMO.md).
El apartado «Sustitución por backend» es una orientación futura, no trabajo pendiente
de esta demo local; no se añaden autenticación de servidor, cobros ni infraestructura remota.

## Criterios de aceptación

1. Un socio activo con cuota vigente reserva sin límite ni pago adicional.
2. La segunda confirmación de una misma pista/franja se rechaza.
3. Sin cuota vigente no hay calendario; una baja bloquea el acceso. Sin credenciales.
4. El administrador gestiona socios, pagos y horarios sin perder históricos.
5. Cada socio consulta únicamente sus pagos y documentos desde los casos de uso.
6. Recargar conserva cambios; otra pestaña recibe las actualizaciones.
7. Todos los controles tienen acción real o indican claramente su limitación.
8. La build produce una webapp instalable servida por HTTPS o localhost.
9. Cambiar de día limpia la hora y pista seleccionadas; cambiar de hora limpia la pista.
10. Una ocupación sobrevenida deshabilita la confirmación y permite volver a elegir.
11. Reprogramar libera el turno anterior únicamente cuando se guarda el nuevo.

## Verificación

- Validación completada: TypeScript sin errores, oxlint sin avisos ni errores,
  186/186 tests correctos en 36 archivos, build de producción y archivos PWA verificados.
  La build muestra un aviso no bloqueante: el chunk principal ocupa unos 753 kB
  minificados y supera el umbral recomendado de 500 kB.
  Vite también avisa de una importación sin extensión en su configuración,
  incompatible con el futuro valor predeterminado `configLoader: 'native'`.
- `pnpm quality` agrupa TypeScript, oxlint, Vitest, compilación y archivos PWA.
- 186 tests automatizados: reglas de horarios y fechas, permisos, bajas,
  suscripción por periodo, pagos rechazados/duplicados/anulados, ausencia de
  cargos al reservar/cancelar, privacidad de vistas, persistencia y errores de cuota.
- Pruebas específicas de snapshots inmutables, operaciones sin escritura,
  invalidación de caché/periodo/permisos, aislamiento del resultado transaccional,
  disponibilidad indexada, renders del reloj y controles reales de `@doscientos/ui`
  (teclado, tooltips, formularios y navegación).
- `shared/ui/tabs.test.tsx`: relaciones ARIA y unicidad de identificadores,
  flechas/Inicio/Fin, exclusión de deshabilitados y paneles ocultos, tabulado y
  conservación de formularios. Se usan los componentes reales de `@doscientos/ui`.
- `club/application/subscription-plans.test.ts`: permisos, catálogo válido, selección
  en altas, reasignación de cuentas, cobro por cuota, cotización obsoleta e historial.
  `club/infrastructure/schema-plans.test.ts`: compatibilidad sin pérdida de datos ni
  escrituras al leer. `app/subscription-plans.test.tsx`: ajustes, altas, invitación,
  registro sin sesión, reasignación administrativa, pago y previsión contable reales.
- `app/tabbed-admin.test.tsx`: borradores de varios ajustes con guardado/descarte
  común, cambios de rol, parámetros contables sin guardar y filtros de pagos.
  Los flujos usan el servicio y repositorio local reales.
- `club/application/billing.test.ts` y `app/billing.test.tsx`: validación fiscal,
  compatibilidad local, snapshots históricos, permisos y formularios de emisor/socios.
  Los tests de comprobantes cubren escape HTML, datos ausentes y desglose de IVA.
- `shared/ui/pagination.test.tsx` cubre 10.000 registros sin renderizarlos todos,
  teclado/foco, tamaño de página, filtros y reducción del conjunto. `app/history-lists.test.tsx`
  cubre 1.000 partidas, pista/fechas, orden, cancelación, pagos, privacidad, totales
  no paginados y filtros que no escriben en almacenamiento. No mide latencia física.
- `app/booking-flows.test.tsx` comprueba todos los pasos sin repetir duración,
  confirmación con pista/fecha/horario etiquetados y reserva persistida sin cargos.
  Tarjetas, resúmenes, cabeceras e indicadores ajustan su distribución para móvil;
  los rangos horarios siguen visibles. La aceptación visual permanece pendiente.
- Concurrencia: dos servicios/repositorios compiten por la misma pista y solo
  uno confirma. Se prueba el fallback serializado y la invocación a Web Locks;
  esta última utiliza un sustituto de la API, no dos pestañas reales.
- Once flujos de UI con Testing Library y jsdom, usando servicio y localStorage
  reales: reserva/cancelación/recarga, cambio de roles y renovación, baja,
  alta local, configuración decimal, registro/anulación de cuotas, horas completas,
  cambio de fecha sin selección obsoleta, conflictos durante el resumen,
  creación/reprogramación administrativas y copia/descarte de horarios.
- Seis pruebas adicionales de composición: rutas directas por rol, navegación
  activa, ruta desconocida, recuperación tras fallo de lectura y límite de errores.
- Cobertura adicional de sincronización, conflictos de ajustes, instalación y
  actualización PWA con errores y descarga/impresión de comprobantes. Las APIs
  del navegador se simulan; no se acredita instalación ni impresión reales.
- Los tests del asistente precargan su módulo real antes de las aserciones para
  no consumir el tiempo de espera de la primera consulta transformando Motion.
- Se verifica que el siguiente turno queda libre, que editar no pierde el turno
  original al fallar y que no se pueden editar partidas canceladas o comenzadas.
- El flujo de reserva y Motion se cargan por separado del archivo principal.
  Ambos se incluyen en la precaché PWA.
- El registro del service worker se sustituye en los tests de UI porque requiere
  un navegador seguro real. No se han usado herramientas de navegador.
- La build genera manifest, iconos, fuentes locales, service worker y caché.
  `node scripts/verify-build.mjs`: correcto; comprueba esos archivos y sus referencias de precaché.
- Preview de producción en localhost.
  `pnpm verifyPreview`: raíz y todos los archivos de producción responden 200,
  coinciden con la build y tienen tipos de contenido válidos.
- Instalación en iOS/Android, impresión/PDF, comportamiento visual en móvil/PC,
  funcionamiento offline real y sincronización entre pestañas físicas quedan
  pendientes de comprobación manual. No se dan por verificados por el build.
- Ver `README.md` para arranque, instalación, perfiles y límites del almacenamiento.
