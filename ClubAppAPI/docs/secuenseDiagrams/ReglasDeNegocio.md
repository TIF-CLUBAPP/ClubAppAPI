# Reglas de Negocio - ClubApp

### Gestión de Usuarios y Roles
- Un usuario puede tener uno de tres roles: Socio, Admin o SuperAdmin.
- El SuperAdmin es el único con permisos para crear, modificar o eliminar otros usuarios y asignar roles.
- El Admin puede gestionar actividades, cupos y registrar pagos manuales.
- Un Socio solo puede visualizar sus propios pagos, inscripciones y estado de membresía.

### Membresías y Estados
- Un Socio debe tener una única Membresía vinculada para poder utilizar los servicios del club.
- La Membresía tiene un estado que puede ser: "Activa", "Vencida", "Pendiente de Pago" o "Próxima a Vencer".
- La Membresía se considera "Activa" únicamente si existe un Pago confirmado para el período actual.
- El sistema debe actualizar el estado de la Membresía a "Vencida" automáticamente si no se registra un pago válido tras la fecha de vencimiento.

### Pagos y Finanzas
- Un Pago corresponde obligatoriamente a una Membresía.
- Un Pago debe registrar el monto, la fecha de transacción y el método (MercadoPago o Efectivo).
- Un Pago tiene un estado: "Completado", "Pendiente" o "Fallido".
- Cuando un Pago pasa a estado "Completado", la Membresía vinculada debe actualizar su fecha de fin y pasar a estado "Activa".
- Solo los usuarios con rol Admin o SuperAdmin pueden registrar pagos realizados en "Efectivo".

### Actividades e Inscripciones
- Una Actividad debe tener un nombre, descripción, cupo máximo y horario.
- Un Socio puede inscribirse a una o más Actividades, siempre que existan cupos disponibles.
- Una Inscripción vincula a un Socio con una Actividad y tiene un estado: "Activa" o "Cancelada".
- El sistema no debe permitir la inscripción de un Socio si la Actividad ha alcanzado su cupo máximo.
- El sistema puede restringir la inscripción a actividades si la Membresía del Socio está en estado "Vencida".
- Si un Socio cancela su participación, el cupo de la Actividad debe liberarse automáticamente para otros usuarios.

### Notificaciones
- El sistema debe generar una Notificación interna cuando una Membresía esté a menos de 5 días de vencer.
- Se debe generar una Notificación automática al Socio cuando un Pago sea procesado con éxito o resulte fallido.
- Las notificaciones deben marcarse como "Leídas" una vez que el usuario acceda a ellas en la aplicación.