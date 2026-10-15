using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSpaceRentalConfig : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CloseTime",
                table: "Spaces",
                type: "TEXT",
                nullable: true);

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

            migrationBuilder.AddColumn<decimal>(
                name: "PricePerHour",
                table: "Spaces",
                type: "TEXT",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "SlotDurationMinutes",
                table: "Spaces",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CloseTime",
                table: "Spaces");

            migrationBuilder.DropColumn(
                name: "Is24Hours",
                table: "Spaces");

            migrationBuilder.DropColumn(
                name: "OpenTime",
                table: "Spaces");

            migrationBuilder.DropColumn(
                name: "PricePerHour",
                table: "Spaces");

            migrationBuilder.DropColumn(
                name: "SlotDurationMinutes",
                table: "Spaces");
        }
    }
}
