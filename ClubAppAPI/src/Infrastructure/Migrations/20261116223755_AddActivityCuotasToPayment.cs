using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddActivityCuotasToPayment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Payments_UserId_Period",
                table: "Payments");

            migrationBuilder.AddColumn<int>(
                name: "ActivityId",
                table: "Payments",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ActivityName",
                table: "Payments",
                type: "TEXT",
                maxLength: 120,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Concepto",
                table: "Payments",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "DueDate",
                table: "Payments",
                type: "TEXT",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Payments_ActivityId",
                table: "Payments",
                column: "ActivityId");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_UserId_Period_Concepto_ActivityId",
                table: "Payments",
                columns: new[] { "UserId", "Period", "Concepto", "ActivityId" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Payments_Activities_ActivityId",
                table: "Payments",
                column: "ActivityId",
                principalTable: "Activities",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Payments_Activities_ActivityId",
                table: "Payments");

            migrationBuilder.DropIndex(
                name: "IX_Payments_ActivityId",
                table: "Payments");

            migrationBuilder.DropIndex(
                name: "IX_Payments_UserId_Period_Concepto_ActivityId",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "ActivityId",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "ActivityName",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "Concepto",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "DueDate",
                table: "Payments");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_UserId_Period",
                table: "Payments",
                columns: new[] { "UserId", "Period" },
                unique: true);
        }
    }
}
