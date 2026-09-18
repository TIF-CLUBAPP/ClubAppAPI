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
            var debtorUser = context.Users.FirstOrDefault(u => u.Email == "deudor@clubapp.com");
            if (debtorUser != null)
            {
                // Asegurar que el usuario deudor tenga al menos las 3 cuotas de prueba (meses -2, -3, -4)
                for (int i = 2; i <= 4; i++)
                {
                    var targetDate = DateTime.UtcNow.AddMonths(-i);
                    // Formato ISO: YYYY-MM
                    string periodName = $"{targetDate:yyyy-MM}";

                    // Verificar si ya existe una cuota para este periodo para este usuario
                    bool exists = context.Payments.Any(p => p.UserId == debtorUser.Id && p.Period == periodName);
                    
                    if (!exists)
                    {
                        context.Payments.Add(new Payment
                        {
                            UserId = debtorUser.Id,
                            Period = periodName,
                            Amount = 15000m,
                            LateFeeApplied = 1500m * (i - 1),
                            PaymentMethod = "CASH",
                            Status = PaymentStatus.Overdue,
                            PaymentDate = targetDate,
                            CreatedAt = targetDate
                        });
                    }
                }
                
                // Crear una cuota pagada para usuario1@clubapp.com (mes -1)
                var userOk = context.Users.FirstOrDefault(u => u.Email == "usuario1@clubapp.com");
                if (userOk != null)
                {
                    var membershipOk = context.Memberships.FirstOrDefault(m => m.UserId == userOk.Id);
                    var membershipDebtor = context.Memberships.FirstOrDefault(m => m.UserId == debtorUser.Id);

                    if (membershipOk != null && membershipDebtor != null)
                    {
                        string periodOk = $"{DateTime.UtcNow.AddMonths(-1):yyyy-MM}";
                        
                        if (!context.Payments.Any(p => p.UserId == userOk.Id && p.Period == periodOk))
                        {
                            context.Payments.Add(new Payment
                            {
                                UserId = userOk.Id,
                                Period = periodOk,
                                Amount = 15000m,
                                LateFeeApplied = 0m,
                                PaymentMethod = "CASH",
                                Status = PaymentStatus.Paid,
                                PaymentDate = DateTime.UtcNow.AddDays(-5),
                                CreatedAt = DateTime.UtcNow.AddDays(-5)
                            });
                        }
                    }
                }
                
                context.SaveChanges();
            }

            // ==========================================
            // 5. REPARACIÓN DE DATOS (Idempotente)
            // ==========================================
            // Reparar formatos antiguos ("MM/yyyy", "Mes Año") a nuevo estándar "yyyy-MM"
            // Resolver duplicados añadiendo sufijo numérico si es necesario
            var corruptPayments = context.Payments
                .Where(p => string.IsNullOrEmpty(p.Period) || p.Period.Contains("/") || !p.Period.Contains("-"))
                .ToList();

            if (corruptPayments.Any())
            {
                var existingPeriods = new HashSet<string>(context.Payments
                    .Where(p => !string.IsNullOrEmpty(p.Period) && p.Period.Contains("-") && !p.Period.Contains("/"))
                    .Select(p => $"{p.UserId}:{p.Period}"));
                
                foreach (var payment in corruptPayments)
                {
                    // Intentar derivar del CreatedAt si es necesario, o intentar parsear
                    var targetDate = payment.CreatedAt;
                    string newPeriod = $"{targetDate:yyyy-MM}";
                    string key = $"{payment.UserId}:{newPeriod}";
                    
                    // Si ya existe, buscar el siguiente mes disponible hacia atrás
                    int suffix = 0;
                    DateTime testDate = targetDate;
                    while (existingPeriods.Contains(key))
                    {
                        suffix++;
                        testDate = targetDate.AddMonths(-suffix);
                        newPeriod = $"{testDate:yyyy-MM}";
                        key = $"{payment.UserId}:{newPeriod}";
                    }
                    
                    payment.Period = newPeriod;
                    existingPeriods.Add(key);
                }
                context.SaveChanges();
            }

            // ==========================================
            // 6. SEEDING INCREMENTAL DE SOCIOS DE PRUEBA
            // ==========================================
            // No destructivo: solo agrega los socios que falten (chequeo por Email/DNI).
            // No toca ni borra los usuarios existentes (SuperAdmin, Profesores, Usuario1-8, etc.).
            SeedTestSocios(context);

        }

        /// <summary>
        /// Inserta (si no existen) los 5 socios de prueba usados por las pantallas
        /// de Deudores y Pagos, junto con su Membership y sus cuotas.
        /// Es idempotente: se puede ejecutar en cada arranque de la API.
        /// </summary>
        private static void SeedTestSocios(ApplicationContext context)
        {
            string hashedPassword = BCrypt.Net.BCrypt.HashPassword("1234");
            decimal cuotaBase = 15000m;

            // ----------------------------------------------------------
            // 6.1 Alta de usuarios (uno por uno, chequeando Email y DNI)
            // ----------------------------------------------------------
            var socios = new List<User>
            {
                // Deudor critico: 6 cuotas impagas con 25% de mora
                new User
                {
                    BadgeNum = "M-100",
                    FirstName = "Roberto",
                    LastName = "Gomez",
                    Email = "roberto.gomez@gmail.com",
                    PasswordHash = hashedPassword,
                    Role = UserRole.MEMBER,
                    Dni = "41000001",
                    Phone = "+5491141000001",
                    BirthDate = new DateTime(1978, 3, 12),
                    IsActive = true,
                    IsExemptFromFees = false,
                    CreatedAt = new DateTime(2026, 1, 10, 0, 0, 0, DateTimeKind.Utc)
                },
                // Jubilada: 3 cuotas impagas con 50% de exencion
                new User
                {
                    BadgeNum = "M-101",
                    FirstName = "Beatriz",
                    LastName = "Fernandez",
                    Email = "b.fernandez@hotmail.com",
                    PasswordHash = hashedPassword,
                    Role = UserRole.MEMBER,
                    Dni = "41000002",
                    Phone = "+5491141000002",
                    BirthDate = new DateTime(1955, 8, 22),
                    IsActive = true,
                    IsExemptFromFees = false, // exencion parcial 50% (no total)
                    CreatedAt = new DateTime(2026, 2, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                // Reciente: 1 cuota del mes actual, sin mora
                new User
                {
                    BadgeNum = "M-102",
                    FirstName = "Lucas",
                    LastName = "Martinez",
                    Email = "lucas.m@gmail.com",
                    PasswordHash = hashedPassword,
                    Role = UserRole.MEMBER,
                    Dni = "41000003",
                    Phone = "+5491141000003",
                    BirthDate = new DateTime(2001, 11, 5),
                    IsActive = true,
                    IsExemptFromFees = false,
                    CreatedAt = DateTime.UtcNow.AddDays(-20)
                },
                // Staff: exencion total, sin deuda
                new User
                {
                    BadgeNum = "M-103",
                    FirstName = "Mariana",
                    LastName = "Lopez",
                    Email = "marian.lopez@clubapp.com",
                    PasswordHash = hashedPassword,
                    Role = UserRole.MEMBER,
                    Dni = "41000004",
                    Phone = "+5491141000004",
                    BirthDate = new DateTime(1992, 6, 30),
                    IsActive = true,
                    IsExemptFromFees = true, // exencion 100%
                    CreatedAt = new DateTime(2025, 9, 15, 0, 0, 0, DateTimeKind.Utc)
                },
                // Al dia: sin cuotas pendientes
                new User
                {
                    BadgeNum = "M-104",
                    FirstName = "Gonzalo",
                    LastName = "Perez",
                    Email = "gonzalo.perez@gmail.com",
                    PasswordHash = hashedPassword,
                    Role = UserRole.MEMBER,
                    Dni = "41000005",
                    Phone = "+5491141000005",
                    BirthDate = new DateTime(1988, 1, 18),
                    IsActive = true,
                    IsExemptFromFees = false,
                    CreatedAt = new DateTime(2025, 5, 2, 0, 0, 0, DateTimeKind.Utc)
                }
            };

            foreach (var socio in socios)
            {
                bool existsByEmail = context.Users.Any(u => u.Email == socio.Email);
                bool existsByDni = context.Users.Any(u => u.Dni == socio.Dni);

                if (!existsByEmail && !existsByDni)
                {
                    context.Users.Add(socio);
                }
            }

            context.SaveChanges();

            // ----------------------------------------------------------
            // 6.2 Membership para cada socio de prueba (si no la tiene)
            // ----------------------------------------------------------
            foreach (var seed in socios)
            {
                var user = context.Users.FirstOrDefault(u => u.Email == seed.Email);
                if (user == null) continue;

                bool hasMembership = context.Memberships.Any(m => m.UserId == user.Id);
                if (!hasMembership)
                {
                    context.Memberships.Add(new Membership
                    {
                        UserId = user.Id,
                        MonthlyPrice = cuotaBase,
                        Status = MembershipStatus.ACTIVE,
                        StartDate = user.CreatedAt,
                        EndDate = user.CreatedAt.AddYears(1),
                        CreatedAt = user.CreatedAt
                    });
                }
            }

            context.SaveChanges();

            // ----------------------------------------------------------
            // 6.3 Cuotas / deudas por socio (idempotente por UserId+Period)
            // ----------------------------------------------------------
            // Helper local: agrega una cuota si no existe para ese periodo.
            void AddCuota(string email, string period, decimal amount, decimal lateFee, PaymentStatus status, DateTime? paidAt = null)
            {
                var user = context.Users.FirstOrDefault(u => u.Email == email);
                if (user == null) return;

                bool exists = context.Payments.Any(p => p.UserId == user.Id && p.Period == period);
                if (exists) return;

                context.Payments.Add(new Payment
                {
                    UserId = user.Id,
                    Period = period,
                    Amount = amount,
                    LateFeeApplied = lateFee,
                    PaymentMethod = "CASH",
                    Status = status,
                    PaymentDate = paidAt,
                    CreatedAt = paidAt ?? DateTime.UtcNow
                });
            }

            // -- Roberto Gomez: 6 cuotas impagas (meses -6 a -1) con mora 25% --
            // Mora sobre el subtotal: 15000 * 0.25 = 3750
            for (int i = 6; i >= 1; i--)
            {
                string period = $"{DateTime.UtcNow.AddMonths(-i):yyyy-MM}";
                AddCuota("roberto.gomez@gmail.com", period, cuotaBase, cuotaBase * 0.25m, PaymentStatus.Overdue);
            }

            // -- Beatriz Fernandez: 3 cuotas impagas (meses -3 a -1), exencion 50% --
            // Subtotal con 50% de exencion: 7500. Mora 25% sobre subtotal = 1875
            for (int i = 3; i >= 1; i--)
            {
                string period = $"{DateTime.UtcNow.AddMonths(-i):yyyy-MM}";
                AddCuota("b.fernandez@hotmail.com", period, cuotaBase * 0.50m, cuotaBase * 0.50m * 0.25m, PaymentStatus.Overdue);
            }

            // -- Lucas Martinez: 1 cuota del mes actual, sin mora --
            {
                string period = $"{DateTime.UtcNow:yyyy-MM}";
                AddCuota("lucas.m@gmail.com", period, cuotaBase, 0m, PaymentStatus.Pending);
            }

            // -- Mariana Lopez: 100% exenta, sin cuotas --
            // -- Gonzalo Perez: al dia, sin cuotas pendientes --
            // (Ambos ya quedan creados como usuarios + membership sin Payments)

            context.SaveChanges();


        }

    }
}