using System.Net;

namespace PromiseModelOnline.BFF.Tests.IntegrationTests;

/// <summary>Integration tests for the BFF /logout endpoint with session cleanup.</summary>
// Requirements: REQ_INT_015
public class LogoutEndpointTests
{
    [Test]
    public async Task REQ_INT_015_Logout_ReturnsSignOutRedirect()
    {
        // Arrange
        await using var server = new BffTestServer();
        // Act
        var response = await server.Client.GetAsync("/logout");

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));
    }

    [Test]
    public async Task REQ_INT_015_Logout_RedirectsToRoot()
    {
        // Arrange
        await using var server = new BffTestServer();
        // Act
        var response = await server.Client.GetAsync("/logout");

        // Assert
        Assert.That(response.Headers.Location?.ToString(), Is.EqualTo("/"));
    }
}
