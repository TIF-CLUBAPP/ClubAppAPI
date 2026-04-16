# 🏟️ ClubApp

Aplicación web fullstack para la gestión de membresías, pagos y actividades en clubes deportivos pequeños. Diseñada para simplificar la administración y mejorar la experiencia tanto de usuarios como del staff del club.

# 🚀 Características
🔐 Autenticación de usuarios
👤 Gestión de roles (Usuario, Admin, SuperAdmin)
💳 Pago de membresías (integración con MercadoPago + registro manual)
📅 Inscripción a actividades con control de cupos
📊 Historial de pagos
🔔 Notificaciones de deuda y vencimiento
🛠️ Panel administrativo para gestión completa

# 🧑‍💻 Tecnologías

Frontend

* React
* JavaScript / HTML / CSS

Backend

* .NET

Base de datos

* SQLite

Herramientas

* Git & GitHub
* Notion
* Google Drive

# 🧩 Arquitectura

La aplicación sigue una arquitectura cliente-servidor:

El frontend en React consume una API REST desarrollada en .NET.
La base de datos SQLite almacena la información de usuarios, pagos, membresías y actividades.
Se implementa control de acceso basado en roles.

# 👥 Roles del sistema
* Usuario
* Ver estado de membresía
* Pagar membresía
* Inscribirse a actividades
* Admin
* Gestionar actividades
* Ver usuarios y estados de membresía
* Registrar pagos manuales
* SuperAdmin
* Gestionar usuarios (alta, baja, modificación)
* Asignar roles
* Bloquear usuarios

# 📌 Funcionalidades principales
* Registro e inicio de sesión
* Gestión de membresías (estado, vencimiento)
* Pagos online y manuales
* Inscripción y cancelación de actividades
* Control de cupos
* Notificaciones dentro de la app

# ❌ Fuera de alcance
* Aplicación mobile nativa
* Notificaciones por email o push
* Reportes financieros avanzados
* Sistema de estadísticas deportivas

# ⚙️ Instalación
Clonar repositorio
git clone https://github.com/tu-usuario/clubapp.git

# 👥 Entrar al proyecto
cd clubapp

Backend
cd backend
dotnet restore
dotnet run

Frontend
cd frontend
npm install
npm start

# 📷 Screenshots

(A FUTURO OJO)

# 👨‍💻 Equipo

* Ivo Bertoni — FullStack Dev / QA
* Diego Contreras — FullStack Dev
* Andrés Volpe — FullStack Dev / QA

# 📄 Licencia

Este proyecto es de uso académico.

# 💡 Sobre el proyecto

ClubApp nace como una solución para clubes pequeños que aún gestionan sus membresías de forma manual o con herramientas poco eficientes, ofreciendo una alternativa digital simple, clara y accesible.
