using ClubApp.Application.Interfaces;
using ClubApp.Application.Dtos;
using ClubApp.Domain.Entities;
using ClubApp.Domain.Interfaces;

namespace ClubApp.Application.Services
{
    public class PaymentService : IPaymentService
    {
        private readonly IPaymentRepository _paymentRepository;

        public PaymentService(IPaymentRepository paymentRepository)
        {
            _paymentRepository = paymentRepository;
        }

        public async Task<IEnumerable<PaymentDto>> GetAllPaymentsAsync()
        {
            var payments = await _paymentRepository.GetAllAsync();
            return payments.Select(p => new PaymentDto
            {
                Id = p.Id,
                User_id = p.User_id,
                Member_id = p.Member_id,
                Amount = p.Amount,
                Method = p.Method.ToString(),
                Status = p.Status.ToString(),
                PaymentDate = p.PaymentDate,
                ExternalTransactionId = p.ExternalTransactionId
            });
        }

        public async Task<IEnumerable<PaymentDto>> GetPaymentsByUserAsync(int userId)
        {
            var payments = (await _paymentRepository.GetAllAsync())
                .Where(p => p.User_id == userId);

            return payments.Select(p => new PaymentDto
            {
                Id = p.Id,
                User_id = p.User_id,
                Member_id = p.Member_id,
                Amount = p.Amount,
                Method = p.Method.ToString(),
                Status = p.Status.ToString(),
                PaymentDate = p.PaymentDate,
                ExternalTransactionId = p.ExternalTransactionId
            });
        }

        public async Task<bool> RegisterPaymentAsync(PaymentDto dto)
        {
            var newPayment = new Payment
            {
                User_id = dto.User_id,
                Member_id = dto.Member_id,
                Amount = dto.Amount,
                Method = Enum.TryParse<PaymentMethod>(dto.Method, true, out var method) ? method : PaymentMethod.CASH,
                Status = Enum.TryParse<PaymentStatus>(dto.Status, true, out var status) ? status : PaymentStatus.PENDING,
                ExternalTransactionId = dto.ExternalTransactionId ?? string.Empty,
                PaymentDate = DateTime.Now
            };

            await _paymentRepository.AddAsync(newPayment);
            return true;
        }

        public async Task<bool> UpdatePaymentStatusAsync(int paymentId, PaymentStatus newStatus)
        {
            var payment = await _paymentRepository.GetByIdAsync(paymentId);
            if (payment == null) return false;

            payment.Status = newStatus;
            await _paymentRepository.UpdateAsync(payment);
            return true;
        }
    }
}
