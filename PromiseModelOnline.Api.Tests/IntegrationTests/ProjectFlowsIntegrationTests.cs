using System.Net;
using Microsoft.Extensions.DependencyInjection;
using PromiseModelOnline.Api.DAL;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.Tests.IntegrationTests;

// Requirements: REQ_FUN_007 REQ_FUN_011 REQ_FUN_012 REQ_SYS_030 REQ_SEC_LOG_001
public class ProjectFlowsIntegrationTests : ApiIntegrationTestBase
{
    private const string Owner = "pmo_test";
    private const string Project = "seeded-project";
    private int _journeyId;

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

            _journeyId = journey.Id;
        }
        else
        {
            _journeyId = db.Journeys.First().Id;
        }
    }

    [SetUp]
    public async Task FlowSetUp() => await SeedHierarchyAsync();

    private async Task<Flow> SeedFlowAsync(string statement = "Test flow")
    {
        using var scope = Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PromiseModelOnlineContext>();
        var journey = await db.Journeys.FindAsync(_journeyId);
        var seq = await db.GetNextFlowSequenceAsync(journey!.Id);
        var flow = new Flow
        {
            Statement = statement,
            Description = null,
            JourneyId = journey.Id,
            SequenceNumber = seq,
            DisplayOrder = 0,
            StatusColor = "red",
        };
        db.Flows.Add(flow);
        await db.SaveChangesAsync();
        return flow;
    }

    [Test]
    [Description("REQ_FUN_007 happy path: Owner creates a Flow with required fields, returns 201 Created")]
    public async Task CreateFlow_AsOwner_ReturnsCreated()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await PostAsync($"/api/projects/{Owner}/{Project}/flows/create",
            new { statement = "New flow", journeyId = _journeyId, displayOrder = 0 });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Created));
        var flow = await ReadJsonAsync<FlowDto>(response);
        Assert.That(flow, Is.Not.Null);
        Assert.That(flow!.Statement, Is.EqualTo("New flow"));
        Assert.That(flow.SequenceNumber, Is.EqualTo(1));
        Assert.That(flow.JourneyId, Is.EqualTo(_journeyId));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated POST returns 401")]
    public async Task CreateFlow_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await PostAsync($"/api/projects/{Owner}/{Project}/flows/create",
            new { statement = "Evil", journeyId = _journeyId, displayOrder = 0 });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Read-only scope cannot create flow, returns 403")]
    public async Task CreateFlow_ReadOnlyScope_Returns403()
    {
        // Arrange
        SetAuthHeader(ReadOnlyToken);
        // Act
        var response = await PostAsync($"/api/projects/{Owner}/{Project}/flows/create",
            new { statement = "NoWrite", journeyId = _journeyId, displayOrder = 0 });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Forbidden));
    }

    [Test]
    [Description("REQ_SYS_030 sad path: Null request body returns 400")]
    public async Task CreateFlow_NullBody_Returns400()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        var json = new StringContent("null", System.Text.Encoding.UTF8, "application/json");
        // Act
        var response = await Client.PostAsync($"/api/projects/{Owner}/{Project}/flows/create", json);
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    [Description("REQ_FUN_007 sad path: Non-existent journey returns 404")]
    public async Task CreateFlow_NonExistentJourney_Returns404()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await PostAsync($"/api/projects/{Owner}/{Project}/flows/create",
            new { statement = "Bad journey", journeyId = 999, displayOrder = 0 });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
    }

    [Test]
    [Description("REQ_FUN_007 happy path: Owner retrieves a Flow by sequence number, returns 200 OK")]
    public async Task GetFlowBySeq_AsOwner_ReturnsOk()
    {
        // Arrange
        var seeded = await SeedFlowAsync("Get by seq");
        SetAuthHeader(OwnerToken);
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/flows/{seeded.SequenceNumber}");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var flow = await ReadJsonAsync<FlowDto>(response);
        Assert.That(flow, Is.Not.Null);
        Assert.That(flow!.Statement, Is.EqualTo("Get by seq"));
    }

    [Test]
    [Description("REQ_FUN_007 sad path: Non-existent sequence number returns 404")]
    public async Task GetFlowBySeq_NonExistent_Returns404()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/flows/999");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated GET returns 401")]
    public async Task GetFlowBySeq_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/flows/1");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_FUN_007 happy path: Owner retrieves a Flow by ID, returns 200 OK")]
    public async Task GetFlowById_AsOwner_ReturnsOk()
    {
        // Arrange
        var seeded = await SeedFlowAsync("Get by id");
        SetAuthHeader(OwnerToken);
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/flows/by-id/{seeded.Id}");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var flow = await ReadJsonAsync<FlowDto>(response);
        Assert.That(flow, Is.Not.Null);
        Assert.That(flow!.Statement, Is.EqualTo("Get by id"));
    }

    [Test]
    [Description("REQ_FUN_007 sad path: Non-existent ID returns 404")]
    public async Task GetFlowById_NonExistent_Returns404()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/flows/by-id/999");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
    }

    [Test]
    [Description("REQ_FUN_007 happy path: Owner lists all flows for a project, returns 200 OK")]
    public async Task GetAllFlows_AsOwner_ReturnsOk()
    {
        // Arrange
        await SeedFlowAsync("Flow A");
        await SeedFlowAsync("Flow B");
        SetAuthHeader(OwnerToken);
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/flows");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var flows = await ReadJsonAsync<List<FlowDto>>(response);
        Assert.That(flows, Is.Not.Null);
        Assert.That(flows!.Count, Is.GreaterThanOrEqualTo(2));
    }

    [Test]
    [Description("REQ_FUN_007 happy path: Owner lists flows filtered by journey sequence, returns 200 OK")]
    public async Task GetAllFlows_WithJourneyFilter_ReturnsOk()
    {
        // Arrange
        var seeded = await SeedFlowAsync("Filtered flow");
        SetAuthHeader(OwnerToken);
        using (var scope = Factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PromiseModelOnlineContext>();
            var journey = await db.Journeys.FindAsync(_journeyId);
            // Act
            var response = await GetAsync($"/api/projects/{Owner}/{Project}/flows?journeySeq={journey!.SequenceNumber}");
            // Assert
            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
            var flows = await ReadJsonAsync<List<FlowDto>>(response);
            Assert.That(flows, Is.Not.Null);
            Assert.That(flows!.Count, Is.EqualTo(1));
            Assert.That(flows[0].Statement, Is.EqualTo("Filtered flow"));
        }
    }

    [Test]
    [Description("REQ_FUN_011 happy path: Owner updates a Flow, returns 204 NoContent")]
    public async Task UpdateFlow_AsOwner_ReturnsNoContent()
    {
        // Arrange
        var seeded = await SeedFlowAsync("Before update");
        SetAuthHeader(OwnerToken);
        // Act
        var response = await PutAsync($"/api/projects/{Owner}/{Project}/flows/{seeded.SequenceNumber}",
            new
            {
                id = seeded.Id,
                statement = "Updated",
                description = "Updated desc",
                journeyId = seeded.JourneyId,
                sequenceNumber = seeded.SequenceNumber,
                displayOrder = 0,
                statusColor = "blue",
                ownerId = (int?)null,
            });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NoContent));
    }

    [Test]
    [Description("REQ_SYS_030 sad path: Null body on update returns 400")]
    public async Task UpdateFlow_NullBody_Returns400()
    {
        // Arrange
        var seeded = await SeedFlowAsync();
        SetAuthHeader(OwnerToken);
        var json = new StringContent("null", System.Text.Encoding.UTF8, "application/json");
        // Act
        var response = await Client.PutAsync($"/api/projects/{Owner}/{Project}/flows/{seeded.SequenceNumber}", json);
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    [Description("REQ_FUN_011 sad path: Mismatched id in update body returns 400")]
    public async Task UpdateFlow_MismatchedId_Returns400()
    {
        // Arrange
        var seeded = await SeedFlowAsync("Mismatch");
        SetAuthHeader(OwnerToken);
        // Act
        var response = await PutAsync($"/api/projects/{Owner}/{Project}/flows/{seeded.SequenceNumber}",
            new
            {
                id = 999,
                statement = "Bad",
                journeyId = seeded.JourneyId,
                sequenceNumber = seeded.SequenceNumber,
                displayOrder = 0,
            });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    [Description("REQ_FUN_011 sad path: Non-existent sequence number on update returns 404")]
    public async Task UpdateFlow_NonExistent_Returns404()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await PutAsync($"/api/projects/{Owner}/{Project}/flows/999",
            new { id = 999, statement = "Ghost", journeyId = _journeyId, sequenceNumber = 999, displayOrder = 0 });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated PUT returns 401")]
    public async Task UpdateFlow_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await PutAsync($"/api/projects/{Owner}/{Project}/flows/1",
            new { id = 1, statement = "x", journeyId = _journeyId, sequenceNumber = 1, displayOrder = 0 });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_FUN_012 happy path: Owner deletes a Flow, returns 204 NoContent")]
    public async Task DeleteFlow_AsOwner_ReturnsNoContent()
    {
        // Arrange
        var seeded = await SeedFlowAsync("To delete");
        SetAuthHeader(OwnerToken);
        // Act
        var response = await Client.DeleteAsync($"/api/projects/{Owner}/{Project}/flows/{seeded.SequenceNumber}");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NoContent));
    }

    [Test]
    [Description("REQ_FUN_012 sad path: Non-existent flow returns 404")]
    public async Task DeleteFlow_NonExistent_Returns404()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await Client.DeleteAsync($"/api/projects/{Owner}/{Project}/flows/999");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated DELETE returns 401")]
    public async Task DeleteFlow_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await Client.DeleteAsync($"/api/projects/{Owner}/{Project}/flows/1");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Read-only scope cannot delete flow, returns 403")]
    public async Task DeleteFlow_ReadOnlyScope_Returns403()
    {
        // Arrange
        SetAuthHeader(ReadOnlyToken);
        // Act
        var response = await Client.DeleteAsync($"/api/projects/{Owner}/{Project}/flows/1");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Forbidden));
    }

    [Test]
    [Description("REQ_FUN_011 happy path: Owner updates a Flow description, returns 200 OK")]
    public async Task UpdateFlowDescription_AsOwner_ReturnsOk()
    {
        // Arrange
        var seeded = await SeedFlowAsync("Desc test");
        SetAuthHeader(OwnerToken);
        // Act
        var response = await PatchAsync($"/api/projects/{Owner}/{Project}/flows/{seeded.SequenceNumber}/description",
            new { description = "New description" });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var flow = await ReadJsonAsync<FlowDto>(response);
        Assert.That(flow, Is.Not.Null);
        Assert.That(flow!.Description, Is.EqualTo("New description"));
    }

    [Test]
    [Description("REQ_FUN_011 happy path: Owner clears a Flow description, returns 200 OK")]
    public async Task UpdateFlowDescription_Clear_ReturnsOk()
    {
        // Arrange
        var seeded = await SeedFlowAsync("Clear desc");
        SetAuthHeader(OwnerToken);
        // Act
        var response = await PatchAsync($"/api/projects/{Owner}/{Project}/flows/{seeded.SequenceNumber}/description",
            new { description = (string?)null });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var flow = await ReadJsonAsync<FlowDto>(response);
        Assert.That(flow, Is.Not.Null);
        Assert.That(flow!.Description, Is.Null);
    }

    [Test]
    [Description("REQ_FUN_011 sad path: Non-existent flow description update returns 404")]
    public async Task UpdateFlowDescription_NonExistent_Returns404()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await PatchAsync($"/api/projects/{Owner}/{Project}/flows/999/description",
            new { description = "Ghost" });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated description update returns 401")]
    public async Task UpdateFlowDescription_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await PatchAsync($"/api/projects/{Owner}/{Project}/flows/1/description",
            new { description = "x" });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }
}
