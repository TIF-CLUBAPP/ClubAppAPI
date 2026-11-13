using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddInvitedAtToActivityInstructor : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // SQLite no admite DEFAULT no constante en ALTER TABLE ADD COLUMN,
            // por lo que se agrega como nullable y luego se rellena con la fecha actual.
            migrationBuilder.AddColumn<DateTime>(
                name: "InvitedAt",
                table: "ActivityInstructors",
                type: "TEXT",
                nullable: true);

            // Las invitaciones pendientes preexistentes reciben una ventana de 3 días nueva.
            migrationBuilder.Sql(
                "UPDATE \"ActivityInstructors\" SET \"InvitedAt\" = datetime('now') " +
                "WHERE \"InvitedAt\" IS NULL AND \"Status\" = 0;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "InvitedAt",
                table: "ActivityInstructors");
        }
    }
}
