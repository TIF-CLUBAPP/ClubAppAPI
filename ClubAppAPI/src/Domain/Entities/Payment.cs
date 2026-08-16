using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ClubApp.Domain.Entities
{
    public enum PaymentStatus 
    { 
        Pending, 
        Paid, 
        Overdue, 
        Exempt 
    }

    public class Payment : BaseEntity
    {
        [Required]
        public int UserId { get; set; }

        [Required]
        [MaxLength(20)] // Formato "MM/YYYY" o "Mes Año"
        public string Period { get; set; } = string.Empty;

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal LateFeeApplied { get; set; } = 0m;

        public DateTime? PaymentDate { get; set; }

        [Required]
        public PaymentStatus Status { get; set; } = PaymentStatus.Pending;

        [MaxLength(50)]
        public string PaymentMethod { get; set; } = string.Empty; // Efectivo, Transferencia, MercadoPago, etc.

        // Navegaci�n
        public virtual User User { get; set; } = null!;
    }
}
