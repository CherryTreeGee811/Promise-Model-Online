using System.Net;
using Microsoft.Extensions.DependencyInjection;
using PromiseModelOnline.Api.DAL;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.Enums;

namespace PromiseModelOnline.Api.Tests.IntegrationTests;

// Requirements: REQ_FUN_008 REQ_FUN_011 REQ_FUN_012 REQ_FUN_020 REQ_FUN_023 REQ_SYS_016 REQ_SYS_030 REQ_SEC_LOG_001
public class ProjectMomentsIntegrationTests : ApiIntegrationTestBase
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
    }

    [SetUp]
    public async Task MomentSetUp() => await SeedHierarchyAsync();

    private async Task<Moment> SeedMomentAsync(string statement = "Test moment")
    {
        using var scope = Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PromiseModelOnlineContext>();
        var flow = await db.Flows.FindAsync(_flowId);
        var seq = await db.GetNextMomentSequenceAsync(flow!.Id);
        var moment = new Moment
        {
            Statement = statement,
            Description = null,
            FlowId = flow.Id,
            Type = MomentType.Story,
            Status = MomentStatus.Todo,
            SequenceNumber = seq,
            DisplayOrder = 0,
            StatusColor = "red",
        };
        db.Moments.Add(moment);
        await db.SaveChangesAsync();
        return moment;
    }

    [Test]
    [Description("REQ_FUN_008 happy path: Owner creates a Moment with required fields, returns 201 Created")]
    public async Task CreateMoment_AsOwner_ReturnsCreated()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await PostAsync($"/api/projects/{Owner}/{Project}/moments/create",
            new { statement = "New moment", flowId = _flowId, displayOrder = 0, type = "Story", status = "Todo" });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Created));
        var moment = await ReadJsonAsync<MomentDto>(response);
        Assert.That(moment, Is.Not.Null);
        Assert.That(moment!.Statement, Is.EqualTo("New moment"));
        Assert.That(moment.SequenceNumber, Is.EqualTo(1));
        Assert.That(moment.Type, Is.EqualTo(MomentType.Story));
        Assert.That(moment.Status, Is.EqualTo(MomentStatus.Todo));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated POST returns 401")]
    public async Task CreateMoment_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await PostAsync($"/api/projects/{Owner}/{Project}/moments/create",
            new { statement = "Evil", flowId = _flowId, displayOrder = 0 });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Read-only scope cannot create moment, returns 403")]
    public async Task CreateMoment_ReadOnlyScope_Returns403()
    {
        // Arrange
        SetAuthHeader(ReadOnlyToken);
        // Act
        var response = await PostAsync($"/api/projects/{Owner}/{Project}/moments/create",
            new { statement = "NoWrite", flowId = _flowId, displayOrder = 0 });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Forbidden));
    }

    [Test]
    [Description("REQ_SYS_030 sad path: Null request body returns 400")]
    public async Task CreateMoment_NullBody_Returns400()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        var json = new StringContent("null", System.Text.Encoding.UTF8, "application/json");
        // Act
        var response = await Client.PostAsync($"/api/projects/{Owner}/{Project}/moments/create", json);
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    [Description("REQ_FUN_008 sad path: Non-existent flow returns 404")]
    public async Task CreateMoment_NonExistentFlow_Returns404()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await PostAsync($"/api/projects/{Owner}/{Project}/moments/create",
            new { statement = "Bad flow", flowId = 999, displayOrder = 0 });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
    }

    [Test]
    [Description("REQ_FUN_008 happy path: Owner retrieves a Moment by sequence number, returns 200 OK")]
    public async Task GetMomentBySeq_AsOwner_ReturnsOk()
    {
        // Arrange
        var seeded = await SeedMomentAsync("Get by seq");
        SetAuthHeader(OwnerToken);
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/moments/{seeded.SequenceNumber}");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var moment = await ReadJsonAsync<MomentDto>(response);
        Assert.That(moment, Is.Not.Null);
        Assert.That(moment!.Statement, Is.EqualTo("Get by seq"));
    }

    [Test]
    [Description("REQ_FUN_008 sad path: Non-existent sequence number returns 404")]
    public async Task GetMomentBySeq_NonExistent_Returns404()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/moments/999");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated GET returns 401")]
    public async Task GetMomentBySeq_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/moments/1");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_FUN_008 happy path: Read-only scope can view a Moment by sequence number, returns 200 OK")]
    public async Task GetMomentBySeq_ReadOnlyScope_ReturnsOk()
    {
        // Arrange
        var seeded = await SeedMomentAsync("Read only access");
        SetAuthHeader(ReadOnlyToken);
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/moments/{seeded.SequenceNumber}");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
    }

    [Test]
    [Description("REQ_FUN_008 happy path: Owner retrieves a Moment by ID, returns 200 OK")]
    public async Task GetMomentById_AsOwner_ReturnsOk()
    {
        // Arrange
        var seeded = await SeedMomentAsync("Get by id");
        SetAuthHeader(OwnerToken);
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/moments/by-id/{seeded.Id}");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var moment = await ReadJsonAsync<MomentDto>(response);
        Assert.That(moment, Is.Not.Null);
        Assert.That(moment!.Statement, Is.EqualTo("Get by id"));
    }

    [Test]
    [Description("REQ_FUN_008 sad path: Non-existent ID returns 404")]
    public async Task GetMomentById_NonExistent_Returns404()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/moments/by-id/999");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
    }

    [Test]
    [Description("REQ_FUN_008 happy path: Owner lists all moments for a project, returns 200 OK")]
    public async Task GetAllMoments_AsOwner_ReturnsOk()
    {
        // Arrange
        await SeedMomentAsync("Moment A");
        await SeedMomentAsync("Moment B");
        SetAuthHeader(OwnerToken);
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/moments");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var moments = await ReadJsonAsync<List<MomentDto>>(response);
        Assert.That(moments, Is.Not.Null);
        Assert.That(moments!.Count, Is.GreaterThanOrEqualTo(2));
    }

    [Test]
    [Description("REQ_FUN_023 happy path: Owner updates a Moment statement, returns 204 NoContent")]
    public async Task UpdateMoment_AsOwner_ReturnsNoContent()
    {
        // Arrange
        var seeded = await SeedMomentAsync("Before update");
        SetAuthHeader(OwnerToken);
        // Act
        var response = await PutAsync($"/api/projects/{Owner}/{Project}/moments/{seeded.SequenceNumber}",
            new
            {
                id = seeded.Id,
                statement = "Updated",
                description = "Updated desc",
                flowId = seeded.FlowId,
                type = "Story",
                status = "Todo",
                sequenceNumber = seeded.SequenceNumber,
                displayOrder = 0,
                statusColor = "blue",
                ownerId = (int?)null,
                assignedStrideId = (int?)null,
            });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NoContent));
    }

    [Test]
    [Description("REQ_SYS_030 sad path: Null body on update returns 400")]
    public async Task UpdateMoment_NullBody_Returns400()
    {
        // Arrange
        var seeded = await SeedMomentAsync();
        SetAuthHeader(OwnerToken);
        var json = new StringContent("null", System.Text.Encoding.UTF8, "application/json");
        // Act
        var response = await Client.PutAsync($"/api/projects/{Owner}/{Project}/moments/{seeded.SequenceNumber}", json);
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated PUT returns 401")]
    public async Task UpdateMoment_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await PutAsync($"/api/projects/{Owner}/{Project}/moments/1",
            new { id = 1, statement = "x", flowId = _flowId, type = "Story", status = "Todo", sequenceNumber = 1, displayOrder = 0 });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_FUN_011 sad path: Non-existent sequence number on update returns 404")]
    public async Task UpdateMoment_NonExistent_Returns404()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await PutAsync($"/api/projects/{Owner}/{Project}/moments/999",
            new { id = 999, statement = "Ghost", flowId = _flowId, type = "Story", status = "Todo", sequenceNumber = 999, displayOrder = 0 });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
    }

    [Test]
    [Description("REQ_FUN_012 happy path: Owner deletes a Moment, returns 204 NoContent")]
    public async Task DeleteMoment_AsOwner_ReturnsNoContent()
    {
        // Arrange
        var seeded = await SeedMomentAsync("To delete");
        SetAuthHeader(OwnerToken);
        // Act
        var response = await Client.DeleteAsync($"/api/projects/{Owner}/{Project}/moments/{seeded.SequenceNumber}");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NoContent));
    }

    [Test]
    [Description("REQ_FUN_012 sad path: Non-existent moment returns 404")]
    public async Task DeleteMoment_NonExistent_Returns404()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await Client.DeleteAsync($"/api/projects/{Owner}/{Project}/moments/999");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated DELETE returns 401")]
    public async Task DeleteMoment_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await Client.DeleteAsync($"/api/projects/{Owner}/{Project}/moments/1");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_FUN_011 happy path: Owner updates a Moment description, returns 200 OK")]
    public async Task UpdateMomentDescription_AsOwner_ReturnsOk()
    {
        // Arrange
        var seeded = await SeedMomentAsync("Desc test");
        SetAuthHeader(OwnerToken);
        // Act
        var response = await PatchAsync($"/api/projects/{Owner}/{Project}/moments/{seeded.SequenceNumber}/description",
            new { description = "New description" });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var moment = await ReadJsonAsync<MomentDto>(response);
        Assert.That(moment, Is.Not.Null);
        Assert.That(moment!.Description, Is.EqualTo("New description"));
    }

    [Test]
    [Description("REQ_FUN_011 happy path: Owner clears a Moment description, returns 200 OK")]
    public async Task UpdateMomentDescription_Clear_ReturnsOk()
    {
        // Arrange
        var seeded = await SeedMomentAsync("Clear desc");
        SetAuthHeader(OwnerToken);
        // Act
        var response = await PatchAsync($"/api/projects/{Owner}/{Project}/moments/{seeded.SequenceNumber}/description",
            new { description = (string?)null });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var moment = await ReadJsonAsync<MomentDto>(response);
        Assert.That(moment, Is.Not.Null);
        Assert.That(moment!.Description, Is.Null);
    }

    [Test]
    [Description("REQ_FUN_011 sad path: Non-existent moment description update returns 404")]
    public async Task UpdateMomentDescription_NonExistent_Returns404()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await PatchAsync($"/api/projects/{Owner}/{Project}/moments/999/description",
            new { description = "Ghost" });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated description update returns 401")]
    public async Task UpdateMomentDescription_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await PatchAsync($"/api/projects/{Owner}/{Project}/moments/1/description",
            new { description = "x" });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_SYS_016 happy path: Owner updates a Moment effort estimate, returns 200 OK")]
    public async Task UpdateMomentEstimate_AsOwner_ReturnsOk()
    {
        // Arrange
        var seeded = await SeedMomentAsync("Estimate test");
        SetAuthHeader(OwnerToken);
        // Act
        var response = await PatchAsync($"/api/projects/{Owner}/{Project}/moments/{seeded.SequenceNumber}/estimate",
            new { estimate = "M" });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var moment = await ReadJsonAsync<MomentDto>(response);
        Assert.That(moment, Is.Not.Null);
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated estimate update returns 401")]
    public async Task UpdateMomentEstimate_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await PatchAsync($"/api/projects/{Owner}/{Project}/moments/1/estimate",
            new { estimate = "M" });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_FUN_011 happy path: Owner updates a Moment type, returns 200 OK")]
    public async Task UpdateMomentType_AsOwner_ReturnsOk()
    {
        // Arrange
        var seeded = await SeedMomentAsync("Type test");
        SetAuthHeader(OwnerToken);
        // Act
        var response = await PatchAsync($"/api/projects/{Owner}/{Project}/moments/{seeded.SequenceNumber}/type",
            new { newType = "Job" });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var moment = await ReadJsonAsync<MomentDto>(response);
        Assert.That(moment, Is.Not.Null);
        Assert.That(moment!.Type, Is.EqualTo(MomentType.Job));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated type update returns 401")]
    public async Task UpdateMomentType_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await PatchAsync($"/api/projects/{Owner}/{Project}/moments/1/type",
            new { newType = "Job" });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_FUN_020 happy path: Owner updates a Moment owner assignment, returns 200 OK")]
    public async Task UpdateMomentOwner_AsOwner_ReturnsOk()
    {
        // Arrange
        var seeded = await SeedMomentAsync("Owner test");
        SetAuthHeader(OwnerToken);
        // Act
        var response = await PatchAsync($"/api/projects/{Owner}/{Project}/moments/{seeded.SequenceNumber}/owner",
            new { userId = 1 });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var moment = await ReadJsonAsync<MomentDto>(response);
        Assert.That(moment, Is.Not.Null);
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated owner update returns 401")]
    public async Task UpdateMomentOwner_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await PatchAsync($"/api/projects/{Owner}/{Project}/moments/1/owner",
            new { userId = 1 });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_FUN_011 happy path: Owner updates a Moment status, returns 200 OK")]
    public async Task UpdateMomentStatus_AsOwner_ReturnsOk()
    {
        // Arrange
        var seeded = await SeedMomentAsync("Status test");
        SetAuthHeader(OwnerToken);
        // Act
        var response = await PatchAsync($"/api/projects/{Owner}/{Project}/moments/{seeded.SequenceNumber}/status",
            new { newStatus = "InProgress" });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var moment = await ReadJsonAsync<MomentDto>(response);
        Assert.That(moment, Is.Not.Null);
        Assert.That(moment!.Status, Is.EqualTo(MomentStatus.InProgress));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated status update returns 401")]
    public async Task UpdateMomentStatus_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await PatchAsync($"/api/projects/{Owner}/{Project}/moments/1/status",
            new { newStatus = "InProgress" });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }
}
