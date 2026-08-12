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
        public DbSet<RoleConfiguration> RoleConfigurations { get; set; }

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
        }
    }
}