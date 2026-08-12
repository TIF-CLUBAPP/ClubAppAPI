using System;
using System.Collections.Generic;
using System.Linq;
using ClubApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace ClubApp.Infrastructure.Data
{
    public static class DbInitializer
    {
        public static void Seed(ApplicationContext context)
        {
            // Use migrations to ensure schema is up-to-date (prevents divergence between EnsureCreated and migrations)
            context.Database.Migrate();

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
                        Dni = $"1000000{i}", // seed DNI único
                        Phone = "+54900000000",
                        BirthDate = new DateTime(1985, 1, 1),
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
                        Dni = $"2000000{i}",
                        Phone = $"+549111000{i:000}",
                        BirthDate = new DateTime(1990, 1, 1).AddYears(i),
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
                        Dni = $"3000000{i}",
                        Phone = $"+549222000{i:000}",
                        BirthDate = new DateTime(2000, 1, 1).AddYears(i),
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
                    Dni = "39999999",
                    Phone = "+54933333333",
                    BirthDate = new DateTime(1995, 6, 15),
                    CreatedAt = new DateTime(2026, 5, 1, 0, 0, 0, DateTimeKind.Utc)
                });

                // Insert each user defensively to avoid UNIQUE constraint failures
                foreach (var u in users)
                {
                    var existsByEmail = context.Users.Any(x => x.Email == u.Email);
                    var existsByDni = !string.IsNullOrWhiteSpace(u.Dni) && context.Users.Any(x => x.Dni == u.Dni);
                    if (!existsByEmail && !existsByDni)
                    {
                        context.Users.Add(u);
                    }
                    else
                    {
                        // Si existe por email pero faltan datos, intentar actualizar campos faltantes
                        var existing = context.Users.FirstOrDefault(x => x.Email == u.Email || (!string.IsNullOrWhiteSpace(u.Dni) && x.Dni == u.Dni));
                        if (existing != null)
                        {
                            // Rellenar solo campos vacíos para no sobreescribir intencionalmente
                            if (string.IsNullOrWhiteSpace(existing.Dni) && !string.IsNullOrWhiteSpace(u.Dni)) existing.Dni = u.Dni;
                            if (string.IsNullOrWhiteSpace(existing.Phone) && !string.IsNullOrWhiteSpace(u.Phone)) existing.Phone = u.Phone;
                            if (existing.BirthDate == null && u.BirthDate != null) existing.BirthDate = u.BirthDate;
                            if (string.IsNullOrWhiteSpace(existing.PasswordHash) && !string.IsNullOrWhiteSpace(u.PasswordHash)) existing.PasswordHash = u.PasswordHash;
                            context.Users.Update(existing);
                        }
                    }
                }

                try
                {
                    context.SaveChanges();
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[DbInitializer] Error guardando usuarios seed: {ex.Message}");
                    throw;
                }
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
                            User = userOk,
                            Status = MembershipStatus.ACTIVE,
                            StartDate = DateTime.UtcNow.AddMonths(-1),
                            EndDate = DateTime.UtcNow.AddMonths(11),
                            MonthlyPrice = 15000m,
                            CreatedAt = DateTime.UtcNow
                        },
                        new Membership
                        {
                            User = userDebtor,
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
                    var membershipOk = context.Memberships.FirstOrDefault(m => m.UserId == userOk.Id);
                    var membershipDebtor = context.Memberships.FirstOrDefault(m => m.UserId == userDebtor.Id);

                    if (membershipOk != null && membershipDebtor != null)
                    {
                        string periodOk = $"{DateTime.UtcNow.AddMonths(-1):MM/yyyy}";
                        string periodDebtor = $"{DateTime.UtcNow.AddMonths(-2):MM/yyyy}";
                        
                        context.Payments.AddRange(
                            new Payment
                            {
                                UserId = userOk.Id,
                                Period = periodOk,
                                Amount = 15000m,
                                LateFeeApplied = 0m,
                                PaymentMethod = "CASH",
                                Status = PaymentStatus.Paid,
                                PaymentDate = DateTime.UtcNow.AddDays(-5),
                                CreatedAt = DateTime.UtcNow.AddDays(-5)
                            },
                            new Payment
                            {
                                UserId = userDebtor.Id,
                                Period = periodDebtor,
                                Amount = 15000m,
                                LateFeeApplied = 1500m, // 10% de recargo
                                PaymentMethod = "CASH",
                                Status = PaymentStatus.Overdue,
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