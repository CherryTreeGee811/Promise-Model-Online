<!-- CODEGRAPH_START -->
## CodeGraph

In repositories indexed by CodeGraph (a `.codegraph/` directory exists at the repo root), reach for it BEFORE grep/find or reading files when you need to understand or locate code:

- **MCP tool** (when available): `codegraph_explore` answers most code questions in one call — the relevant symbols' verbatim source plus the call paths between them, including dynamic-dispatch hops grep can't follow. Name a file or symbol in the query to read its current line-numbered source. If it's listed but deferred, load it by name via tool search.
- **Shell** (always works): `codegraph explore "<symbol names or question>"` prints the same output.

If there is no `.codegraph/` directory, skip CodeGraph entirely — indexing is the user's decision.
<!-- CODEGRAPH_END -->

## Database Schema — Index Inventory

### Hierarchy (Project → Promise → Epic → Journey → Flow → Moment → Task)

All FK columns have indexes (auto-created by EF Core). Additional covering indexes added in migration `AddMissingPerformanceIndexes`:

| Table | Index | Columns | Purpose |
|-------|-------|---------|---------|
| Promises | `IX_Promises_ProjectId_DisplayOrder` | ProjectId, DisplayOrder | Stack-graph sort |
| Epics | `IX_Epics_ProductPromiseId_DisplayOrder` | ProductPromiseId, DisplayOrder | Stack-graph sort |
| Journeys | `IX_Journeys_EpicId_DisplayOrder` | EpicId, DisplayOrder | Stack-graph sort |
| Flows | `IX_Flows_JourneyId_DisplayOrder` | JourneyId, DisplayOrder | Stack-graph sort |
| Moments | `IX_Moments_AssignedStrideId_Status` | AssignedStrideId, Status | Stride board filter |

### AuditEvents (no indexes existed prior to migration)

| Index | Columns | Query Pattern |
|-------|---------|---------------|
| `IX_AuditEvents_ProjectId_OccurredAtUtc` | ProjectId, OccurredAtUtc | History listing |
| `IX_AuditEvents_EntityType_EntityId` | EntityType, EntityId | Detail modal lookup |

### Permissions

| Index | Columns | Query Pattern |
|-------|---------|---------------|
| `IX_Permission_UserId_Status` | UserId, Status | Pending invitations, active project IDs |

### Notifications, Reactions

| Table | Index | Columns | Query Pattern |
|-------|-------|---------|---------------|
| Notification | `IX_Notification_UserId_IsRead` | UserId, IsRead | Unread badge count |
| Reactions | `IX_Reactions_StackItemType_StackItemId` | StackItemType, StackItemId | Polymorphic reaction display |

### Task Queries

| Table | Index | Columns | Query Pattern |
|-------|-------|---------|---------------|
| MomentTask | `IX_MomentTask_OwnerId_IsCompleted` | OwnerId, IsCompleted | My Tasks page |
| BugReworkTask | `IX_BugReworkTask_SourceCommentId` | SourceCommentId | Bug rework lookup |

### Automation

| Table | Index | Columns | Filter | Query Pattern |
|-------|-------|---------|--------|---------------|
| Strides | `IX_Strides_EndDate` | EndDate | `WHERE IterationId IS NOT NULL` | Overdue stride detection |

### Migration

- Name: `AddMissingPerformanceIndexes`
- Timestamp: `20260713033412`
- DDL only — no schema changes, no data movement

### CI Verification

- **Script**: `scripts/check-query-performance.sh` — runs every query 3×, averages CPU time, fails if >500ms
- **Trigger**: Runs automatically in CI (`BuildAndTest.yml`) after E2E core tests, before OWASP ZAP
- **Credentials**: Uses `pmo_api` user with password from `${{ secrets.PMO_API_DB_PASSWORD }}`
- **sqlcmd**: Installed on CI runner via `mssql-tools18` Ubuntu package
- **Empty tables**: Skipped gracefully with a `SKIP (table empty)` message

### Notes

- `IX_BugReworkTask_SourceCommentId` is an EF Core auto-generated FK index from the initial migration, NOT added by `AddMissingPerformanceIndexes`.
- `IX_Moments_OwnerId` likewise exists as an auto-generated FK index from the initial migration.

## E2E Session Refresh

### Problem
`ViewUser_CannotCreateStride` flakes because pre-captured session cookies (stored in `GlobalSetUp.OwnerSessionChunks` / `SecondUserSessionChunks`) expire during a long test run. By the time the 13th test executes, the injected cookies are stale, so API calls via `SendWithSessionCookieAsync` return 401 instead of `Forbidden`.

### Fix
`ValidateAndRefreshSessionAsync` in `E2ETestBase.cs` runs after cookie injection:
1. Navigates to `BaseUrl` with `WaitUntilState.DOMContentLoaded`
2. If the URL matches the login page pattern (`account/login|connect/authorize`), the session has expired
3. Falls back to a full browser `LoginAsUser` which captures fresh cookies
4. Updates the global `GlobalSetUp` static chunks so subsequent tests benefit from the refresh

### Files
- `E2ETestBase.cs:195-214` — validation + refresh methods
- `E2ETestBase.cs:154-193` — `LoginAsync` / `LoginAsSecondUserAsync` call validation after injection
- `GlobalSetUp.cs:14-25` — `RefreshOwnerSession` / `RefreshSecondUserSession` setter methods

### Regression: `ViewUser_CannotCreateJourney` flake

`ValidateAndRefreshSessionAsync` revealed a latent issue in the initial `GotoAsync(BaseUrl)` inside `LoginAsync`/`LoginAsSecondUserAsync`. The original catch only matched `ERR_ABORTED`, but Playwright can also throw "interrupted by another navigation" when the SPA's client-side auth redirect fires before the `load` event.

**Fix (2026-07-13):**
- Changed `WaitUntilState.Load → DOMContentLoaded` so GotoAsync returns before the SPA's async redirect
- Widened all `catch (PlaywrightException ex) when (...)` to `catch (PlaywrightException)` for both initial and validation navigations
- `E2ETestBase.cs:158-164`, `181-187`, `213-218`
