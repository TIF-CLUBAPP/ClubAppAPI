using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
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

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Esto inyecta un usuario a la fuerza en la base de datos al iniciar
            modelBuilder.Entity<ClubApp.Domain.Entities.User>().HasData(new ClubApp.Domain.Entities.User
            {
                Id = 1,
                BadgeNum = "123",
                FirstName = "nico",
                LastName = "dev",
                Email = "nico@clubapp.com",
                PasswordHash = "1234", // Esta va a ser tu contraseña de prueba
                Role = ClubApp.Domain.Entities.UserRole.ADMIN
            });
        }

    }

}
