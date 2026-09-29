using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSpacesAndConflicts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "SpaceId",
                table: "ResourceBookings",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SpaceId",
                table: "Activities",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Spaces",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    SportCategory = table.Column<string>(type: "TEXT", nullable: false),
                    Location = table.Column<string>(type: "TEXT", nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    AllowReservationsDuringClasses = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Spaces", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ResourceBookings_SpaceId",
                table: "ResourceBookings",
                column: "SpaceId");

            migrationBuilder.CreateIndex(
                name: "IX_Activities_SpaceId",
                table: "Activities",
                column: "SpaceId");

            migrationBuilder.AddForeignKey(
                name: "FK_Activities_Spaces_SpaceId",
                table: "Activities",
                column: "SpaceId",
                principalTable: "Spaces",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_ResourceBookings_Spaces_SpaceId",
                table: "ResourceBookings",
                column: "SpaceId",
                principalTable: "Spaces",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Activities_Spaces_SpaceId",
                table: "Activities");

            migrationBuilder.DropForeignKey(
                name: "FK_ResourceBookings_Spaces_SpaceId",
                table: "ResourceBookings");

            migrationBuilder.DropTable(
                name: "Spaces");

            migrationBuilder.DropIndex(
                name: "IX_ResourceBookings_SpaceId",
                table: "ResourceBookings");

            migrationBuilder.DropIndex(
                name: "IX_Activities_SpaceId",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "SpaceId",
                table: "ResourceBookings");

            migrationBuilder.DropColumn(
                name: "SpaceId",
                table: "Activities");
        }
    }
}
