using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ClubApp.Domain.Entities
{
    public enum PaymentStatus 
    { 
        Pending, 
        Paid, 
        Overdue, 
        Exempt,
        Cancelled
    }

    /// <summary>
    /// Distingue el origen/concepto de una obligacion de pago para que las cuotas de
    /// actividades convivan con la cuota social en el mismo circuito financiero.
    /// </summary>
    public enum CuotaConcepto
    {
        /// <summary>Cuota social / membresia mensual.</summary>
        CuotaSocial = 0,

        /// <summary>Cuota de una actividad (inscripcion mensual).</summary>
        Actividad = 1
    }

    public class Payment : BaseEntity
    {
        [Required]
        public int UserId { get; set; }

        [Required]
        [MaxLength(20)] // Formato "MM/YYYY" o "Mes Año"
        public string Period { get; set; } = string.Empty;

        /// <summary>
        /// Concepto de la obligacion: cuota social vs cuota de actividad.
        /// Permite discriminar ambos origenes en un unico listado de cuotas.
        /// </summary>
        public CuotaConcepto Concepto { get; set; } = CuotaConcepto.CuotaSocial;

        /// <summary>Actividad asociada (solo cuando Concepto == Actividad). Null para cuota social.</summary>
        public int? ActivityId { get; set; }
        public virtual Activity? Activity { get; set; }

        /// <summary>Nombre de la actividad (denormalizado para listados/comprobantes sin join).</summary>
        [MaxLength(120)]
        public string? ActivityName { get; set; }

        /// <summary>
        /// Fecha de vencimiento propia de la cuota de actividad (calculada con el
        /// DiaVencimiento de la actividad). Null para la cuota social.
        /// </summary>
        public DateTime? DueDate { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal LateFeeApplied { get; set; } = 0m;

        [Column(TypeName = "decimal(18,2)")]
        public decimal MarketplaceFee { get; set; } = 0m;

        public DateTime? PaymentDate { get; set; }

        [Required]
        public PaymentStatus Status { get; set; } = PaymentStatus.Pending;

        [MaxLength(50)]
        public string PaymentMethod { get; set; } = string.Empty; // Efectivo, Transferencia, MercadoPago, etc.

        [MaxLength(100)]
        public string? TransferReference { get; set; } // Nro. de operación / comprobante de transferencia

        [MaxLength(255)]
        public string? ReceiptUrl { get; set; } // URL/ruta del archivo de comprobante adjunto

        // Navegaci�n
        public virtual User User { get; set; } = null!;
    }
}
