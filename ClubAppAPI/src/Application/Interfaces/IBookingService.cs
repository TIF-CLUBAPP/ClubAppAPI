using ClubApp.Application.Dtos;

namespace ClubApp.Application.Interfaces;

public interface IBookingService
{
    /// <summary>Reservas (no canceladas) para una fecha determinada (disponibilidad).</summary>
    Task<List<BookingDto>> GetBookingsByDateAsync(DateTime date);

    /// <summary>Reservas del usuario autenticado.</summary>
    Task<List<BookingDto>> GetMyBookingsAsync(int userId);

    /// <summary>Crea una reserva y su pago asociado (con la regla de comisión ATRIO).</summary>
    Task<BookingDto> CreateBookingAsync(int userId, CreateBookingRequest dto);

    Task<bool> ConfirmBookingAsync(int bookingId, int userId);
    Task<bool> CancelBookingAsync(int bookingId, int userId);
}