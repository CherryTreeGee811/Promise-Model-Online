using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PromiseModelOnline.Api.Migrations;

/// <inheritdoc />
public partial class UseEntitySequence : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "ProjectSequences");

        migrationBuilder.CreateTable(
            name: "EntitySequences",
            columns: table => new
            {
                ParentId = table.Column<int>(type: "int", nullable: false),
                Scope = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                NextSequenceNumber = table.Column<int>(type: "int", nullable: false, defaultValue: 1)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_EntitySequences", x => new { x.ParentId, x.Scope });
            });
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "EntitySequences");

        migrationBuilder.CreateTable(
            name: "ProjectSequences",
            columns: table => new
            {
                ProjectId = table.Column<int>(type: "int", nullable: false),
                NextSequenceNumber = table.Column<int>(type: "int", nullable: false, defaultValue: 1)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_ProjectSequences", x => x.ProjectId);
            });
    }
}
