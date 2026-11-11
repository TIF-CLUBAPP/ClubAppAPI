using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAttendanceStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Present",
                table: "AttendanceRecords",
                newName: "Status");

            // Reasigna los valores booleanos históricos al nuevo enum:
            //  · Antes: 0 = Ausente (false), 1 = Presente (true).
            //  · Ahora: 0 = PRESENT, 1 = ABSENT, 2 = JUSTIFIED.
            // Por lo tanto: 1 -> 0 (PRESENT) y 0 -> 1 (ABSENT).
            migrationBuilder.Sql(
                "UPDATE \"AttendanceRecords\" SET \"Status\" = CASE WHEN \"Status\" = 1 THEN 0 ELSE 1 END;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Revierte el enum al booleano histórico: 0 (PRESENT) -> 1 (true) y el resto -> 0 (false).
            migrationBuilder.Sql(
                "UPDATE \"AttendanceRecords\" SET \"Status\" = CASE WHEN \"Status\" = 0 THEN 1 ELSE 0 END;");

            migrationBuilder.RenameColumn(
                name: "Status",
                table: "AttendanceRecords",
                newName: "Present");
        }
    }
}
