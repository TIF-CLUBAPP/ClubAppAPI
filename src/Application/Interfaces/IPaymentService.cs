using ClubApp.Application.Dtos;

namespace ClubApp.Application.Interfaces;

public interface IPaymentService
{
    Task<IEnumerable<PaymentDto>> GetAllPaymentsAsync();
    Task<IEnumerable<PaymentDto>> GetPaymentsByUserAsync(int userId);
    Task<bool> RegisterPaymentAsync(PaymentDto paymentDto);
    Task<bool> UpdatePaymentStatusAsync(int paymentId, string newStatus);
}