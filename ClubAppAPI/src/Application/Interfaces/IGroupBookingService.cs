using ClubApp.Application.Dtos;

namespace ClubApp.Application.Interfaces;

public interface IGroupBookingService
{
    /// <summary>
    /// Crea la reserva temporal y la cuota del organizador (abonada al iniciar).
    /// Devuelve el estado del grupo con el token público para compartir.
    /// </summary>
    Task<GroupBookingDto> InitAsync(int organizerUserId, InitGroupBookingRequest dto);

    /// <summary>Obtiene el estado público del grupo mediante su token único.</summary>
    Task<GroupBookingDto> GetByTokenAsync(string token);

    /// <summary>Registra el pago de un participante individual (el usuario autenticado).</summary>
    Task<GroupBookingDto> PayAsync(string token, int userId, GroupPayRequest dto);
}
