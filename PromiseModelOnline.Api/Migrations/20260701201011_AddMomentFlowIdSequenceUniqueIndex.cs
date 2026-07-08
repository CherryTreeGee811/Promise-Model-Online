using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PromiseModelOnline.Api.Migrations;

/// <inheritdoc />
public partial class AddMomentFlowIdSequenceUniqueIndex : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_Moments_FlowId",
            table: "Moments");

        migrationBuilder.CreateIndex(
            name: "IX_Moments_FlowId_SequenceNumber",
            table: "Moments",
            columns: new[] { "FlowId", "SequenceNumber" },
            unique: true);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_Moments_FlowId_SequenceNumber",
            table: "Moments");

        migrationBuilder.CreateIndex(
            name: "IX_Moments_FlowId",
            table: "Moments",
            column: "FlowId");
    }
}
