using System.Globalization;
using ClubApp.Application.Interfaces;
using ClubApp.Application.Dtos;
using ClubApp.Domain.Entities;
using ClubApp.Domain.Exceptions;
using ClubApp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ClubApp.Infrastructure.Services;

public class ActivityService : IActivityService
{
    private readonly ApplicationContext _context;

    public ActivityService(ApplicationContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<ActivityDto>> GetAllAvailableActivitiesAsync()
    {
        var activities = await _context.Activities
            .Include(a => a.Teacher)
            .Include(a => a.Space)
            .Include(a => a.Schedules)
            .Include(a => a.Instructors)
                .ThenInclude(i => i.User)
            .ToListAsync();

        var result = new List<ActivityDto>();
        foreach (var activity in activities)
        {
            result.Add(await MapAsync(activity));
        }
        return result;
    }

    public async Task<ActivityDto?> GetActivityByIdAsync(int activityId)
    {
        var activity = await _context.Activities
            .Include(a => a.Teacher)
            .Include(a => a.Space)
            .Include(a => a.Schedules)
            .Include(a => a.Instructors)
                .ThenInclude(i => i.User)
            .FirstOrDefaultAsync(a => a.Id == activityId);

        if (activity == null) return null;
        return await MapAsync(activity);
    }

    public async Task<ActivityDto> CreateActivityAsync(SaveActivityRequest dto, int actorId, UserRole actorRole)
    {
        Validate(dto);

        var instructorIds = ResolveInstructorIds(dto, actorId, actorRole);
        await EnsureInstructorsExistAsync(instructorIds);
        await EnsureSpaceExistsAsync(dto.SpaceId);
        await ValidateScheduleOverlapsAsync(dto, null);

        // Un profesor solo puede crear actividades a su cargo; para el resto,
        // el "profesor primario" es el TeacherId explícito o el primer instructor.
        int? teacherId = actorRole == UserRole.TEACHER
            ? actorId
            : dto.TeacherId ?? (instructorIds.Count > 0 ? instructorIds[0] : (int?)null);

        var teacher = teacherId.HasValue
            ? await _context.Users.FirstOrDefaultAsync(u => u.Id == teacherId.Value)
            : null;
        bool isIndependent = teacher?.TipoProfesor == TipoProfesor.INDEPENDIENTE;
        decimal facilityCanon = isIndependent ? dto.FacilityCanon : 0m;

        string? estadoNegociacion = null;
        decimal? proposedPriceMember = null;
        decimal? proposedFacilityCanon = null;
        if (isIndependent && actorRole == UserRole.TEACHER)
        {
            estadoNegociacion = "PENDIENTE";
            proposedPriceMember = dto.PriceMember;
            proposedFacilityCanon = dto.FacilityCanon;
        }

        var activity = new Activity
        {
            Name = dto.Name.Trim(),
            Description = dto.Description?.Trim() ?? string.Empty,
            Category = dto.Category?.Trim() ?? string.Empty,
            Price = dto.PriceMember,
            PriceMember = dto.PriceMember,
            PriceNonMember = dto.PriceNonMember,
            PaymentCollector = Enum.TryParse<PaymentCollectorType>(dto.PaymentCollector, true, out var pc) ? pc : PaymentCollectorType.CLUB,
            ProfessorFacilityFeeMember = facilityCanon,
            ProfessorFacilityFeeNonMember = facilityCanon,
            FacilityCanon = facilityCanon,
            AplicaDescuentoSocios = dto.AplicaDescuentoSocios,
            TipoDescuentoCanon = Enum.TryParse<TipoDescuentoCanon>(dto.TipoDescuentoCanon, true, out var tdcCreate) ? tdcCreate : TipoDescuentoCanon.MONTO_FIJO,
            ValorDescuentoPorSocio = dto.ValorDescuentoPorSocio,
            DescuentoMaximoCanon = dto.DescuentoMaximoCanon,
            EstadoNegociacion = estadoNegociacion,
            ProposedPriceMember = proposedPriceMember,
            ProposedFacilityCanon = proposedFacilityCanon,
            ProfessorMercadoPagoPublicKey = dto.ProfessorMercadoPagoPublicKey,
            ProfessorMercadoPagoAccessToken = dto.ProfessorMercadoPagoAccessToken,
            MaxCapacity = dto.MaxCapacity,
            TeacherId = teacherId,
            SpaceId = dto.SpaceId,
            RequiresBooking = dto.RequiresBooking,
            Schedule = dto.Schedule?.Trim() ?? string.Empty,
            IsActive = dto.IsActive,
            Instructors = instructorIds.Select(id => new ActivityInstructor { UserId = id }).ToList(),
            Schedules = BuildSchedules(dto.Schedules)
        };

        _context.Activities.Add(activity);
        await _context.SaveChangesAsync();

        return await MapAsync(activity);
    }

    public async Task<bool> UpdateActivityAsync(int activityId, SaveActivityRequest dto, int actorId, UserRole actorRole)
    {
        var existing = await _context.Activities
            .Include(a => a.Schedules)
            .Include(a => a.Instructors)
            .FirstOrDefaultAsync(a => a.Id == activityId);

        if (existing == null) throw new NotFoundException("Activity", activityId);

        EnsureCanManage(existing, actorId, actorRole);
        Validate(dto);
        await EnsureSpaceExistsAsync(dto.SpaceId);
        await ValidateScheduleOverlapsAsync(dto, activityId);

        int? effectiveTeacherId = actorRole == UserRole.TEACHER
            ? existing.TeacherId
            : (dto.TeacherId ?? existing.TeacherId);
        var teacher = effectiveTeacherId.HasValue
            ? await _context.Users.FirstOrDefaultAsync(u => u.Id == effectiveTeacherId.Value)
            : null;
        bool isIndependent = teacher?.TipoProfesor == TipoProfesor.INDEPENDIENTE;
        decimal facilityCanon = isIndependent ? dto.FacilityCanon : 0m;

        if (isIndependent && actorRole == UserRole.TEACHER)
        {
            if (existing.PriceMember != dto.PriceMember || existing.FacilityCanon != facilityCanon)
            {
                existing.EstadoNegociacion = "PENDIENTE";
                existing.ProposedPriceMember = dto.PriceMember;
                existing.ProposedFacilityCanon = facilityCanon;
            }
        }
        else
        {
            existing.EstadoNegociacion = null;
            existing.ProposedPriceMember = null;
            existing.ProposedFacilityCanon = null;
        }

        existing.Name = dto.Name.Trim();
        existing.Description = dto.Description?.Trim() ?? string.Empty;
        existing.Category = dto.Category?.Trim() ?? string.Empty;
        existing.Price = dto.PriceMember;
        existing.PriceMember = dto.PriceMember;
        existing.PriceNonMember = dto.PriceNonMember;
        existing.PaymentCollector = Enum.TryParse<PaymentCollectorType>(dto.PaymentCollector, true, out var pc) ? pc : PaymentCollectorType.CLUB;
        existing.ProfessorFacilityFeeMember = facilityCanon;
        existing.ProfessorFacilityFeeNonMember = facilityCanon;
        existing.FacilityCanon = facilityCanon;
        existing.AplicaDescuentoSocios = dto.AplicaDescuentoSocios;
        existing.TipoDescuentoCanon = Enum.TryParse<TipoDescuentoCanon>(dto.TipoDescuentoCanon, true, out var tdcUpdate) ? tdcUpdate : TipoDescuentoCanon.MONTO_FIJO;
        existing.ValorDescuentoPorSocio = dto.ValorDescuentoPorSocio;
        existing.DescuentoMaximoCanon = dto.DescuentoMaximoCanon;
        existing.ProfessorMercadoPagoPublicKey = dto.ProfessorMercadoPagoPublicKey;
        
        // Solo actualizamos el token si se proporciona uno nuevo (para no pisar con vacío en un edit normal si el front no lo manda)
        if (!string.IsNullOrWhiteSpace(dto.ProfessorMercadoPagoAccessToken))
        {
            existing.ProfessorMercadoPagoAccessToken = dto.ProfessorMercadoPagoAccessToken;
        }

        existing.MaxCapacity = dto.MaxCapacity;
        existing.RequiresBooking = dto.RequiresBooking;
        existing.Schedule = dto.Schedule?.Trim() ?? string.Empty;
        existing.IsActive = dto.IsActive;
        existing.SpaceId = dto.SpaceId;

        if (actorRole != UserRole.TEACHER)
        {
            existing.TeacherId = dto.TeacherId;

            var instructorIds = ResolveInstructorIds(dto, actorId, actorRole);
            await EnsureInstructorsExistAsync(instructorIds);

            if (existing.TeacherId == null && instructorIds.Count > 0)
                existing.TeacherId = instructorIds[0];

            ReplaceInstructors(existing, instructorIds);
        }

        _context.ActivitySchedules.RemoveRange(existing.Schedules);
        var newSchedules = BuildSchedules(dto.Schedules);
        foreach (var schedule in newSchedules)
        {
            schedule.ActivityId = existing.Id;
        }
        existing.Schedules = newSchedules;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteActivityAsync(int activityId, int actorId, UserRole actorRole)
    {
        var existing = await _context.Activities
            .Include(a => a.Schedules)
            .Include(a => a.Instructors)
            .FirstOrDefaultAsync(a => a.Id == activityId);

        if (existing == null) throw new NotFoundException("Activity", activityId);

        EnsureCanManage(existing, actorId, actorRole);

        _context.Activities.Remove(existing);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> EnrollMemberAsync(int userId, int activityId)
    {
        var activity = await _context.Activities.FindAsync(activityId);
        if (activity == null) throw new NotFoundException("Activity", activityId);

        if (!activity.IsActive)
            throw new AppValidationException("La actividad seleccionada no se encuentra activa.");

        var currentEnrollments = await _context.Enrollments
            .CountAsync(e => e.ActivityId == activityId && e.Status == EnrollmentStatus.ACTIVE);

        if (currentEnrollments >= activity.MaxCapacity)
            throw new AppValidationException("No hay cupos disponibles para esta actividad.");

        _context.Enrollments.Add(new Enrollment
        {
            UserId = userId,
            ActivityId = activityId,
            EnrollmentDate = DateTime.UtcNow,
            Status = EnrollmentStatus.ACTIVE,
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<ActivityDto?> AssignInstructorAsync(int activityId, int userId)
    {
        var activity = await _context.Activities
            .Include(a => a.Teacher)
            .Include(a => a.Space)
            .Include(a => a.Schedules)
            .Include(a => a.Instructors)
            .FirstOrDefaultAsync(a => a.Id == activityId);

        if (activity == null) return null;

        var userExists = await _context.Users.AnyAsync(u => u.Id == userId && !u.IsDeleted);
        if (!userExists)
            throw new AppValidationException("El usuario a asignar no existe.");

        if (activity.Instructors.All(i => i.UserId != userId))
        {
            activity.Instructors.Add(new ActivityInstructor
            {
                ActivityId = activity.Id,
                UserId = userId
            });

            // Backward compat: si no había un profesor primario, este lo pasa a ser.
            activity.TeacherId ??= userId;

            await _context.SaveChangesAsync();
        }

        return await MapAsync(activity);
    }

    private async Task<ActivityDto> MapAsync(Activity activity)
    {
        var enrolledCount = await _context.Enrollments
            .CountAsync(e => e.ActivityId == activity.Id && e.Status == EnrollmentStatus.ACTIVE);

        var instructorIds = activity.Instructors.Select(i => i.UserId).Distinct().ToList();
        var instructorUsers = instructorIds.Count == 0
            ? new List<User>()
            : await _context.Users
                .Where(u => instructorIds.Contains(u.Id))
                .ToListAsync();

        return new ActivityDto
        {
            Id = activity.Id,
            Name = activity.Name,
            Description = activity.Description,
            Category = activity.Category,
            Price = activity.Price,
            PriceMember = activity.PriceMember,
            PriceNonMember = activity.PriceNonMember,
            PaymentCollector = activity.PaymentCollector.ToString(),
            ProfessorFacilityFeeMember = activity.ProfessorFacilityFeeMember,
            ProfessorFacilityFeeNonMember = activity.ProfessorFacilityFeeNonMember,
            FacilityCanon = activity.FacilityCanon,
            AplicaDescuentoSocios = activity.AplicaDescuentoSocios,
            TipoDescuentoCanon = activity.TipoDescuentoCanon.ToString(),
            ValorDescuentoPorSocio = activity.ValorDescuentoPorSocio,
            DescuentoMaximoCanon = activity.DescuentoMaximoCanon,
            EstadoNegociacion = activity.EstadoNegociacion,
            ProposedPriceMember = activity.ProposedPriceMember,
            ProposedFacilityCanon = activity.ProposedFacilityCanon,
            ProfessorMercadoPagoPublicKey = activity.ProfessorMercadoPagoPublicKey,
            ProfessorBankAlias = activity.Teacher?.BankAlias,
            ProfessorHasMercadoPago = !string.IsNullOrWhiteSpace(activity.Teacher?.MercadoPagoAccessToken),
            ProfessorMercadoPagoUserId = activity.Teacher?.MercadoPagoUserId,
            MaxCapacity = activity.MaxCapacity,
            TeacherId = activity.TeacherId,
            TeacherName = activity.Teacher?.FullName,
            TeacherTipoProfesor = activity.Teacher?.TipoProfesor.ToString(),
            Instructors = instructorUsers
                .OrderBy(u => u.FullName)
                .Select(u => new InstructorDto
                {
                    Id = u.Id,
                    FullName = u.FullName,
                    Email = u.Email
                })
                .ToList(),
            SpaceId = activity.SpaceId,
            SpaceName = activity.Space?.Name,
            RequiresBooking = activity.RequiresBooking,
            Schedule = activity.Schedule,
            IsActive = activity.IsActive,
            EnrolledCount = enrolledCount,
            Schedules = activity.Schedules
                .OrderBy(s => s.DayOfWeek)
                .ThenBy(s => s.StartTime)
                .Select(s => new ActivityScheduleDto
                {
                    Id = s.Id,
                    DayOfWeek = s.DayOfWeek,
                    DayName = CultureInfo.GetCultureInfo("es-AR").DateTimeFormat.GetDayName((DayOfWeek)s.DayOfWeek),
                    StartTime = s.StartTime.ToString(@"hh\:mm"),
                    EndTime = s.EndTime.ToString(@"hh\:mm")
                })
                .ToList()
        };
    }

    private async Task EnsureSpaceExistsAsync(int? spaceId)
    {
        if (spaceId.HasValue && !await _context.Spaces.AnyAsync(s => s.Id == spaceId.Value))
            throw new AppValidationException("El espacio seleccionado no existe.");
    }

    /// <summary>
    /// Valida que los horarios de una actividad no colisionen con actividades
    /// ya asignadas al mismo espacio, aplicando las reglas de superposición:
    ///  - Espacio sin superposición: cualquier colisión bloquea (ROJO).
    ///  - Espacio con superposición: mismo deporte comparte (AMARILLO),
    ///    deporte distinto bloquea (ROJO).
    /// </summary>
    private async Task ValidateScheduleOverlapsAsync(SaveActivityRequest dto, int? excludeActivityId)
    {
        if (dto.SpaceId is null || dto.Schedules is null || dto.Schedules.Count == 0)
            return;

        var space = await _context.Spaces.FindAsync(dto.SpaceId.Value);
        if (space is null) return;

        var conflicting = await _context.ActivitySchedules
            .Include(s => s.Activity)
            .Where(s => s.Activity.SpaceId == dto.SpaceId.Value
                        && s.Activity.IsActive
                        && (excludeActivityId == null || s.ActivityId != excludeActivityId.Value))
            .ToListAsync();

        foreach (var input in dto.Schedules)
        {
            if (input.DayOfWeek < 0 || input.DayOfWeek > 6) continue;

            var start = ParseTime(input.StartTime, "inicio");
            var end = ParseTime(input.EndTime, "fin");
            if (end <= start) continue;

            foreach (var existing in conflicting.Where(c => c.DayOfWeek == input.DayOfWeek))
            {
                var overlaps = start < existing.EndTime && existing.StartTime < end;
                if (!overlaps) continue;

                var sameCategory = string.Equals(
                    dto.Category?.Trim(), existing.Activity.Category?.Trim(),
                    StringComparison.OrdinalIgnoreCase);

                if (!space.PermitirSuperposicion)
                {
                    throw new AppValidationException(
                        $"El {DayName(input.DayOfWeek)} de {input.StartTime} a {input.EndTime} ya está ocupado por la actividad \"{existing.Activity.Name}\" en este espacio.");
                }

                if (!sameCategory)
                {
                    throw new AppValidationException(
                        $"No se puede superponer \"{existing.Activity.Name}\" ({existing.Activity.Category}) con \"{dto.Name.Trim()}\" ({dto.Category?.Trim()}) el {DayName(input.DayOfWeek)} de {input.StartTime} a {input.EndTime}: son deportes distintos.");
                }
            }
        }
    }

    private static string DayName(int dayOfWeek) =>
        CultureInfo.GetCultureInfo("es-AR").DateTimeFormat.GetDayName((DayOfWeek)dayOfWeek);

    private static void Validate(SaveActivityRequest dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            throw new AppValidationException("El nombre de la actividad es obligatorio.");

        if (dto.MaxCapacity < 0)
            throw new AppValidationException("La capacidad máxima no puede ser negativa.");

        if (dto.Price < 0)
            throw new AppValidationException("El precio no puede ser negativo.");
    }

    private static void EnsureCanManage(Activity activity, int actorId, UserRole actorRole)
    {
        if (actorRole == UserRole.ADMIN || actorRole == UserRole.SUPERADMIN)
            return;

        if (actorRole == UserRole.TEACHER
            && (activity.TeacherId == actorId
                || activity.Instructors.Any(i => i.UserId == actorId)))
            return;

        throw new NotAllowedException("No tenés permisos para gestionar esta actividad.");
    }

    private static List<int> ResolveInstructorIds(SaveActivityRequest dto, int actorId, UserRole actorRole)
    {
        var ids = (dto.InstructorIds ?? new List<int>())
            .Where(id => id > 0)
            .Distinct()
            .ToList();

        // Un profesor siempre queda a cargo de las actividades que crea.
        if (actorRole == UserRole.TEACHER && !ids.Contains(actorId))
            ids.Insert(0, actorId);

        return ids;
    }

    private static void ReplaceInstructors(Activity activity, List<int> instructorIds)
    {
        activity.Instructors.Clear();
        foreach (var id in instructorIds)
        {
            activity.Instructors.Add(new ActivityInstructor
            {
                ActivityId = activity.Id,
                UserId = id
            });
        }
    }

    private async Task EnsureInstructorsExistAsync(List<int> instructorIds)
    {
        if (instructorIds.Count == 0)
            return;

        var existingIds = await _context.Users
            .Where(u => instructorIds.Contains(u.Id) && !u.IsDeleted)
            .Select(u => u.Id)
            .ToListAsync();

        var missing = instructorIds.Where(id => !existingIds.Contains(id)).ToList();
        if (missing.Count > 0)
            throw new AppValidationException($"Los profesores asignados no existen: {string.Join(", ", missing)}.");
    }

    private static List<ActivitySchedule> BuildSchedules(List<ActivityScheduleInputDto> inputs)
    {
        var result = new List<ActivitySchedule>();
        foreach (var item in inputs ?? new List<ActivityScheduleInputDto>())
        {
            if (item.DayOfWeek < 0 || item.DayOfWeek > 6)
                throw new AppValidationException("El día de la semana debe estar entre 0 (Domingo) y 6 (Sábado).");


            var start = ParseTime(item.StartTime, "inicio");
            var end = ParseTime(item.EndTime, "fin");
            if (end <= start)
                throw new AppValidationException("La hora de fin debe ser posterior a la de inicio.");

            result.Add(new ActivitySchedule
            {
                DayOfWeek = item.DayOfWeek,
                StartTime = start,
                EndTime = end,
                CreatedAt = DateTime.UtcNow
            });
        }
        return result;
    }

    private static TimeSpan ParseTime(string value, string field)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new AppValidationException($"La hora de {field} es obligatoria.");

        if (TimeSpan.TryParse(value.Trim(), out var time))
            return time;

        throw new AppValidationException($"La hora de {field} no es válida. Usá el formato HH:mm.");
    }

    public async Task<ActivitySettlementDto> GetActivitySettlementAsync(int activityId)
    {
        var activity = await _context.Activities
            .FirstOrDefaultAsync(a => a.Id == activityId);

        if (activity == null) throw new NotFoundException("Activity", activityId);

        var activeEnrollments = await _context.Enrollments
            .Where(e => e.ActivityId == activityId && e.Status == EnrollmentStatus.ACTIVE)
            .Select(e => e.UserId)
            .ToListAsync();

        var usersWithActiveMembership = await _context.Memberships
            .Where(m => m.Status == MembershipStatus.ACTIVE && activeEnrollments.Contains(m.UserId))
            .Select(m => m.UserId)
            .Distinct()
            .ToListAsync();

        int memberCount = usersWithActiveMembership.Count;
        int nonMemberCount = activeEnrollments.Count - memberCount;

        decimal baseTotal = activeEnrollments.Count * activity.FacilityCanon;
        decimal discountAmount = 0m;

        if (activity.AplicaDescuentoSocios && memberCount > 0)
        {
            if (activity.TipoDescuentoCanon == TipoDescuentoCanon.PORCENTAJE)
            {
                discountAmount = (activity.FacilityCanon * (activity.ValorDescuentoPorSocio / 100m)) * memberCount;
            }
            else // MONTO_FIJO
            {
                discountAmount = activity.ValorDescuentoPorSocio * memberCount;
            }

            if (activity.DescuentoMaximoCanon.HasValue && discountAmount > activity.DescuentoMaximoCanon.Value)
            {
                discountAmount = activity.DescuentoMaximoCanon.Value;
            }
        }

        decimal totalSettlement = Math.Max(0m, baseTotal - discountAmount);

        return new ActivitySettlementDto
        {
            ActivityId = activity.Id,
            ActivityName = activity.Name,
            TotalEnrollments = activeEnrollments.Count,
            MemberEnrollments = memberCount,
            NonMemberEnrollments = nonMemberCount,
            MemberFee = activity.FacilityCanon,
            NonMemberFee = activity.FacilityCanon,
            FacilityCanon = activity.FacilityCanon,
            TotalSettlement = totalSettlement,
            DiscountApplied = discountAmount
        };
    }

    public async Task<ActivityDto?> AcceptNegotiationAsync(int activityId, int actorId, UserRole actorRole)
    {
        var activity = await _context.Activities
            .Include(a => a.Teacher)
            .Include(a => a.Space)
            .Include(a => a.Schedules)
            .Include(a => a.Instructors)
                .ThenInclude(i => i.User)
            .FirstOrDefaultAsync(a => a.Id == activityId);

        if (activity == null) return null;
        EnsureCanManage(activity, actorId, actorRole);

        if (activity.ProposedPriceMember.HasValue)
            activity.PriceMember = activity.ProposedPriceMember.Value;
        if (activity.ProposedFacilityCanon.HasValue)
            activity.FacilityCanon = activity.ProposedFacilityCanon.Value;

        activity.ProfessorFacilityFeeMember = activity.FacilityCanon;
        activity.ProfessorFacilityFeeNonMember = activity.FacilityCanon;
        activity.EstadoNegociacion = "APROBADO";
        activity.ProposedPriceMember = null;
        activity.ProposedFacilityCanon = null;

        await _context.SaveChangesAsync();
        return await MapAsync(activity);
    }

    public async Task<ActivityDto?> ProposeNegotiationAsync(int activityId, NegotiationProposalRequest request, int actorId, UserRole actorRole)
    {
        var activity = await _context.Activities
            .Include(a => a.Teacher)
            .Include(a => a.Space)
            .Include(a => a.Schedules)
            .Include(a => a.Instructors)
                .ThenInclude(i => i.User)
            .FirstOrDefaultAsync(a => a.Id == activityId);

        if (activity == null) return null;
        EnsureCanManage(activity, actorId, actorRole);

        if (request.PriceMember.HasValue)
            activity.ProposedPriceMember = request.PriceMember.Value;
        if (request.FacilityCanon.HasValue)
            activity.ProposedFacilityCanon = request.FacilityCanon.Value;
        activity.EstadoNegociacion = "PENDIENTE";

        await _context.SaveChangesAsync();
        return await MapAsync(activity);
    }
}