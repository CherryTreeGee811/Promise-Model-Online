using System.Net;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using PMO.Core.Models;
using PromiseModelOnline.Api.DAL;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.Enums;

namespace PromiseModelOnline.Api.Tests.IntegrationTests;

// Requirements: REQ_FUN_001 REQ_FUN_002 REQ_FUN_003 REQ_FUN_004 REQ_FUN_005 REQ_FUN_006 REQ_FUN_007 REQ_FUN_008 REQ_SYS_030 REQ_SYS_032 REQ_SEC_LOG_001
public class ProjectDetailIntegrationTests : ApiIntegrationTestBase
{
    private const string Owner = "pmo_test";
    private const string Project = "seeded-project";
    private int _flowId;

    private async Task SeedHierarchyAsync()
    {
        using var scope = Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PromiseModelOnlineContext>();

        if (!db.Promises.Any())
        {
            var promiseSeq = await db.GetNextPromiseSequenceAsync(1);
            var promise = new Promise
            {
                Statement = "Root promise",
                ProjectId = 1,
                SequenceNumber = promiseSeq,
                DisplayOrder = 0,
                StatusColor = "red",
            };
            db.Promises.Add(promise);
            await db.SaveChangesAsync();

            var epicSeq = await db.GetNextEpicSequenceAsync(promise.Id);
            var epic = new Epic
            {
                Statement = "Root epic",
                ProductPromiseId = promise.Id,
                SequenceNumber = epicSeq,
                DisplayOrder = 0,
                StatusColor = "red",
            };
            db.Epics.Add(epic);
            await db.SaveChangesAsync();

            var journeySeq = await db.GetNextJourneySequenceAsync(epic.Id);
            var journey = new Journey
            {
                Statement = "Root journey",
                EpicId = epic.Id,
                SequenceNumber = journeySeq,
                DisplayOrder = 0,
                StatusColor = "red",
            };
            db.Journeys.Add(journey);
            await db.SaveChangesAsync();

            var flowSeq = await db.GetNextFlowSequenceAsync(journey.Id);
            var flow = new Flow
            {
                Statement = "Root flow",
                JourneyId = journey.Id,
                SequenceNumber = flowSeq,
                DisplayOrder = 0,
                StatusColor = "red",
            };
            db.Flows.Add(flow);
            await db.SaveChangesAsync();

            var momentSeq = await db.GetNextMomentSequenceAsync(flow.Id);
            var moment = new Moment
            {
                Statement = "Root moment",
                FlowId = flow.Id,
                Type = MomentType.Story,
                Status = MomentStatus.Todo,
                SequenceNumber = momentSeq,
                DisplayOrder = 0,
                StatusColor = "red",
            };
            db.Moments.Add(moment);
            await db.SaveChangesAsync();

            _flowId = flow.Id;
        }
        else
        {
            var promise = db.Promises.First();
            var epic = db.Epics.First();
            var journey = db.Journeys.First();
            var flow = db.Flows.First();
            _flowId = flow.Id;
        }

        if (!db.AuditEvents.Any())
        {
            db.AuditEvents.Add(new AuditEvent
            {
                OccurredAtUtc = DateTime.UtcNow,
                ActorUserId = "1",
                ActorEmail = "owner@example.com",
                EntityType = "Project",
                EntityId = 1,
                ProjectId = 1,
                ActionType = "Updated",
                ChangesJson = "{\"Name\":{\"Before\":\"Old\",\"After\":\"New\"}}"
            });
            await db.SaveChangesAsync();
        }
    }

    [SetUp]
    public async Task ProjectDetailSetUp() => await SeedHierarchyAsync();

