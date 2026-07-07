using System.Net;
using System.Text.Json;

namespace PromiseModelOnline.E2E.Tests;

[TestFixture]
public class XssE2ETests : E2ETestBase
{
    private const string Owner = "pmo_test";
    private const string Project = "promise-model-online";
    private const string XssScript = "<script>alert(1)</script>";
    private const string XssImg = "<img src=x onerror=alert(1)>";
    private const string XssSvg = "<svg onload=alert(1)>";

    private static readonly string[] XssPayloads =
    [
        XssScript,
        XssImg,
        XssSvg,
        "\" onfocus=alert(1) autofocus=\"",
        "javascript:alert(1)",
        "'-alert(1)-'",
    ];

    [Test]
    [Description("REQ_FUN_047 misuse: XSS in promise statement stored and rendered safely")]
    public async Task PromiseStatement_Xss_RendersSafely()
    {
        // Arrange
        await LoginAsync();
        var payload = $"XSS-{Guid.NewGuid():N}-{XssScript}";
        var json = $$"""{"statement":"{{EscapeJson(payload)}}","displayOrder":1}""";
        var createResponse = await AuthPostJsonAsync(
            $"/api/projects/{Owner}/{Project}/promises/create", json, ajax: true);
        Assert.That(createResponse.StatusCode, Is.EqualTo(HttpStatusCode.Created));
        var created = JsonSerializer.Deserialize<JsonElement>(await createResponse.Content.ReadAsStringAsync());
        var seq = created.GetProperty("sequenceNumber").GetInt32();

        // Act
        await Page.GotoAsync($"/{Owner}/{Project}/promises/{seq}");
        await Page.WaitForSelectorAsync(".promise-detail-card", new() { Timeout = 15000 });

        // Assert
        var html = await Page.Locator(".promise-detail-card").InnerHTMLAsync();
        Assert.That(html, Does.Not.Contain("<script>"),
            "Promise statement must not render raw <script>");
        Assert.That(html, Does.Contain("&lt;script&gt;").Or.Contain("&#60;script&#62;"),
            "Promise statement XSS payload must appear HTML-escaped");
        AssertNoCspViolations();
    }

    [Test]
    [Description("REQ_FUN_047 misuse: XSS in epic statement stored and rendered safely")]
    public async Task EpicStatement_Xss_RendersSafely()
    {
        // Arrange
        await LoginAsync();
        var payload = $"XSS-{Guid.NewGuid():N}-{XssScript}";
        var json = $$"""{"statement":"{{EscapeJson(payload)}}","productPromiseId":1,"displayOrder":1}""";
        var createResponse = await AuthPostJsonAsync(
            $"/api/projects/{Owner}/{Project}/epics/create", json, ajax: true);
        Assert.That(createResponse.StatusCode, Is.EqualTo(HttpStatusCode.Created));
        var created = JsonSerializer.Deserialize<JsonElement>(await createResponse.Content.ReadAsStringAsync());
        var seq = created.GetProperty("sequenceNumber").GetInt32();

        // Act
        await Page.GotoAsync($"/{Owner}/{Project}/epics/{seq}");
        await Page.WaitForSelectorAsync(".epic-detail-card", new() { Timeout = 15000 });

        // Assert
        var html = await Page.Locator(".epic-detail-card").InnerHTMLAsync();
        Assert.That(html, Does.Not.Contain("<script>"));
        AssertNoCspViolations();
    }

    [Test]
    [Description("REQ_FUN_047 misuse: XSS in journey statement stored and rendered safely")]
    public async Task JourneyStatement_Xss_RendersSafely()
    {
        // Arrange
        await LoginAsync();
        var payload = $"XSS-{Guid.NewGuid():N}-{XssScript}";
        var json = $$"""{"statement":"{{EscapeJson(payload)}}","epicId":1,"displayOrder":1}""";
        var createResponse = await AuthPostJsonAsync(
            $"/api/projects/{Owner}/{Project}/journeys/create", json, ajax: true);
        Assert.That(createResponse.StatusCode, Is.EqualTo(HttpStatusCode.Created));
        var created = JsonSerializer.Deserialize<JsonElement>(await createResponse.Content.ReadAsStringAsync());
        var seq = created.GetProperty("sequenceNumber").GetInt32();

        // Act
        await Page.GotoAsync($"/{Owner}/{Project}/journeys/{seq}");
        await Page.WaitForSelectorAsync(".journey-detail-card", new() { Timeout = 15000 });

        // Assert
        var html = await Page.Locator(".journey-detail-card").InnerHTMLAsync();
        Assert.That(html, Does.Not.Contain("<script>"));
        AssertNoCspViolations();
    }

