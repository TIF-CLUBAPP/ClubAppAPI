using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSuspensionSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SuspensionSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    MaxOverdueMonths = table.Column<int>(type: "INTEGER", nullable: false),
                    MaxOverdueAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    SuspensionCondition = table.Column<string>(type: "TEXT", maxLength: 10, nullable: false),
                    PendingMaxOverdueMonths = table.Column<int>(type: "INTEGER", nullable: true),
                    PendingMaxOverdueAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    PendingSuspensionCondition = table.Column<string>(type: "TEXT", maxLength: 10, nullable: true),
                    EffectiveFromDate = table.Column<DateTime>(type: "TEXT", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SuspensionSettings", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SuspensionSettings");
        }
    }
}
