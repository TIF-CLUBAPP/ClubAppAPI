using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RecreacionUsuarioConHashFijo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Activities",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    Description = table.Column<string>(type: "TEXT", nullable: false),
                    MaxCapacity = table.Column<int>(type: "INTEGER", nullable: false),
                    Schedule = table.Column<string>(type: "TEXT", nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Activities", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Memberships",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    User_id = table.Column<int>(type: "INTEGER", nullable: false),
                    Status = table.Column<int>(type: "INTEGER", nullable: false),
                    StartTime = table.Column<DateTime>(type: "TEXT", nullable: false),
                    EndTime = table.Column<DateTime>(type: "TEXT", nullable: false),
                    MonthlyPrice = table.Column<decimal>(type: "TEXT", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Memberships", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    BadgeNum = table.Column<string>(type: "TEXT", nullable: false),
                    FirstName = table.Column<string>(type: "TEXT", nullable: false),
                    LastName = table.Column<string>(type: "TEXT", nullable: false),
                    Email = table.Column<string>(type: "TEXT", nullable: false),
                    PasswordHash = table.Column<string>(type: "TEXT", nullable: false),
                    Role = table.Column<int>(type: "INTEGER", nullable: false),
                    LastPaymentDate = table.Column<DateTime>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Enrollments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false),
                    ActivityId = table.Column<int>(type: "INTEGER", nullable: false),
                    EnrollmentDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Status = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Enrollments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Enrollments_Activities_ActivityId",
                        column: x => x.ActivityId,
                        principalTable: "Activities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Enrollments_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Notifications",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    User_id = table.Column<int>(type: "INTEGER", nullable: false),
                    Title = table.Column<string>(type: "TEXT", nullable: false),
                    Message = table.Column<string>(type: "TEXT", nullable: false),
                    IsRead = table.Column<bool>(type: "INTEGER", nullable: false),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notifications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Notifications_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Payments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    User_id = table.Column<int>(type: "INTEGER", nullable: false),
                    Member_id = table.Column<int>(type: "INTEGER", nullable: false),
                    Amount = table.Column<decimal>(type: "TEXT", nullable: false),
                    Method = table.Column<int>(type: "INTEGER", nullable: false),
                    Status = table.Column<int>(type: "INTEGER", nullable: false),
                    ExternalTransactionId = table.Column<string>(type: "TEXT", nullable: false),
                    PaymentDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false),
                    MembershipId = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Payments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Payments_Memberships_MembershipId",
                        column: x => x.MembershipId,
                        principalTable: "Memberships",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Payments_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "BadgeNum", "CreatedAt", "Email", "FirstName", "LastName", "LastPaymentDate", "PasswordHash", "Role" },
                values: new object[,]
                {
                    { 1, "000", new DateTime(2026, 6, 26, 0, 0, 0, 0, DateTimeKind.Utc), "superadmin1@clubapp.com", "SuperAdmin1", "Admin", null, "$2a$11$e/y6pI44H6J63P.6lZ2Yte3sQy.l51/2y/GgL2iCg.b.7kQ1W6Z7S", 2 },
                    { 2, "000", new DateTime(2026, 6, 26, 0, 0, 0, 0, DateTimeKind.Utc), "superadmin2@clubapp.com", "SuperAdmin2", "Admin", null, "$2a$11$e/y6pI44H6J63P.6lZ2Yte3sQy.l51/2y/GgL2iCg.b.7kQ1W6Z7S", 2 },
                    { 3, "000", new DateTime(2026, 6, 26, 0, 0, 0, 0, DateTimeKind.Utc), "profesor1@clubapp.com", "Profesor1", "Profe", null, "$2a$11$e/y6pI44H6J63P.6lZ2Yte3sQy.l51/2y/GgL2iCg.b.7kQ1W6Z7S", 1 },
                    { 4, "000", new DateTime(2026, 6, 26, 0, 0, 0, 0, DateTimeKind.Utc), "profesor2@clubapp.com", "Profesor2", "Profe", null, "$2a$11$e/y6pI44H6J63P.6lZ2Yte3sQy.l51/2y/GgL2iCg.b.7kQ1W6Z7S", 1 },
                    { 5, "000", new DateTime(2026, 6, 26, 0, 0, 0, 0, DateTimeKind.Utc), "profesor3@clubapp.com", "Profesor3", "Profe", null, "$2a$11$e/y6pI44H6J63P.6lZ2Yte3sQy.l51/2y/GgL2iCg.b.7kQ1W6Z7S", 1 },
                    { 6, "000", new DateTime(2026, 6, 26, 0, 0, 0, 0, DateTimeKind.Utc), "profesor4@clubapp.com", "Profesor4", "Profe", null, "$2a$11$e/y6pI44H6J63P.6lZ2Yte3sQy.l51/2y/GgL2iCg.b.7kQ1W6Z7S", 1 },
                    { 7, "000", new DateTime(2026, 6, 26, 0, 0, 0, 0, DateTimeKind.Utc), "usuario1@clubapp.com", "Usuario1", "Member", null, "$2a$11$e/y6pI44H6J63P.6lZ2Yte3sQy.l51/2y/GgL2iCg.b.7kQ1W6Z7S", 0 },
                    { 8, "000", new DateTime(2026, 6, 26, 0, 0, 0, 0, DateTimeKind.Utc), "usuario2@clubapp.com", "Usuario2", "Member", null, "$2a$11$e/y6pI44H6J63P.6lZ2Yte3sQy.l51/2y/GgL2iCg.b.7kQ1W6Z7S", 0 },
                    { 9, "000", new DateTime(2026, 6, 26, 0, 0, 0, 0, DateTimeKind.Utc), "usuario3@clubapp.com", "Usuario3", "Member", null, "$2a$11$e/y6pI44H6J63P.6lZ2Yte3sQy.l51/2y/GgL2iCg.b.7kQ1W6Z7S", 0 },
                    { 10, "000", new DateTime(2026, 6, 26, 0, 0, 0, 0, DateTimeKind.Utc), "usuario4@clubapp.com", "Usuario4", "Member", null, "$2a$11$e/y6pI44H6J63P.6lZ2Yte3sQy.l51/2y/GgL2iCg.b.7kQ1W6Z7S", 0 },
                    { 11, "000", new DateTime(2026, 6, 26, 0, 0, 0, 0, DateTimeKind.Utc), "usuario5@clubapp.com", "Usuario5", "Member", null, "$2a$11$e/y6pI44H6J63P.6lZ2Yte3sQy.l51/2y/GgL2iCg.b.7kQ1W6Z7S", 0 },
                    { 12, "000", new DateTime(2026, 6, 26, 0, 0, 0, 0, DateTimeKind.Utc), "usuario6@clubapp.com", "Usuario6", "Member", null, "$2a$11$e/y6pI44H6J63P.6lZ2Yte3sQy.l51/2y/GgL2iCg.b.7kQ1W6Z7S", 0 },
                    { 13, "000", new DateTime(2026, 6, 26, 0, 0, 0, 0, DateTimeKind.Utc), "usuario7@clubapp.com", "Usuario7", "Member", null, "$2a$11$e/y6pI44H6J63P.6lZ2Yte3sQy.l51/2y/GgL2iCg.b.7kQ1W6Z7S", 0 },
                    { 14, "000", new DateTime(2026, 6, 26, 0, 0, 0, 0, DateTimeKind.Utc), "usuario8@clubapp.com", "Usuario8", "Member", null, "$2a$11$e/y6pI44H6J63P.6lZ2Yte3sQy.l51/2y/GgL2iCg.b.7kQ1W6Z7S", 0 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Enrollments_ActivityId",
                table: "Enrollments",
                column: "ActivityId");

            migrationBuilder.CreateIndex(
                name: "IX_Enrollments_UserId",
                table: "Enrollments",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_UserId",
                table: "Notifications",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_MembershipId",
                table: "Payments",
                column: "MembershipId");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_UserId",
                table: "Payments",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Enrollments");

            migrationBuilder.DropTable(
                name: "Notifications");

            migrationBuilder.DropTable(
                name: "Payments");

            migrationBuilder.DropTable(
                name: "Activities");

            migrationBuilder.DropTable(
                name: "Memberships");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
