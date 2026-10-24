using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCanonMemberDiscount : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "AplicaDescuentoSocios",
                table: "Spaces",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<decimal>(
                name: "DescuentoMaximoCanon",
                table: "Spaces",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TipoDescuentoCanon",
                table: "Spaces",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "ValorDescuentoPorSocio",
                table: "Spaces",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<bool>(
                name: "AplicaDescuentoSocios",
                table: "Activities",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<decimal>(
                name: "DescuentoMaximoCanon",
                table: "Activities",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TipoDescuentoCanon",
                table: "Activities",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "ValorDescuentoPorSocio",
                table: "Activities",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AplicaDescuentoSocios",
                table: "Spaces");

            migrationBuilder.DropColumn(
                name: "DescuentoMaximoCanon",
                table: "Spaces");

            migrationBuilder.DropColumn(
                name: "TipoDescuentoCanon",
                table: "Spaces");

            migrationBuilder.DropColumn(
                name: "ValorDescuentoPorSocio",
                table: "Spaces");

            migrationBuilder.DropColumn(
                name: "AplicaDescuentoSocios",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "DescuentoMaximoCanon",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "TipoDescuentoCanon",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "ValorDescuentoPorSocio",
                table: "Activities");
        }
    }
}