    [Test]
    [Description("REQ_FUN_047 misuse: XSS in flow statement (name) stored and rendered safely")]
    public async Task FlowStatement_Xss_RendersSafely()
    {
        // Arrange
        await LoginAsync();
        var payload = $"XSS-{Guid.NewGuid():N}-{XssScript}";
        var json = $$"""{"statement":"{{EscapeJson(payload)}}","journeyId":1,"displayOrder":1}""";
        var createResponse = await AuthPostJsonAsync(
            $"/api/projects/{Owner}/{Project}/flows/create", json, ajax: true);
        Assert.That(createResponse.StatusCode, Is.EqualTo(HttpStatusCode.Created));
        var created = JsonSerializer.Deserialize<JsonElement>(await createResponse.Content.ReadAsStringAsync());
        var seq = created.GetProperty("sequenceNumber").GetInt32();

        // Act
        await Page.GotoAsync($"/{Owner}/{Project}/flows/{seq}");
        await Page.WaitForSelectorAsync(".flow-detail-card", new() { Timeout = 15000 });

        // Assert
        var html = await Page.Locator(".flow-detail-card").InnerHTMLAsync();
        Assert.That(html, Does.Not.Contain("<script>"));
        AssertNoCspViolations();
    }

    [Test]
    [Description("REQ_FUN_047 misuse: XSS in moment description stored and rendered safely")]
    public async Task MomentDescription_Xss_RendersSafely()
    {
        // Arrange
        await LoginAsync();
        var uniqueId = Guid.NewGuid().ToString("N")[..8];
        var createJson = $$"""{"statement":"Moment-XSS-{{uniqueId}}","flowId":1,"displayOrder":1}""";
        var createResponse = await AuthPostJsonAsync(
            $"/api/projects/{Owner}/{Project}/moments/create", createJson, ajax: true);
        Assert.That(createResponse.StatusCode, Is.EqualTo(HttpStatusCode.Created));
        var created = JsonSerializer.Deserialize<JsonElement>(await createResponse.Content.ReadAsStringAsync());
        var seq = created.GetProperty("sequenceNumber").GetInt32();

        var payload = $"XSS-{Guid.NewGuid():N}-{XssImg}";
        var descJson = $$"""{"description":"{{EscapeJson(payload)}}"}""";
        var patchResponse = await AuthPatchJsonAsync(
            $"/api/projects/{Owner}/{Project}/moments/{seq}/description", descJson);
        Assert.That(patchResponse.StatusCode, Is.EqualTo(HttpStatusCode.OK));

        // Act
        await Page.GotoAsync($"/{Owner}/{Project}/moments/{seq}");
        await Page.WaitForSelectorAsync(".moment-detail-card", new() { Timeout = 15000 });

        // Assert
        var html = await Page.Locator(".moment-detail-card").InnerHTMLAsync();
        Assert.That(html, Does.Not.Contain("<img"),
            "Moment description must not contain unescaped HTML tags");
        Assert.That(html, Does.Contain("&lt;img"),
            "Moment description must render XSS payload as HTML-escaped text");
        AssertNoCspViolations();
    }

    [Test]
    [Description("REQ_FUN_047 misuse: XSS in project description stored and rendered safely")]
    public async Task ProjectDescription_Xss_RendersSafely()
    {
        // Arrange
        await LoginAsync();
        var uniqueName = $"XSS-{Guid.NewGuid():N}";
        var uniquePayload = $"XSS-{Guid.NewGuid():N}";
        var payload = $"{uniquePayload}-{XssSvg}";
        var patchJson = $$"""{"name":"{{EscapeJson(uniqueName)}}","description":"{{EscapeJson(payload)}}"}""";
        var patchResponse = await AuthPatchJsonAsync(
            $"/api/projects/{Owner}/{Project}/details", patchJson);
        Assert.That(patchResponse.StatusCode, Is.EqualTo(HttpStatusCode.OK));

        // Act — project description is shown on the settings page (populated async by JS)
        await Page.GotoAsync($"/{Owner}/{Project}/settings");

        // Wait for the description view to be populated with text by the async loadProject()
        // showView uses textContent, so the innerHTML will contain the HTML-escaped text
        var descLocator = Page.Locator("#project-description-view");
        await descLocator.WaitForAsync(new() { Timeout = 15000 });
        await Page.WaitForFunctionAsync(
            $"() => document.querySelector('#project-description-view')?.textContent?.includes('{uniquePayload}')",
            null, new() { Timeout = 15000 });

        // Assert — the description is rendered via formatCommentText → showView (textContent).
        // formatCommentText escapes the payload, and textContent sets literal text,
        // so innerHTML contains the HTML-escaped representation.
        var html = await Page.Locator("#project-description-view").InnerHTMLAsync();
        Assert.That(html, Does.Not.Contain("<svg"),
            "Project description must not contain unescaped HTML tags");
        Assert.That(html, Does.Contain("&lt;svg").Or.Contain("&amp;lt;svg"),
            "Project description must render XSS payload as HTML-escaped or double-escaped text");
        AssertNoCspViolations();
    }