    [Test]
    [Description("REQ_FUN_001 happy path: Owner gets project detail, returns 200 OK")]
    public async Task GetProjectDetail_AsOwner_ReturnsOk()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var dto = await ReadJsonAsync<ProjectDto>(response);
        Assert.That(dto, Is.Not.Null);
        Assert.That(dto!.Name, Is.EqualTo("Test Project"));
        Assert.That(dto.Slug, Is.EqualTo(Project));
        Assert.That(dto.OwnerSlug, Is.EqualTo(Owner));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated GET project detail returns 401")]
    public async Task GetProjectDetail_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_FUN_002 happy path: Owner gets project members, returns 200 OK")]
    public async Task GetMembers_AsOwner_ReturnsOk()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/members");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var members = await ReadJsonAsync<List<ProjectMemberDto>>(response);
        Assert.That(members, Is.Not.Null);
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated GET members returns 401")]
    public async Task GetMembers_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/members");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_FUN_003 happy path: Owner gets top-level promises, returns 200 OK")]
    public async Task GetPromises_AsOwner_ReturnsOk()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/promises");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var promises = await ReadJsonAsync<List<PromiseDto>>(response);
        Assert.That(promises, Is.Not.Null);
        Assert.That(promises!, Has.Count.GreaterThanOrEqualTo(1));
        Assert.That(promises![0].Statement, Is.EqualTo("Root promise"));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated GET promises returns 401")]
    public async Task GetPromises_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/promises");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_FUN_004 happy path: Owner gets entity map, returns 200 OK")]
    public async Task GetEntityMap_AsOwner_ReturnsOk()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/entity-map");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var map = await ReadJsonAsync<List<object>>(response);
        Assert.That(map, Is.Not.Null);
        Assert.That(map!, Has.Count.GreaterThanOrEqualTo(1));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated GET entity map returns 401")]
    public async Task GetEntityMap_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/entity-map");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_FUN_005 happy path: Owner gets my-permission, returns 200 OK with permission and isOwner fields")]
    public async Task GetMyPermission_AsOwner_ReturnsOk()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/my-permission");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var body = await response.Content.ReadAsStringAsync();
        Assert.That(body, Does.Contain("\"permission\":"));
        Assert.That(body, Does.Contain("\"isOwner\":"));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated GET my-permission returns 401")]
    public async Task GetMyPermission_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/my-permission");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_FUN_006 happy path: Owner updates project details, returns 200 OK")]
    public async Task UpdateDetails_AsOwner_ReturnsOk()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await PatchAsync($"/api/projects/{Owner}/{Project}/details",
            new { name = "Updated Name" });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var dto = await ReadJsonAsync<ProjectDto>(response);
        Assert.That(dto, Is.Not.Null);
        Assert.That(dto!.Name, Is.EqualTo("Updated Name"));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated PATCH details returns 401")]
    public async Task UpdateDetails_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await PatchAsync($"/api/projects/{Owner}/{Project}/details",
            new { name = "Hacked" });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Read-only scope cannot update project details, returns 403")]
    public async Task UpdateDetails_ReadOnlyScope_Returns403()
    {
        // Arrange
        SetAuthHeader(ReadOnlyToken);
        // Act
        var response = await PatchAsync($"/api/projects/{Owner}/{Project}/details",
            new { name = "NoWrite" });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Forbidden));
    }

    [Test]
    [Description("REQ_SYS_030 sad path: Null body on update details returns 400")]
    public async Task UpdateDetails_NullBody_Returns400()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        var content = new StringContent("null", System.Text.Encoding.UTF8, "application/json");
        // Act
        var response = await Client.PatchAsync($"/api/projects/{Owner}/{Project}/details", content);
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    [Description("REQ_FUN_007 happy path: Owner deletes project, returns 204 NoContent then project is gone")]
    public async Task DeleteProject_AsOwner_ReturnsNoContent()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await Client.DeleteAsync($"/api/projects/{Owner}/{Project}");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NoContent));

        // Verify project is no longer accessible
        var verifyResponse = await GetAsync($"/api/projects/{Owner}/{Project}");
        Assert.That(verifyResponse.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated DELETE returns 401")]
    public async Task DeleteProject_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await Client.DeleteAsync($"/api/projects/{Owner}/{Project}");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Read-only scope cannot delete project, returns 403")]
    public async Task DeleteProject_ReadOnlyScope_Returns403()
    {
        // Arrange
        SetAuthHeader(ReadOnlyToken);
        // Act
        var response = await Client.DeleteAsync($"/api/projects/{Owner}/{Project}");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Forbidden));
    }

    [Test]
    [Description("REQ_FUN_008 happy path: Owner exports project, returns 200 OK with application/json content type")]
    public async Task ExportProject_AsOwner_ReturnsOk()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/export");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        Assert.That(response.Content.Headers.ContentType?.MediaType, Is.EqualTo("application/json"));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated GET export returns 401")]
    public async Task ExportProject_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/export");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_SYS_032 happy path: Owner gets audit events, returns 200 OK with X-Total-Count header")]
    public async Task GetAuditEvents_AsOwner_ReturnsOk()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/audit-events");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        Assert.That(response.Headers.Contains("X-Total-Count"), Is.True);
        var events = await ReadJsonAsync<List<AuditTimelineItemDto>>(response);
        Assert.That(events, Is.Not.Null);
        Assert.That(events!, Has.Count.GreaterThanOrEqualTo(1));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated GET audit events returns 401")]
    public async Task GetAuditEvents_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/audit-events");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_SYS_032 happy path: Owner gets audit events with take/skip params, returns 200 OK")]
    public async Task GetAuditEvents_WithPaginationParams_ReturnsOk()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/audit-events?take=10&skip=0");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        Assert.That(response.Headers.Contains("X-Total-Count"), Is.True);
        var events = await ReadJsonAsync<List<AuditTimelineItemDto>>(response);
        Assert.That(events, Is.Not.Null);
    }

    [Test]
    [Description("PMO-179: Deleting a project cascades through full hierarchy")]
    public async Task DeleteProject_CascadesFullHierarchy()
    {
        // Arrange — SeedHierarchyAsync creates promise->epic->journey->flow->moment
        // Add a moment task for full cascade verification
        using (var setupScope = Factory.Services.CreateScope())
        {
            var setupDb = setupScope.ServiceProvider.GetRequiredService<PromiseModelOnlineContext>();
            var moment = await setupDb.Moments.FirstAsync();
            setupDb.Set<MomentTask>().Add(new MomentTask
            {
                Name = "Cascade test task",
                Description = "Should be removed with project",
                MomentId = moment.Id,
                IsCompleted = false,
                CreatedAt = DateTime.UtcNow
            });
            await setupDb.SaveChangesAsync();
        }
        SetAuthHeader(OwnerToken);

        // Act — delete the project
        var deleteResponse = await Client.DeleteAsync($"/api/projects/{Owner}/{Project}");
        Assert.That(deleteResponse.StatusCode, Is.EqualTo(HttpStatusCode.NoContent));

        // Assert — all hierarchy levels are gone
        using var verifyScope = Factory.Services.CreateScope();
        var verifyDb = verifyScope.ServiceProvider.GetRequiredService<PromiseModelOnlineContext>();
        Assert.That(await verifyDb.Promises.AnyAsync(), Is.False, "Promises should be cascade-deleted");
        Assert.That(await verifyDb.Epics.AnyAsync(), Is.False, "Epics should be cascade-deleted");
        Assert.That(await verifyDb.Journeys.AnyAsync(), Is.False, "Journeys should be cascade-deleted");
        Assert.That(await verifyDb.Flows.AnyAsync(), Is.False, "Flows should be cascade-deleted");
        Assert.That(await verifyDb.Moments.AnyAsync(), Is.False, "Moments should be cascade-deleted");
        Assert.That(await verifyDb.Set<MomentTask>().AnyAsync(), Is.False, "MomentTasks should be cascade-deleted");
    }
}
