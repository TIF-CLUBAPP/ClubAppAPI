using ClubApp.Domain.Entities;

namespace ClubApp.Domain.Interfaces;

public interface IMembershipRepository : IRepositoryBase<Membership>
{
    Task<bool> UpdateStatusAsync(int id, string newStatus);
}
