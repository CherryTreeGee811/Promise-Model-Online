using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PromiseModelOnline.Api.Migrations;

/// <inheritdoc />
public partial class AddMissingPerformanceIndexes : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_Promises_ProjectId",
            table: "Promises");

        migrationBuilder.DropIndex(
            name: "IX_Permission_UserId",
            table: "Permission");

        migrationBuilder.DropIndex(
            name: "IX_Notification_UserId",
            table: "Notification");

        migrationBuilder.DropIndex(
            name: "IX_MomentTask_OwnerId",
            table: "MomentTask");

        migrationBuilder.DropIndex(
            name: "IX_Moments_AssignedStrideId",
            table: "Moments");

        migrationBuilder.DropIndex(
            name: "IX_Journeys_EpicId",
            table: "Journeys");

        migrationBuilder.DropIndex(
            name: "IX_Flows_JourneyId",
            table: "Flows");

        migrationBuilder.DropIndex(
            name: "IX_Epics_ProductPromiseId",
            table: "Epics");

        migrationBuilder.CreateIndex(
            name: "IX_Strides_EndDate",
            table: "Strides",
            column: "EndDate",
            filter: "[IterationId] IS NOT NULL");

        migrationBuilder.CreateIndex(
            name: "IX_Reactions_StackItemType_StackItemId",
            table: "Reactions",
            columns: new[] { "StackItemType", "StackItemId" });

        migrationBuilder.CreateIndex(
            name: "IX_Promises_ProjectId_DisplayOrder",
            table: "Promises",
            columns: new[] { "ProjectId", "DisplayOrder" });

        migrationBuilder.CreateIndex(
            name: "IX_Permission_UserId_Status",
            table: "Permission",
            columns: new[] { "UserId", "Status" });

        migrationBuilder.CreateIndex(
            name: "IX_Notification_UserId_IsRead",
            table: "Notification",
            columns: new[] { "UserId", "IsRead" });

        migrationBuilder.CreateIndex(
            name: "IX_MomentTask_OwnerId_IsCompleted",
            table: "MomentTask",
            columns: new[] { "OwnerId", "IsCompleted" });

        migrationBuilder.CreateIndex(
            name: "IX_Moments_AssignedStrideId_Status",
            table: "Moments",
            columns: new[] { "AssignedStrideId", "Status" });

        migrationBuilder.CreateIndex(
            name: "IX_Journeys_EpicId_DisplayOrder",
            table: "Journeys",
            columns: new[] { "EpicId", "DisplayOrder" });

        migrationBuilder.CreateIndex(
            name: "IX_Flows_JourneyId_DisplayOrder",
            table: "Flows",
            columns: new[] { "JourneyId", "DisplayOrder" });

        migrationBuilder.CreateIndex(
            name: "IX_Epics_ProductPromiseId_DisplayOrder",
            table: "Epics",
            columns: new[] { "ProductPromiseId", "DisplayOrder" });

        migrationBuilder.CreateIndex(
            name: "IX_AuditEvents_EntityType_EntityId",
            table: "AuditEvents",
            columns: new[] { "EntityType", "EntityId" });

        migrationBuilder.CreateIndex(
            name: "IX_AuditEvents_ProjectId_OccurredAtUtc",
            table: "AuditEvents",
            columns: new[] { "ProjectId", "OccurredAtUtc" });
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_Strides_EndDate",
            table: "Strides");

        migrationBuilder.DropIndex(
            name: "IX_Reactions_StackItemType_StackItemId",
            table: "Reactions");

        migrationBuilder.DropIndex(
            name: "IX_Promises_ProjectId_DisplayOrder",
            table: "Promises");

        migrationBuilder.DropIndex(
            name: "IX_Permission_UserId_Status",
            table: "Permission");

        migrationBuilder.DropIndex(
            name: "IX_Notification_UserId_IsRead",
            table: "Notification");

        migrationBuilder.DropIndex(
            name: "IX_MomentTask_OwnerId_IsCompleted",
            table: "MomentTask");

        migrationBuilder.DropIndex(
            name: "IX_Moments_AssignedStrideId_Status",
            table: "Moments");

        migrationBuilder.DropIndex(
            name: "IX_Journeys_EpicId_DisplayOrder",
            table: "Journeys");

        migrationBuilder.DropIndex(
            name: "IX_Flows_JourneyId_DisplayOrder",
            table: "Flows");

        migrationBuilder.DropIndex(
            name: "IX_Epics_ProductPromiseId_DisplayOrder",
            table: "Epics");

        migrationBuilder.DropIndex(
            name: "IX_AuditEvents_EntityType_EntityId",
            table: "AuditEvents");

        migrationBuilder.DropIndex(
            name: "IX_AuditEvents_ProjectId_OccurredAtUtc",
            table: "AuditEvents");

        migrationBuilder.CreateIndex(
            name: "IX_Promises_ProjectId",
            table: "Promises",
            column: "ProjectId");

        migrationBuilder.CreateIndex(
            name: "IX_Permission_UserId",
            table: "Permission",
            column: "UserId");

        migrationBuilder.CreateIndex(
            name: "IX_Notification_UserId",
            table: "Notification",
            column: "UserId");

        migrationBuilder.CreateIndex(
            name: "IX_MomentTask_OwnerId",
            table: "MomentTask",
            column: "OwnerId");

        migrationBuilder.CreateIndex(
            name: "IX_Moments_AssignedStrideId",
            table: "Moments",
            column: "AssignedStrideId");

        migrationBuilder.CreateIndex(
            name: "IX_Journeys_EpicId",
            table: "Journeys",
            column: "EpicId");

        migrationBuilder.CreateIndex(
            name: "IX_Flows_JourneyId",
            table: "Flows",
            column: "JourneyId");

        migrationBuilder.CreateIndex(
            name: "IX_Epics_ProductPromiseId",
            table: "Epics",
            column: "ProductPromiseId");
    }
}
