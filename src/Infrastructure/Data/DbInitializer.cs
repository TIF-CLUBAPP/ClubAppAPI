using System;
using System.Collections.Generic;
using System.Linq;
using ClubApp.Domain.Entities;
using Microsoft.AspNetCore.Identity;

namespace ClubApp.Infrastructure.Data
{
    public static class DbInitializer
    {
        public static void Seed(ApplicationContext context)
        {
            context.Database.EnsureCreated();

            // ==========================================
            // 2. SEEDING DE USUARIOS
            // ==========================================
            if (!context.Users.Any())
            {
                var passwordHasher = new PasswordHasher<User>();
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
                        PasswordHash = passwordHasher.HashPassword(null!, "1234"),
                        Role = UserRole.SUPERADMIN,
                        CreatedAt = new DateTime(2026, 6, 26, 0, 0, 0, DateTimeKind.Utc)
                    });
                }

                // Cuatro Profesores
                for (int i = 1; i <= 4; i++)
                {
                    users.Add(new User
                    {
                        Id = i + 2,
                        BadgeNum = "000",
                        FirstName = $"Profesor{i}",
                        LastName = "Profe",
                        Email = $"profesor{i}@clubapp.com",
                        PasswordHash = passwordHasher.HashPassword(null!, "1234"),
                        Role = UserRole.ADMIN,
                        CreatedAt = new DateTime(2026, 6, 26, 0, 0, 0, DateTimeKind.Utc)
                    });
                }

                // Ocho Miembros
                for (int i = 1; i <= 8; i++)
                {
                    users.Add(new User
                    {
                        Id = i + 6,
                        BadgeNum = "000",
                        FirstName = $"Usuario{i}",
                        LastName = "Member",
                        Email = $"usuario{i}@clubapp.com",
                        PasswordHash = passwordHasher.HashPassword(null!, "1234"),
                        Role = UserRole.MEMBER,
                        CreatedAt = new DateTime(2026, 6, 26, 0, 0, 0, DateTimeKind.Utc)
                    });
                }

                context.Users.AddRange(users);
                context.SaveChanges();
            }

            // ==========================================
            // 3. SEEDING DE ACTIVIDADES
            // ==========================================
            if (!context.Activities.Any())
            {
                context.Activities.AddRange(
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
                        MaxCapacity = 0,
                        Schedule = "Viernes 18:00 hs",
                        IsActive = true,
                        CreatedAt = new DateTime(2026, 6, 26, 0, 0, 0, DateTimeKind.Utc)
                    }
                );
                context.SaveChanges();
            }
        }
    }
}