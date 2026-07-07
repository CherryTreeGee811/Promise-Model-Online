using System.Net;
using Microsoft.Extensions.DependencyInjection;
using PromiseModelOnline.Api.DAL;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.Tests.IntegrationTests;

// Requirements: REQ_FUN_006 REQ_FUN_011 REQ_FUN_012 REQ_SYS_030 REQ_SEC_LOG_001
public class ProjectJourneysIntegrationTests : ApiIntegrationTestBase
{
    private const string Owner = "pmo_test";
    private const string Project = "seeded-project";
    private int _epicId;
    private int _epicSeq;

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

            _epicId = epic.Id;
            _epicSeq = epic.SequenceNumber;
        }
        else
        {
            var epic = db.Epics.First();
            _epicId = epic.Id;
            _epicSeq = epic.SequenceNumber;
        }
    }

    [SetUp]
    public async Task JourneySetUp() => await SeedHierarchyAsync();

    private async Task<Journey> SeedJourneyAsync(string statement = "Test journey")
    {
        using var scope = Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PromiseModelOnlineContext>();
        var seq = await db.GetNextJourneySequenceAsync(_epicId);
        var journey = new Journey
        {
            Statement = statement,
            Description = null,
            EpicId = _epicId,
            SequenceNumber = seq,
            DisplayOrder = 0,
            StatusColor = "red",
        };
        db.Journeys.Add(journey);
        await db.SaveChangesAsync();
        return journey;
    }

    [Test]
    [Description("REQ_FUN_006 happy path: Owner creates a Journey with required fields, returns 201 Created")]
    public async Task CreateJourney_AsOwner_ReturnsCreated()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await PostAsync($"/api/projects/{Owner}/{Project}/journeys/create",
            new { statement = "New journey", epicId = _epicId, displayOrder = 0 });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Created));
        var journey = await ReadJsonAsync<JourneyDto>(response);
        Assert.That(journey, Is.Not.Null);
        Assert.That(journey!.Statement, Is.EqualTo("New journey"));
        Assert.That(journey.SequenceNumber, Is.EqualTo(1));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated POST returns 401")]
    public async Task CreateJourney_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await PostAsync($"/api/projects/{Owner}/{Project}/journeys/create",
            new { statement = "Evil", epicId = _epicId, displayOrder = 0 });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Read-only scope cannot create journey, returns 403")]
    public async Task CreateJourney_ReadOnlyScope_Returns403()
    {
        // Arrange
        SetAuthHeader(ReadOnlyToken);
        // Act
        var response = await PostAsync($"/api/projects/{Owner}/{Project}/journeys/create",
            new { statement = "NoWrite", epicId = _epicId, displayOrder = 0 });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Forbidden));
    }

    [Test]
    [Description("REQ_SYS_030 sad path: Null request body returns 400")]
    public async Task CreateJourney_NullBody_Returns400()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        var json = new StringContent("null", System.Text.Encoding.UTF8, "application/json");
        // Act
        var response = await Client.PostAsync($"/api/projects/{Owner}/{Project}/journeys/create", json);
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    [Description("REQ_FUN_006 sad path: Non-existent epic returns 404")]
    public async Task CreateJourney_NonExistentEpic_Returns404()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await PostAsync($"/api/projects/{Owner}/{Project}/journeys/create",
            new { statement = "Bad epic", epicId = 999, displayOrder = 0 });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
    }

    [Test]
    [Description("REQ_FUN_006 happy path: Owner retrieves a Journey by sequence number, returns 200 OK")]
    public async Task GetJourneyBySeq_AsOwner_ReturnsOk()
    {
        // Arrange
        var seeded = await SeedJourneyAsync("Get by seq");
        SetAuthHeader(OwnerToken);
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/journeys/{seeded.SequenceNumber}");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var journey = await ReadJsonAsync<JourneyDto>(response);
        Assert.That(journey, Is.Not.Null);
        Assert.That(journey!.Statement, Is.EqualTo("Get by seq"));
    }

    [Test]
    [Description("REQ_FUN_006 sad path: Non-existent sequence number returns 404")]
    public async Task GetJourneyBySeq_NonExistent_Returns404()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/journeys/999");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated GET returns 401")]
    public async Task GetJourneyBySeq_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/journeys/1");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_FUN_006 happy path: Owner retrieves a Journey by ID, returns 200 OK")]
    public async Task GetJourneyById_AsOwner_ReturnsOk()
    {
        // Arrange
        var seeded = await SeedJourneyAsync("Get by id");
        SetAuthHeader(OwnerToken);
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/journeys/by-id/{seeded.Id}");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var journey = await ReadJsonAsync<JourneyDto>(response);
        Assert.That(journey, Is.Not.Null);
        Assert.That(journey!.Statement, Is.EqualTo("Get by id"));
    }

    [Test]
    [Description("REQ_FUN_006 sad path: Non-existent ID returns 404")]
    public async Task GetJourneyById_NonExistent_Returns404()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/journeys/by-id/999");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
    }

    [Test]
    [Description("REQ_FUN_006 happy path: Owner lists all journeys for a project, returns 200 OK")]
    public async Task GetAllJourneys_AsOwner_ReturnsOk()
    {
        // Arrange
        await SeedJourneyAsync("Journey A");
        await SeedJourneyAsync("Journey B");
        SetAuthHeader(OwnerToken);
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/journeys");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var journeys = await ReadJsonAsync<List<JourneyDto>>(response);
        Assert.That(journeys, Is.Not.Null);
        Assert.That(journeys!.Count, Is.GreaterThanOrEqualTo(2));
    }

    [Test]
    [Description("REQ_FUN_006 happy path: Owner lists journeys filtered by epic sequence number, returns 200 OK")]
    public async Task GetAllJourneys_WithEpicFilter_ReturnsOk()
    {
        // Arrange
        await SeedJourneyAsync("Filtered journey");
        SetAuthHeader(OwnerToken);
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/journeys?epicSeq={_epicSeq}");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var journeys = await ReadJsonAsync<List<JourneyDto>>(response);
        Assert.That(journeys, Is.Not.Null);
        Assert.That(journeys!.Count, Is.GreaterThanOrEqualTo(1));
    }

    [Test]
    [Description("REQ_FUN_006 happy path: Owner updates a Journey, returns 204 NoContent")]
    public async Task UpdateJourney_AsOwner_ReturnsNoContent()
    {
        // Arrange
        var seeded = await SeedJourneyAsync("Before update");
        SetAuthHeader(OwnerToken);
        // Act
        var response = await PutAsync($"/api/projects/{Owner}/{Project}/journeys/{seeded.SequenceNumber}",
            new
            {
                id = seeded.Id,
                statement = "Updated",
                description = "Updated desc",
                epicId = seeded.EpicId,
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
    public async Task UpdateJourney_NullBody_Returns400()
    {
        // Arrange
        var seeded = await SeedJourneyAsync();
        SetAuthHeader(OwnerToken);
        var json = new StringContent("null", System.Text.Encoding.UTF8, "application/json");
        // Act
        var response = await Client.PutAsync($"/api/projects/{Owner}/{Project}/journeys/{seeded.SequenceNumber}", json);
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    [Description("REQ_FUN_006 sad path: Mismatched ID on update returns 400")]
    public async Task UpdateJourney_MismatchedId_Returns400()
    {
        // Arrange
        var seeded = await SeedJourneyAsync("Mismatch");
        SetAuthHeader(OwnerToken);
        // Act
        var response = await PutAsync($"/api/projects/{Owner}/{Project}/journeys/{seeded.SequenceNumber}",
            new
            {
                id = 999,
                statement = "Mismatch",
                epicId = seeded.EpicId,
                sequenceNumber = seeded.SequenceNumber,
                displayOrder = 0,
            });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    [Description("REQ_FUN_006 sad path: Non-existent sequence number on update returns 404")]
    public async Task UpdateJourney_NonExistent_Returns404()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await PutAsync($"/api/projects/{Owner}/{Project}/journeys/999",
            new { id = 999, statement = "Ghost", epicId = _epicId, sequenceNumber = 999, displayOrder = 0 });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated PUT returns 401")]
    public async Task UpdateJourney_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await PutAsync($"/api/projects/{Owner}/{Project}/journeys/1",
            new { id = 1, statement = "x", epicId = _epicId, sequenceNumber = 1, displayOrder = 0 });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_FUN_006 happy path: Owner deletes a Journey, returns 204 NoContent")]
    public async Task DeleteJourney_AsOwner_ReturnsNoContent()
    {
        // Arrange
        var seeded = await SeedJourneyAsync("To delete");
        SetAuthHeader(OwnerToken);
        // Act
        var response = await Client.DeleteAsync($"/api/projects/{Owner}/{Project}/journeys/{seeded.SequenceNumber}");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NoContent));
    }

    [Test]
    [Description("REQ_FUN_006 sad path: Non-existent journey returns 404")]
    public async Task DeleteJourney_NonExistent_Returns404()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await Client.DeleteAsync($"/api/projects/{Owner}/{Project}/journeys/999");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated DELETE returns 401")]
    public async Task DeleteJourney_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await Client.DeleteAsync($"/api/projects/{Owner}/{Project}/journeys/1");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Read-only scope cannot delete journey, returns 403")]
    public async Task DeleteJourney_ReadOnlyScope_Returns403()
    {
        // Arrange
        var seeded = await SeedJourneyAsync("Read only delete");
        SetAuthHeader(ReadOnlyToken);
        // Act
        var response = await Client.DeleteAsync($"/api/projects/{Owner}/{Project}/journeys/{seeded.SequenceNumber}");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Forbidden));
    }

    [Test]
    [Description("REQ_FUN_006 happy path: Owner updates a Journey description, returns 200 OK")]
    public async Task UpdateJourneyDescription_AsOwner_ReturnsOk()
    {
        // Arrange
        var seeded = await SeedJourneyAsync("Desc test");
        SetAuthHeader(OwnerToken);
        // Act
        var response = await PatchAsync($"/api/projects/{Owner}/{Project}/journeys/{seeded.SequenceNumber}/description",
            new { description = "New description" });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var journey = await ReadJsonAsync<JourneyDto>(response);
        Assert.That(journey, Is.Not.Null);
        Assert.That(journey!.Description, Is.EqualTo("New description"));
    }

    [Test]
    [Description("REQ_FUN_006 happy path: Owner clears a Journey description, returns 200 OK")]
    public async Task UpdateJourneyDescription_Clear_ReturnsOk()
    {
        // Arrange
        var seeded = await SeedJourneyAsync("Clear desc");
        SetAuthHeader(OwnerToken);
        // Act
        var response = await PatchAsync($"/api/projects/{Owner}/{Project}/journeys/{seeded.SequenceNumber}/description",
            new { description = (string?)null });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var journey = await ReadJsonAsync<JourneyDto>(response);
        Assert.That(journey, Is.Not.Null);
        Assert.That(journey!.Description, Is.Null);
    }

    [Test]
    [Description("REQ_FUN_006 sad path: Non-existent journey description update returns 404")]
    public async Task UpdateJourneyDescription_NonExistent_Returns404()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await PatchAsync($"/api/projects/{Owner}/{Project}/journeys/999/description",
            new { description = "Ghost" });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated description update returns 401")]
    public async Task UpdateJourneyDescription_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await PatchAsync($"/api/projects/{Owner}/{Project}/journeys/1/description",
            new { description = "x" });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }
}
