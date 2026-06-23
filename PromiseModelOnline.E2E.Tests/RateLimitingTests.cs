using System.Net;

namespace PromiseModelOnline.E2E.Tests;

/// <summary>E2E tests for rate limiting on authentication endpoints.</summary>
// Requirements: REQ_NF_010
public class RateLimitingTests : E2ETestBase
{
    [Test]
    public async Task REQ_NF_010_TokenEndpoint_RateLimited_AfterBurst()
    {
        // Arrange (no setup needed)
        // Act
        var statuses = await HammerAsync("/connect/token", 50, HttpMethod.Post);

        // Assert
        Assert.That(statuses, Does.Contain(HttpStatusCode.TooManyRequests).Or.Contain(HttpStatusCode.ServiceUnavailable),
            "Expected /connect/token to return 429 after exceeding rate+burst");
    }

    [Test]
    public async Task REQ_NF_010_RegisterEndpoint_RateLimited_AfterBurst()
    {
        // Arrange (no setup needed)
        // Act
        var statuses = await HammerAsync("/account/register", 10);

        // Assert
        Assert.That(statuses, Does.Contain(HttpStatusCode.TooManyRequests).Or.Contain(HttpStatusCode.ServiceUnavailable),
            "Expected /account/register to return 429 after exceeding rate+burst");
    }

    [Test]
    public async Task REQ_NF_010_LoginEndpoint_RateLimited_AfterBurst()
    {
        // Arrange (no setup needed)
        // Act
        var statuses = await HammerAsync("/login", 40);

        // Assert
        Assert.That(statuses, Does.Contain(HttpStatusCode.TooManyRequests).Or.Contain(HttpStatusCode.ServiceUnavailable),
            "Expected /login to return 429 after exceeding rate+burst");
    }

    [Test]
    public async Task REQ_NF_010_ApiEndpoint_RateLimited_AfterBurst()
    {
        // Arrange (no setup needed)
        // Act
        var statuses = await HammerAsync("/api/projects", 150);

        // Assert
        Assert.That(statuses, Does.Contain(HttpStatusCode.TooManyRequests).Or.Contain(HttpStatusCode.ServiceUnavailable),
            "Expected /api/ to return 429 after exceeding rate+burst");
    }

    [Test]
    public async Task REQ_NF_010_HubsEndpoint_RateLimited_AfterBurst()
    {
        // Arrange (no setup needed)
        // Act
        var statuses = await HammerAsync("/hubs/notifications", 100);

        // Assert
        Assert.That(statuses, Does.Contain(HttpStatusCode.TooManyRequests).Or.Contain(HttpStatusCode.ServiceUnavailable),
            "Expected /hubs/ to return 429 after exceeding rate+burst");
    }

    [Test]
    public async Task REQ_NF_010_NormalTraffic_PassesThrough()
    {
        // Arrange (no setup needed)
        // Act
        for (var i = 0; i < 10; i++)
        {
            var response = await GetAsync("/health");
            // Assert
            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK),
                "Health endpoint should not be rate limited");
        }
    }
}
