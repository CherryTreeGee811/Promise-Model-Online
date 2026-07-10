using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PromiseModelOnline.Api.Migrations;

/// <inheritdoc />
public partial class AddMissingPerformanceIndexes : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // AuditEvents — full table scan on every history page load
        migrationBuilder.CreateIndex(
            name: "IX_AuditEvents_ProjectId_OccurredAtUtc",
            table: "AuditEvents",
            columns: new[] { "ProjectId", "OccurredAtUtc" });

        // AuditEvents — detail modal lookup by entity type + id
        migrationBuilder.CreateIndex(
            name: "IX_AuditEvents_EntityType_EntityId",
            table: "AuditEvents",
            columns: new[] { "EntityType", "EntityId" });

        // Notification — unread badge count query
        migrationBuilder.CreateIndex(
            name: "IX_Notification_UserId_IsRead",
            table: "Notification",
            columns: new[] { "UserId", "IsRead" });

        // Reactions — polymorphic lookup by stack item
        migrationBuilder.CreateIndex(
            name: "IX_Reactions_StackItemType_StackItemId",
            table: "Reactions",
            columns: new[] { "StackItemType", "StackItemId" });

        // Hierarchy — covering indexes for stack-graph DisplayOrder sort
        migrationBuilder.CreateIndex(
            name: "IX_Promises_ProjectId_DisplayOrder",
            table: "Promises",
            columns: new[] { "ProjectId", "DisplayOrder" });

        migrationBuilder.CreateIndex(
            name: "IX_Epics_ProductPromiseId_DisplayOrder",
            table: "Epics",
            columns: new[] { "ProductPromiseId", "DisplayOrder" });

        migrationBuilder.CreateIndex(
            name: "IX_Journeys_EpicId_DisplayOrder",
            table: "Journeys",
            columns: new[] { "EpicId", "DisplayOrder" });

        migrationBuilder.CreateIndex(
            name: "IX_Flows_JourneyId_DisplayOrder",
            table: "Flows",
            columns: new[] { "JourneyId", "DisplayOrder" });

        // Moments — stride board unfinished-moment filter
        migrationBuilder.CreateIndex(
            name: "IX_Moments_AssignedStrideId_Status",
            table: "Moments",
            columns: new[] { "AssignedStrideId", "Status" });

        // MomentTask — My Tasks page query by owner
        migrationBuilder.CreateIndex(
            name: "IX_MomentTask_OwnerId_IsCompleted",
            table: "MomentTask",
            columns: new[] { "OwnerId", "IsCompleted" });

        // Strides — automation overdue detection, only for iteration-scoped
        migrationBuilder.CreateIndex(
            name: "IX_Strides_EndDate",
            table: "Strides",
            columns: new[] { "EndDate" },
            filter: "[IterationId] IS NOT NULL");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(name: "IX_AuditEvents_ProjectId_OccurredAtUtc", table: "AuditEvents");
        migrationBuilder.DropIndex(name: "IX_AuditEvents_EntityType_EntityId", table: "AuditEvents");
        migrationBuilder.DropIndex(name: "IX_Notification_UserId_IsRead", table: "Notification");
        migrationBuilder.DropIndex(name: "IX_Reactions_StackItemType_StackItemId", table: "Reactions");
        migrationBuilder.DropIndex(name: "IX_Promises_ProjectId_DisplayOrder", table: "Promises");
        migrationBuilder.DropIndex(name: "IX_Epics_ProductPromiseId_DisplayOrder", table: "Epics");
        migrationBuilder.DropIndex(name: "IX_Journeys_EpicId_DisplayOrder", table: "Journeys");
        migrationBuilder.DropIndex(name: "IX_Flows_JourneyId_DisplayOrder", table: "Flows");
        migrationBuilder.DropIndex(name: "IX_Moments_AssignedStrideId_Status", table: "Moments");
        migrationBuilder.DropIndex(name: "IX_MomentTask_OwnerId_IsCompleted", table: "MomentTask");
        migrationBuilder.DropIndex(name: "IX_Strides_EndDate", table: "Strides");
    }
}
