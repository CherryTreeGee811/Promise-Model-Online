using System.Net;
using System.Text.Json;

namespace PromiseModelOnline.Auth.Tests.IntegrationTests;

/// <summary>Integration tests for the Auth server health check endpoint.</summary>
// Requirements: REQ_INT_006
public class HealthIntegrationTests : IntegrationTestBase
{
    [Test]
    public async Task REQ_INT_006_Get_Health_ReturnsOk()
    {
        // Arrange
        // Act
        var response = await Client.GetAsync("/health");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));

        var json = await response.Content.ReadAsStringAsync();
        var doc = JsonDocument.Parse(json);
        var status = doc.RootElement.GetProperty("status").GetString();
        Assert.That(status, Is.EqualTo("healthy"));
    }
}
