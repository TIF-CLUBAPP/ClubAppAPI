using System.Collections.Generic;
using System.Threading.Tasks;
using ClubApp.Domain.Entities;
using ClubApp.Application.Dtos;

namespace ClubApp.Application.Interfaces;

public interface IPaymentService
{
    Task<IEnumerable<Payment>> GetAllPaymentsAsync();
    Task<Payment?> GetByIdAsync(int id);
    Task<IEnumerable<Payment>> GetPaymentsByUserIdAsync(int userId);
    Task<Payment> CreatePaymentAsync(int loggedInUserId, string userRole, CreatePaymentDto dto); 
    Task<string> UpdateStatusAsync(int paymentId, PaymentStatus status);
}