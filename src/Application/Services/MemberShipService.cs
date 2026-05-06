using ClubApp.Application.Interfaces;
using ClubApp.Application.Dtos;
using ClubApp.Domain.Entities;
using ClubApp.Domain.Interfaces;

namespace ClubApp.Application.Services
{
    public class MembershipService : IMembershipService
    {
        private readonly IMembershipRepository _membershipRepository;

        public MembershipService(IMembershipRepository membershipRepository)
        {
            _membershipRepository = membershipRepository;
        }

        public async Task<IEnumerable<MembershipDto>> GetAllMembershipsAsync()
        {
            var memberships = await _membershipRepository.GetAllAsync();
            return memberships.Select(m => new MembershipDto
            {
                Id = m.Id,
                User_id = m.User_id,
                StartTime = m.StartTime,
                EndTime = m.EndTime,
                MonthlyPrice = m.MonthlyPrice,
                Status = m.Status   // enum → enum, sin conversión
            });
        }

        public async Task<MembershipDto?> GetByUserIdAsync(int userId)
        {
            var membership = (await _membershipRepository.GetAllAsync())
                .FirstOrDefault(m => m.User_id == userId);

            if (membership == null) return null;

            return new MembershipDto
            {
                Id = membership.Id,
                User_id = membership.User_id,
                StartTime = membership.StartTime,
                EndTime = membership.EndTime,
                MonthlyPrice = membership.MonthlyPrice,
                Status = membership.Status
            };
        }

        public async Task<bool> CreateMembershipAsync(MembershipDto dto)
        {
            var newMembership = new Membership
            {
                User_id = dto.User_id,
                StartTime = DateTime.Now,
                EndTime = DateTime.Now.AddMonths(1),
                MonthlyPrice = dto.MonthlyPrice,
                Status = MembershipStatus.ACTIVE
            };

            await _membershipRepository.AddAsync(newMembership);
            return true;
        }

        public async Task<bool> UpdateStatusAsync(int id, MembershipStatus newStatus)
        {
            var membership = await _membershipRepository.GetByIdAsync(id);
            if (membership == null) return false;

            membership.Status = newStatus;
            await _membershipRepository.UpdateAsync(membership);
            return true;
        }
    }
}
