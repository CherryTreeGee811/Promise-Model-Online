using System.Net;

namespace PromiseModelOnline.BFF.Tests.IntegrationTests;

public class LogoutEndpointTests
{
    [Test]
    public async Task Logout_ReturnsSignOutRedirect()
    {
        await using var server = new BffTestServer();
        var response = await server.Client.GetAsync("/logout");

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));
    }

    [Test]
    public async Task Logout_RedirectsToRoot()
    {
        await using var server = new BffTestServer();
        var response = await server.Client.GetAsync("/logout");

        Assert.That(response.Headers.Location?.ToString(), Is.EqualTo("/"));
    }
}
