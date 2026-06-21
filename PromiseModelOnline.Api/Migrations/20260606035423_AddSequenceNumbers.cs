using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PromiseModelOnline.Api.Migrations;

/// <inheritdoc />
public partial class AddSequenceNumbers : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<int>(
            name: "SequenceNumber",
            table: "Promises",
            type: "int",
            nullable: false,
            defaultValue: 0);

        migrationBuilder.AddColumn<int>(
            name: "SequenceNumber",
            table: "Moments",
            type: "int",
            nullable: false,
            defaultValue: 0);

        migrationBuilder.AddColumn<int>(
            name: "SequenceNumber",
            table: "Journeys",
            type: "int",
            nullable: false,
            defaultValue: 0);

        migrationBuilder.AddColumn<int>(
            name: "SequenceNumber",
            table: "Flows",
            type: "int",
            nullable: false,
            defaultValue: 0);

        migrationBuilder.AddColumn<int>(
            name: "SequenceNumber",
            table: "Epics",
            type: "int",
            nullable: false,
            defaultValue: 0);

        migrationBuilder.Sql(@"
                WITH numbered AS (
                    SELECT Id, ProjectId,
                           ROW_NUMBER() OVER (PARTITION BY ProjectId ORDER BY Id) AS rn
                    FROM Promises
                )
                UPDATE p SET SequenceNumber = numbered.rn
                FROM Promises p
                INNER JOIN numbered ON p.Id = numbered.Id
            ");
        migrationBuilder.Sql(@"
                WITH numbered AS (
                    SELECT Id, ProductPromiseId,
                           ROW_NUMBER() OVER (PARTITION BY ProductPromiseId ORDER BY Id) AS rn
                    FROM Epics
                )
                UPDATE e SET SequenceNumber = numbered.rn
                FROM Epics e
                INNER JOIN numbered ON e.Id = numbered.Id
            ");
        migrationBuilder.Sql(@"
                WITH numbered AS (
                    SELECT Id, EpicId,
                           ROW_NUMBER() OVER (PARTITION BY EpicId ORDER BY Id) AS rn
                    FROM Journeys
                )
                UPDATE j SET SequenceNumber = numbered.rn
                FROM Journeys j
                INNER JOIN numbered ON j.Id = numbered.Id
            ");
        migrationBuilder.Sql(@"
                WITH numbered AS (
                    SELECT Id, JourneyId,
                           ROW_NUMBER() OVER (PARTITION BY JourneyId ORDER BY Id) AS rn
                    FROM Flows
                )
                UPDATE f SET SequenceNumber = numbered.rn
                FROM Flows f
                INNER JOIN numbered ON f.Id = numbered.Id
            ");
        migrationBuilder.Sql(@"
                WITH numbered AS (
                    SELECT Id, FlowId,
                           ROW_NUMBER() OVER (PARTITION BY FlowId ORDER BY Id) AS rn
                    FROM Moments
                )
                UPDATE m SET SequenceNumber = numbered.rn
                FROM Moments m
                INNER JOIN numbered ON m.Id = numbered.Id
            ");

        migrationBuilder.CreateIndex(
            name: "IX_Promises_ProjectId_SequenceNumber",
            table: "Promises",
            columns: new[] { "ProjectId", "SequenceNumber" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_Epics_ProductPromiseId_SequenceNumber",
            table: "Epics",
            columns: new[] { "ProductPromiseId", "SequenceNumber" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_Journeys_EpicId_SequenceNumber",
            table: "Journeys",
            columns: new[] { "EpicId", "SequenceNumber" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_Flows_JourneyId_SequenceNumber",
            table: "Flows",
            columns: new[] { "JourneyId", "SequenceNumber" },
            unique: true);

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
            name: "IX_Promises_ProjectId_SequenceNumber",
            table: "Promises");

        migrationBuilder.DropIndex(
            name: "IX_Epics_ProductPromiseId_SequenceNumber",
            table: "Epics");

        migrationBuilder.DropIndex(
            name: "IX_Journeys_EpicId_SequenceNumber",
            table: "Journeys");

        migrationBuilder.DropIndex(
            name: "IX_Flows_JourneyId_SequenceNumber",
            table: "Flows");

        migrationBuilder.DropIndex(
            name: "IX_Moments_FlowId_SequenceNumber",
            table: "Moments");

        migrationBuilder.DropColumn(
            name: "SequenceNumber",
            table: "Promises");

        migrationBuilder.DropColumn(
            name: "SequenceNumber",
            table: "Moments");

        migrationBuilder.DropColumn(
            name: "SequenceNumber",
            table: "Journeys");

        migrationBuilder.DropColumn(
            name: "SequenceNumber",
            table: "Flows");

        migrationBuilder.DropColumn(
            name: "SequenceNumber",
            table: "Epics");
    }
}
