using ClubApp.Application.Interfaces;
using ClubApp.Application.Dtos;
using ClubApp.Domain.Entities;
using ClubApp.Domain.Interfaces;
using ClubApp.Domain.Exceptions; 

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
                Status = m.Status
            }).ToList();
        }

        public async Task<MembershipDto> GetByUserIdAsync(int userId)
        {
            var membership = (await _membershipRepository.GetAllAsync())
                .FirstOrDefault(m => m.User_id == userId);

            // REGLA: Si el usuario no tiene membresia, cortamos el flujo con 404
            if (membership == null)
            {
                throw new NotFoundException("Membership for User ID", userId);
            }

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
            // Regla de validacion: El precio mensual no puede ser negativo
            if (dto.MonthlyPrice < 0)
            {
                throw new AppValidationException("El precio mensual de la membresía no puede ser un valor negativo.");
            }

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
            
            // REGLA: Si la membresia no existe en el sistema, lanzamos 404
            if (membership == null)
            {
                throw new NotFoundException("Membership", id);
            }

            membership.Status = newStatus;
            await _membershipRepository.UpdateAsync(membership);
            return true;
        }

        // Caso de uso automatico: Verificar Expiración
        public async Task<bool> CheckExpirationAsync(int id)
        {
            var membership = await _membershipRepository.GetByIdAsync(id);
            if (membership == null)
            {
                throw new NotFoundException("Membership", id);
            }
            // Si ya esta expirada, no hace falta procesarla de nuevo
            if (membership.Status == MembershipStatus.EXPIRED)
            {
                throw new AppValidationException("La membresía seleccionada ya se encuentra en estado EXPIRADO.");
            }
            if (DateTime.Now > membership.EndTime)
            {
                membership.Status = MembershipStatus.EXPIRED;
                await _membershipRepository.UpdateAsync(membership);
                return true;
            }

            return false;
        }
    }
}