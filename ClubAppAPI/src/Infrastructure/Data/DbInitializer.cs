using System;
using System.Collections.Generic;
using System.Linq;
using ClubApp.Domain.Entities;
using ClubApp.Domain.Constants;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace ClubApp.Infrastructure.Data
{
    public static class DbInitializer
    {
        public static void Seed(ApplicationContext context, IConfiguration configuration)
        {
            // Use migrations to ensure schema is up-to-date (prevents divergence between EnsureCreated and migrations)
            context.Database.Migrate();

            // ==========================================
            // 0. SEEDING DE CONFIGURACIÓN DEL CLUB (ClubConfig)
            // ==========================================
            // Debe existir SIEMPRE al menos un registro de ClubConfig para que el
            // flujo de pago (POST /api/payments/create-order) no falle con 404.
            // Además se garantiza un token de Mercado Pago (config → fallback sandbox).
            var mpAccessToken = ClubConfigDefaults.ResolveAccessToken(configuration["MercadoPago:AccessToken"]);
            var mpPublicKey = ClubConfigDefaults.ResolvePublicKey(configuration["MercadoPago:PublicKey"]);

            var clubConfig = context.ClubConfigs.FirstOrDefault();
            if (clubConfig == null)
            {
                context.ClubConfigs.Add(new ClubConfig
                {
                    TrialEndsAt = DateTime.UtcNow.AddDays(ClubConfigDefaults.DefaultTrialDays),
                    MonthlySubscriptionFee = ClubConfigDefaults.DefaultMonthlySubscriptionFee,
                    ApplicationFeePercentage = ClubConfigDefaults.DefaultApplicationFeePercentage,
                    MaxApplicationFeeAmount = ClubConfigDefaults.DefaultMaxApplicationFeeAmount,
                    MercadoPagoAccessToken = mpAccessToken,
                    MercadoPagoPublicKey = mpPublicKey
                });
                context.SaveChanges();
            }
            else
            {
                // Backfill: sincronizamos el token/key de Mercado Pago con el valor
                // configurado (o el sandbox por defecto) para autocorregir credenciales
                // viejas o vacías que hayan quedado persistidas en la BD local.
                var changed = false;

                if (clubConfig.MercadoPagoAccessToken != mpAccessToken)
                {
                    clubConfig.MercadoPagoAccessToken = mpAccessToken;
                    changed = true;
                }

                if (clubConfig.MercadoPagoPublicKey != mpPublicKey)
                {
                    clubConfig.MercadoPagoPublicKey = mpPublicKey;
                    changed = true;
                }

                if (changed)
                {
                    context.SaveChanges();
                }
            }

            // ==========================================
            // 0.1 SEEDING DE TARIFA VIGENTE (FeeSettings)
            // ==========================================
            // Garantiza que exista una tarifa "vigente desde siempre" (EffectiveFromDate = null)
            // para que GET /api/payments/settings devuelva el precio base real en curso
            // (y no 0 ni el último cambio pendiente).
            var vigenteFee = context.FeeSettings.FirstOrDefault(f => f.EffectiveFromDate == null);
            if (vigenteFee == null)
            {
                context.FeeSettings.Add(new FeeSettings
                {
                    BaseFeeAmount = 15000m,
                    LateFeePercentage = 10m,
                    DueDayOfMonth = 10,
                    EffectiveFromDate = null,
                    IsCurrent = true
                });
                context.SaveChanges();
            }

            // ==========================================
            // 0.15 SEEDING DE REGLAS DE SUSPENSIÓN POR MORA (SuspensionSettings)
            // ==========================================
            // Garantiza que exista una fila base con límites por defecto para el
            // corte de servicio / suspensión de socios morosos.
            if (!context.SuspensionSettings.Any())
            {
                context.SuspensionSettings.Add(new SuspensionSettings
                {
                    MaxOverdueMonths = 2,
                    MaxOverdueAmount = 10000m,
                    SuspensionCondition = "OR",
                    UpdatedAt = DateTime.UtcNow
                });
                context.SaveChanges();
            }

            // ==========================================
            // 0.2 SEEDING DE EXENCIÓN DE CUOTA POR ROL (RoleFeeExemption)
            // ==========================================
            // Garantiza una fila base por rol (MEMBER 0%, gestión 100%). La política
            // editable por el admin vive en esta tabla y NO es retroactiva.
            var roleExemptionNames = new[] { "MEMBER", "TEACHER", "ADMIN", "SUPERADMIN" };
            foreach (var roleName in roleExemptionNames)
            {
                if (!context.RoleFeeExemptions.Any(e => e.RoleName == roleName))
                {
                    context.RoleFeeExemptions.Add(new RoleFeeExemption
                    {
                        RoleName = roleName,
                        DiscountPercentage = roleName == "MEMBER" ? 0m : 100m,
                        UpdatedAt = DateTime.UtcNow
                    });
                }
            }
            context.SaveChanges();

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

                // Un Administrador de Club (ADMIN) para pruebas de gestión
                users.Add(new User
                {
                    BadgeNum = "000",
                    FirstName = "Administrador",
                    LastName = "Club",
                    Email = "admin@clubapp.com",
                    PasswordHash = hashedPassword,
                    Role = UserRole.ADMIN,
                    Dni = "21000001",
                    Phone = "+54944400001",
                    BirthDate = new DateTime(1988, 3, 10),
                    CreatedAt = new DateTime(2026, 6, 26, 0, 0, 0, DateTimeKind.Utc)
                });

                // Cuatro Profesores (TEACHER)
                for (int i = 1; i <= 4; i++)
                {
                    users.Add(new User
                    {
                        BadgeNum = "000",
                        FirstName = $"Profesor{i}",
                        LastName = "Profe",
                        Email = $"profesor{i}@clubapp.com",
                        PasswordHash = hashedPassword,
                        Role = UserRole.TEACHER,
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
            // 1.1 BACKFILL DE ROLES DE PROFESORES DE PRUEBA
            // ==========================================
            // Versiones anteriores del seeder crearon los usuarios "profesor1-4@clubapp.com"
            // con Role = ADMIN. El guard `if (!context.Users.Any())` impide que se vuelvan a
            // insertar, por lo que esos registros persistieron con el rol incorrecto.
            // Este bloque corrige de forma idempotente el rol a TEACHER en cada arranque,
            // sin tocar el resto de los campos ni a otros usuarios.
            var profesorEmails = new[]
            {
                "profesor1@clubapp.com",
                "profesor2@clubapp.com",
                "profesor3@clubapp.com",
                "profesor4@clubapp.com"
            };

            var profesoresACorregir = context.Users
                .Where(u => profesorEmails.Contains(u.Email) && u.Role != UserRole.TEACHER)
                .ToList();

            if (profesoresACorregir.Any())
            {
                foreach (var profesor in profesoresACorregir)
                {
                    profesor.Role = UserRole.TEACHER;
                    Console.WriteLine($"[DbInitializer] Corrigiendo rol a TEACHER: {profesor.Email}");
                }

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
            SeedSpaces(context);
            SeedCommercialActivities(context);

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

        /// <summary>
        /// Inserta (si no existen) los espacios físicos del club (canchas, salones,
        /// gimnasio, pileta, etc.) con su configuración exacta de reservas/alquiler.
        /// Idempotente: verifica por Name antes de insertar para evitar duplicados.
        /// </summary>
        private static void SeedSpaces(ApplicationContext context)
        {
            // ==========================================
            // Migración idempotente de nombres con erratas de ortografía.
            // Los espacios ya guardados en la BD (p. ej. clubapp_v3.db) tienen nombres con
            // erratas ("Chanca", "Chincho", "Olimpica", "Padel", "Futbol", "Practica",
            // "Salon", "Italia1400"). Los renombramos una única vez a su forma correcta para
            // que el chequeo por Name (EnsureSpace) siga siendo estable y no se generen
            // duplicados al comparar por nombre.
            // ==========================================
            var renameSpaces = new Dictionary<string, string>
            {
                ["Pileta Olimpica Peñarol"] = "Pileta Olímpica Peñarol",
                ["Salon Quincho 1"] = "Salón Quincho 1",
                ["Cancha Futbol Practica 1 Italia 1400"] = "Cancha Fútbol Práctica 1 Italia 1400",
                ["Chanca Futbol Oficial 1 Italia 1400"] = "Cancha Fútbol Oficial 1 Italia 1400",
                ["Chincho Exterior Italia1400"] = "Quincho Exterior Italia 1400",
                ["Padel Cancha 1"] = "Pádel Cancha 1",
                ["Padel Chancha 2"] = "Pádel Cancha 2",
                ["Cancha Futbol Practica 2 Alvear 1300"] = "Cancha Fútbol Práctica 2 Alvear 1300",
                ["Chanca Futbol Oficial 2 Alvear 1300"] = "Cancha Fútbol Oficial 2 Alvear 1300",
            };

            foreach (var rename in renameSpaces)
            {
                var oldName = rename.Key;
                var newName = rename.Value;

                // Solo renombra si el nombre viejo existe y el nuevo todavía no, para evitar
                // colisiones o duplicados. Idempotente: en ejecuciones posteriores el nombre
                // viejo ya no existe y no se hace nada.
                var space = context.Spaces.FirstOrDefault(s => s.Name == oldName);
                if (space != null && !context.Spaces.Any(s => s.Name == newName))
                {
                    space.Name = newName;
                }
            }
            context.SaveChanges();


            void EnsureSpace(Space desired)
            {
                if (context.Spaces.Any(s => s.Name == desired.Name)) return;

                context.Spaces.Add(desired);
                context.SaveChanges();
            }

            // ==========================================
            // Basket / Bochas
            // ==========================================
            EnsureSpace(new Space
            {
                Name = "Basket Peñarol CANCHA 1",
                SportCategory = "Básquet",
                Location = "San Martín 1351, Elortondo, Provincia de Santa Fe",
                IsActive = true,
                AllowReservationsDuringClasses = false, // Bloqueo de alquileres privados
                RequiresApproval = false,
                PermitirSuperposicion = false,
                PricePerHour = 0m,
                SlotDurationMinutes = 60,
                Is24Hours = false,
                OpenTime = "08:00",
                CloseTime = "23:00"
            });

            EnsureSpace(new Space
            {
                Name = "Bochas Peñarol 1",
                SportCategory = "Bochas",
                Location = "Austria 601, Elortondo, Provincia de Santa Fe",
                IsActive = true,
                AllowReservationsDuringClasses = true, // Permite reservas
                RequiresApproval = false,
                PermitirSuperposicion = false,
                PricePerHour = 1000m,
                SlotDurationMinutes = 60,
                Is24Hours = false,
                OpenTime = "08:00",
                CloseTime = "22:00"
            });

            EnsureSpace(new Space
            {
                Name = "Bochas Peñarol 2",
                SportCategory = "Bochas",
                Location = "Austria 601, Elortondo, Provincia de Santa Fe",
                IsActive = true,
                AllowReservationsDuringClasses = true,
                RequiresApproval = false,
                PermitirSuperposicion = false,
                PricePerHour = 1000m,
                SlotDurationMinutes = 60,
                Is24Hours = false,
                OpenTime = "08:00",
                CloseTime = "22:00"
            });

            EnsureSpace(new Space
            {
                Name = "Bochas Peñarol 3",
                SportCategory = "Bochas",
                Location = "Austria 601, Elortondo, Provincia de Santa Fe",
                IsActive = true,
                AllowReservationsDuringClasses = true,
                RequiresApproval = false,
                PermitirSuperposicion = false,
                PricePerHour = 1000m,
                SlotDurationMinutes = 60,
                Is24Hours = false,
                OpenTime = "08:00",
                CloseTime = "22:00"
            });

            EnsureSpace(new Space
            {
                Name = "Bochas Peñarol 4",
                SportCategory = "Bochas",
                Location = "Austria 601, Elortondo, Provincia de Santa Fe",
                IsActive = true,
                AllowReservationsDuringClasses = true,
                RequiresApproval = false,
                PermitirSuperposicion = false,
                PricePerHour = 1000m,
                SlotDurationMinutes = 60,
                Is24Hours = false,
                OpenTime = "08:00",
                CloseTime = "22:00"
            });

            // ==========================================
            // Predio San Martín 1351
            // ==========================================
            EnsureSpace(new Space
            {
                Name = "GYM Peñarol",
                SportCategory = "Gimnasio / Musculación",
                Location = "San Martín 1351, Elortondo, Provincia de Santa Fe",
                IsActive = true,
                AllowReservationsDuringClasses = false,
                RequiresApproval = false,
                PermitirSuperposicion = true,
                PricePerHour = 0m,
                SlotDurationMinutes = 60,
                Is24Hours = false,
                OpenTime = "08:00",
                CloseTime = "23:00"
            });

            EnsureSpace(new Space
            {
                Name = "Pileta Olímpica Peñarol",
                SportCategory = "Natación (Piscina)",
                Location = "San Martín 1351, Elortondo, Provincia de Santa Fe",
                IsActive = true,
                AllowReservationsDuringClasses = false,
                RequiresApproval = false,
                PermitirSuperposicion = false,
                PricePerHour = 0m,
                SlotDurationMinutes = 60,
                Is24Hours = false,
                OpenTime = "08:00",
                CloseTime = "23:00"
            });

            EnsureSpace(new Space
            {
                Name = "Salón Quincho 1",
                SportCategory = "SUM / Salón de Eventos",
                Location = "San Martín 1351, Elortondo, Provincia de Santa Fe",
                IsActive = true,
                AllowReservationsDuringClasses = true,
                RequiresApproval = true,
                PermitirSuperposicion = false,
                PricePerHour = 1500m,
                SlotDurationMinutes = 60,
                Is24Hours = true,
                OpenTime = "08:00",
                CloseTime = "23:00"
            });

            // ==========================================
            // Italia 1401
            // ==========================================
            EnsureSpace(new Space
            {
                Name = "Cancha Fútbol Práctica 1 Italia 1400",
                SportCategory = "Fútbol 11",
                Location = "Italia 1401, Elortondo, Provincia de Santa Fe",
                IsActive = true,
                AllowReservationsDuringClasses = false,
                RequiresApproval = false,
                PermitirSuperposicion = true,
                PricePerHour = 0m,
                SlotDurationMinutes = 0,
                Is24Hours = false,
                OpenTime = null,
                CloseTime = null
            });

            EnsureSpace(new Space
            {
                Name = "Cancha Fútbol Oficial 1 Italia 1400",
                SportCategory = "Fútbol 11",
                Location = "Italia 1401, Elortondo, Provincia de Santa Fe",
                IsActive = true,
                AllowReservationsDuringClasses = false,
                RequiresApproval = false,
                PermitirSuperposicion = true,
                PricePerHour = 0m,
                SlotDurationMinutes = 0,
                Is24Hours = false,
                OpenTime = null,
                CloseTime = null
            });

            EnsureSpace(new Space
            {
                Name = "Quincho Exterior Italia 1400",
                SportCategory = "Quincho / Parrilla",
                Location = "Italia 1401, Elortondo, Provincia de Santa Fe",
                IsActive = true,
                AllowReservationsDuringClasses = true,
                RequiresApproval = true,
                PermitirSuperposicion = false,
                PricePerHour = 1500m,
                SlotDurationMinutes = 60,
                Is24Hours = true,
                OpenTime = "08:00",
                CloseTime = "23:00"
            });

            // ==========================================
            // Italia 1360
            // ==========================================
            EnsureSpace(new Space
            {
                Name = "Pádel Cancha 1",
                SportCategory = "Pádel",
                Location = "Italia 1360, Elortondo, Provincia de Santa Fe",
                IsActive = true,
                AllowReservationsDuringClasses = true,
                RequiresApproval = false,
                PermitirSuperposicion = false,
                PricePerHour = 1200.03m,
                SlotDurationMinutes = 60,
                Is24Hours = false,
                OpenTime = "08:00",
                CloseTime = "20:00"
            });

            EnsureSpace(new Space
            {
                Name = "Pádel Cancha 2",
                SportCategory = "Pádel",
                Location = "Italia 1360, Elortondo, Provincia de Santa Fe",
                IsActive = true,
                AllowReservationsDuringClasses = true,
                RequiresApproval = false,
                PermitirSuperposicion = false,
                PricePerHour = 1200m,
                SlotDurationMinutes = 60,
                Is24Hours = false,
                OpenTime = "08:00",
                CloseTime = "20:00"
            });

            EnsureSpace(new Space
            {
                Name = "Tenis 1 Peñarol",
                SportCategory = "Tenis",
                Location = "Italia 1360, Elortondo, Provincia de Santa Fe",
                IsActive = true,
                AllowReservationsDuringClasses = true,
                RequiresApproval = false,
                PermitirSuperposicion = false,
                PricePerHour = 1600m,
                SlotDurationMinutes = 60,
                Is24Hours = false,
                OpenTime = "08:00",
                CloseTime = "20:00"
            });

            EnsureSpace(new Space
            {
                Name = "Tenis 2 Peñarol",
                SportCategory = "Tenis",
                Location = "Italia 1360, Elortondo, Provincia de Santa Fe",
                IsActive = true,
                AllowReservationsDuringClasses = true,
                RequiresApproval = false,
                PermitirSuperposicion = false,
                PricePerHour = 1600m,
                SlotDurationMinutes = 60,
                Is24Hours = false,
                OpenTime = "08:00",
                CloseTime = "20:00"
            });

            // ==========================================
            // Alvear 1300
            // ==========================================
            EnsureSpace(new Space
            {
                Name = "Cancha Fútbol Práctica 2 Alvear 1300",
                SportCategory = "Fútbol 11",
                Location = "Marcelo T. de Alvear 1300, Elortondo, Provincia de Santa Fe",
                IsActive = true,
                AllowReservationsDuringClasses = false,
                RequiresApproval = false,
                PermitirSuperposicion = true,
                PricePerHour = 0m,
                SlotDurationMinutes = 0,
                Is24Hours = false,
                OpenTime = null,
                CloseTime = null
            });

            EnsureSpace(new Space
            {
                Name = "Cancha Fútbol Oficial 2 Alvear 1300",
                SportCategory = "Fútbol 11",
                Location = "Marcelo T. de Alvear 1300, Elortondo, Provincia de Santa Fe",
                IsActive = true,
                AllowReservationsDuringClasses = false,
                RequiresApproval = false,
                PermitirSuperposicion = false,
                PricePerHour = 0m,
                SlotDurationMinutes = 0,
                Is24Hours = false,
                OpenTime = null,
                CloseTime = null
            });
        }

        // ==========================================
        // 8. SEEDING DE ACTIVIDADES COMERCIALES + INSCRIPCIONES + LIQUIDACIÓN DE CANON
        // ==========================================
        // Idempotente: verifica por Email/DNI (usuarios) y por Name (actividades) antes
        // de insertar, y rellena la configuración comercial de actividades ya existentes.
        private static void SeedCommercialActivities(ApplicationContext context)
        {
            string hashedPassword = BCrypt.Net.BCrypt.HashPassword("1234");

            // ==========================================
            // 8.0 Renombrado idempotente de actividades (nombres anteriores → actuales).
            // Los registros ya guardados con el nombre viejo se renombran una única vez
            // para que EnsureActivity (que chequea por Name) no cree duplicados.
            // ==========================================
            var renameActivities = new Dictionary<string, string>
            {
                ["Clases de Tenis"] = "Tenis Adultos",
                ["Pádel Avanzado"] = "Pádel Nivel 6",
                // Deduplicación por tildes/mayúsculas (evita "Futbol sub 15" vs "Fútbol Sub 15").
                ["Futbol sub 15"] = "Fútbol Sub 15",
                ["Futbol Sub15"] = "Fútbol Sub 15",
                ["Basquet Juvenil"] = "Básquet Juvenil",
                ["Basquet"] = "Básquet Juvenil",
                ["Padel Nivel 6"] = "Pádel Nivel 6",
                ["Padel Avanzado"] = "Pádel Nivel 6",
                ["Spinning/GYM"] = "Spinning / GYM",
                ["Natacion Libre"] = "Natación Libre / Adultos",
                ["Natacion Escuela"] = "Natación Escuela Niños",
                ["Musculacion"] = "Musculación Libre",
            };

            foreach (var rename in renameActivities)
            {
                var activity = context.Activities.FirstOrDefault(a => a.Name == rename.Key);
                if (activity != null && !context.Activities.Any(a => a.Name == rename.Value))
                {
                    activity.Name = rename.Value;
                }
            }
            context.SaveChanges();

            // Resuelve el Id del espacio físico por nombre. Los espacios ya fueron
            // asegurados por SeedSpaces antes de llegar a este punto.
            int? ResolveSpaceId(string name) => context.Spaces.FirstOrDefault(s => s.Name == name)?.Id;

            User EnsureUser(User seed)
            {
                var existing = context.Users.FirstOrDefault(u => u.Email == seed.Email);
                if (existing == null && !string.IsNullOrWhiteSpace(seed.Dni))
                    existing = context.Users.FirstOrDefault(u => u.Dni == seed.Dni);

                if (existing != null) return existing;

                context.Users.Add(seed);
                context.SaveChanges();
                return seed;
            }

            Activity EnsureActivity(Activity desired)
            {
                var existing = context.Activities.FirstOrDefault(a => a.Name == desired.Name);
                if (existing == null)
                {
                    context.Activities.Add(desired);
                    context.SaveChanges();
                    return desired;
                }

                var changed = false;
                if (existing.Category != desired.Category) { existing.Category = desired.Category; changed = true; }
                if (existing.Description != desired.Description) { existing.Description = desired.Description; changed = true; }
                if (existing.Price != desired.Price) { existing.Price = desired.Price; changed = true; }
                if (existing.PriceMember != desired.PriceMember) { existing.PriceMember = desired.PriceMember; changed = true; }
                if (existing.PriceNonMember != desired.PriceNonMember) { existing.PriceNonMember = desired.PriceNonMember; changed = true; }
                if (existing.DiaVencimiento != desired.DiaVencimiento) { existing.DiaVencimiento = desired.DiaVencimiento; changed = true; }
                if (existing.TipoRecargoMora != desired.TipoRecargoMora) { existing.TipoRecargoMora = desired.TipoRecargoMora; changed = true; }
                if (existing.RecargoMoraSocio != desired.RecargoMoraSocio) { existing.RecargoMoraSocio = desired.RecargoMoraSocio; changed = true; }
                if (existing.RecargoMoraNoSocio != desired.RecargoMoraNoSocio) { existing.RecargoMoraNoSocio = desired.RecargoMoraNoSocio; changed = true; }
                if (existing.PaymentCollector != desired.PaymentCollector) { existing.PaymentCollector = desired.PaymentCollector; changed = true; }
                if (existing.ProfessorFacilityFeeMember != desired.ProfessorFacilityFeeMember) { existing.ProfessorFacilityFeeMember = desired.ProfessorFacilityFeeMember; changed = true; }
                if (existing.ProfessorFacilityFeeNonMember != desired.ProfessorFacilityFeeNonMember) { existing.ProfessorFacilityFeeNonMember = desired.ProfessorFacilityFeeNonMember; changed = true; }
                if (existing.ProfessorMercadoPagoPublicKey != desired.ProfessorMercadoPagoPublicKey) { existing.ProfessorMercadoPagoPublicKey = desired.ProfessorMercadoPagoPublicKey; changed = true; }
                if (existing.ProfessorMercadoPagoAccessToken != desired.ProfessorMercadoPagoAccessToken) { existing.ProfessorMercadoPagoAccessToken = desired.ProfessorMercadoPagoAccessToken; changed = true; }
                if (existing.MaxCapacity != desired.MaxCapacity) { existing.MaxCapacity = desired.MaxCapacity; changed = true; }
                if (existing.TeacherId != desired.TeacherId) { existing.TeacherId = desired.TeacherId; changed = true; }
                if (existing.SpaceId != desired.SpaceId) { existing.SpaceId = desired.SpaceId; changed = true; }
                if (existing.Schedule != desired.Schedule) { existing.Schedule = desired.Schedule; changed = true; }
                if (existing.IsActive != desired.IsActive) { existing.IsActive = desired.IsActive; changed = true; }

                if (changed)
                {
                    context.Activities.Update(existing);
                    context.SaveChanges();
                }

                return existing;
            }

            void EnsureSchedules(int activityId, params (int DayOfWeek, string Start, string End)[] rows)
            {
                if (context.ActivitySchedules.Any(s => s.ActivityId == activityId))
                    return;

                context.ActivitySchedules.AddRange(rows.Select(r => new ActivitySchedule
                {
                    ActivityId = activityId,
                    DayOfWeek = r.DayOfWeek,
                    StartTime = TimeSpan.Parse(r.Start),
                    EndTime = TimeSpan.Parse(r.End),
                    CreatedAt = DateTime.UtcNow
                }));
                context.SaveChanges();
            }

            void EnsureEnrollment(int userId, int activityId)
            {
                if (context.Enrollments.Any(e => e.UserId == userId && e.ActivityId == activityId && e.Status == EnrollmentStatus.ACTIVE))
                    return;

                context.Enrollments.Add(new Enrollment
                {
                    UserId = userId,
                    ActivityId = activityId,
                    EnrollmentDate = DateTime.UtcNow,
                    Status = EnrollmentStatus.ACTIVE,
                    CreatedAt = DateTime.UtcNow
                });
            }

            // Inserta (si no existe) una cuota de actividad con un período, estado y
            // recargo determinados. Idempotente por (UserId, Period, Concepto, ActivityId).
            void EnsureActivityPayment(
                int userId, Activity activity, bool esSocio, string period,
                PaymentStatus status, bool paidInCurrentMonth)
            {
                // La clave única de Payment es (UserId, Period, Concepto, ActivityId).
                if (context.Payments.Any(p =>
                        p.UserId == userId
                        && p.Period == period
                        && p.Concepto == CuotaConcepto.Actividad
                        && p.ActivityId == activity.Id))
                    return;

                var diaVencimiento = Math.Clamp(activity.DiaVencimiento, 1, 28);
                var dueDate = ResolveActivityDueDate(period, diaVencimiento);

                var precioBase = esSocio ? activity.PriceMember : activity.PriceNonMember;
                var recargo = CalcularRecargoActividadSeeder(precioBase, esSocio, activity, diaVencimiento);

                // Fecha de pago: si está pagada y corresponde al mes corriente, se paga
                // en Noviembre 2026 para que compute en "Recaudación del Mes".
                var paymentDate = status == PaymentStatus.Paid
                    ? (DateTime?)DateTime.SpecifyKind(
                        paidInCurrentMonth
                            ? new DateTime(2026, 11, 15, 11, 0, 0)
                            : new DateTime(2026, 10, 12, 11, 0, 0),
                        DateTimeKind.Utc)
                    : null;

                context.Payments.Add(new Payment
                {
                    UserId = userId,
                    Period = period,
                    Concepto = CuotaConcepto.Actividad,
                    ActivityId = activity.Id,
                    ActivityName = activity.Name,
                    DueDate = dueDate,
                    Amount = precioBase,
                    LateFeeApplied = recargo,
                    MarketplaceFee = 0m,
                    PaymentMethod = status == PaymentStatus.Paid ? "Efectivo" : string.Empty,
                    Status = status,
                    PaymentDate = paymentDate,
                    CreatedAt = DateTime.UtcNow
                });
            }

            // Resuelve la fecha de vencimiento de una cuota de actividad a partir del
            // período "yyyy-MM" y el día de vencimiento (1-28). Réplica de la lógica
            // del PaymentService para que el seed quede consistente con la app.
            static DateTime ResolveActivityDueDate(string period, int diaVencimiento)
            {
                var parts = period.Split('-');
                if (parts.Length == 2 && int.TryParse(parts[0], out var year) && int.TryParse(parts[1], out var month))
                {
                    var maxDay = DateTime.DaysInMonth(year, month);
                    var day = Math.Min(diaVencimiento, maxDay);
                    return new DateTime(year, month, day);
                }

                return new DateTime(2026, 11, Math.Min(diaVencimiento, 30));
            }

            // Réplica de CalcularRecargoActividad del PaymentService, pero parametrizable
            // respecto a una "fecha actual" fija en el seed (17 de Noviembre de 2026).
            static decimal CalcularRecargoActividadSeeder(decimal precioBase, bool esSocio, Activity activity, int diaVencimiento)
            {
                if (activity.TipoRecargoMora == TipoRecargoMora.Ninguno || precioBase <= 0m)
                    return 0m;

                // Fecha de referencia del seed: 17 de Noviembre de 2026.
                var ahora = new DateTime(2026, 11, 17);
                var recargo = esSocio ? activity.RecargoMoraSocio : activity.RecargoMoraNoSocio;
                if (recargo <= 0m || ahora.Day <= diaVencimiento)
                    return 0m;

                var incremento = activity.TipoRecargoMora == TipoRecargoMora.Porcentaje
                    ? precioBase * (recargo / 100m)
                    : recargo;

                return Math.Round(incremento, 2, MidpointRounding.AwayFromZero);
            }

            // 8.1 Profesores de prueba (4, con credenciales de acceso "1234")
            var teacherTenis = EnsureUser(new User
            {
                BadgeNum = "P-001",
                FirstName = "Juan",
                LastName = "Pérez",
                Email = "profesor.tenis@clubapp.com",
                PasswordHash = hashedPassword,
                Role = UserRole.TEACHER,
                Dni = "40000001",
                Phone = "+54900000001",
                BirthDate = new DateTime(1988, 5, 20),
                CreatedAt = DateTime.UtcNow
            });

            var teacherPadel = EnsureUser(new User
            {
                BadgeNum = "P-002",
                FirstName = "María",
                LastName = "García",
                Email = "profesor.padel@clubapp.com",
                PasswordHash = hashedPassword,
                Role = UserRole.TEACHER,
                Dni = "40000002",
                Phone = "+54900000002",
                BirthDate = new DateTime(1990, 9, 12),
                CreatedAt = DateTime.UtcNow
            });

            var teacherGym = EnsureUser(new User
            {
                BadgeNum = "P-003",
                FirstName = "Carlos",
                LastName = "Rodríguez",
                Email = "profesor.gym@clubapp.com",
                PasswordHash = hashedPassword,
                Role = UserRole.TEACHER,
                Dni = "40000003",
                Phone = "+54900000003",
                BirthDate = new DateTime(1985, 2, 14),
                CreatedAt = DateTime.UtcNow
            });

            var teacherFutbol = EnsureUser(new User
            {
                BadgeNum = "P-004",
                FirstName = "Diego",
                LastName = "Fernández",
                Email = "profesor.futbol@clubapp.com",
                PasswordHash = hashedPassword,
                Role = UserRole.TEACHER,
                Dni = "40000004",
                Phone = "+54900000004",
                BirthDate = new DateTime(1987, 11, 3),
                CreatedAt = DateTime.UtcNow
            });

            var teacherNatacion = EnsureUser(new User
            {
                BadgeNum = "P-005",
                FirstName = "Lucía",
                LastName = "Moline",
                Email = "profesor.natacion@clubapp.com",
                PasswordHash = hashedPassword,
                Role = UserRole.TEACHER,
                Dni = "40000005",
                Phone = "+54900000005",
                BirthDate = new DateTime(1992, 3, 18),
                CreatedAt = DateTime.UtcNow
            });

            // 8.2 Alumnos: 12 socios (membresía activa) + 6 no socios (sin membresía).
            // IsMember distingue de forma explícita Socio (true) vs No Socio/Seguidor (false).
            var socioNames = new (string First, string Last)[]
            {
                ("Martín", "Álvarez"), ("Sofía", "Benítez"), ("Lautaro", "Castro"),
                ("Valentina", "Díaz"), ("Joaquín", "Escobar"), ("Camila", "Fernández"),
                ("Matías", "González"), ("Agustina", "Herrera"), ("Bruno", "Ibarra"),
                ("Julieta", "Juárez"), ("Nicolás", "Krause"), ("Milagros", "Ledesma"),
            };

            var noSocioNames = new (string First, string Last)[]
            {
                ("Tomás", "Méndez"), ("Florencia", "Navarro"), ("Santiago", "Ocampo"),
                ("Renata", "Paz"), ("Gonzalo", "Quintero"), ("Ailén", "Romero"),
            };

            var socios = new List<User>();
            var noSocios = new List<User>();

            for (int i = 0; i < socioNames.Length; i++)
            {
                var socio = EnsureUser(new User
                {
                    BadgeNum = $"S-{i + 1:000}",
                    FirstName = socioNames[i].First,
                    LastName = socioNames[i].Last,
                    Email = $"socio{i + 1}@clubapp.com",
                    PasswordHash = hashedPassword,
                    Role = UserRole.MEMBER,
                    IsMember = true,
                    Dni = $"450000{i + 1:00}",
                    Phone = $"+549555000{i + 1:000}",
                    BirthDate = new DateTime(1990, 1, 1).AddDays(i + 1),
                    CreatedAt = DateTime.UtcNow
                });
                socio.IsMember = true; // backfill idempotente por si el registro ya existía
                socios.Add(socio);
            }

            for (int i = 0; i < noSocioNames.Length; i++)
            {
                var noSocio = EnsureUser(new User
                {
                    BadgeNum = $"NS-{i + 1:000}",
                    FirstName = noSocioNames[i].First,
                    LastName = noSocioNames[i].Last,
                    Email = $"nosocio{i + 1}@clubapp.com",
                    PasswordHash = hashedPassword,
                    Role = UserRole.MEMBER,
                    IsMember = false,
                    Dni = $"460000{i + 1:00}",
                    Phone = $"+549666000{i + 1:000}",
                    BirthDate = new DateTime(1992, 2, 1).AddDays(i + 1),
                    CreatedAt = DateTime.UtcNow
                });
                noSocio.IsMember = false; // backfill idempotente
                noSocios.Add(noSocio);
            }

            // Membresía ACTIVA solo para los socios (los no socios no tienen membresía).
            foreach (var socio in socios)
            {
                if (!context.Memberships.Any(m => m.UserId == socio.Id))
                {
                    context.Memberships.Add(new Membership
                    {
                        UserId = socio.Id,
                        MonthlyPrice = 15000m,
                        Status = MembershipStatus.ACTIVE,
                        StartDate = DateTime.UtcNow.AddMonths(-1),
                        EndDate = DateTime.UtcNow.AddMonths(11),
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }
            context.SaveChanges();

            // 8.3 Actividades comerciales (cupos variados para probar la UI de inscripción).
            // Cada actividad configura sus reglas financieras reales: día de vencimiento,
            // tipo de recargo y valores de recargo para Socios / No Socios.
            // NOTA: la fecha de referencia del seed es el 17 de Noviembre de 2026.

            // 1) Tenis Adultos — LLENA (cupo 8/8). Cobra el profesor (PROFESSOR_DIRECT):
            //    NO genera deuda en "Mis Cuotas" del club (validación de cobro directo).
            var tenis = EnsureActivity(new Activity
            {
                Name = "Tenis Adultos",
                Description = "Clases de tenis para adultos, nivel inicial y avanzado.",
                Category = "Deportes",
                Price = 8000m,
                PriceMember = 8000m,
                PriceNonMember = 12000m,
                DiaVencimiento = 10,
                TipoRecargoMora = TipoRecargoMora.Ninguno,
                RecargoMoraSocio = 0m,
                RecargoMoraNoSocio = 0m,
                PaymentCollector = PaymentCollectorType.PROFESSOR_DIRECT,
                ProfessorFacilityFeeMember = 1500m,
                ProfessorFacilityFeeNonMember = 3000m,
                ProfessorMercadoPagoPublicKey = "APP_USR-tenis-public-key",
                ProfessorMercadoPagoAccessToken = "APP_USR-1111111111111111-010101-aaaaaaaaaaaa",
                MaxCapacity = 8,
                TeacherId = teacherTenis.Id,
                SpaceId = ResolveSpaceId("Tenis 1 Peñarol"),
                RequiresBooking = false,
                Schedule = "Lunes y Miércoles 18:00 hs",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            });

            // 3) Fútbol Sub 15 — MITAD DE CAPACIDAD (cupo 24, 12 insc). Cobra el Club.
            //    Vencimiento día 15 con recargo MONTO FIJO ($2500 socio / $4000 no socio).
            var futbol = EnsureActivity(new Activity
            {
                Name = "Fútbol Sub 15",
                Description = "Entrenamiento y partidos de fútbol juvenil.",
                Category = "Deportes",
                Price = 5000m,
                PriceMember = 5000m,
                PriceNonMember = 8000m,
                DiaVencimiento = 15,
                TipoRecargoMora = TipoRecargoMora.MontoFijo,
                RecargoMoraSocio = 2500m,
                RecargoMoraNoSocio = 4000m,
                PaymentCollector = PaymentCollectorType.CLUB,
                ProfessorFacilityFeeMember = 0m,
                ProfessorFacilityFeeNonMember = 0m,
                ProfessorMercadoPagoPublicKey = null,
                ProfessorMercadoPagoAccessToken = null,
                MaxCapacity = 24,
                TeacherId = teacherFutbol.Id,
                SpaceId = ResolveSpaceId("Cancha Fútbol Práctica 1 Italia 1400"),
                RequiresBooking = false,
                Schedule = "Martes y Jueves 17:00 hs",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            });

            // 6) Spinning / GYM — Cupo variado. Cobra el Club.
            //    SIN RECARGO (TipoRecargoMora = Ninguno), vencimiento día 10: aunque esté
            //    vencida no suma punitorio.
            var spinning = EnsureActivity(new Activity
            {
                Name = "Spinning / GYM",
                Description = "Clases de ciclismo indoor y acondicionamiento físico en el gimnasio.",
                Category = "Fitness",
                Price = 6000m,
                PriceMember = 6000m,
                PriceNonMember = 9000m,
                DiaVencimiento = 10,
                TipoRecargoMora = TipoRecargoMora.Ninguno,
                RecargoMoraSocio = 0m,
                RecargoMoraNoSocio = 0m,
                PaymentCollector = PaymentCollectorType.CLUB,
                ProfessorFacilityFeeMember = 1000m,
                ProfessorFacilityFeeNonMember = 2000m,
                ProfessorMercadoPagoPublicKey = null,
                ProfessorMercadoPagoAccessToken = null,
                MaxCapacity = 12,
                TeacherId = teacherGym.Id,
                SpaceId = ResolveSpaceId("GYM Peñarol"),
                RequiresBooking = false,
                Schedule = "Martes y Jueves 09:00 hs",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            });

            // 5) Básquet Juvenil — 100% LIBRE (cupo 15, 0 insc). Cobra el Club.
            //    Vencimiento día 10 con recargo PORCENTAJE (para probar inscripción desde cero).
            var basquet = EnsureActivity(new Activity
            {
                Name = "Básquet Juvenil",
                Description = "Entrenamiento de básquet para categorías juveniles.",
                Category = "Deportes",
                Price = 5500m,
                PriceMember = 5500m,
                PriceNonMember = 8500m,
                DiaVencimiento = 10,
                TipoRecargoMora = TipoRecargoMora.Porcentaje,
                RecargoMoraSocio = 10m,
                RecargoMoraNoSocio = 15m,
                PaymentCollector = PaymentCollectorType.CLUB,
                ProfessorFacilityFeeMember = 1000m,
                ProfessorFacilityFeeNonMember = 2000m,
                ProfessorMercadoPagoPublicKey = null,
                ProfessorMercadoPagoAccessToken = null,
                MaxCapacity = 15,
                TeacherId = teacherFutbol.Id,
                SpaceId = ResolveSpaceId("Basket Peñarol CANCHA 1"),
                RequiresBooking = false,
                Schedule = "Miércoles y Viernes 16:00 hs",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            });

            // 2) Pádel Nivel 6 — A 1 CUPO DE LLENARSE (cupo 10, 9 insc). Cobra el Club.
            //    Vencimiento día 1 con recargo PORCENTAJE (10% socio / 15% no socio).
            var padel = EnsureActivity(new Activity
            {
                Name = "Pádel Nivel 6",
                Description = "Entrenamiento de pádel para jugadores de nivel 6.",
                Category = "Deportes",
                Price = 9000m,
                PriceMember = 9000m,
                PriceNonMember = 13000m,
                DiaVencimiento = 1,
                TipoRecargoMora = TipoRecargoMora.Porcentaje,
                RecargoMoraSocio = 10m,
                RecargoMoraNoSocio = 15m,
                PaymentCollector = PaymentCollectorType.CLUB,
                ProfessorFacilityFeeMember = 0m,
                ProfessorFacilityFeeNonMember = 0m,
                ProfessorMercadoPagoPublicKey = null,
                ProfessorMercadoPagoAccessToken = null,
                MaxCapacity = 10,
                TeacherId = teacherPadel.Id,
                SpaceId = ResolveSpaceId("Pádel Cancha 1"),
                RequiresBooking = false,
                Schedule = "Viernes 19:00 hs",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            });

            // 4) Natación Libre / Adultos — POCOS INSCRIPTOS (cupo 20, 3 insc). Cobra el Club.
            //    Vencimiento día 28 con recargo PORCENTAJE: las cuotas de noviembre quedan
            //    PENDIENTES (aún no llegó el día 28), sin recargo.
            var natacionLibre = EnsureActivity(new Activity
            {
                Name = "Natación Libre / Adultos",
                Description = "Natación libre supervisada para adultos.",
                Category = "Natación",
                Price = 7000m,
                PriceMember = 7000m,
                PriceNonMember = 10500m,
                DiaVencimiento = 28,
                TipoRecargoMora = TipoRecargoMora.Porcentaje,
                RecargoMoraSocio = 12m,
                RecargoMoraNoSocio = 18m,
                PaymentCollector = PaymentCollectorType.CLUB,
                ProfessorFacilityFeeMember = 0m,
                ProfessorFacilityFeeNonMember = 0m,
                ProfessorMercadoPagoPublicKey = null,
                ProfessorMercadoPagoAccessToken = null,
                MaxCapacity = 20,
                TeacherId = teacherGym.Id,
                SpaceId = ResolveSpaceId("Pileta Olímpica Peñarol"),
                RequiresBooking = false,
                Schedule = "Lunes, Miércoles y Viernes 19:00 hs",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            });

            // 7) Musculación Libre — GRATUITA (PrecioSocio = 0, PrecioNoSocio = 0).
            //    Validación: no genera deuda en "Mis Cuotas" del club.
            var musculacion = EnsureActivity(new Activity
            {
                Name = "Musculación Libre",
                Description = "Acceso libre a la sala de musculación del gimnasio.",
                Category = "Fitness",
                Price = 0m,
                PriceMember = 0m,
                PriceNonMember = 0m,
                DiaVencimiento = 10,
                TipoRecargoMora = TipoRecargoMora.Ninguno,
                RecargoMoraSocio = 0m,
                RecargoMoraNoSocio = 0m,
                PaymentCollector = PaymentCollectorType.CLUB,
                ProfessorFacilityFeeMember = 0m,
                ProfessorFacilityFeeNonMember = 0m,
                ProfessorMercadoPagoPublicKey = null,
                ProfessorMercadoPagoAccessToken = null,
                MaxCapacity = 30,
                TeacherId = teacherGym.Id,
                SpaceId = ResolveSpaceId("GYM Peñarol"),
                RequiresBooking = false,
                Schedule = "Lunes a Sábados 08:00 a 20:00 hs",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            });

            // 8) Natación Escuela Niños — PROFESOR_DIRECT con costo: validación de que
            //    el cobro directo por profesor NO genera deuda en "Mis Cuotas" del club.
            var natacionEscuela = EnsureActivity(new Activity
            {
                Name = "Natación Escuela Niños",
                Description = "Escuela de natación para niños dictada por profesor independiente.",
                Category = "Natación",
                Price = 6500m,
                PriceMember = 6500m,
                PriceNonMember = 9500m,
                DiaVencimiento = 10,
                TipoRecargoMora = TipoRecargoMora.Ninguno,
                RecargoMoraSocio = 0m,
                RecargoMoraNoSocio = 0m,
                PaymentCollector = PaymentCollectorType.PROFESSOR_DIRECT,
                ProfessorFacilityFeeMember = 1800m,
                ProfessorFacilityFeeNonMember = 2800m,
                ProfessorMercadoPagoPublicKey = "APP_USR-natacion-public-key",
                ProfessorMercadoPagoAccessToken = "APP_USR-3333333333333333-030303-cccccccccccc",
                MaxCapacity = 16,
                TeacherId = teacherNatacion.Id,
                SpaceId = ResolveSpaceId("Pileta Olímpica Peñarol"),
                RequiresBooking = false,
                Schedule = "Lunes y Miércoles 17:00 hs",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            });

            // 8.4 Horarios estructurados (días ocupados en la semana)
            EnsureSchedules(tenis.Id, (1, "18:00", "19:00"), (3, "18:00", "19:00"));
            EnsureSchedules(futbol.Id, (2, "17:00", "18:30"), (4, "17:00", "18:30"));
            EnsureSchedules(spinning.Id, (2, "09:00", "10:00"), (4, "09:00", "10:00"), (6, "10:00", "11:00"));
            EnsureSchedules(basquet.Id, (3, "16:00", "17:30"), (5, "16:00", "17:30"));
            EnsureSchedules(padel.Id, (5, "19:00", "20:00"));
            EnsureSchedules(natacionLibre.Id, (1, "19:00", "20:00"), (3, "19:00", "20:00"), (5, "19:00", "20:00"));
            EnsureSchedules(natacionEscuela.Id, (1, "17:00", "18:00"), (3, "17:00", "18:00"));

            // 8.5 Inscripciones (idempotentes por UserId + ActivityId + Estado ACTIVE)
            // Los cupos quedan en los niveles pedidos para probar la UI de inscripción:
            //  - LLENA (0 disponibles), 1 cupo restante, ~50%, pocos inscriptos, 100% libre.
            // Tenis Adultos (PROFESSOR_DIRECT): cupo 8 → 8 inscripciones (SIN CUPO). 3 socios + 5 no socios.
            EnsureEnrollment(socios[0].Id, tenis.Id);
            EnsureEnrollment(socios[1].Id, tenis.Id);
            EnsureEnrollment(socios[2].Id, tenis.Id);
            for (int i = 0; i < 5; i++) EnsureEnrollment(noSocios[i].Id, tenis.Id);

            // Pádel Nivel 6 (CLUB): cupo 10 → 9 inscripciones (1 solo cupo restante). 5 socios + 4 no socios.
            for (int i = 0; i < 5; i++) EnsureEnrollment(socios[i].Id, padel.Id);
            for (int i = 0; i < 4; i++) EnsureEnrollment(noSocios[i].Id, padel.Id);

            // Fútbol Sub 15 (CLUB): cupo 24 → 12 inscripciones (~50%). 8 socios + 4 no socios.
            for (int i = 0; i < 8; i++) EnsureEnrollment(socios[i].Id, futbol.Id);
            for (int i = 0; i < 4; i++) EnsureEnrollment(noSocios[i].Id, futbol.Id);

            // Natación Libre / Adultos (CLUB): cupo 20 → 3 inscripciones (recién abierta). 2 socios + 1 no socio.
            EnsureEnrollment(socios[0].Id, natacionLibre.Id);
            EnsureEnrollment(socios[1].Id, natacionLibre.Id);
            EnsureEnrollment(noSocios[0].Id, natacionLibre.Id);

            // Básquet Juvenil (CLUB): cupo 15 → 0 inscripciones (100% libre).

            // Spinning / GYM (CLUB): cupo 12 → 7 inscripciones. 4 socios + 3 no socios.
            for (int i = 0; i < 4; i++) EnsureEnrollment(socios[i].Id, spinning.Id);
            for (int i = 0; i < 3; i++) EnsureEnrollment(noSocios[i].Id, spinning.Id);

            // Musculación Libre (GRATUITA): cupo 30 → 6 inscripciones. 4 socios + 2 no socios.
            for (int i = 0; i < 4; i++) EnsureEnrollment(socios[i].Id, musculacion.Id);
            for (int i = 0; i < 2; i++) EnsureEnrollment(noSocios[i].Id, musculacion.Id);

            // Natación Escuela Niños (PROFESSOR_DIRECT): cupo 16 → 4 inscripciones. 3 socios + 1 no socio.
            for (int i = 0; i < 3; i++) EnsureEnrollment(socios[i].Id, natacionEscuela.Id);
            EnsureEnrollment(noSocios[0].Id, natacionEscuela.Id);

            context.SaveChanges();

            // ==========================================
            // 8.6 SEEDING DE PAGOS DE ACTIVIDAD (CuotaConcepto.Actividad)
            // ==========================================
            // Genera un historial financiero realista y variado para que el Dashboard
            // ("Recaudación del Mes → Por Actividades") y "Control de Recaudación"
            // muestren cifras concretas. Cubre Paid / Pending / Overdue según la regla
            // de vencimiento y recargo de cada actividad.
            var currentPeriod = "2026-11";
            var previousPeriod = "2026-10";

            // --- Pádel Nivel 6 (vencimiento día 1, recargo %): cuotas de Noviembre VENCIDAS.
            for (int i = 0; i < 3; i++) EnsureActivityPayment(socios[i].Id, padel, true, currentPeriod, PaymentStatus.Paid, true);
            EnsureActivityPayment(socios[3].Id, padel, true, currentPeriod, PaymentStatus.Overdue, false);
            EnsureActivityPayment(socios[4].Id, padel, true, currentPeriod, PaymentStatus.Overdue, false);
            EnsureActivityPayment(noSocios[0].Id, padel, false, currentPeriod, PaymentStatus.Paid, true);
            for (int i = 1; i < 4; i++) EnsureActivityPayment(noSocios[i].Id, padel, false, currentPeriod, PaymentStatus.Overdue, false);
            EnsureActivityPayment(socios[0].Id, padel, true, previousPeriod, PaymentStatus.Paid, false);

            // --- Fútbol Sub 15 (vencimiento día 15, recargo $ fijo): cuotas de Noviembre VENCIDAS.
            for (int i = 0; i < 5; i++) EnsureActivityPayment(socios[i].Id, futbol, true, currentPeriod, PaymentStatus.Paid, true);
            for (int i = 5; i < 8; i++) EnsureActivityPayment(socios[i].Id, futbol, true, currentPeriod, PaymentStatus.Overdue, false);
            for (int i = 0; i < 2; i++) EnsureActivityPayment(noSocios[i].Id, futbol, false, currentPeriod, PaymentStatus.Paid, true);
            for (int i = 2; i < 4; i++) EnsureActivityPayment(noSocios[i].Id, futbol, false, currentPeriod, PaymentStatus.Overdue, false);
            EnsureActivityPayment(socios[0].Id, futbol, true, previousPeriod, PaymentStatus.Paid, false);
            EnsureActivityPayment(socios[1].Id, futbol, true, previousPeriod, PaymentStatus.Paid, false);

            // --- Natación Libre / Adultos (vencimiento día 28, recargo %): PENDIENTES.
            EnsureActivityPayment(socios[0].Id, natacionLibre, true, currentPeriod, PaymentStatus.Pending, false);
            EnsureActivityPayment(socios[1].Id, natacionLibre, true, currentPeriod, PaymentStatus.Pending, false);
            EnsureActivityPayment(noSocios[0].Id, natacionLibre, false, currentPeriod, PaymentStatus.Pending, false);

            // --- Spinning / GYM (vencimiento día 10, SIN recargo): vencidas sin punitorio.
            for (int i = 0; i < 3; i++) EnsureActivityPayment(socios[i].Id, spinning, true, currentPeriod, PaymentStatus.Paid, true);
            EnsureActivityPayment(socios[3].Id, spinning, true, currentPeriod, PaymentStatus.Overdue, false);
            EnsureActivityPayment(noSocios[0].Id, spinning, false, currentPeriod, PaymentStatus.Paid, true);
            for (int i = 1; i < 3; i++) EnsureActivityPayment(noSocios[i].Id, spinning, false, currentPeriod, PaymentStatus.Overdue, false);

            // --- Musculación Libre (GRATUITA, precio 0): NO genera Payment de actividad.
            // --- Tenis Adultos y Natación Escuela Niños (PROFESSOR_DIRECT): NO generan
            //     Payment en "Mis Cuotas" (cobro directo del profesor).

            context.SaveChanges();
        }

    }
}