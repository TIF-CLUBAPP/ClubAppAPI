using System;
using System.Collections.Generic;
using System.Linq;
using ClubApp.Domain.Entities;

namespace ClubApp.Infrastructure.Data
{
    public static class DbInitializer
    {
        public static void Seed(ApplicationContext context)
        {
            context.Database.EnsureCreated();

            // ==========================================
            // 1. SEEDING DE USUARIOS (Sin forzar IDs)
            // ==========================================
            if (!context.Users.Any())
            {
                string hashedPassword = BCrypt.Net.BCrypt.HashPassword("1234");
                var users = new List<User>();

                // Dos Super Admins
                for (int i = 1; i <= 2; i++)
                {
                    users.Add(new User
                    {
                        BadgeNum = "000",
                        FirstName = $"SuperAdmin{i}",
                        LastName = "Admin",
                        Email = $"superadmin{i}@clubapp.com",
                        PasswordHash = hashedPassword,
                        Role = UserRole.SUPERADMIN,
                        CreatedAt = new DateTime(2026, 6, 26, 0, 0, 0, DateTimeKind.Utc)
                    });
                }

                // Cuatro Profesores
                for (int i = 1; i <= 4; i++)
                {
                    users.Add(new User
                    {
                        BadgeNum = "000",
                        FirstName = $"Profesor{i}",
                        LastName = "Profe",
                        Email = $"profesor{i}@clubapp.com",
                        PasswordHash = hashedPassword,
                        Role = UserRole.ADMIN,
                        CreatedAt = new DateTime(2026, 6, 26, 0, 0, 0, DateTimeKind.Utc)
                    });
                }

                // Ocho Miembros
                for (int i = 1; i <= 8; i++)
                {
                    users.Add(new User
                    {
                        BadgeNum = $"M-00{i}",
                        FirstName = $"Usuario{i}",
                        LastName = "Member",
                        Email = $"usuario{i}@clubapp.com",
                        PasswordHash = hashedPassword,
                        Role = UserRole.MEMBER,
                        CreatedAt = new DateTime(2026, 6, 26, 0, 0, 0, DateTimeKind.Utc)
                    });
                }

                // Usuario Deudor
                users.Add(new User
                {
                    BadgeNum = "M-999",
                    FirstName = "Socio",
                    LastName = "Deudor",
                    Email = "deudor@clubapp.com",
                    PasswordHash = hashedPassword,
                    Role = UserRole.MEMBER,
                    CreatedAt = new DateTime(2026, 5, 1, 0, 0, 0, DateTimeKind.Utc)
                });

                context.Users.AddRange(users);
                context.SaveChanges();
            }

            // ==========================================
            // 2. SEEDING DE ACTIVIDADES
            // ==========================================
            if (!context.Activities.Any())
            {
                context.Activities.AddRange(
                    new Activity
                    {
                        Name = "Fútbol 5",
                        Description = "Turnos nocturnos de fútbol amateur.",
                        MaxCapacity = 10,
                        Schedule = "Lunes y Miércoles 20:00 hs",
                        IsActive = true,
                        CreatedAt = new DateTime(2026, 6, 26, 0, 0, 0, DateTimeKind.Utc)
                    },
                    new Activity
                    {
                        Name = "Crossfit",
                        Description = "Clases de alta intensidad y WODs.",
                        MaxCapacity = 15,
                        Schedule = "Martes y Jueves 19:00 hs",
                        IsActive = true,
                        CreatedAt = new DateTime(2026, 6, 26, 0, 0, 0, DateTimeKind.Utc)
                    },
                    new Activity
                    {
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

            // ==========================================
            // 3. SEEDING DE MEMBRESÍAS (Buscando usuarios por Email)
            // ==========================================
            if (!context.Memberships.Any())
            {
                var userOk = context.Users.FirstOrDefault(u => u.Email == "usuario1@clubapp.com");
                var userDebtor = context.Users.FirstOrDefault(u => u.Email == "deudor@clubapp.com");

                if (userOk != null && userDebtor != null)
                {
                    context.Memberships.AddRange(
                        new Membership
                        {
                            User_id = userOk.Id,
                            Status = MembershipStatus.ACTIVE,
                            StartDate = DateTime.UtcNow.AddMonths(-1),
                            EndDate = DateTime.UtcNow.AddMonths(11),
                            MonthlyPrice = 15000m,
                            CreatedAt = DateTime.UtcNow
                        },
                        new Membership
                        {
                            User_id = userDebtor.Id,
                            Status = MembershipStatus.INACTIVE,
                            StartDate = DateTime.UtcNow.AddMonths(-3),
                            EndDate = DateTime.UtcNow.AddMonths(9),
                            MonthlyPrice = 15000m,
                            CreatedAt = DateTime.UtcNow.AddMonths(-3)
                        }
                    );
                    context.SaveChanges();
                }
            }

            // ==========================================
            // 4. SEEDING DE PAGOS (Bloque independiente)
            // ==========================================
            if (!context.Payments.Any())
            {
                var userOk = context.Users.FirstOrDefault(u => u.Email == "usuario1@clubapp.com");
                var userDebtor = context.Users.FirstOrDefault(u => u.Email == "deudor@clubapp.com");

                if (userOk != null && userDebtor != null)
                {
                    var membershipOk = context.Memberships.FirstOrDefault(m => m.User_id == userOk.Id);
                    var membershipDebtor = context.Memberships.FirstOrDefault(m => m.User_id == userDebtor.Id);

                    if (membershipOk != null && membershipDebtor != null)
                    {
                        context.Payments.AddRange(
                            new Payment
                            {
                                User_id = userOk.Id,
                                Member_id = membershipOk.Id,
                                Amount = 15000m,
                                LateFee = 0m,
                                Method = PaymentMethod.CASH,
                                Status = PaymentStatus.COMPLETED,
                                DueDate = DateTime.UtcNow.AddDays(15),
                                PaymentDate = DateTime.UtcNow.AddDays(-5),
                                CreatedAt = DateTime.UtcNow.AddDays(-5)
                            },
                            new Payment
                            {
                                User_id = userDebtor.Id,
                                Member_id = membershipDebtor.Id,
                                Amount = 15000m,
                                LateFee = 1500m, // 10% de recargo
                                Method = PaymentMethod.CASH,
                                Status = PaymentStatus.OVERDUE,
                                DueDate = DateTime.UtcNow.AddMonths(-2),
                                PaymentDate = DateTime.UtcNow.AddMonths(-2),
                                CreatedAt = DateTime.UtcNow.AddMonths(-2)
                            }
                        );
                        context.SaveChanges();
                    }
                }
            }
        }
    }
}