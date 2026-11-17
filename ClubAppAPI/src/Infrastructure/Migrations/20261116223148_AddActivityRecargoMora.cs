using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddActivityRecargoMora : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DiaVencimiento",
                table: "Activities",
                type: "INTEGER",
                nullable: false,
                defaultValue: 10);

            migrationBuilder.AddColumn<decimal>(
                name: "RecargoMoraNoSocio",
                table: "Activities",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "RecargoMoraSocio",
                table: "Activities",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "TipoRecargoMora",
                table: "Activities",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DiaVencimiento",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "RecargoMoraNoSocio",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "RecargoMoraSocio",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "TipoRecargoMora",
                table: "Activities");
        }
    }
}
