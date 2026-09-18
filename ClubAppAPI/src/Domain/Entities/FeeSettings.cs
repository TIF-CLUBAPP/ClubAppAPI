using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ClubApp.Domain.Entities
{
    /// <summary>
    /// Configuración vigente de cuotas. Se mantiene una única fila "actual"
    /// (<see cref="IsCurrent"/> = true) que representa la tarifa aplicable hoy.
    /// Los cambios NO sobrescriben el pasado: se archivan en <see cref="FeeSettingsHistory"/>
    /// y la nueva tarifa rige a partir de <see cref="EffectiveFromDate"/> (1° del mes siguiente).
    /// </summary>
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

        /// <summary>
        /// Fecha (UTC, primer día del mes) desde la cual esta tarifa entra en vigencia.
        /// Null = vigente desde siempre (fila inicial).
        /// </summary>
        public DateTime? EffectiveFromDate { get; set; }

        /// <summary>
        /// Marca la fila que representa la tarifa aplicable en el presente.
        /// </summary>
        public bool IsCurrent { get; set; } = true;
    }

    /// <summary>
    /// Registro histórico e inmutable de cada cambio de tarifa.
    /// Guarda la tarifa anterior, la nueva, y la fecha de vigencia de la nueva,
    /// para poder auditar la evolución de precios sin perder deudas emitidas.
    /// </summary>
    public class FeeSettingsHistory : BaseEntity
    {
        [Column(TypeName = "decimal(18,2)")]
        public decimal PreviousBaseFeeAmount { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal PreviousLateFeePercentage { get; set; }

        public int PreviousDueDayOfMonth { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal NewBaseFeeAmount { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal NewLateFeePercentage { get; set; }

        public int NewDueDayOfMonth { get; set; }

        /// <summary>Fecha (UTC, 1° del mes siguiente) desde la que aplica la nueva tarifa.</summary>
        public DateTime EffectiveFromDate { get; set; }

        /// <summary>Fecha en que se registró el cambio.</summary>
        public DateTime ChangedAt { get; set; } = DateTime.UtcNow;

        /// <summary>Usuario que realizó el cambio (si se pudo resolver del token).</summary>
        public int? ChangedByUserId { get; set; }

        [MaxLength(500)]
        public string? Notes { get; set; }
    }
}