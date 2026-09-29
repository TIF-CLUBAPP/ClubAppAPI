using Microsoft.EntityFrameworkCore;
using ClubApp.Domain.Entities;

namespace ClubApp.Infrastructure.Data
{
    public class ApplicationContext : DbContext
    {
        public ApplicationContext(DbContextOptions<ApplicationContext> options) : base(options)
        {
        }

        public DbSet<Activity> Activities { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<Enrollment> Enrollments { get; set; }
        public DbSet<Membership> Memberships { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<FeeSettings> FeeSettings { get; set; }
        public DbSet<FeeSettingsHistory> FeeSettingsHistory { get; set; }
        public DbSet<RoleConfiguration> RoleConfigurations { get; set; }
        public DbSet<ClubConfig> ClubConfigs { get; set; }
        public DbSet<ActivitySchedule> ActivitySchedules { get; set; }
        public DbSet<ResourceBooking> ResourceBookings { get; set; }
        public DbSet<AttendanceRecord> AttendanceRecords { get; set; }
        public DbSet<Space> Spaces { get; set; }


        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Índice único para DNI
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Dni)
                .IsUnique();

            // Configuración explícita de la relación Membership -> User para evitar FKs duplicadas
            modelBuilder.Entity<Membership>()
                .HasOne(m => m.User)
                .WithMany(u => u.Memberships)
                .HasForeignKey(m => m.UserId);

            // Configuración de FeeSettings - solo debe haber una configuración activa
            modelBuilder.Entity<FeeSettings>()
                .HasIndex(f => f.Id); // Ya es PK

            // Historial de precios: se consulta ordenado por fecha de vigencia.
            modelBuilder.Entity<FeeSettingsHistory>()
                .HasIndex(h => h.EffectiveFromDate);

            // Configuración de RoleConfiguration - único por Role
            modelBuilder.Entity<RoleConfiguration>()
                .HasIndex(r => r.Role)
                .IsUnique();

            // Configuración de Payment
            modelBuilder.Entity<Payment>()
                .HasIndex(p => new { p.UserId, p.Period })
                .IsUnique(); // Un usuario solo puede tener un pago por período

            modelBuilder.Entity<Payment>()
                .HasOne(p => p.User)
                .WithMany()
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Actividad -> Profesor (opcional). Si se borra el profesor, la actividad queda sin docente.
            modelBuilder.Entity<Activity>()
                .HasOne(a => a.Teacher)
                .WithMany()
                .HasForeignKey(a => a.TeacherId)
                .OnDelete(DeleteBehavior.SetNull);

            // Horarios de actividad (se eliminan en cascada con la actividad).
            modelBuilder.Entity<ActivitySchedule>()
                .HasOne(s => s.Activity)
                .WithMany(a => a.Schedules)
                .HasForeignKey(s => s.ActivityId)
                .OnDelete(DeleteBehavior.Cascade);

            // Reserva de espacio -> Usuario (obligatorio).
            modelBuilder.Entity<ResourceBooking>()
                .HasOne(b => b.User)
                .WithMany()
                .HasForeignKey(b => b.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Reserva de espacio -> Pago (opcional).
            modelBuilder.Entity<ResourceBooking>()
                .HasOne(b => b.Payment)
                .WithMany()
                .HasForeignKey(b => b.PaymentId)
                .OnDelete(DeleteBehavior.SetNull);

            // Espacio -> Actividades (si se borra el espacio, la actividad queda sin espacio).
            modelBuilder.Entity<Activity>()
                .HasOne(a => a.Space)
                .WithMany(s => s.Activities)
                .HasForeignKey(a => a.SpaceId)
                .OnDelete(DeleteBehavior.SetNull);

            // Espacio -> Reservas (si se borra el espacio, la reserva queda sin espacio).
            modelBuilder.Entity<ResourceBooking>()
                .HasOne(b => b.Space)
                .WithMany(s => s.ResourceBookings)
                .HasForeignKey(b => b.SpaceId)
                .OnDelete(DeleteBehavior.SetNull);

            // Registro de asistencia -> Horario + Usuario.
            modelBuilder.Entity<AttendanceRecord>()
                .HasOne(r => r.ActivitySchedule)
                .WithMany(s => s.AttendanceRecords)
                .HasForeignKey(r => r.ActivityScheduleId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<AttendanceRecord>()
                .HasOne(r => r.User)
                .WithMany()
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<AttendanceRecord>()
                .HasIndex(r => new { r.ActivityScheduleId, r.UserId, r.Date })
                .IsUnique();
        }
    }
}