using System;
using ClubApp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <summary>
    /// Agrega la columna PermitirSuperposicion a la tabla Spaces.
    /// </summary>
    [DbContext(typeof(ApplicationContext))]
    [Migration("20260930100000_AddPermitirSuperposicionToSpace")]
    public partial class AddPermitirSuperposicionToSpace : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "PermitirSuperposicion",
                table: "Spaces",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PermitirSuperposicion",
                table: "Spaces");
        }
    }
}
