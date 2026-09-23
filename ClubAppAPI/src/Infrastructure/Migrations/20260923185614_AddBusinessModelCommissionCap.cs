using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBusinessModelCommissionCap : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "MaxApplicationFeeAmount",
                table: "ClubConfigs",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 1500m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MaxApplicationFeeAmount",
                table: "ClubConfigs");
        }
    }
}
