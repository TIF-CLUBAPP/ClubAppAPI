using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ClubApp.Domain.Entities
{
    /// <summary>
    /// Política de exención de cuota por rol, expresada como porcentaje de descuento (0-100).
    /// Sigue la misma lógica que <see cref="FeeSettings"/>: los cambios NO son retroactivos.
    /// La nueva exención queda "pendiente" y comienza a aplicarse únicamente a partir del
    /// 1° del mes siguiente (siguiente ciclo de facturación).
    /// </summary>
    public class RoleFeeExemption : BaseEntity
    {
        [Required]
        [MaxLength(50)]
        public string RoleName { get; set; } = string.Empty;

        /// <summary>Porcentaje de exención VIGENTE hoy (0-100). 100 = exento total.</summary>
        [Required]
        [Column(TypeName = "decimal(5,2)")]
        public decimal DiscountPercentage { get; set; } = 0m;

        /// <summary>
        /// Porcentaje de exención PENDIENTE. Aplicará desde <see cref="EffectiveFromDate"/>.
        /// Null = sin cambio pendiente.
        /// </summary>
        [Column(TypeName = "decimal(5,2)")]
        public decimal? PendingDiscountPercentage { get; set; }

        /// <summary>
        /// Fecha (UTC, 1° del mes siguiente) desde la que regirá el porcentaje pendiente.
        /// Null = sin cambio pendiente.
        /// </summary>
        public DateTime? EffectiveFromDate { get; set; }

        /// <summary>Fecha de la última modificación.</summary>
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
