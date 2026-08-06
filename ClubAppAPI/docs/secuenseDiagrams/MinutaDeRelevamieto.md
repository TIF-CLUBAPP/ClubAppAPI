# Proceso de Gestión de Socios, Membresías y Actividades (ClubApp)

## Contexto
Muchos clubes deportivos de pequeña escala o barriales gestionan sus registros de forma manual (libros de actas) o mediante herramientas no centralizadas (planillas de cálculo, chats de WhatsApp). Esto genera ineficiencias en el control de cobros, falta de transparencia para el socio sobre su estado de deuda y dificultades para organizar los cupos de las actividades deportivas o recreativas que el club ofrece.

## Proceso actual
Cuando una persona desea asociarse al club, debe acercarse físicamente a la administración. Allí, un administrativo toma sus datos y le asigna un número de legajo. El pago de la cuota mensual se realiza mayormente en efectivo en la secretaría o mediante transferencias bancarias manuales que el administrativo debe verificar una por una en el resumen de cuenta para luego marcar al socio como "al día" en una planilla.

Para las actividades (ej. fútbol, gimnasio, patín), los profesores suelen llevar sus propias listas de asistencia. Si un socio quiere anotarse, debe consultar al profesor si hay cupo. No existe un control estricto que cruce si el socio que está realizando la actividad tiene la cuota paga, lo que genera morosidad que el club nota recién al final del ciclo mensual. Las notificaciones de deuda se hacen de forma individual por teléfono o cuando el socio intenta ingresar a la institución.

## Proceso con el sistema de información deseado (ClubApp)

### Gestión de Usuarios y Acceso
Cuando un **Socio** desea interactuar con el club, accede a **ClubApp** con su **Usuario** y contraseña. El sistema presenta un panel principal donde el socio puede visualizar de forma inmediata el **Estado de su Membresía** (Activa, Vencida o Próxima a vencer). 

### Gestión de Membresía y Pagos
Si la membresía está vencida o el socio desea adelantar el mes, selecciona la opción de "Pagar Cuota". El sistema permite realizar el pago de forma integrada a través de **MercadoPago**. Una vez que la transacción es confirmada por la plataforma de pagos, el sistema actualiza automáticamente la **Membresía** del socio a estado "Activa" y extiende su fecha de vencimiento. 

En caso de que el socio prefiera pagar en la sede, un **Admin** puede buscar al usuario en el sistema y registrar un "Pago Manual" en efectivo. En ambos casos, el sistema genera un registro de **Pago** vinculado a la membresía para consultas históricas y emite una **Notificación** de confirmación al socio.

### Inscripción a Actividades
El socio puede navegar por un listado de **Actividades** disponibles. Al seleccionar una, el sistema muestra la descripción, el horario y los **cupos disponibles**. 
- Si hay cupo y la membresía del socio está activa, el socio puede confirmar su **Inscripción**. 
- El sistema descuenta automáticamente un cupo de la actividad.
- Si el socio desea darse de baja, puede hacerlo desde su perfil, liberando el cupo para otro miembro de forma inmediata.

### Administración y Control
Los usuarios con rol **Admin** o **SuperAdmin** acceden a un panel de control donde pueden visualizar el listado completo de socios y filtrar a aquellos que presentan deudas. 
- El **Admin** puede crear nuevas actividades, definir el límite de cupos y modificar horarios.
- El **SuperAdmin** tiene la facultad adicional de gestionar las cuentas de usuario (altas, bajas y bloqueos) y asignar roles administrativos a otros empleados del club.

### Notificaciones y Vencimientos
El sistema corre un proceso automático que verifica diariamente las fechas de vencimiento de las membresías. 
- Si una membresía está por vencer, envía una **Notificación** interna al socio como aviso preventivo.
- Si la fecha de vencimiento expira sin un pago registrado, el sistema cambia el estado de la membresía a "Vencida" y restringe el acceso del socio a la inscripción de nuevas actividades hasta que regularice su situación.