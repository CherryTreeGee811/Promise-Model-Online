using System.Net;

namespace PromiseModelOnline.BFF.Tests.IntegrationTests;

public class HealthEndpointTests
{
    [Test]
    public async Task Health_Returns200()
    {
        await using var server = new BffTestServer();
        var response = await server.Client.GetAsync("/health");

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
    }

    [Test]
    public async Task Health_ReturnsJsonBody()
    {
        await using var server = new BffTestServer();
        var json = await server.Client.GetStringAsync("/health");

        Assert.That(json, Does.Contain("healthy"));
    }

    [Test]
    public async Task Health_Post_Returns405()
    {
        await using var server = new BffTestServer();
        var response = await server.Client.PostAsync("/health", null);

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.MethodNotAllowed));
    }

    [Test]
    public async Task Health_Put_Returns405()
    {
        await using var server = new BffTestServer();
        var response = await server.Client.PutAsync("/health", null);

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.MethodNotAllowed));
    }

    [Test]
    public async Task Health_Delete_Returns405()
    {
        await using var server = new BffTestServer();
        var response = await server.Client.DeleteAsync("/health");

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.MethodNotAllowed));
    }
}