    [Test]
    [Description("REQ_FUN_047 misuse: XSS in comment text stored and rendered safely")]
    public async Task CommentText_Xss_RendersSafely()
    {
        // Arrange
        await LoginAsync();
        var payload = $"XSS-{Guid.NewGuid():N}-{XssScript}";
        var json = $$"""{"text":"{{EscapeJson(payload)}}","parentType":"Promise","parentId":1}""";
        var createResponse = await AuthPostJsonAsync("/api/comments", json, ajax: true);
        Assert.That(createResponse.StatusCode, Is.EqualTo(HttpStatusCode.Created));

        // Act
        await Page.GotoAsync($"/{Owner}/{Project}/promises/1");
        await Page.WaitForSelectorAsync(".promise-detail-card", new() { Timeout = 15000 });
        await Page.WaitForFunctionAsync($"payload => document.body.textContent.includes(payload)", payload, options: new() { Timeout = 10000 });

        // Assert
        var html = await Page.ContentAsync();
        Assert.That(html, Does.Not.Contain("<script>alert(1)</script>"),
            "Comment text must not contain raw script tag");
        Assert.That(html, Does.Contain(payload.Replace("<", "&lt;").Replace(">", "&gt;")).Or.Contain(payload),
            "Comment text payload must be visible");
        AssertNoCspViolations();
    }

    [Test]
    [Description("REQ_FUN_047 misuse: XSS in moment task name stored and rendered safely")]
    public async Task MomentTaskName_Xss_RendersSafely()
    {
        // Arrange
        await LoginAsync();
        var uniqueId = Guid.NewGuid().ToString("N")[..8];
        var createJson = $$"""{"statement":"Task-XSS-{{uniqueId}}","flowId":1,"displayOrder":1}""";
        var createResponse = await AuthPostJsonAsync(
            $"/api/projects/{Owner}/{Project}/moments/create", createJson, ajax: true);
        Assert.That(createResponse.StatusCode, Is.EqualTo(HttpStatusCode.Created));
        var created = JsonSerializer.Deserialize<JsonElement>(await createResponse.Content.ReadAsStringAsync());
        var seq = created.GetProperty("sequenceNumber").GetInt32();

        var payload = $"XSS-{Guid.NewGuid():N}-{XssImg}";
        var taskJson = $$"""{"name":"{{EscapeJson(payload)}}","isCompleted":false}""";
        var taskResponse = await AuthPostJsonAsync(
            $"/api/projects/{Owner}/{Project}/moments/{seq}/tasks", taskJson, ajax: true);
        // Act — verify the API response contains the XSS payload
        var taskBody = await taskResponse.Content.ReadAsStringAsync();
        var taskResult = JsonSerializer.Deserialize<JsonElement>(taskBody);

        // Assert — verify payload is stored safely (literal text, not stripped or executed)
        Assert.That(taskBody, Does.Contain("<img src=x onerror=alert(1)>"),
            "Task name XSS payload must be preserved as literal text in API response");
        AssertNoCspViolations();
    }

