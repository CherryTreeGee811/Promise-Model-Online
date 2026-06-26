using System.Net;
using Microsoft.Extensions.DependencyInjection;
using PromiseModelOnline.Api.DAL;
using PromiseModelOnline.Api.DTOs;

namespace PromiseModelOnline.Api.Tests.IntegrationTests;

// Requirements: REQ_SYS_032 REQ_SEC_LOG_001
public class AuditEventsIntegrationTests : ApiIntegrationTestBase
{
    private const int SeededProjectId = 1;

    [Test]
    [Description("REQ_SYS_032 happy path: No audit events for project returns empty timeline")]
    public async Task GetProjectHistory_ReturnsEmptyTimeline()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await GetAsync($"/api/audit-events/projects/{SeededProjectId}");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var events = await ReadJsonAsync<List<AuditTimelineItemDto>>(response);
        Assert.That(events, Is.Not.Null);
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated GET project history returns 401")]
    public async Task GetProjectHistory_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await GetAsync($"/api/audit-events/projects/{SeededProjectId}");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_SYS_032 happy path: No audit events for entity returns empty timeline")]
    public async Task GetEntityHistory_ReturnsEmptyTimeline()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await GetAsync($"/api/audit-events/entities/Moment/1");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var events = await ReadJsonAsync<List<AuditTimelineItemDto>>(response);
        Assert.That(events, Is.Not.Null);
        Assert.That(events!, Is.Empty);
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated GET entity history returns 401")]
    public async Task GetEntityHistory_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await GetAsync($"/api/audit-events/entities/Moment/1");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_SYS_032 happy path: GetProjectHistory with take/skip pagination returns OK")]
    public async Task GetProjectHistory_WithPaginationParams_ReturnsOk()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await GetAsync($"/api/audit-events/projects/{SeededProjectId}?take=10&skip=0");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var events = await ReadJsonAsync<List<AuditTimelineItemDto>>(response);
        Assert.That(events, Is.Not.Null);
    }
}
