using ClubApp.Domain.Entities;

namespace ClubApp.Application.Dtos
{
    public class MembershipDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public MembershipStatus Status { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public decimal MonthlyPrice { get; set; }
    }

    /// <summary>
    /// Resumen de la membresía vigente del usuario autenticado (GET /api/memberships/me).
    /// El frontend lo usa para sincronizar el estado "Socio activo / pendiente / no socio".
    /// </summary>
    public class MyMembershipDto
    {
        public int MembershipId { get; set; }

        /// <summary>Estado de la membresía en texto (ACTIVE, INACTIVE, CANCELLED, EXPIRED, ...).</summary>
        public string Status { get; set; } = string.Empty;

        public string MembershipType { get; set; } = string.Empty;

        public decimal MonthlyPrice { get; set; }

        /// <summary>true => el usuario es Socio activo (membresía ACTIVA).</summary>
        public bool IsSocio { get; set; }

        /// <summary>Fecha de vencimiento del período vigente (null si no aplica).</summary>
        public DateTime? NextDueDate { get; set; }
    }
}
