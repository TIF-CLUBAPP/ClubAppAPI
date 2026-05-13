using ClubApp.Application.Interfaces;
using ClubApp.Domain.Entities;
using ClubApp.Domain.Interfaces;
using ClubApp.Infrastructure.Data.Migrations;
using Infrastructure.Data;

namespace ClubApp.Infrastructure.Data;

public class PaymentRepository : RepositoryBase<Payment>, IPaymentRepository 
{
    public PaymentRepository(ApplicationContext context) : base(context)
    {
        
    }
}
