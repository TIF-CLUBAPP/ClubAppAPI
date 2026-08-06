using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SeedActividadesFijas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Activities",
                columns: new[] { "Id", "CreatedAt", "Description", "IsActive", "MaxCapacity", "Name", "Schedule" },
                values: new object[,]
                {
                    { 1, new DateTime(2026, 6, 26, 0, 0, 0, 0, DateTimeKind.Utc), "Turnos nocturnos de fútbol amateur.", true, 10, "Fútbol 5", "Lunes y Miércoles 20:00 hs" },
                    { 2, new DateTime(2026, 6, 26, 0, 0, 0, 0, DateTimeKind.Utc), "Clases de alta intensidad y WODs.", true, 15, "Crossfit", "Martes y Jueves 19:00 hs" },
                    { 3, new DateTime(2026, 6, 26, 0, 0, 0, 0, DateTimeKind.Utc), "Ciclismo de interior sin cupos disponibles.", true, 0, "Spinning (TEST LLENO)", "Viernes 18:00 hs" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Activities",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Activities",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Activities",
                keyColumn: "Id",
                keyValue: 3);
        }
    }
}
