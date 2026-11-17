using ClubApp.Application.Dtos;
using ClubApp.Domain.Entities;

namespace ClubApp.Application.Interfaces;

public interface IActivityService
{
    Task<IEnumerable<ActivityDto>> GetAllAvailableActivitiesAsync();
    Task<ActivityDto?> GetActivityByIdAsync(int activityId);
    Task<ActivityDto> CreateActivityAsync(SaveActivityRequest dto, int actorId, UserRole actorRole);
    Task<bool> UpdateActivityAsync(int activityId, SaveActivityRequest dto, int actorId, UserRole actorRole);
    Task<bool> DeleteActivityAsync(int activityId, int actorId, UserRole actorRole);
    Task<bool> EnrollMemberAsync(int userId, int activityId);
    Task<ActivityDto?> AssignInstructorAsync(int activityId, int userId);
    Task<ActivitySettlementDto> GetActivitySettlementAsync(int activityId);

    /// <summary>Acepta la contraoferta de negociación pendiente y aplica los valores propuestos.</summary>
    Task<ActivityDto?> AcceptNegotiationAsync(int activityId, int actorId, UserRole actorRole);

    /// <summary>Registra una nueva contraoferta de Precio Socio / Canon de instalaciones.</summary>
    Task<ActivityDto?> ProposeNegotiationAsync(int activityId, NegotiationProposalRequest request, int actorId, UserRole actorRole);

    /// <summary>Permite que un instructor invitado acepte o rechace su asignación a una actividad.</summary>
    Task<ActivityDto?> SetInstructorStatusAsync(int activityId, int teacherId, AssignmentStatus status, int actorId);

    /// <summary>Vence automáticamente las invitaciones pendientes que superen los 3 días sin respuesta.</summary>
    Task ExpireOverdueInvitationsAsync();

    /// <summary>
    /// Calcula el monto total a cobrar por una cuota de actividad aplicando el recargo por mora
    /// cuando corresponda. Si la fecha de referencia ya superó el día de vencimiento mensual,
    /// añade el recargo configurado (porcentaje sobre el precio base o monto fijo) según
    /// TipoRecargoMora, diferenciando si el inscripto es Socio (true) o No Socio (false).
    /// </summary>
    /// <param name="precioBase">Precio base de la actividad (socio o no socio según corresponda).</param>
    /// <param name="esSocio">True si el inscripto es Socio; false si es No Socio.</param>
    /// <param name="tipoRecargo">Regla de recargo por mora configurada en la actividad.</param>
    /// <param name="recargoSocio">Valor de recargo para Socios (% o $).</param>
    /// <param name="recargoNoSocio">Valor de recargo para No Socios (% o $).</param>
    /// <param name="diaVencimiento">Día mensual de vencimiento de la actividad (1-28).</param>
    /// <param name="fechaReferencia">Fecha en que se calcula la deuda (por defecto, hoy).</param>
    /// <returns>El monto base incrementado con el recargo, o el monto base intacto si no hay recargo.</returns>
    decimal CalcularMontoConRecargo(decimal precioBase, bool esSocio, TipoRecargoMora tipoRecargo, decimal recargoSocio, decimal recargoNoSocio, int diaVencimiento, DateTime? fechaReferencia = null);

}