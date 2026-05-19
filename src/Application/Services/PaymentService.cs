using ClubApp.Application.Interfaces;
using ClubApp.Application.Dtos;
using ClubApp.Domain.Entities;
using ClubApp.Domain.Interfaces;
using ClubApp.Domain.Exceptions; 

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
            }).ToList();
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
            }).ToList();
        }

        public async Task<bool> RegisterPaymentAsync(PaymentDto dto)
        {
            // REGLA DE NEGOCIO: El monto no puede ser menor o igual a cero
            if (dto.Amount <= 0)
            {
                throw new AppValidationException("El monto del pago debe ser mayor a cero.");
            }

            var newPayment = new Payment
            {
                User_id = dto.User_id,
                Member_id = dto.Member_id,
                Amount = dto.Amount,
                // Mapeamos de string a tus enums reales usando Enum.TryParse
                Method = Enum.TryParse<PaymentMethod>(dto.Method, true, out var method) ? method : PaymentMethod.CASH,
                Status = Enum.TryParse<PaymentStatus>(dto.Status, true, out var status) ? status : PaymentStatus.PENDING,
                ExternalTransactionId = dto.ExternalTransactionId ?? string.Empty,
                PaymentDate = DateTime.Now
            };

            await _paymentRepository.AddAsync(newPayment);
            return true;
        }

        // Usamos PaymentStatus como parámetro tal cual lo pide tu interfaz IPaymentService
        public async Task<bool> UpdatePaymentStatusAsync(int paymentId, PaymentStatus newStatus)
        {
            var payment = await _paymentRepository.GetByIdAsync(paymentId);
            
            // REGLA: Si el pago no existe en la BD, disparamos tu excepción custom 404
            if (payment == null)
            {
                throw new NotFoundException("Payment", paymentId);
            }

            // REGLA DE NEGOCIO: Si el pago ya fue completado con exito, bloqueamos modificaciones físicas
            if (payment.Status == PaymentStatus.COMPLETED)
            {
                throw new AppValidationException("No se puede modificar el estado de un pago que ya se encuentra COMPLETADO.");
            }

            payment.Status = newStatus;
            await _paymentRepository.UpdateAsync(payment);
            return true;
        }
    }
}