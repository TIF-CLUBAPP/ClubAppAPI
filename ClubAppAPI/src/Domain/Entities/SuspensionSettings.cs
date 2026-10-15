using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ClubApp.Domain.Entities
{
    /// <summary>
    /// Configuración de corte de servicio / suspensión de socio por mora.
    /// Se mantiene una única fila. Los cambios NO son retroactivos: quedan como
    /// "pendientes" y comienzan a regir a partir del 1° del mes siguiente
    /// (<see cref="EffectiveFromDate"/>), igual que <see cref="RoleFeeExemption"/>.
    /// </summary>
    public class SuspensionSettings : BaseEntity
    {
        /// <summary>Meses de mora permitidos (regla vigente hoy). Ej: 2.</summary>
        public int MaxOverdueMonths { get; set; } = 2;

        /// <summary>Monto máximo de deuda permitido (regla vigente hoy). Ej: $10.000.</summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal MaxOverdueAmount { get; set; } = 10000m;

        /// <summary>
        /// Condición de suspensión vigente: "OR" (superar meses O monto) o "AND" (superar ambos).
        /// </summary>
        [MaxLength(10)]
        public string SuspensionCondition { get; set; } = "OR";

        /// <summary>Meses de mora pendientes. Aplicarán desde <see cref="EffectiveFromDate"/>. Null = sin cambio pendiente.</summary>
        public int? PendingMaxOverdueMonths { get; set; }

        /// <summary>Monto máximo de deuda pendiente. Null = sin cambio pendiente.</summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal? PendingMaxOverdueAmount { get; set; }

        /// <summary>Condición de suspensión pendiente ("OR"/"AND"). Null = sin cambio pendiente.</summary>
        [MaxLength(10)]
        public string? PendingSuspensionCondition { get; set; }

        /// <summary>Fecha (UTC, 1° del mes siguiente) desde la que rige la regla pendiente.</summary>
        public DateTime? EffectiveFromDate { get; set; }

        /// <summary>Fecha de la última modificación.</summary>
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
