using System.Net;
using System.Text.Json;
using Microsoft.Playwright;

namespace PromiseModelOnline.E2E.Tests;

[TestFixture]
public class SqlInjectionTests : E2ETestBase
{
    private const string Owner = "pmo_test";
    private const string Project = "promise-model-online";

    private static readonly string[] TautologyPayloads =
    [
        "' OR '1'='1",
        "' OR 1=1 --",
        "' OR '1'='1' --",
        "\" OR 1=1 --",
        "admin'--",
        "1' OR '1'='1",
        "' OR ''='",
    ];

    private static readonly string[] DestructivePayloads =
    [
        "'; DROP TABLE Moments; --",
        "'; DELETE FROM Projects; --",
        "'; DROP TABLE [__EFMigrationsHistory]; --",
    ];

    private static readonly string[] UnionPayloads =
    [
        "' UNION SELECT NULL--",
        "' UNION SELECT @@version --",
        "' UNION SELECT name FROM sys.tables --",
    ];

    private static readonly string[] TimeBasedPayloads =
    [
        "'; WAITFOR DELAY '0:0:3'; --",
        "1; WAITFOR DELAY '0:0:3'--",
        "1' WAITFOR DELAY '0:0:3'--",
    ];

    private static readonly string[] AllPayloads =
        [.. TautologyPayloads, .. DestructivePayloads, .. UnionPayloads, .. TimeBasedPayloads];

    private static readonly string[] SqlErrorKeywords =
    [
        "Incorrect syntax",
        "Unclosed quotation mark",
        "SQL syntax",
        "SqlException",
        "SqlError",
        "System.Data",
        "Microsoft.Data.SqlClient",
        "row in object",
        "String or binary data would be truncated",
        "Cannot insert duplicate key",
        "violation of PRIMARY KEY",
        "DELETE statement conflicted",
        "Column name or number",
        "Invalid column name",
        "Invalid object name",
    ];

    private static void AssertSafeResponse(int payloadIndex, HttpResponseMessage response, string payload)
    {
        var sc = response.StatusCode;
        Assert.That(sc, Is.Not.EqualTo(HttpStatusCode.InternalServerError),
            $"Payload #{payloadIndex} '{Truncate(payload, 40)}' caused 500");

        Assert.That(sc, Is.Not.EqualTo(HttpStatusCode.BadGateway),
            $"Payload #{payloadIndex} '{Truncate(payload, 40)}' caused 502");

        Assert.That(sc, Is.Not.EqualTo(HttpStatusCode.ServiceUnavailable),
            $"Payload #{payloadIndex} '{Truncate(payload, 40)}' caused 503");

        if (sc is HttpStatusCode.OK or HttpStatusCode.Created or HttpStatusCode.NoContent)
            return;

        var body = response.Content.ReadAsStringAsync().GetAwaiter().GetResult();
        foreach (var keyword in SqlErrorKeywords)
        {
            Assert.That(body, Does.Not.Contain(keyword),
                $"Payload #{payloadIndex} '{Truncate(payload, 40)}' leaked SQL error keyword '{keyword}' in response body");
        }
    }

    private static string Truncate(string s, int max) => s.Length <= max ? s : s[..max] + "...";

    [Test]
    [Description("REQ_FUN_047 misuse: SQL injection in promise statement rejected safely (no 500, no SQL leak)")]
    public async Task PromiseStatement_SqlInjection_RejectedSafely()
    {
        // Arrange
        await LoginAsync();

        for (var i = 0; i < AllPayloads.Length; i++)
        {
            var payload = AllPayloads[i];
            var json = $$"""{"statement":"{{EscapeJson(payload)}}","displayOrder":1}""";

            // Act
            var response = await AuthPostJsonAsync(
                $"/api/projects/{Owner}/{Project}/promises/create", json, ajax: true);

            // Assert
            AssertSafeResponse(i, response, payload);
        }
    }

    [Test]
    [Description("REQ_FUN_047 misuse: SQL injection in epic statement rejected safely (no 500, no SQL leak)")]
    public async Task EpicStatement_SqlInjection_RejectedSafely()
    {
        // Arrange
        await LoginAsync();

        for (var i = 0; i < AllPayloads.Length; i++)
        {
            var payload = AllPayloads[i];
            var json = $$"""{"statement":"{{EscapeJson(payload)}}","productPromiseId":1,"displayOrder":1}""";

            // Act
            var response = await AuthPostJsonAsync(
                $"/api/projects/{Owner}/{Project}/epics/create", json, ajax: true);

            // Assert
            AssertSafeResponse(i, response, payload);
        }
    }

