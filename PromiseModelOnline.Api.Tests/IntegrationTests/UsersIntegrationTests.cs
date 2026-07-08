using System.Net;
using Microsoft.Extensions.DependencyInjection;

namespace PromiseModelOnline.Api.Tests.IntegrationTests;

// Requirements: REQ_SYS_014 REQ_SEC_LOG_001
public class UsersIntegrationTests : ApiIntegrationTestBase
{
    [Test]
    [Description("REQ_SYS_014 happy path: Authenticated user retrieves own profile, returns 200 OK")]
    public async Task GetMe_AsOwner_ReturnsOk()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await GetAsync("/api/users/me");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
    }

    [Test]
    [Description("REQ_SYS_014 happy path: Authenticated user profile contains name and email fields")]
    public async Task GetMe_ReturnsUserInfo()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await GetAsync("/api/users/me");
        var data = await ReadJsonAsync<Dictionary<string, object?>>(response);
        // Assert
        Assert.That(data, Is.Not.Null);
        Assert.That(data!["name"]?.ToString(), Is.EqualTo("Test Owner"));
        Assert.That(data["email"]?.ToString(), Is.EqualTo("owner@example.com"));
        Assert.That(data["userId"]?.ToString(), Is.EqualTo("1"));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated GET returns 401")]
    public async Task GetMe_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await GetAsync("/api/users/me");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_SYS_014 happy path: Empty search query returns empty list")]
    public async Task Search_EmptyQuery_ReturnsEmptyList()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await GetAsync("/api/users/search?q=nonexistent");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var results = await ReadJsonAsync<List<object>>(response);
        Assert.That(results, Is.Not.Null);
        Assert.That(results!, Is.Empty);
    }

    [Test]
    [Description("REQ_SYS_014 happy path: Search with query returns matching users")]
    public async Task Search_WithQuery_ReturnsResults()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await GetAsync("/api/users/search?q=owner&max=10");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var results = await ReadJsonAsync<List<object>>(response);
        Assert.That(results, Is.Not.Null);
        Assert.That(results!, Is.Not.Empty);
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated search returns 401")]
    public async Task Search_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await GetAsync("/api/users/search?q=test");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_SYS_014 happy path: Authenticated user exports personal data, returns 200 OK with JSON")]
    public async Task Export_AsOwner_ReturnsOk()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await GetAsync("/api/users/me/export");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var data = await ReadJsonAsync<Dictionary<string, object?>>(response);
        Assert.That(data, Is.Not.Null);
        Assert.That(data!, Contains.Key("exportedAt"));
        Assert.That(data.ContainsKey("account"), Is.True);
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated export returns 401")]
    public async Task Export_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await GetAsync("/api/users/me/export");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_SYS_014 happy path: Authenticated user deletes account, returns 204 NoContent")]
    public async Task Delete_AsOwner_ReturnsNoContent()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await Client.DeleteAsync("/api/users/me");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NoContent));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated DELETE returns 401")]
    public async Task Delete_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await Client.DeleteAsync("/api/users/me");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }
}
