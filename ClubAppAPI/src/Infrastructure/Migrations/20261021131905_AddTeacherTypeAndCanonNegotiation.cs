using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTeacherTypeAndCanonNegotiation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "TipoProfesor",
                table: "Users",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "CanonBase",
                table: "Spaces",
                type: "TEXT",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "EstadoNegociacion",
                table: "Activities",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "FacilityCanon",
                table: "Activities",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "ProposedFacilityCanon",
                table: "Activities",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ProposedPriceMember",
                table: "Activities",
                type: "decimal(18,2)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TipoProfesor",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "CanonBase",
                table: "Spaces");

            migrationBuilder.DropColumn(
                name: "EstadoNegociacion",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "FacilityCanon",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "ProposedFacilityCanon",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "ProposedPriceMember",
                table: "Activities");
        }
    }
}
