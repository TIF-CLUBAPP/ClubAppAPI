using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ClubApp.Domain.Entities
{
    public class ClubConfig : BaseEntity
    {
        public DateTime TrialEndsAt { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal MonthlySubscriptionFee { get; set; }

        public string? MercadoPagoAccessToken { get; set; }

        public string? MercadoPagoPublicKey { get; set; }

        /// <summary>Identificador de la cuenta de Mercado Pago vinculada a la Institución.</summary>
        public string? MercadoPagoUserId { get; set; }

        /// <summary>Alias / CBU / CVU de la cuenta bancaria que recibe las transferencias del Club.</summary>
        public string? BankAlias { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal ApplicationFeePercentage { get; set; } = 3.5m;

        [Column(TypeName = "decimal(18,2)")]
        public decimal MaxApplicationFeeAmount { get; set; } = 1500m;
    }
}
