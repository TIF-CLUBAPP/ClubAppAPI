using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using ClubApp.Domain.Entities;
using BCrypt.Net;

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

            // Hash estatico para "1234"
            string hash1234 = "$2a$11$e/y6pI44H6J63P.6lZ2Yte3sQy.l51/2y/GgL2iCg.b.7kQ1W6Z7S";

            var users = new List<User>();

            // 1. Dos Super Admins
            for (int i = 1; i <= 2; i++)
            {
                users.Add(new User
                {
                    Id = i,
                    BadgeNum = "000",
                    FirstName = $"SuperAdmin{i}",
                    LastName = "Admin",
                    Email = $"superadmin{i}@clubapp.com",
                    PasswordHash = hash1234, // Valor estático
                    Role = UserRole.SUPERADMIN,
                    CreatedAt = new DateTime(2026, 6, 26, 0, 0, 0, DateTimeKind.Utc)
                });
            }

            // 2. Cuatro Profesores/Admins
            for (int i = 1; i <= 4; i++)
            {
                users.Add(new User
                {
                    Id = i + 2,
                    BadgeNum = "000",
                    FirstName = $"Profesor{i}",
                    LastName = "Profe",
                    Email = $"profesor{i}@clubapp.com",
                    PasswordHash = hash1234, // Valor estático
                    Role = UserRole.ADMIN,
                    CreatedAt = new DateTime(2026, 6, 26, 0, 0, 0, DateTimeKind.Utc)
                });
            }

            // 3. Ocho Usuarios/Members
            for (int i = 1; i <= 8; i++)
            {
                users.Add(new User
                {
                    Id = i + 6,
                    BadgeNum = "000",
                    FirstName = $"Usuario{i}",
                    LastName = "Member",
                    Email = $"usuario{i}@clubapp.com",
                    PasswordHash = hash1234, // Valor estático
                    Role = UserRole.MEMBER,
                    CreatedAt = new DateTime(2026, 6, 26, 0, 0, 0, DateTimeKind.Utc)
                });
            }

            modelBuilder.Entity<User>().HasData(users);
        }
    }
}