    [Test]
    [Description("REQ_FUN_047 misuse: SQL injection in journey statement rejected safely (no 500, no SQL leak)")]
    public async Task JourneyStatement_SqlInjection_RejectedSafely()
    {
        // Arrange
        await LoginAsync();

        for (var i = 0; i < AllPayloads.Length; i++)
        {
            var payload = AllPayloads[i];
            var json = $$"""{"statement":"{{EscapeJson(payload)}}","epicId":1,"displayOrder":1}""";

            // Act
            var response = await AuthPostJsonAsync(
                $"/api/projects/{Owner}/{Project}/journeys/create", json, ajax: true);

            // Assert
            AssertSafeResponse(i, response, payload);
        }
    }

    [Test]
    [Description("REQ_FUN_047 misuse: SQL injection in flow statement rejected safely (no 500, no SQL leak)")]
    public async Task FlowStatement_SqlInjection_RejectedSafely()
    {
        // Arrange
        await LoginAsync();

        for (var i = 0; i < AllPayloads.Length; i++)
        {
            var payload = AllPayloads[i];
            var json = $$"""{"statement":"{{EscapeJson(payload)}}","journeyId":1,"displayOrder":1}""";

            // Act
            var response = await AuthPostJsonAsync(
                $"/api/projects/{Owner}/{Project}/flows/create", json, ajax: true);

            // Assert
            AssertSafeResponse(i, response, payload);
        }
    }

    [Test]
    [Description("REQ_FUN_047 misuse: SQL injection in moment statement rejected safely (no 500, no SQL leak)")]
    public async Task MomentStatement_SqlInjection_RejectedSafely()
    {
        // Arrange
        await LoginAsync();

        for (var i = 0; i < AllPayloads.Length; i++)
        {
            var payload = AllPayloads[i];
            var json = $$"""{"statement":"{{EscapeJson(payload)}}","flowId":1,"displayOrder":1}""";

            // Act
            var response = await AuthPostJsonAsync(
                $"/api/projects/{Owner}/{Project}/moments/create", json, ajax: true);

            // Assert
            AssertSafeResponse(i, response, payload);
        }
    }

    [Test]
    [Description("REQ_FUN_047 misuse: SQL injection in moment description rejected safely (no 500, no SQL leak)")]
    public async Task MomentDescription_SqlInjection_RejectedSafely()
    {
        // Arrange
        await LoginAsync();
        var createResponse = await AuthPostJsonAsync(
            $"/api/projects/{Owner}/{Project}/moments/create",
            $$"""{"statement":"Desc-SQLi-{{Guid.NewGuid():N}}","flowId":1,"displayOrder":1}""",
            ajax: true);
        Assert.That(createResponse.StatusCode, Is.EqualTo(HttpStatusCode.Created));
        var created = JsonSerializer.Deserialize<JsonElement>(await createResponse.Content.ReadAsStringAsync());
        var momentId = created.GetProperty("sequenceNumber").GetInt32();

        for (var i = 0; i < AllPayloads.Length; i++)
        {
            var payload = AllPayloads[i];
            var json = $$"""{"description":"{{EscapeJson(payload)}}"}""";

            // Act
            var response = await AuthPatchJsonAsync(
                $"/api/projects/{Owner}/{Project}/moments/{momentId}/description", json);

            // Assert
            AssertSafeResponse(i, response, payload);
        }
    }

    [Test]
    [Description("REQ_FUN_047 misuse: SQL injection in project name rejected safely (authenticated, no 500)")]
    public async Task ProjectCreate_SqlInjection_Authenticated_RejectedSafely()
    {
        // Arrange
        await LoginAsync();

        for (var i = 0; i < AllPayloads.Length; i++)
        {
            var payload = AllPayloads[i];
            var json = $$"""{"name":"SQLi-{{Guid.NewGuid():N}}-{{EscapeJson(payload)}}"}""";

            // Act
            var response = await AuthPostJsonAsync("/api/projects/create", json, ajax: true);

            // Assert
            AssertSafeResponse(i, response, payload);
        }
    }

    [Test]
    [Description("REQ_FUN_047 misuse: SQL injection in comment text rejected safely (no 500, no SQL leak)")]
    public async Task Comment_SqlInjection_Authenticated_RejectedSafely()
    {
        // Arrange
        await LoginAsync();

        for (var i = 0; i < AllPayloads.Length; i++)
        {
            var payload = AllPayloads[i];
            var json = $$"""{"text":"{{EscapeJson(payload)}}","parentType":"Promise","parentId":1}""";

            // Act
            var response = await AuthPostJsonAsync("/api/comments", json, ajax: true);

            // Assert
            AssertSafeResponse(i, response, payload);
        }
    }

