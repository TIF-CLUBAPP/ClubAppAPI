using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ClubApp.Domain.Entities
{
    public class FeeSettings : BaseEntity
    {
        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal BaseFeeAmount { get; set; } = 0m;

        [Required]
        [Column(TypeName = "decimal(5,2)")]
        public decimal LateFeePercentage { get; set; } = 10m; // Porcentaje de recargo por mora (ej. 10%)

        [Required]
        [Range(1, 28)]
        public int DueDayOfMonth { get; set; } = 10; // Día de vencimiento mensual (1-28)
    }
}