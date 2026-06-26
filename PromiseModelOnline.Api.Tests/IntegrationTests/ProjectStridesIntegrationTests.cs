using System.Net;
using Microsoft.Extensions.DependencyInjection;
using PromiseModelOnline.Api.DAL;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.Tests.IntegrationTests;

// Requirements: REQ_FUN_024
public class ProjectStridesIntegrationTests : ApiIntegrationTestBase
{
    private const string Owner = "pmo_test";
    private const string Project = "seeded-project";
    private int _iterationId;

    private async Task SeedIterationAsync()
    {
        using var scope = Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PromiseModelOnlineContext>();
        if (!db.Iterations.Any())
        {
            var iteration = new Iteration { Name = "Sprint 1", ProjectId = 1 };
            db.Iterations.Add(iteration);
            await db.SaveChangesAsync();
            _iterationId = iteration.Id;
        }
        else
        {
            _iterationId = db.Iterations.First().Id;
        }
    }

    private async Task<int> SeedStrideAsync()
    {
        using var scope = Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PromiseModelOnlineContext>();
        var iteration = db.Iterations.First();
        var stride = new Stride
        {
            Name = "Sprint 1",
            IterationId = iteration.Id,
            StartDate = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            EndDate = new DateTime(2025, 1, 14, 0, 0, 0, DateTimeKind.Utc),
            DurationDays = 14,
            IsActive = true,
        };
        db.Strides.Add(stride);
        await db.SaveChangesAsync();
        return stride.Id;
    }

    [SetUp]
    public async Task StrideSetUp() => await SeedIterationAsync();

    [Test]
    [Description("REQ_FUN_024 happy path: List strides returns empty list")]
    public async Task GetAll_ReturnsEmptyList()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/strides");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var strides = await ReadJsonAsync<List<StrideDto>>(response);
        Assert.That(strides, Is.Not.Null);
        Assert.That(strides, Is.Empty);
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated GET returns 401")]
    public async Task GetAll_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/strides");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated GET by-id returns 401")]
    public async Task GetById_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/strides/by-id/1");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_FUN_024 sad path: Non-existent ID returns 404")]
    public async Task GetById_NonExistent_Returns404()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/strides/by-id/999");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
    }

    [Test]
    [Description("REQ_FUN_024 happy path: Create stride returns 201 Created with StrideDto")]
    public async Task Create_ReturnsCreated()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await PostAsync($"/api/projects/{Owner}/{Project}/strides",
            new { name = "Sprint 1", iterationId = _iterationId, startDate = "2025-01-01T00:00:00Z", endDate = "2025-01-14T00:00:00Z", durationDays = 14 });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Created));
        Assert.That(response.Headers.Location, Is.Not.Null);
        var stride = await ReadJsonAsync<StrideDto>(response);
        Assert.That(stride, Is.Not.Null);
        Assert.That(stride!.Name, Is.EqualTo("Sprint 1"));
        Assert.That(stride.DurationDays, Is.EqualTo(14));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated POST returns 401")]
    public async Task Create_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await PostAsync($"/api/projects/{Owner}/{Project}/strides",
            new { name = "Sprint 1", startDate = "2025-01-01T00:00:00Z", endDate = "2025-01-14T00:00:00Z", durationDays = 14 });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_SYS_030 sad path: Null request body returns 400")]
    public async Task Create_NullBody_Returns400()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        var json = new StringContent("null", System.Text.Encoding.UTF8, "application/json");
        // Act
        var response = await Client.PostAsync($"/api/projects/{Owner}/{Project}/strides", json);
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Read-only scope cannot create stride, returns 403")]
    public async Task Create_ReadOnlyScope_Returns403()
    {
        // Arrange
        SetAuthHeader(ReadOnlyToken);
        // Act
        var response = await PostAsync($"/api/projects/{Owner}/{Project}/strides",
            new { name = "Sprint 1", startDate = "2025-01-01T00:00:00Z", endDate = "2025-01-14T00:00:00Z", durationDays = 14 });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Forbidden));
    }

    [Test]
    [Description("REQ_FUN_024 happy path: UpdateStride returns 204 NoContent")]
    public async Task UpdateStride_ReturnsNoContent()
    {
        // Arrange
        var strideId = await SeedStrideAsync();
        SetAuthHeader(OwnerToken);
        // Act
        var response = await PatchAsync($"/api/projects/{Owner}/{Project}/strides/{strideId}",
            new { progressUnfinishedMoments = true });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NoContent));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated PATCH returns 401")]
    public async Task UpdateStride_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await PatchAsync($"/api/projects/{Owner}/{Project}/strides/1",
            new { progressUnfinishedMoments = true });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_SYS_030 sad path: Null body on update returns 400")]
    public async Task UpdateStride_NullBody_Returns400()
    {
        // Arrange
        var strideId = await SeedStrideAsync();
        SetAuthHeader(OwnerToken);
        var json = new StringContent("null", System.Text.Encoding.UTF8, "application/json");
        // Act
        var response = await Client.PatchAsync($"/api/projects/{Owner}/{Project}/strides/{strideId}", json);
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated POST progress returns 401")]
    public async Task ProgressStride_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await Client.PostAsync($"/api/projects/{Owner}/{Project}/strides/1/progress", null);
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_FUN_024 sad path: Create with non-existent iteration returns 404")]
    public async Task Create_NonExistentIteration_Returns404()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await PostAsync($"/api/projects/{Owner}/{Project}/strides",
            new { name = "Sprint 1", iterationId = 999, startDate = "2025-01-01T00:00:00Z", endDate = "2025-01-14T00:00:00Z", durationDays = 14 });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
    }
}
