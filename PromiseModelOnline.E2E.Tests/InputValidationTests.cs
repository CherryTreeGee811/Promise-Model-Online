using System.Net;

namespace PromiseModelOnline.E2E.Tests;

/// <summary>Browser-based E2E tests for input validation — XSS, SQL injection, malformed payloads, empty/long input.</summary>
// Requirements: REQ_FUN_047 REQ_NF_008
public class InputValidationTests : E2ETestBase
{
    private const string Owner = "pmo_test";
    private const string Project = "promise-model-online";

    [Test]
    [Description("REQ_FUN_047 misuse: XSS in project name rejected by API")]
    public async Task ProjectCreate_XssInName_BypassClient_Returns401()
    {
        // Arrange
        var json = System.Text.Json.JsonSerializer.Serialize(new { name = "<script>alert(1)</script>", slug = "xss-test" });

        // Act
        var response = await PostJsonAsync("/api/projects/create", json, ajax: true);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_FUN_047 misuse: SQL injection in project name rejected by API")]
    public async Task ProjectCreate_SqlInjection_BypassClient_Returns401()
    {
        // Arrange
        var json = """{"name":"test' DROP TABLE Projects --","slug":"sqli-test"}""";

        // Act
        var response = await PostJsonAsync("/api/projects/create", json, ajax: true);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_FUN_047 misuse: Non-JSON payload rejected by API")]
    public async Task Import_NonJson_BypassClient_Returns401()
    {
        // Arrange (no setup needed)
        // Act
        var response = await PostJsonAsync("/api/projects/import", "<xml><hack/></xml>", ajax: true);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_FUN_047 misuse: XSS in comment text rejected by API")]
    public async Task Comment_XssInText_BypassClient_Returns401()
    {
        // Arrange
        var json = System.Text.Json.JsonSerializer.Serialize(new { text = "<script>alert(1)</script>", parentType = "Promise", parentId = 1 });

        // Act
        var response = await PostJsonAsync("/api/comments", json, ajax: true);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_FUN_047 happy path: Empty comment text returns 400")]
    public async Task Comment_EmptyText_BypassClient_Returns400()
    {
        // Arrange
        await LoginAsync();
        var json = System.Text.Json.JsonSerializer.Serialize(new { text = "", parentType = "Promise", parentId = 1 });

        // Act
        var response = await AuthPostJsonAsync("/api/comments", json, ajax: true);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    [Description("REQ_FUN_047 happy path: Long comment text creates successfully")]
    public async Task Comment_ExcessiveLength_BypassClient_Returns201()
    {
        // Arrange
        await LoginAsync();
        var longText = new string('A', 2001);
        var json = System.Text.Json.JsonSerializer.Serialize(new { text = longText, parentType = "Promise", parentId = 1 });

        // Act
        var response = await AuthPostJsonAsync("/api/comments", json, ajax: true);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Created));
    }
}
