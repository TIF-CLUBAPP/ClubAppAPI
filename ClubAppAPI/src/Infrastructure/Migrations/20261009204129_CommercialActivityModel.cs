using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class CommercialActivityModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "PaymentCollector",
                table: "Activities",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "PriceMember",
                table: "Activities",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "PriceNonMember",
                table: "Activities",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "ProfessorFacilityFeeMember",
                table: "Activities",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "ProfessorFacilityFeeNonMember",
                table: "Activities",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "ProfessorMercadoPagoAccessToken",
                table: "Activities",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProfessorMercadoPagoPublicKey",
                table: "Activities",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PaymentCollector",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "PriceMember",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "PriceNonMember",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "ProfessorFacilityFeeMember",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "ProfessorFacilityFeeNonMember",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "ProfessorMercadoPagoAccessToken",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "ProfessorMercadoPagoPublicKey",
                table: "Activities");
        }
    }
}
