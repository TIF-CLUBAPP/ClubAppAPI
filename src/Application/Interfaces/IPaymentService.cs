using System.Collections.Generic;
using System.Threading.Tasks;
using ClubApp.Domain.Entities;
using ClubApp.Application.Dtos;

namespace ClubApp.Application.Interfaces;

public interface IPaymentService
{
    Task<IEnumerable<Payment>> GetAllPaymentsAsync();
    Task<IEnumerable<Payment>> GetPaymentsByUserIdAsync(int userId);
    Task<string> CreatePaymentAsync(int loggedInUserId, string loggedInUserRole, CreatePaymentDto dto);
    Task<string> UpdateStatusAsync(int paymentId, PaymentStatus newStatus);
}