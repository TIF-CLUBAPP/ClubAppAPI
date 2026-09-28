using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPayoutConfig : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "AllowsDirectPayment",
                table: "Users",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "BankAlias",
                table: "Users",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MercadoPagoAccessToken",
                table: "Users",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MercadoPagoUserId",
                table: "Users",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BankAlias",
                table: "ClubConfigs",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MercadoPagoUserId",
                table: "ClubConfigs",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AllowsDirectPayment",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "BankAlias",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "MercadoPagoAccessToken",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "MercadoPagoUserId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "BankAlias",
                table: "ClubConfigs");

            migrationBuilder.DropColumn(
                name: "MercadoPagoUserId",
                table: "ClubConfigs");
        }
    }
}
