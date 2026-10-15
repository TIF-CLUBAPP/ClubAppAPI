using ClubApp.Domain.Entities;
using ClubApp.Domain.Interfaces;
using ClubApp.Infrastructure.Data; 
using Microsoft.EntityFrameworkCore;
using System;

namespace ClubApp.Infrastructure.Data
{
    public class MembershipRepository : RepositoryBase<Membership>, IMembershipRepository
    {
        public MembershipRepository(ApplicationContext context) : base(context)
        {
        }

        public async Task<bool> UpdateStatusAsync(int id, string newStatus)
        {
            var membership = await _context.Memberships.FirstOrDefaultAsync(m => m.Id == id);
            if (membership == null) return false;

            membership.Status = (MembershipStatus)Enum.Parse(typeof(MembershipStatus), newStatus, true);
            
            _context.Memberships.Update(membership);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}