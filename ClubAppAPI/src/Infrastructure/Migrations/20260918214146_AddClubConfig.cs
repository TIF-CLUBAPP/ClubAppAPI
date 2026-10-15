using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddClubConfig : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "EffectiveFromDate",
                table: "FeeSettings",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsCurrent",
                table: "FeeSettings",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "ClubConfigs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    TrialEndsAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    MonthlySubscriptionFee = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    MercadoPagoAccessToken = table.Column<string>(type: "TEXT", nullable: true),
                    MercadoPagoPublicKey = table.Column<string>(type: "TEXT", nullable: true),
                    ApplicationFeePercentage = table.Column<decimal>(type: "decimal(5,2)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClubConfigs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "FeeSettingsHistory",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    PreviousBaseFeeAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PreviousLateFeePercentage = table.Column<decimal>(type: "decimal(5,2)", nullable: false),
                    PreviousDueDayOfMonth = table.Column<int>(type: "INTEGER", nullable: false),
                    NewBaseFeeAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    NewLateFeePercentage = table.Column<decimal>(type: "decimal(5,2)", nullable: false),
                    NewDueDayOfMonth = table.Column<int>(type: "INTEGER", nullable: false),
                    EffectiveFromDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    ChangedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    ChangedByUserId = table.Column<int>(type: "INTEGER", nullable: true),
                    Notes = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FeeSettingsHistory", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_FeeSettingsHistory_EffectiveFromDate",
                table: "FeeSettingsHistory",
                column: "EffectiveFromDate");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ClubConfigs");

            migrationBuilder.DropTable(
                name: "FeeSettingsHistory");

            migrationBuilder.DropColumn(
                name: "EffectiveFromDate",
                table: "FeeSettings");

            migrationBuilder.DropColumn(
                name: "IsCurrent",
                table: "FeeSettings");
        }
    }
}