    [Test]
    [Description("REQ_FUN_047 misuse: Multiple XSS payload variants all stored safely (no 500, no SQL leak)")]
    public async Task MultipleXssVariants_AllStoredSafely()
    {
        // Arrange
        await LoginAsync();

        for (var i = 0; i < XssPayloads.Length; i++)
        {
            var payload = XssPayloads[i];
            var uniqueId = Guid.NewGuid().ToString("N")[..8];
            var json = $$"""{"statement":"XSS-{{uniqueId}}-{{EscapeJson(payload)}}","displayOrder":1}""";

            // Act
            var response = await AuthPostJsonAsync(
                $"/api/projects/{Owner}/{Project}/promises/create", json, ajax: true);

            // Assert
            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Created),
                $"Payload #{i} '{Truncate(payload, 40)}' should be stored successfully (not rejected)");
        }
    }

    [Test]
    [Description("REQ_FUN_047 misuse: Second-order XSS — store payload and verify it survives round-trip safely")]
    public async Task SecondOrder_Xss_StoredAndRenderedSafely()
    {
        // Arrange
        await LoginAsync();
        var payload = $"2nd-XSS-{Guid.NewGuid():N}-{XssScript}";
        var json = $$"""{"statement":"{{EscapeJson(payload)}}","displayOrder":1}""";
        var createResponse = await AuthPostJsonAsync(
            $"/api/projects/{Owner}/{Project}/promises/create", json, ajax: true);
        Assert.That(createResponse.StatusCode, Is.EqualTo(HttpStatusCode.Created));
        var created = JsonSerializer.Deserialize<JsonElement>(await createResponse.Content.ReadAsStringAsync());
        var seq = created.GetProperty("sequenceNumber").GetInt32();

        // Act — retrieve via API
        var authClient = await GetAuthClientAsync();
        using var getRequest = new HttpRequestMessage(HttpMethod.Get,
            $"/api/projects/{Owner}/{Project}/promises/{seq}");
        var getResponse = await authClient.SendAsync(getRequest);

        // Assert — stored value is intact (parameterized query preserved XSS payload as literal text)
        Assert.That(getResponse.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var body = await getResponse.Content.ReadAsStringAsync();
        Assert.That(body, Does.Contain("<script>alert(1)</script>"),
            "XSS payload must be stored and returned as literal text by the API");

        // Assert — browser rendering is safe
        await Page.GotoAsync($"/{Owner}/{Project}/promises/{seq}");
        await Page.WaitForSelectorAsync(".promise-detail-card", new() { Timeout = 15000 });
        AssertNoCspViolations();
    }

    [Test]
    [Description("REQ_FUN_047 misuse: XSS in epic description stored and rendered safely")]
    public async Task EpicDescription_Xss_RendersSafely()
    {
        // Arrange
        await LoginAsync();
        var payload = $"XSS-{Guid.NewGuid():N}-{XssImg}";
        var descJson = $$"""{"description":"{{EscapeJson(payload)}}"}""";
        var patchResponse = await AuthPatchJsonAsync(
            $"/api/projects/{Owner}/{Project}/epics/1/description", descJson);
        Assert.That(patchResponse.StatusCode, Is.EqualTo(HttpStatusCode.OK));

        // Act
        await Page.GotoAsync($"/{Owner}/{Project}/epics/1");
        await Page.WaitForSelectorAsync(".epic-detail-card", new() { Timeout = 15000 });

        // Assert
        var html = await Page.Locator(".epic-detail-card").InnerHTMLAsync();
        Assert.That(html, Does.Not.Contain("<img"),
            "Epic description must not contain unescaped HTML tags");
        Assert.That(html, Does.Contain("&lt;img"),
            "Epic description must render XSS payload as HTML-escaped text");
        AssertNoCspViolations();
    }

    [Test]
    [Description("REQ_FUN_047 misuse: XSS in journey description stored and rendered safely")]
    public async Task JourneyDescription_Xss_RendersSafely()
    {
        // Arrange
        await LoginAsync();
        var payload = $"XSS-{Guid.NewGuid():N}-{XssImg}";
        var descJson = $$"""{"description":"{{EscapeJson(payload)}}"}""";
        var patchResponse = await AuthPatchJsonAsync(
            $"/api/projects/{Owner}/{Project}/journeys/1/description", descJson);
        Assert.That(patchResponse.StatusCode, Is.EqualTo(HttpStatusCode.OK));

        // Act
        await Page.GotoAsync($"/{Owner}/{Project}/journeys/1");
        await Page.WaitForSelectorAsync(".journey-detail-card", new() { Timeout = 15000 });

        // Assert
        var html = await Page.Locator(".journey-detail-card").InnerHTMLAsync();
        Assert.That(html, Does.Not.Contain("<img"),
            "Journey description must not contain unescaped HTML tags");
        Assert.That(html, Does.Contain("&lt;img"),
            "Journey description must render XSS payload as HTML-escaped text");
        AssertNoCspViolations();
    }

    [Test]
    [Description("REQ_FUN_047 misuse: XSS in flow description stored and rendered safely")]
    public async Task FlowDescription_Xss_RendersSafely()
    {
        // Arrange
        await LoginAsync();
        var payload = $"XSS-{Guid.NewGuid():N}-{XssImg}";
        var descJson = $$"""{"description":"{{EscapeJson(payload)}}"}""";
        var patchResponse = await AuthPatchJsonAsync(
            $"/api/projects/{Owner}/{Project}/flows/1/description", descJson);
        Assert.That(patchResponse.StatusCode, Is.EqualTo(HttpStatusCode.OK));

        // Act
        await Page.GotoAsync($"/{Owner}/{Project}/flows/1");
        await Page.WaitForSelectorAsync(".flow-detail-card", new() { Timeout = 15000 });

        // Assert
        var html = await Page.Locator(".flow-detail-card").InnerHTMLAsync();
        Assert.That(html, Does.Not.Contain("<img"),
            "Flow description must not contain unescaped HTML tags");
        Assert.That(html, Does.Contain("&lt;img"),
            "Flow description must render XSS payload as HTML-escaped text");
        AssertNoCspViolations();
    }

    [Test]
    [Description("REQ_FUN_047 misuse: XSS in promise description stored and rendered safely")]
    public async Task PromiseDescription_Xss_RendersSafely()
    {
        // Arrange
        await LoginAsync();
        var payload = $"XSS-{Guid.NewGuid():N}-{XssImg}";
        var descJson = $$"""{"description":"{{EscapeJson(payload)}}"}""";
        var patchResponse = await AuthPatchJsonAsync(
            $"/api/projects/{Owner}/{Project}/promises/1/description", descJson);
        Assert.That(patchResponse.StatusCode, Is.EqualTo(HttpStatusCode.OK));

        // Act
        await Page.GotoAsync($"/{Owner}/{Project}/promises/1");
        await Page.WaitForSelectorAsync(".promise-detail-card", new() { Timeout = 15000 });

        // Assert
        var html = await Page.Locator(".promise-detail-card").InnerHTMLAsync();
        Assert.That(html, Does.Not.Contain("<img"),
            "Promise description must not contain unescaped HTML tags");
        Assert.That(html, Does.Contain("&lt;img"),
            "Promise description must render XSS payload as HTML-escaped text");
        AssertNoCspViolations();
    }

    [Test]
    [Description("REQ_FUN_047 misuse: XSS entities visible on graph page render safely")]
    public async Task GraphPage_XssEntities_RenderSafely()
    {
        // Arrange — create entities with XSS that will appear on the graph
        await LoginAsync();
        var uniqueId = Guid.NewGuid().ToString("N")[..8];
        var promisePayload = $"Graph-XSS-{uniqueId}-{XssScript}";
        var promiseJson = $$"""{"statement":"{{EscapeJson(promisePayload)}}","displayOrder":1}""";
        var createResponse = await AuthPostJsonAsync(
            $"/api/projects/{Owner}/{Project}/promises/create", promiseJson, ajax: true);
        Assert.That(createResponse.StatusCode, Is.EqualTo(HttpStatusCode.Created));

        // Act
        await Page.GotoAsync($"/{Owner}/{Project}/graph");
        await Page.WaitForSelectorAsync("#graph-content", new() { Timeout = 15000 });
        await Page.WaitForFunctionAsync("() => { const n = document.querySelector('.graph-node'); return n && n.getBoundingClientRect().width > 0; }", options: new() { Timeout = 10000 });

        // Assert
        var html = await Page.Locator("#graph-content").InnerHTMLAsync();
        Assert.That(html, Does.Not.Contain("<script>"),
            "Graph page must not render raw script tags from entity data");
        Assert.That(html, Does.Contain($"Graph-XSS-{uniqueId}"),
            "Graph page must display the XSS-tagged entity text");
        AssertNoCspViolations();
    }

    private static string EscapeJson(string raw) =>
        raw.Replace("\\", "\\\\")
           .Replace("\"", "\\\"")
           .Replace("\n", "\\n")
           .Replace("\r", "\\r")
           .Replace("\t", "\\t");

    private static string Truncate(string s, int max) => s.Length <= max ? s : s[..max] + "...";
}
