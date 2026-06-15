using System.Net;

namespace PromiseModelOnline.BFF.Tests.IntegrationTests;

/// <summary>Integration tests for the BFF /health endpoint.</summary>
// Requirements: REQ_INT_006
public class HealthEndpointTests
{
    [Test]
    public async Task REQ_INT_006_Health_Returns200()
    {
        // Arrange
        await using var server = new BffTestServer();
        // Act
        var response = await server.Client.GetAsync("/health");

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
    }

    [Test]
    public async Task REQ_INT_006_Health_ReturnsJsonBody()
    {
        // Arrange
        await using var server = new BffTestServer();
        // Act
        var json = await server.Client.GetStringAsync("/health");

        // Assert
        Assert.That(json, Does.Contain("healthy"));
    }

    [Test]
    public async Task REQ_INT_006_Health_Post_Returns405()
    {
        // Arrange
        await using var server = new BffTestServer();
        // Act
        var response = await server.Client.PostAsync("/health", null);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.MethodNotAllowed));
    }

    [Test]
    public async Task REQ_INT_006_Health_Put_Returns405()
    {
        // Arrange
        await using var server = new BffTestServer();
        // Act
        var response = await server.Client.PutAsync("/health", null);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.MethodNotAllowed));
    }

    [Test]
    public async Task REQ_INT_006_Health_Delete_Returns405()
    {
        // Arrange
        await using var server = new BffTestServer();
        // Act
        var response = await server.Client.DeleteAsync("/health");

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.MethodNotAllowed));
    }
}
