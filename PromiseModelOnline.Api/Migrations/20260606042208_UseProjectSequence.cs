using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PromiseModelOnline.Api.Migrations
{
    /// <inheritdoc />
    public partial class UseProjectSequence : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Moments_FlowId_SequenceNumber",
                table: "Moments");

            migrationBuilder.DropIndex(
                name: "IX_Journeys_EpicId_SequenceNumber",
                table: "Journeys");

            migrationBuilder.DropIndex(
                name: "IX_Flows_JourneyId_SequenceNumber",
                table: "Flows");

            migrationBuilder.DropIndex(
                name: "IX_Epics_ProductPromiseId_SequenceNumber",
                table: "Epics");

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

            migrationBuilder.Sql(@"
                INSERT INTO ProjectSequences (ProjectId, NextSequenceNumber)
                SELECT ProjectId, MAX(m) + 1
                FROM (
                    SELECT ProjectId, MAX(SequenceNumber) AS m FROM Promises GROUP BY ProjectId
                    UNION ALL
                    SELECT pr.ProjectId, MAX(e.SequenceNumber)
                    FROM Epics e
                    INNER JOIN Promises pr ON pr.Id = e.ProductPromiseId
                    GROUP BY pr.ProjectId
                    UNION ALL
                    SELECT pr.ProjectId, MAX(j.SequenceNumber)
                    FROM Journeys j
                    INNER JOIN Epics e ON e.Id = j.EpicId
                    INNER JOIN Promises pr ON pr.Id = e.ProductPromiseId
                    GROUP BY pr.ProjectId
                    UNION ALL
                    SELECT pr.ProjectId, MAX(f.SequenceNumber)
                    FROM Flows f
                    INNER JOIN Journeys j ON j.Id = f.JourneyId
                    INNER JOIN Epics e ON e.Id = j.EpicId
                    INNER JOIN Promises pr ON pr.Id = e.ProductPromiseId
                    GROUP BY pr.ProjectId
                    UNION ALL
                    SELECT pr.ProjectId, MAX(m.SequenceNumber)
                    FROM Moments m
                    INNER JOIN Flows f ON f.Id = m.FlowId
                    INNER JOIN Journeys j ON j.Id = f.JourneyId
                    INNER JOIN Epics e ON e.Id = j.EpicId
                    INNER JOIN Promises pr ON pr.Id = e.ProductPromiseId
                    GROUP BY pr.ProjectId
                ) src
                GROUP BY ProjectId
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Epics_ProductPromiseId_SequenceNumber",
                table: "Epics",
                columns: new[] { "ProductPromiseId", "SequenceNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Flows_JourneyId_SequenceNumber",
                table: "Flows",
                columns: new[] { "JourneyId", "SequenceNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Journeys_EpicId_SequenceNumber",
                table: "Journeys",
                columns: new[] { "EpicId", "SequenceNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Moments_FlowId_SequenceNumber",
                table: "Moments",
                columns: new[] { "FlowId", "SequenceNumber" },
                unique: true);

            migrationBuilder.DropTable(
                name: "ProjectSequences");
        }
    }
}
