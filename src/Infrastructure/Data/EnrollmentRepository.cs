using ClubApp.Domain.Entities;
using ClubApp.Domain.Interfaces;
using ClubApp.Infrastructure.Data.Migrations;
using Infrastructure.Data;

namespace ClubApp.Infrastructure.Data;

public class EnrollmentRepository : RepositoryBase<Enrollment>, IEnrollmentRepository
{
    public EnrollmentRepository(ApplicationContext context) : base(context)
    {
        
    }
}