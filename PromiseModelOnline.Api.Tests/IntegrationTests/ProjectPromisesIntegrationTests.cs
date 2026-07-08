using System.Net;
using Microsoft.Extensions.DependencyInjection;
using PromiseModelOnline.Api.DAL;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.Tests.IntegrationTests;

// Requirements: REQ_FUN_004 REQ_FUN_010 REQ_FUN_011 REQ_FUN_012 REQ_SYS_017 REQ_SYS_030 REQ_SEC_LOG_001
public class ProjectPromisesIntegrationTests : ApiIntegrationTestBase
{
    private const string Owner = "pmo_test";
    private const string Project = "seeded-project";

    private async Task<Promise> SeedPromiseAsync(string statement = "Test promise")
    {
        using var scope = Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PromiseModelOnlineContext>();
        var project = await db.Projects.FindAsync(1);
        var seq = await db.GetNextPromiseSequenceAsync(project!.Id);
        var promise = new Promise
        {
            Statement = statement,
            Description = null,
            ProjectId = project.Id,
            SequenceNumber = seq,
            DisplayOrder = 0,
            StatusColor = "red",
        };
        db.Promises.Add(promise);
        await db.SaveChangesAsync();
        return promise;
    }

    [Test]
    [Description("REQ_FUN_004 happy path: Owner creates a Product Promise with required statement field, returns 201 Created")]
    public async Task CreatePromise_AsOwner_ReturnsCreated()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await PostAsync($"/api/projects/{Owner}/{Project}/promises/create",
            new { statement = "New promise", projectId = 1, displayOrder = 0 });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Created));
        var promise = await ReadJsonAsync<PromiseDto>(response);
        Assert.That(promise, Is.Not.Null);
        Assert.That(promise!.Statement, Is.EqualTo("New promise"));
        Assert.That(promise.SequenceNumber, Is.EqualTo(1));
        Assert.That(promise.StatusColor, Is.EqualTo("red"));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated POST returns 401")]
    public async Task CreatePromise_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await PostAsync($"/api/projects/{Owner}/{Project}/promises/create",
            new { statement = "Evil", projectId = 1, displayOrder = 0 });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Read-only scope cannot create promise, returns 403")]
    public async Task CreatePromise_ReadOnlyScope_Returns403()
    {
        // Arrange
        SetAuthHeader(ReadOnlyToken);
        // Act
        var response = await PostAsync($"/api/projects/{Owner}/{Project}/promises/create",
            new { statement = "NoWrite", projectId = 1, displayOrder = 0 });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Forbidden));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: No scope token cannot create promise, returns 403")]
    public async Task CreatePromise_NoScope_Returns403()
    {
        // Arrange
        SetAuthHeader(NoScopeToken);
        // Act
        var response = await PostAsync($"/api/projects/{Owner}/{Project}/promises/create",
            new { statement = "NoScope", projectId = 1, displayOrder = 0 });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Forbidden));
    }

    [Test]
    [Description("REQ_SYS_030 sad path: Null request body returns 400")]
    public async Task CreatePromise_NullBody_Returns400()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        var json = new StringContent("null", System.Text.Encoding.UTF8, "application/json");
        // Act
        var response = await Client.PostAsync($"/api/projects/{Owner}/{Project}/promises/create", json);
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    [Description("REQ_FUN_004 sad path: Non-existent project slug returns 404")]
    public async Task CreatePromise_NonExistentProject_Returns404()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await PostAsync("/api/projects/pmo_test/nonexistent/promises/create",
            new { statement = "Bad project", projectId = 999, displayOrder = 0 });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
    }

    [Test]
    [Description("REQ_FUN_010 happy path: Owner retrieves a Product Promise by sequence number, returns 200 OK")]
    public async Task GetPromiseBySeq_AsOwner_ReturnsOk()
    {
        // Arrange
        var seeded = await SeedPromiseAsync("Get by seq");
        SetAuthHeader(OwnerToken);
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/promises/{seeded.SequenceNumber}");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var promise = await ReadJsonAsync<PromiseDto>(response);
        Assert.That(promise, Is.Not.Null);
        Assert.That(promise!.Statement, Is.EqualTo("Get by seq"));
    }

    [Test]
    [Description("REQ_FUN_010 sad path: Non-existent sequence number returns 404")]
    public async Task GetPromiseBySeq_NonExistent_Returns404()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/promises/999");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated GET returns 401")]
    public async Task GetPromiseBySeq_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/promises/1");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_FUN_010 happy path: Read-only scope can view a Product Promise by sequence number, returns 200 OK")]
    public async Task GetPromiseBySeq_ReadOnlyScope_ReturnsOk()
    {
        // Arrange
        var seeded = await SeedPromiseAsync("Read only access");
        SetAuthHeader(ReadOnlyToken);
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/promises/{seeded.SequenceNumber}");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
    }

    [Test]
    [Description("REQ_FUN_010 happy path: Owner retrieves a Product Promise by ID, returns 200 OK")]
    public async Task GetPromiseById_AsOwner_ReturnsOk()
    {
        // Arrange
        var seeded = await SeedPromiseAsync("Get by id");
        SetAuthHeader(OwnerToken);
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/promises/by-id/{seeded.Id}");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var promise = await ReadJsonAsync<PromiseDto>(response);
        Assert.That(promise, Is.Not.Null);
        Assert.That(promise!.Statement, Is.EqualTo("Get by id"));
    }

    [Test]
    [Description("REQ_FUN_010 sad path: Non-existent ID returns 404")]
    public async Task GetPromiseById_NonExistent_Returns404()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/promises/by-id/999");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
    }

    [Test]
    [Description("REQ_FUN_011 happy path: Owner updates a Product Promise statement, returns 204 NoContent")]
    public async Task UpdatePromise_AsOwner_ReturnsNoContent()
    {
        // Arrange
        var seeded = await SeedPromiseAsync("Before update");
        SetAuthHeader(OwnerToken);
        // Act
        var response = await PutAsync($"/api/projects/{Owner}/{Project}/promises/{seeded.SequenceNumber}",
            new
            {
                id = seeded.Id,
                statement = "Updated",
                description = "Updated desc",
                projectId = seeded.ProjectId,
                sequenceNumber = seeded.SequenceNumber,
                displayOrder = 0,
                statusColor = "blue",
                createdAt = seeded.CreatedAt,
            });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NoContent));
    }

    [Test]
    [Description("REQ_SYS_030 sad path: Null body on update returns 400")]
    public async Task UpdatePromise_NullBody_Returns400()
    {
        // Arrange
        var seeded = await SeedPromiseAsync();
        SetAuthHeader(OwnerToken);
        var json = new StringContent("null", System.Text.Encoding.UTF8, "application/json");
        // Act
        var response = await Client.PutAsync($"/api/projects/{Owner}/{Project}/promises/{seeded.SequenceNumber}", json);
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    [Description("REQ_SYS_030 sad path: Mismatched route ID vs body ID returns 400")]
    public async Task UpdatePromise_MismatchedId_Returns400()
    {
        // Arrange
        var seeded = await SeedPromiseAsync();
        SetAuthHeader(OwnerToken);
        // Act
        var response = await PutAsync($"/api/projects/{Owner}/{Project}/promises/{seeded.SequenceNumber}",
            new
            {
                id = 999,
                statement = "Mismatched",
                projectId = seeded.ProjectId,
                sequenceNumber = seeded.SequenceNumber,
                displayOrder = 0,
                statusColor = "red",
                createdAt = seeded.CreatedAt,
            });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    [Description("REQ_FUN_011 sad path: Non-existent sequence number on update returns 404")]
    public async Task UpdatePromise_NonExistent_Returns404()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await PutAsync($"/api/projects/{Owner}/{Project}/promises/999",
            new
            {
                id = 999,
                statement = "Ghost",
                projectId = 1,
                sequenceNumber = 999,
                displayOrder = 0,
                statusColor = "red",
                createdAt = DateTime.UtcNow,
            });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated PUT returns 401")]
    public async Task UpdatePromise_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await PutAsync($"/api/projects/{Owner}/{Project}/promises/1",
            new { id = 1, statement = "x", projectId = 1, sequenceNumber = 1, displayOrder = 0, statusColor = "red" });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Read-only scope cannot update promise, returns 403")]
    public async Task UpdatePromise_ReadOnlyScope_Returns403()
    {
        // Arrange
        var seeded = await SeedPromiseAsync();
        SetAuthHeader(ReadOnlyToken);
        // Act
        var response = await PutAsync($"/api/projects/{Owner}/{Project}/promises/{seeded.SequenceNumber}",
            new
            {
                id = seeded.Id,
                statement = "x",
                projectId = seeded.ProjectId,
                sequenceNumber = seeded.SequenceNumber,
                displayOrder = 0,
                statusColor = "red",
                createdAt = seeded.CreatedAt,
            });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Forbidden));
    }

    [Test]
    [Description("REQ_FUN_012 happy path: Owner deletes a Product Promise, returns 204 NoContent")]
    public async Task DeletePromise_AsOwner_ReturnsNoContent()
    {
        // Arrange
        var seeded = await SeedPromiseAsync("To be deleted");
        SetAuthHeader(OwnerToken);
        // Act
        var response = await Client.DeleteAsync($"/api/projects/{Owner}/{Project}/promises/{seeded.SequenceNumber}");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NoContent));
    }

    [Test]
    [Description("REQ_FUN_012 sad path: Non-existent sequence number on delete returns 404")]
    public async Task DeletePromise_NonExistent_Returns404()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await Client.DeleteAsync($"/api/projects/{Owner}/{Project}/promises/999");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
    }

    [Test]
    [Description("REQ_FUN_012 sad path: Already-deleted promise returns 404 on second delete")]
    public async Task DeletePromise_AlreadyDeleted_Returns404()
    {
        // Arrange
        var seeded = await SeedPromiseAsync("Delete twice");
        SetAuthHeader(OwnerToken);
        await Client.DeleteAsync($"/api/projects/{Owner}/{Project}/promises/{seeded.SequenceNumber}");
        // Act
        var response = await Client.DeleteAsync($"/api/projects/{Owner}/{Project}/promises/{seeded.SequenceNumber}");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated DELETE returns 401")]
    public async Task DeletePromise_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await Client.DeleteAsync($"/api/projects/{Owner}/{Project}/promises/1");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Read-only scope cannot delete promise, returns 403")]
    public async Task DeletePromise_ReadOnlyScope_Returns403()
    {
        // Arrange
        var seeded = await SeedPromiseAsync();
        SetAuthHeader(ReadOnlyToken);
        // Act
        var response = await Client.DeleteAsync($"/api/projects/{Owner}/{Project}/promises/{seeded.SequenceNumber}");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Forbidden));
    }

    [Test]
    [Description("REQ_FUN_011 happy path: Owner updates a Product Promise description, returns 200 OK with updated DTO")]
    public async Task UpdateDescription_AsOwner_ReturnsOk()
    {
        // Arrange
        var seeded = await SeedPromiseAsync("Desc test");
        SetAuthHeader(OwnerToken);
        // Act
        var response = await PatchAsync($"/api/projects/{Owner}/{Project}/promises/{seeded.SequenceNumber}/description",
            new { description = "New description" });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var promise = await ReadJsonAsync<PromiseDto>(response);
        Assert.That(promise, Is.Not.Null);
        Assert.That(promise!.Description, Is.EqualTo("New description"));
    }

    [Test]
    [Description("REQ_FUN_011 happy path: Owner clears a Product Promise description (sets to null), returns 200 OK")]
    public async Task UpdateDescription_Clear_ReturnsOk()
    {
        // Arrange
        var seeded = await SeedPromiseAsync("Clear desc");
        SetAuthHeader(OwnerToken);
        // Act
        var response = await PatchAsync($"/api/projects/{Owner}/{Project}/promises/{seeded.SequenceNumber}/description",
            new { description = (string?)null });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var promise = await ReadJsonAsync<PromiseDto>(response);
        Assert.That(promise, Is.Not.Null);
        Assert.That(promise!.Description, Is.Null);
    }

    [Test]
    [Description("REQ_FUN_011 sad path: Non-existent promise description update returns 404")]
    public async Task UpdateDescription_NonExistent_Returns404()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await PatchAsync($"/api/projects/{Owner}/{Project}/promises/999/description",
            new { description = "Ghost" });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated PATCH returns 401")]
    public async Task UpdateDescription_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await PatchAsync($"/api/projects/{Owner}/{Project}/promises/1/description",
            new { description = "x" });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Read-only scope cannot update description, returns 403")]
    public async Task UpdateDescription_ReadOnlyScope_Returns403()
    {
        // Arrange
        var seeded = await SeedPromiseAsync();
        SetAuthHeader(ReadOnlyToken);
        // Act
        var response = await PatchAsync($"/api/projects/{Owner}/{Project}/promises/{seeded.SequenceNumber}/description",
            new { description = "x" });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Forbidden));
    }

    [Test]
    [Description("REQ_SYS_017 happy path: Owner retrieves total effort for a promise, returns 200 OK")]
    public async Task GetTotalEffort_AsOwner_ReturnsOk()
    {
        // Arrange
        var seeded = await SeedPromiseAsync("Effort test");
        SetAuthHeader(OwnerToken);
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/promises/{seeded.SequenceNumber}/total-effort");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var effort = await ReadJsonAsync<int>(response);
        Assert.That(effort, Is.EqualTo(0));
    }

    [Test]
    [Description("REQ_SYS_017 sad path: Non-existent promise total effort returns 404")]
    public async Task GetTotalEffort_NonExistent_Returns404()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/promises/999/total-effort");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated total effort returns 401")]
    public async Task GetTotalEffort_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/promises/1/total-effort");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_SYS_017 happy path: Read-only scope can view total effort for a promise, returns 200 OK")]
    public async Task GetTotalEffort_ReadOnlyScope_ReturnsOk()
    {
        // Arrange
        var seeded = await SeedPromiseAsync("Effort read only");
        SetAuthHeader(ReadOnlyToken);
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/promises/{seeded.SequenceNumber}/total-effort");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
    }
}