    [Test]
    [Description("REQ_FUN_047 misuse: SQL injection in promise description rejected safely (no 500, no SQL leak)")]
    public async Task PromiseDescription_SqlInjection_RejectedSafely()
    {
        // Arrange
        await LoginAsync();
        var createResponse = await AuthPostJsonAsync(
            $"/api/projects/{Owner}/{Project}/promises/create",
            $$"""{"statement":"Desc-SQLi-{{Guid.NewGuid():N}}","displayOrder":1}""",
            ajax: true);
        Assert.That(createResponse.StatusCode, Is.EqualTo(HttpStatusCode.Created));
        var created = JsonSerializer.Deserialize<JsonElement>(await createResponse.Content.ReadAsStringAsync());
        var promiseId = created.GetProperty("sequenceNumber").GetInt32();

        for (var i = 0; i < AllPayloads.Length; i++)
        {
            var payload = AllPayloads[i];
            var json = $$"""{"description":"{{EscapeJson(payload)}}"}""";

            // Act
            var response = await AuthPatchJsonAsync(
                $"/api/projects/{Owner}/{Project}/promises/{promiseId}/description", json);

            // Assert
            AssertSafeResponse(i, response, payload);
        }
    }

    [Test]
    [Description("REQ_FUN_047 misuse: SQL injection in promise owner field returns 400 (not 500)")]
    public async Task PromiseOwner_SqlInjection_ReturnsBadRequest()
    {
        // Arrange
        await LoginAsync();

        foreach (var payload in AllPayloads)
        {
            var json = $$"""{"userId":"{{EscapeJson(payload)}}"}""";

            // Act
            var response = await AuthPostJsonAsync(
                $"/api/projects/{Owner}/{Project}/promises/1/owner", json, ajax: true);

            // Assert
            Assert.That(response.StatusCode, Is.Not.EqualTo(HttpStatusCode.InternalServerError));
        }
    }

    [Test]
    [Description("REQ_FUN_047 misuse: Second-order SQL injection via stored statement then retrieved")]
    public async Task StoredStatement_SecondOrder_SqlInjection_RejectedSafely()
    {
        // Arrange
        await LoginAsync();
        var payload = "' OR '1'='1";

        // Act — store the injection payload
        var createResponse = await AuthPostJsonAsync(
            $"/api/projects/{Owner}/{Project}/promises/create",
            $$"""{"statement":"{{EscapeJson(payload)}}","displayOrder":2}""",
            ajax: true);
        Assert.That(createResponse.StatusCode, Is.EqualTo(HttpStatusCode.Created));

        var created = JsonSerializer.Deserialize<JsonElement>(await createResponse.Content.ReadAsStringAsync());
        var seqNum = created.GetProperty("sequenceNumber").GetInt32();

        // Act — retrieve the stored injection payload
        var authClient = await GetAuthClientAsync();
        using var getRequest = new HttpRequestMessage(HttpMethod.Get,
            $"/api/projects/{Owner}/{Project}/promises/{seqNum}");
        var getResponse = await authClient.SendAsync(getRequest);

        // Assert
        Assert.That(getResponse.StatusCode, Is.EqualTo(HttpStatusCode.OK));

        var body = await getResponse.Content.ReadAsStringAsync();
        Assert.That(body, Does.Contain("' OR '1'='1"));
        AssertNoCspViolations();
    }

    [Test]
    [Description("REQ_FUN_047 misuse: SQL injection in epic description update handled safely")]
    public async Task EpicDescription_SqlInjection_RejectedSafely()
    {
        // Arrange
        await LoginAsync();

        for (var i = 0; i < AllPayloads.Length; i++)
        {
            var payload = AllPayloads[i];
            var json = $$"""{"description":"{{EscapeJson(payload)}}"}""";

            // Act
            var response = await AuthPatchJsonAsync(
                $"/api/projects/{Owner}/{Project}/epics/1/description", json);

            // Assert
            AssertSafeResponse(i, response, payload);
        }
    }

    [Test]
    [Description("REQ_FUN_047 misuse: SQL injection in journey description update handled safely")]
    public async Task JourneyDescription_SqlInjection_RejectedSafely()
    {
        // Arrange
        await LoginAsync();

        for (var i = 0; i < AllPayloads.Length; i++)
        {
            var payload = AllPayloads[i];
            var json = $$"""{"description":"{{EscapeJson(payload)}}"}""";

            // Act
            var response = await AuthPatchJsonAsync(
                $"/api/projects/{Owner}/{Project}/journeys/1/description", json);

            // Assert
            AssertSafeResponse(i, response, payload);
        }
    }

    [Test]
    [Description("REQ_FUN_047 misuse: SQL injection in flow description update handled safely")]
    public async Task FlowDescription_SqlInjection_RejectedSafely()
    {
        // Arrange
        await LoginAsync();

        for (var i = 0; i < AllPayloads.Length; i++)
        {
            var payload = AllPayloads[i];
            var json = $$"""{"description":"{{EscapeJson(payload)}}"}""";

            // Act
            var response = await AuthPatchJsonAsync(
                $"/api/projects/{Owner}/{Project}/flows/1/description", json);

            // Assert
            AssertSafeResponse(i, response, payload);
        }
    }

