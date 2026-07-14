using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PromiseModelOnline.Api.Migrations;

/// <inheritdoc />
public partial class AddUserUsername : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
        => migrationBuilder.AddColumn<string>(
            name: "Username",
            table: "Users",
            type: "nvarchar(256)",
            maxLength: 256,
            nullable: true);

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
        => migrationBuilder.DropColumn(
            name: "Username",
            table: "Users");
}
