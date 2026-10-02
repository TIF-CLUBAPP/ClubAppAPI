using ClubApp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <summary>
    /// Agrega la configuración de alquiler privado al modelo Space:
    /// precio por turno, duración del turno, disponibilidad 24hs y rango horario.
    /// </summary>
    [DbContext(typeof(ApplicationContext))]
    [Migration("20261001120000_AddSpaceRentalConfig")]
    public partial class AddSpaceRentalConfig : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "PricePerHour",
                table: "Spaces",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "SlotDurationMinutes",
                table: "Spaces",
                type: "INTEGER",
                nullable: false,
                defaultValue: 60);

            migrationBuilder.AddColumn<bool>(
                name: "Is24Hours",
                table: "Spaces",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "OpenTime",
                table: "Spaces",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CloseTime",
                table: "Spaces",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PricePerHour",
                table: "Spaces");

            migrationBuilder.DropColumn(
                name: "SlotDurationMinutes",
                table: "Spaces");

            migrationBuilder.DropColumn(
                name: "Is24Hours",
                table: "Spaces");

            migrationBuilder.DropColumn(
                name: "OpenTime",
                table: "Spaces");

            migrationBuilder.DropColumn(
                name: "CloseTime",
                table: "Spaces");
        }
    }
}
