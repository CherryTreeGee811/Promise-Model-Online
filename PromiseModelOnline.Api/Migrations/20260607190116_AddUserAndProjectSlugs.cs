using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PromiseModelOnline.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddUserAndProjectSlugs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add Slug as nullable first (existing rows have no slug)
            migrationBuilder.AddColumn<string>(
                name: "Slug",
                table: "Users",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            // Add Slug column to Projects as nullable
            migrationBuilder.AddColumn<string>(
                name: "Slug",
                table: "Projects",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            // Backfill User slugs with unique values using the primary key
            migrationBuilder.Sql("UPDATE [Users] SET [Slug] = LOWER(CONCAT('user-', [Id])) WHERE [Slug] IS NULL");

            // Backfill Project slugs with unique values using the primary key
            migrationBuilder.Sql("UPDATE [Projects] SET [Slug] = LOWER(CONCAT('project-', [Id])) WHERE [Slug] IS NULL");

            // Make Slug non-nullable now that all rows have values
            migrationBuilder.AlterColumn<string>(
                name: "Slug",
                table: "Users",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AlterColumn<string>(
                name: "Slug",
                table: "Projects",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            // Drop old index on Projects.OwnerId (no longer needed with composite index)
            migrationBuilder.DropIndex(
                name: "IX_Projects_OwnerId",
                table: "Projects");

            // Create new unique indexes
            migrationBuilder.CreateIndex(
                name: "IX_Users_Slug",
                table: "Users",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Projects_OwnerId_Slug",
                table: "Projects",
                columns: new[] { "OwnerId", "Slug" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Users_Slug",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Projects_OwnerId_Slug",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "Slug",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Slug",
                table: "Projects");

            migrationBuilder.CreateIndex(
                name: "IX_Projects_OwnerId",
                table: "Projects",
                column: "OwnerId");
        }
    }
}
