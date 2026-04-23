using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PromiseModelOnline.Api.Migrations
{
    /// <inheritdoc />
    public partial class MomentTasks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MomentTask",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    MomentId = table.Column<int>(type: "int", nullable: false),
                    OwnerId = table.Column<int>(type: "int", nullable: true),
                    IsCompleted = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MomentTask", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MomentTask_Moments_MomentId",
                        column: x => x.MomentId,
                        principalTable: "Moments",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_MomentTask_Users_OwnerId",
                        column: x => x.OwnerId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_MomentTask_MomentId",
                table: "MomentTask",
                column: "MomentId");

            migrationBuilder.CreateIndex(
                name: "IX_MomentTask_OwnerId",
                table: "MomentTask",
                column: "OwnerId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MomentTask");
        }
    }
}