    [Test]
    [Description("REQ_FUN_047 misuse: SQL injection in moment task name handled safely")]
    public async Task MomentTaskName_SqlInjection_RejectedSafely()
    {
        // Arrange
        await LoginAsync();

        var createResponse = await AuthPostJsonAsync(
            $"/api/projects/{Owner}/{Project}/moments/create",
            $$"""{"statement":"Task-SQLi-{{Guid.NewGuid():N}}","flowId":1,"displayOrder":1}""",
            ajax: true);
        Assert.That(createResponse.StatusCode, Is.EqualTo(HttpStatusCode.Created));
        var created = JsonSerializer.Deserialize<JsonElement>(await createResponse.Content.ReadAsStringAsync());
        var momentSeq = created.GetProperty("sequenceNumber").GetInt32();

        for (var i = 0; i < AllPayloads.Length; i++)
        {
            var payload = AllPayloads[i];
            var json = $$"""{"name":"{{EscapeJson(payload)}}","isCompleted":false}""";

            // Act
            var response = await AuthPostJsonAsync(
                $"/api/projects/{Owner}/{Project}/moments/{momentSeq}/tasks", json, ajax: true);

            // Assert
            AssertSafeResponse(i, response, payload);
        }
    }

    [Test]
    [Description("REQ_FUN_047 misuse: SQL injection in project import name rejected safely")]
    public async Task ProjectImport_SqlInjection_Authenticated_RejectedSafely()
    {
        // Arrange
        await LoginAsync();

        for (var i = 0; i < AllPayloads.Length; i++)
        {
            var payload = AllPayloads[i];
            var uniqueId = Guid.NewGuid().ToString("N")[..12];
            var json = $$"""
                {
                    "schemaVersion":"1.0",
                    "exportedAt":"2026-01-01T00:00:00Z",
                    "project":{
                        "name":"Import-{{uniqueId}}-{{EscapeJson(payload)}}",
                        "ownerId":1,
                        "createdAt":"2026-01-01T00:00:00Z",
                        "productPromises":[],
                        "iterations":[]
                    }
                }
                """;

            // Act
            var response = await AuthPostJsonAsync("/api/projects/import", json, ajax: true);

            // Assert
            AssertSafeResponse(i, response, payload);
        }
    }

    [Test]
    [Description("REQ_FUN_047 misuse: SQL injection in registration email handled safely (browser)")]
    public async Task Registration_Email_SqlInjection_RejectedSafely()
    {
        // Arrange
        foreach (var payload in AllPayloads)
        {
            var uniqueSuffix = Guid.NewGuid().ToString("N")[..8];
            var clean = payload
                .Replace("'", "").Replace("\"", "").Replace(";", "")
                .Replace("--", "").Replace("=", "").Replace(" ", "");
            var email = $"sqli-{uniqueSuffix}-{clean[..Math.Min(15, clean.Length)]}@test.com";

            await NavigateForFormAsync("/account/register");

            await Page.EvaluateAsync("document.querySelector('form').noValidate = true");

            await Page.Locator("#Email").FillAsync(email);
            await Page.Locator("#Username").FillAsync(email);
            await Page.Locator("#Password").FillAsync("Test123*!");
            await Page.Locator("#ConfirmPassword").FillAsync("Test123*!");
            await Page.CheckAsync("#privacyConsent");
            await SubmitFormAsync();

            await Page.WaitForSelectorAsync(".auth-message.auth-error, .verify-card", new() { Timeout = 10000 });

            // Assert — either redirected to verify page (success) or shows validation error
            Assert.That(Page.Url, Does.Not.Contain("Exception"),
                $"Payload '{Truncate(payload, 40)}' caused error page");

            var bodyText = await Page.TextContentAsync("body") ?? "";
            Assert.That(bodyText, Does.Not.Contain("Internal Server Error"),
                $"Payload '{Truncate(payload, 40)}' caused 500 page");

            var url = Page.Url;
            if (!url.Contains("register", StringComparison.OrdinalIgnoreCase))
            {
                Assert.That(url, Does.Contain("verify-email").Or.Contain("EmailVerification"),
                    $"Payload '{Truncate(payload, 40)}' redirected to unexpected page: {url}");
            }
        }
    }

    private static string EscapeJson(string raw) =>
        raw.Replace("\\", "\\\\")
           .Replace("\"", "\\\"")
           .Replace("\n", "\\n")
           .Replace("\r", "\\r")
           .Replace("\t", "\\t");
}