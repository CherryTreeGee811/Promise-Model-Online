using System.Net;

namespace PromiseModelOnline.E2E.Tests;

public class RateLimitingTests : E2ETestBase
{
    [Test]
    public async Task TokenEndpoint_RateLimited_AfterBurst()
    {
        var statuses = await HammerAsync("/connect/token", 50, HttpMethod.Post);

        Assert.That(statuses, Does.Contain(HttpStatusCode.TooManyRequests),
            "Expected /connect/token to return 429 after exceeding rate+burst");
    }

    [Test]
    public async Task RegisterEndpoint_RateLimited_AfterBurst()
    {
        var statuses = await HammerAsync("/account/register", 10);

        Assert.That(statuses, Does.Contain(HttpStatusCode.TooManyRequests),
            "Expected /account/register to return 429 after exceeding rate+burst");
    }

    [Test]
    public async Task LoginEndpoint_RateLimited_AfterBurst()
    {
        var statuses = await HammerAsync("/login", 40);

        Assert.That(statuses, Does.Contain(HttpStatusCode.TooManyRequests),
            "Expected /login to return 429 after exceeding rate+burst");
    }

    [Test]
    public async Task ApiEndpoint_RateLimited_AfterBurst()
    {
        var statuses = await HammerAsync("/api/projects", 150);

        Assert.That(statuses, Does.Contain(HttpStatusCode.TooManyRequests),
            "Expected /api/ to return 429 after exceeding rate+burst");
    }

    [Test]
    public async Task HubsEndpoint_RateLimited_AfterBurst()
    {
        var statuses = await HammerAsync("/hubs/notifications", 100);

        Assert.That(statuses, Does.Contain(HttpStatusCode.TooManyRequests),
            "Expected /hubs/ to return 429 after exceeding rate+burst");
    }

    [Test]
    public async Task NormalTraffic_PassesThrough()
    {
        for (var i = 0; i < 10; i++)
        {
            var response = await GetAsync("/health");
            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK),
                "Health endpoint should not be rate limited");
        }
    }
}
