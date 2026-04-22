using ClubApp.Application.Interfaces;
using ClubApp.Application.Dtos;

namespace ClubApp.Application.Services;

public class PaymentService : IPaymentService
{
    private static List<PaymentDto> _payments = new List<PaymentDto>();

    public async Task<IEnumerable<PaymentDto>> GetAllPaymentsAsync()
    {
        return await Task.FromResult(_payments);
    }

    public async Task<IEnumerable<PaymentDto>> GetPaymentsByUserAsync(int userId)
    {
        return await Task.FromResult(_payments.Where(p => p.User_id == userId));
    }

    public async Task<bool> RegisterPaymentAsync(PaymentDto dto)
    {
        dto.Id = _payments.Any() ? _payments.Max(p => p.Id) + 1 : 1;
        dto.PaymentDate = DateTime.Now;
        _payments.Add(dto);
        return await Task.FromResult(true);
    }
}