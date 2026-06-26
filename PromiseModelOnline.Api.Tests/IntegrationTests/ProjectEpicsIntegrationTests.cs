using System.Net;
using Microsoft.Extensions.DependencyInjection;
using PromiseModelOnline.Api.DAL;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.Tests.IntegrationTests;

// Requirements: REQ_FUN_005 REQ_FUN_011 REQ_FUN_012 REQ_SYS_030 REQ_SEC_LOG_001
public class ProjectEpicsIntegrationTests : ApiIntegrationTestBase
{
    private const string Owner = "pmo_test";
    private const string Project = "seeded-project";
    private int _promiseId;

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
            _promiseId = promise.Id;
        }
        else
        {
            _promiseId = db.Promises.First().Id;
        }
    }

    private async Task<Epic> SeedEpicAsync(string statement = "Test epic")
    {
        using var scope = Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PromiseModelOnlineContext>();
        var seq = await db.GetNextEpicSequenceAsync(_promiseId);
        var epic = new Epic
        {
            Statement = statement,
            Description = null,
            ProductPromiseId = _promiseId,
            SequenceNumber = seq,
            DisplayOrder = 0,
            StatusColor = "red",
        };
        db.Epics.Add(epic);
        await db.SaveChangesAsync();
        return epic;
    }

    [Test]
    [Description("REQ_FUN_005 happy path: Owner creates an Epic with required fields, returns 201 Created")]
    public async Task CreateEpic_AsOwner_ReturnsCreated()
    {
        // Arrange
        await SeedHierarchyAsync();
        SetAuthHeader(OwnerToken);
        // Act
        var response = await PostAsync($"/api/projects/{Owner}/{Project}/epics/create",
            new { statement = "New epic", productPromiseId = _promiseId, displayOrder = 0 });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Created));
        var epic = await ReadJsonAsync<EpicDto>(response);
        Assert.That(epic, Is.Not.Null);
        Assert.That(epic!.Statement, Is.EqualTo("New epic"));
        Assert.That(epic.SequenceNumber, Is.EqualTo(1));
        Assert.That(epic.StatusColor, Is.EqualTo("red"));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated POST returns 401")]
    public async Task CreateEpic_Unauthenticated_Returns401()
    {
        // Arrange
        await SeedHierarchyAsync();
        // (no auth header set)
        // Act
        var response = await PostAsync($"/api/projects/{Owner}/{Project}/epics/create",
            new { statement = "Evil", productPromiseId = _promiseId, displayOrder = 0 });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Read-only scope cannot create epic, returns 403")]
    public async Task CreateEpic_ReadOnlyScope_Returns403()
    {
        // Arrange
        await SeedHierarchyAsync();
        SetAuthHeader(ReadOnlyToken);
        // Act
        var response = await PostAsync($"/api/projects/{Owner}/{Project}/epics/create",
            new { statement = "NoWrite", productPromiseId = _promiseId, displayOrder = 0 });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Forbidden));
    }

    [Test]
    [Description("REQ_SYS_030 sad path: Null request body returns 400")]
    public async Task CreateEpic_NullBody_Returns400()
    {
        // Arrange
        await SeedHierarchyAsync();
        SetAuthHeader(OwnerToken);
        var json = new StringContent("null", System.Text.Encoding.UTF8, "application/json");
        // Act
        var response = await Client.PostAsync($"/api/projects/{Owner}/{Project}/epics/create", json);
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    [Description("REQ_FUN_005 sad path: Non-existent promise returns 404")]
    public async Task CreateEpic_NonExistentPromise_Returns404()
    {
        // Arrange
        await SeedHierarchyAsync();
        SetAuthHeader(OwnerToken);
        // Act
        var response = await PostAsync($"/api/projects/{Owner}/{Project}/epics/create",
            new { statement = "Bad promise", productPromiseId = 999, displayOrder = 0 });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
    }

    [Test]
    [Description("REQ_FUN_005 happy path: Owner retrieves an Epic by sequence number, returns 200 OK")]
    public async Task GetEpicBySeq_AsOwner_ReturnsOk()
    {
        // Arrange
        await SeedHierarchyAsync();
        var seeded = await SeedEpicAsync("Get by seq");
        SetAuthHeader(OwnerToken);
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/epics/{seeded.SequenceNumber}");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var epic = await ReadJsonAsync<EpicDto>(response);
        Assert.That(epic, Is.Not.Null);
        Assert.That(epic!.Statement, Is.EqualTo("Get by seq"));
    }

    [Test]
    [Description("REQ_FUN_005 sad path: Non-existent sequence number returns 404")]
    public async Task GetEpicBySeq_NonExistent_Returns404()
    {
        // Arrange
        await SeedHierarchyAsync();
        SetAuthHeader(OwnerToken);
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/epics/999");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated GET returns 401")]
    public async Task GetEpicBySeq_Unauthenticated_Returns401()
    {
        // Arrange
        await SeedHierarchyAsync();
        // (no auth header set)
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/epics/1");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_FUN_005 happy path: Read-only scope can view an Epic by sequence number, returns 200 OK")]
    public async Task GetEpicBySeq_ReadOnlyScope_ReturnsOk()
    {
        // Arrange
        await SeedHierarchyAsync();
        var seeded = await SeedEpicAsync("Read only access");
        SetAuthHeader(ReadOnlyToken);
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/epics/{seeded.SequenceNumber}");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
    }

    [Test]
    [Description("REQ_FUN_005 happy path: Owner retrieves an Epic by ID, returns 200 OK")]
    public async Task GetEpicById_AsOwner_ReturnsOk()
    {
        // Arrange
        await SeedHierarchyAsync();
        var seeded = await SeedEpicAsync("Get by id");
        SetAuthHeader(OwnerToken);
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/epics/by-id/{seeded.Id}");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var epic = await ReadJsonAsync<EpicDto>(response);
        Assert.That(epic, Is.Not.Null);
        Assert.That(epic!.Statement, Is.EqualTo("Get by id"));
    }

    [Test]
    [Description("REQ_FUN_005 sad path: Non-existent ID returns 404")]
    public async Task GetEpicById_NonExistent_Returns404()
    {
        // Arrange
        await SeedHierarchyAsync();
        SetAuthHeader(OwnerToken);
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/epics/by-id/999");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
    }

    [Test]
    [Description("REQ_FUN_005 happy path: Owner lists all epics for a project, returns 200 OK")]
    public async Task GetAllEpics_AsOwner_ReturnsOk()
    {
        // Arrange
        await SeedHierarchyAsync();
        await SeedEpicAsync("Epic A");
        await SeedEpicAsync("Epic B");
        SetAuthHeader(OwnerToken);
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/epics");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var epics = await ReadJsonAsync<List<EpicDto>>(response);
        Assert.That(epics, Is.Not.Null);
        Assert.That(epics!.Count, Is.GreaterThanOrEqualTo(2));
    }

    [Test]
    [Description("REQ_FUN_005 happy path: Owner lists epics filtered by promise sequence number, returns 200 OK")]
    public async Task GetAllEpics_WithPromiseFilter_ReturnsOk()
    {
        // Arrange
        await SeedHierarchyAsync();
        await SeedEpicAsync("Filtered epic");
        SetAuthHeader(OwnerToken);
        using (var scope = Factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PromiseModelOnlineContext>();
            var promise = await db.Promises.FindAsync(_promiseId);
            // Act
            var response = await GetAsync($"/api/projects/{Owner}/{Project}/epics?promiseSeq={promise!.SequenceNumber}");
            // Assert
            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
            var epics = await ReadJsonAsync<List<EpicDto>>(response);
            Assert.That(epics, Is.Not.Null);
            Assert.That(epics!.Count, Is.GreaterThanOrEqualTo(1));
        }
    }

    [Test]
    [Description("REQ_FUN_011 happy path: Owner updates an Epic, returns 204 NoContent")]
    public async Task UpdateEpic_AsOwner_ReturnsNoContent()
    {
        // Arrange
        await SeedHierarchyAsync();
        var seeded = await SeedEpicAsync("Before update");
        SetAuthHeader(OwnerToken);
        // Act
        var response = await PutAsync($"/api/projects/{Owner}/{Project}/epics/{seeded.SequenceNumber}",
            new
            {
                id = seeded.Id,
                statement = "Updated",
                description = "Updated desc",
                productPromiseId = seeded.ProductPromiseId,
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
    public async Task UpdateEpic_NullBody_Returns400()
    {
        // Arrange
        await SeedHierarchyAsync();
        var seeded = await SeedEpicAsync();
        SetAuthHeader(OwnerToken);
        var json = new StringContent("null", System.Text.Encoding.UTF8, "application/json");
        // Act
        var response = await Client.PutAsync($"/api/projects/{Owner}/{Project}/epics/{seeded.SequenceNumber}", json);
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    [Description("REQ_SYS_030 sad path: Mismatched route ID vs body ID returns 400")]
    public async Task UpdateEpic_MismatchedId_Returns400()
    {
        // Arrange
        await SeedHierarchyAsync();
        var seeded = await SeedEpicAsync();
        SetAuthHeader(OwnerToken);
        // Act
        var response = await PutAsync($"/api/projects/{Owner}/{Project}/epics/{seeded.SequenceNumber}",
            new
            {
                id = 999,
                statement = "Mismatched",
                productPromiseId = seeded.ProductPromiseId,
                sequenceNumber = seeded.SequenceNumber,
                displayOrder = 0,
                statusColor = "red",
            });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    [Description("REQ_FUN_011 sad path: Non-existent sequence number on update returns 404")]
    public async Task UpdateEpic_NonExistent_Returns404()
    {
        // Arrange
        await SeedHierarchyAsync();
        SetAuthHeader(OwnerToken);
        // Act
        var response = await PutAsync($"/api/projects/{Owner}/{Project}/epics/999",
            new
            {
                id = 999,
                statement = "Ghost",
                productPromiseId = _promiseId,
                sequenceNumber = 999,
                displayOrder = 0,
                statusColor = "red",
            });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated PUT returns 401")]
    public async Task UpdateEpic_Unauthenticated_Returns401()
    {
        // Arrange
        await SeedHierarchyAsync();
        var seeded = await SeedEpicAsync();
        // (no auth header set)
        // Act
        var response = await PutAsync($"/api/projects/{Owner}/{Project}/epics/{seeded.SequenceNumber}",
            new { id = seeded.Id, statement = "x", productPromiseId = _promiseId, sequenceNumber = seeded.SequenceNumber, displayOrder = 0, statusColor = "red" });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_FUN_012 happy path: Owner deletes an Epic, returns 204 NoContent")]
    public async Task DeleteEpic_AsOwner_ReturnsNoContent()
    {
        // Arrange
        await SeedHierarchyAsync();
        var seeded = await SeedEpicAsync("To delete");
        SetAuthHeader(OwnerToken);
        // Act
        var response = await Client.DeleteAsync($"/api/projects/{Owner}/{Project}/epics/{seeded.SequenceNumber}");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NoContent));
    }

    [Test]
    [Description("REQ_FUN_012 sad path: Non-existent epic returns 404")]
    public async Task DeleteEpic_NonExistent_Returns404()
    {
        // Arrange
        await SeedHierarchyAsync();
        SetAuthHeader(OwnerToken);
        // Act
        var response = await Client.DeleteAsync($"/api/projects/{Owner}/{Project}/epics/999");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
    }

    [Test]
    [Description("REQ_FUN_012 sad path: Already-deleted epic returns 404 on second delete")]
    public async Task DeleteEpic_AlreadyDeleted_Returns404()
    {
        // Arrange
        await SeedHierarchyAsync();
        var seeded = await SeedEpicAsync("Delete twice");
        SetAuthHeader(OwnerToken);
        await Client.DeleteAsync($"/api/projects/{Owner}/{Project}/epics/{seeded.SequenceNumber}");
        // Act
        var response = await Client.DeleteAsync($"/api/projects/{Owner}/{Project}/epics/{seeded.SequenceNumber}");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated DELETE returns 401")]
    public async Task DeleteEpic_Unauthenticated_Returns401()
    {
        // Arrange
        await SeedHierarchyAsync();
        // (no auth header set)
        // Act
        var response = await Client.DeleteAsync($"/api/projects/{Owner}/{Project}/epics/1");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Read-only scope cannot delete epic, returns 403")]
    public async Task DeleteEpic_ReadOnlyScope_Returns403()
    {
        // Arrange
        await SeedHierarchyAsync();
        var seeded = await SeedEpicAsync();
        SetAuthHeader(ReadOnlyToken);
        // Act
        var response = await Client.DeleteAsync($"/api/projects/{Owner}/{Project}/epics/{seeded.SequenceNumber}");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Forbidden));
    }

    [Test]
    [Description("REQ_FUN_011 happy path: Owner updates an Epic description, returns 200 OK")]
    public async Task UpdateEpicDescription_AsOwner_ReturnsOk()
    {
        // Arrange
        await SeedHierarchyAsync();
        var seeded = await SeedEpicAsync("Desc test");
        SetAuthHeader(OwnerToken);
        // Act
        var response = await PatchAsync($"/api/projects/{Owner}/{Project}/epics/{seeded.SequenceNumber}/description",
            new { description = "New description" });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var epic = await ReadJsonAsync<EpicDto>(response);
        Assert.That(epic, Is.Not.Null);
        Assert.That(epic!.Description, Is.EqualTo("New description"));
    }

    [Test]
    [Description("REQ_FUN_011 happy path: Owner clears an Epic description, returns 200 OK")]
    public async Task UpdateEpicDescription_Clear_ReturnsOk()
    {
        // Arrange
        await SeedHierarchyAsync();
        var seeded = await SeedEpicAsync("Clear desc");
        SetAuthHeader(OwnerToken);
        // Act
        var response = await PatchAsync($"/api/projects/{Owner}/{Project}/epics/{seeded.SequenceNumber}/description",
            new { description = (string?)null });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var epic = await ReadJsonAsync<EpicDto>(response);
        Assert.That(epic, Is.Not.Null);
        Assert.That(epic!.Description, Is.Null);
    }

    [Test]
    [Description("REQ_FUN_011 sad path: Non-existent epic description update returns 404")]
    public async Task UpdateEpicDescription_NonExistent_Returns404()
    {
        // Arrange
        await SeedHierarchyAsync();
        SetAuthHeader(OwnerToken);
        // Act
        var response = await PatchAsync($"/api/projects/{Owner}/{Project}/epics/999/description",
            new { description = "Ghost" });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated description update returns 401")]
    public async Task UpdateEpicDescription_Unauthenticated_Returns401()
    {
        // Arrange
        await SeedHierarchyAsync();
        // (no auth header set)
        // Act
        var response = await PatchAsync($"/api/projects/{Owner}/{Project}/epics/1/description",
            new { description = "x" });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }
}
