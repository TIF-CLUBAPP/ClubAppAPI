using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ClubApp.Domain.Entities
{
    public class RoleConfiguration : BaseEntity
    {
        [Required]
        public UserRole Role { get; set; }

        [Required]
        public bool AreFeesExempt { get; set; } = false; // Si true, los usuarios con este rol no generan cuotas

        [MaxLength(500)]
        public string? Description { get; set; }
    }
}