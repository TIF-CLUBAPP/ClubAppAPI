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

            // ==========================================
            // 1. DATA SEEDING DE USUARIOS 
            // ==========================================
            var users = new List<User>();

            // Dos Super Admins
            for (int i = 1; i <= 2; i++)
            {
                users.Add(new User
                {
                    Id = i,
                    BadgeNum = "000",
                    FirstName = $"SuperAdmin{i}",
                    LastName = "Admin",
                    Email = $"superadmin{i}@clubapp.com",
                    PasswordHash = "$2a$11$e/y6pI44H6J63P.6lZ2Yte3sQy.l51/2y/GgL2iCg.b.7kQ1W6Z7S",
                    Role = UserRole.SUPERADMIN,
                    CreatedAt = new DateTime(2026, 6, 26, 0, 0, 0, DateTimeKind.Utc)
                });
            }

            // Cuatro Profesores/Admins
            for (int i = 1; i <= 4; i++)
            {
                users.Add(new User
                {
                    Id = i + 2,
                    BadgeNum = "000",
                    FirstName = $"Profesor{i}",
                    LastName = "Profe",
                    Email = $"profesor{i}@clubapp.com",
                    PasswordHash = "$2a$11$e/y6pI44H6J63P.6lZ2Yte3sQy.l51/2y/GgL2iCg.b.7kQ1W6Z7S",
                    Role = UserRole.ADMIN,
                    CreatedAt = new DateTime(2026, 6, 26, 0, 0, 0, DateTimeKind.Utc)
                });
            }

            // Ocho Usuarios/Members
            for (int i = 1; i <= 8; i++)
            {
                users.Add(new User
                {
                    Id = i + 6,
                    BadgeNum = "000",
                    FirstName = $"Usuario{i}",
                    LastName = "Member",
                    Email = $"usuario{i}@clubapp.com",
                    PasswordHash = "$2a$11$e/y6pI44H6J63P.6lZ2Yte3sQy.l51/2y/GgL2iCg.b.7kQ1W6Z7S",
                    Role = UserRole.MEMBER,
                    CreatedAt = new DateTime(2026, 6, 26, 0, 0, 0, DateTimeKind.Utc)
                });
            }

            modelBuilder.Entity<User>().HasData(users);

            // ==========================================
            // 2. DATA SEEDING DE ACTIVIDADES 
            // ==========================================
            modelBuilder.Entity<Activity>().HasData(
                new Activity
                {
                    Id = 1,
                    Name = "Fútbol 5",
                    Description = "Turnos nocturnos de fútbol amateur.",
                    MaxCapacity = 10,
                    Schedule = "Lunes y Miércoles 20:00 hs",
                    IsActive = true,
                    CreatedAt = new DateTime(2026, 6, 26, 0, 0, 0, DateTimeKind.Utc)
                },
                new Activity
                {
                    Id = 2,
                    Name = "Crossfit",
                    Description = "Clases de alta intensidad y WODs.",
                    MaxCapacity = 15,
                    Schedule = "Martes y Jueves 19:00 hs",
                    IsActive = true,
                    CreatedAt = new DateTime(2026, 6, 26, 0, 0, 0, DateTimeKind.Utc)
                },
                new Activity
                {
                    Id = 3,
                    Name = "Spinning (TEST LLENO)",
                    Description = "Ciclismo de interior sin cupos disponibles.",
                    MaxCapacity = 0, // <--para forzar el error de clase llena en Enrollment
                    Schedule = "Viernes 18:00 hs",
                    IsActive = true,
                    CreatedAt = new DateTime(2026, 6, 26, 0, 0, 0, DateTimeKind.Utc)
                }
            );
        }
    }
}