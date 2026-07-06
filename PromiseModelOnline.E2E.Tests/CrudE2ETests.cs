using System.Buffers;
using System.Net;
using System.Text;
using System.Text.Json;
using Microsoft.Playwright;
using NUnit.Framework;

namespace PromiseModelOnline.E2E.Tests;

[TestFixture]
public class CrudE2ETests : E2ETestBase
{
    private const string Owner = "pmo_test";
    private const string Project = "promise-model-online";

    private static readonly SearchValues<char> UrlDelimiters = SearchValues.Create(['/', '?', '#']);

    // ──────────────────────────────
    //  Helper: parse entity seq from URL
    // ──────────────────────────────

    private static int ParseSeqFromUrl(string url, string segment)
    {
        var pattern = $"/{segment}/";
        var idx = url.LastIndexOf(pattern, StringComparison.OrdinalIgnoreCase);
        if (idx < 0) throw new InvalidOperationException($"Could not find /{segment}/ in URL: {url}");
        var after = url[(idx + pattern.Length)..];
        var end = after.AsSpan().IndexOfAny(UrlDelimiters);
        if (end > 0) after = after[..end];
        return int.Parse(after);
    }

    private static int ParseSeqFromJson(string json, string property = "sequenceNumber")
    {
        using var doc = JsonDocument.Parse(json);
        return doc.RootElement.GetProperty(property).GetInt32();
    }

    // ──────────────────────────────
    //  Entity CREATE tests (UI + API verify)
    // ──────────────────────────────

    [Test]
    [Description("REQ-FUN-005: Create epic via inline-add form on promise detail, then verify via API")]
    public async Task CreateEpic_OnPromiseDetail_CreatesAndDisplaysEpic()
    {
        // Arrange
        await LoginAsync();
        var statement = $"E2E Epic {Guid.NewGuid():N}";

        // Act
        await Page.GotoAsync($"/{Owner}/{Project}/promises/1");
        await Page.WaitForSelectorAsync("#promise-detail-content", new() { Timeout = 15000 });
        await Page.WaitForSelectorAsync("#promise-epics-list", new() { Timeout = 10000 });
        await Page.WaitForSelectorAsync("#add-epic-statement", new() { Timeout = 5000 });
        await Page.FillAsync("#add-epic-statement", statement);
        await Page.ClickAsync("#add-epic-submit");
        await Page.WaitForSelectorAsync($"text={statement}", new() { Timeout = 10000 });

        // Assert
        AssertNoCspViolations();
        var response = await AuthGetAsync($"/api/projects/{Owner}/{Project}/epics?promiseSeq=1");
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var body = await response.Content.ReadAsStringAsync();
        Assert.That(body, Does.Contain(statement));
    }

    [Test]
    [Description("REQ-FUN-006: Create journey via inline-add form on epic detail, then verify via API")]
    public async Task CreateJourney_OnEpicDetail_CreatesAndDisplaysJourney()
    {
        // Arrange
        await LoginAsync();
        var statement = $"E2E Journey {Guid.NewGuid():N}";

        // Act
        await Page.GotoAsync($"/{Owner}/{Project}/epics/1");
        await Page.WaitForSelectorAsync("#epic-detail-content", new() { Timeout = 15000 });
        await Page.WaitForSelectorAsync("#epic-journeys-list", new() { Timeout = 10000 });
        await Page.WaitForSelectorAsync("#add-journey-statement", new() { Timeout = 5000 });
        await Page.FillAsync("#add-journey-statement", statement);
        await Page.ClickAsync("#add-journey-submit");
        await Page.WaitForSelectorAsync($"text={statement}", new() { Timeout = 10000 });

        // Assert
        AssertNoCspViolations();
        var response = await AuthGetAsync($"/api/projects/{Owner}/{Project}/journeys?epicSeq=1");
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var body = await response.Content.ReadAsStringAsync();
        Assert.That(body, Does.Contain(statement));
    }

    [Test]
    [Description("REQ-FUN-007: Create flow via inline-add form on journey detail, then verify via API")]
    public async Task CreateFlow_OnJourneyDetail_CreatesAndDisplaysFlow()
    {
        // Arrange
        await LoginAsync();
        var statement = $"E2E Flow {Guid.NewGuid():N}";

        // Act
        await Page.GotoAsync($"/{Owner}/{Project}/journeys/1");
        await Page.WaitForSelectorAsync("#journey-detail-content", new() { Timeout = 15000 });
        await Page.WaitForSelectorAsync("#journey-flows-list", new() { Timeout = 10000 });
        await Page.WaitForSelectorAsync("#add-flow-statement", new() { Timeout = 5000 });
        await Page.FillAsync("#add-flow-statement", statement);
        await Page.ClickAsync("#add-flow-submit");
        await Page.WaitForSelectorAsync($"text={statement}", new() { Timeout = 10000 });

        // Assert
        AssertNoCspViolations();
        var response = await AuthGetAsync($"/api/projects/{Owner}/{Project}/flows?journeySeq=1");
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var body = await response.Content.ReadAsStringAsync();
        Assert.That(body, Does.Contain(statement));
    }

    [Test]
    [Description("REQ-FUN-008: Create moment via inline-add form on flow detail, then verify via API")]
    public async Task CreateMoment_OnFlowDetail_CreatesAndDisplaysMoment()
    {
        // Arrange
        await LoginAsync();
        var statement = $"E2E Moment {Guid.NewGuid():N}";

        // Act
        await Page.GotoAsync($"/{Owner}/{Project}/flows/1");
        await Page.WaitForSelectorAsync("#flow-detail-content", new() { Timeout = 15000 });
        await Page.WaitForSelectorAsync("#add-moment-statement", new() { Timeout = 10000 });
        await Page.FillAsync("#add-moment-statement", statement);
        await Page.SelectOptionAsync("#add-moment-type", new SelectOptionValue { Label = "Story" });
        await Page.ClickAsync("#add-moment-submit");
        await Page.WaitForSelectorAsync($"text={statement}", new() { Timeout = 10000 });

        // Assert
        AssertNoCspViolations();
        var response = await AuthGetAsync($"/api/projects/{Owner}/{Project}/moments?flowSeq=1");
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var body = await response.Content.ReadAsStringAsync();
        Assert.That(body, Does.Contain(statement));
    }

    [Test]
    [Description("REQ-FUN-023: Create stride via modal on project page, then verify via API")]
    public async Task CreateStride_OnProjectPage_CreatesAndDisplaysStride()
    {
        // Arrange
        await LoginAsync();
        var strideName = $"E2E Stride {Guid.NewGuid():N}";
        var tomorrow = DateTime.UtcNow.AddDays(1).ToString("yyyy-MM-dd");
        var dayAfter = DateTime.UtcNow.AddDays(15).ToString("yyyy-MM-dd");

        // Act
        await Page.GotoAsync($"/{Owner}/{Project}");
        await Page.WaitForSelectorAsync("#stride-board", new() { Timeout = 15000 });
        await Page.WaitForSelectorAsync("#create-stride-btn", new() { Timeout = 10000 });
        await Page.ClickAsync("#create-stride-btn");
        await Page.WaitForSelectorAsync("#stride-create-modal.show", new() { Timeout = 5000 });
        await Page.FillAsync("#stride-create-name", strideName);
        await Page.SelectOptionAsync("#stride-create-iteration", new SelectOptionValue { Index = 0 });
        await Page.FillAsync("#stride-create-start", tomorrow);
        await Page.FillAsync("#stride-create-end", dayAfter);
        await Page.ClickAsync("#stride-create-submit");
        await Page.WaitForSelectorAsync($"text={strideName}", new() { Timeout = 10000 });

        // Assert
        AssertNoCspViolations();
        var stridesResp = await AuthGetAsync($"/api/projects/{Owner}/{Project}/strides");
        Assert.That(stridesResp.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var stridesBody = await stridesResp.Content.ReadAsStringAsync();
        Assert.That(stridesBody, Does.Contain(strideName));
    }

    [Test]
    [Description("REQ-FUN-023: Create iteration via modal on iterations page, then verify via API")]
    public async Task CreateIteration_OnIterationsPage_CreatesAndDisplaysIteration()
    {
        // Arrange
        await LoginAsync();
        var name = $"E2E Iteration {Guid.NewGuid():N}";

        // Act
        await Page.GotoAsync($"/{Owner}/{Project}/iterations");
        await Page.WaitForSelectorAsync("#iterations-view", new() { Timeout = 15000 });
        await Page.WaitForSelectorAsync("#create-iteration-btn", new() { Timeout = 10000 });
        await Page.ClickAsync("#create-iteration-btn");
        await Page.WaitForSelectorAsync("#iteration-create-modal.show", new() { Timeout = 5000 });
        await Page.FillAsync("#iteration-create-name", name);
        await Page.ClickAsync("#iteration-create-submit");
        await Page.WaitForSelectorAsync($"text={name}", new() { Timeout = 10000 });

        // Assert
        AssertNoCspViolations();
        var response = await AuthGetAsync($"/api/projects/{Owner}/{Project}/iterations");
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var body = await response.Content.ReadAsStringAsync();
        Assert.That(body, Does.Contain(name));
    }

    // ──────────────────────────────
    //  Entity UPDATE tests
    // ──────────────────────────────

    [Test]
    [Description("REQ-FUN-011: Update project title and description via settings page, then verify via API")]
    public async Task UpdateProjectDetails_SettingsPage_SavesSuccessfully()
    {
        // Arrange
        await LoginAsync();
        var newTitle = $"E2E Updated Title {Guid.NewGuid():N}";
        var newDesc = $"E2E Updated Description {Guid.NewGuid():N}";

        // Act
        await Page.GotoAsync($"/{Owner}/{Project}/settings");
        await Page.WaitForSelectorAsync("#project-settings-form", new() { Timeout = 15000 });
        await Page.ClickAsync("#edit-project-title-btn");
        await Page.ClickAsync("#edit-project-desc-btn");
        await Page.WaitForSelectorAsync("#save-project-settings-btn", new() { Timeout = 5000 });
        await Page.FillAsync("#project-title-input", newTitle);
        await Page.FillAsync("#project-description-input", newDesc);
        await Page.ClickAsync("#save-project-settings-btn");
        var successOrError = await Page.WaitForSelectorAsync("#success-text:not(:empty), #error-text:not(:empty)", new() { Timeout = 10000, State = WaitForSelectorState.Attached });
        var text = await successOrError!.InnerTextAsync();

        // Assert
        Assert.That(text, Does.Contain("saved").Or.Contains("error").Or.Contains("required"));
        AssertNoCspViolations();
        var getResp = await AuthGetAsync($"/api/projects/{Owner}/{Project}");
        Assert.That(getResp.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var body = await getResp.Content.ReadAsStringAsync();
        Assert.That(body, Does.Contain(newTitle));
        Assert.That(body, Does.Contain(newDesc));
    }

    [Test]
    [Description("REQ-FUN-011: Update epic description via API PATCH")]
    public async Task UpdateEpicDescription_Api_Succeeds()
    {
        // Arrange
        await LoginAsync();
        var newDesc = $"E2E Epic desc {Guid.NewGuid():N}";
        var patchJson = JsonSerializer.Serialize(new { description = newDesc });

        // Act
        var resp = await AuthPatchJsonAsync($"/api/projects/{Owner}/{Project}/epics/1/description", patchJson);

        // Assert
        Assert.That(resp.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var getResp = await AuthGetAsync($"/api/projects/{Owner}/{Project}/epics/1");
        var body = await getResp.Content.ReadAsStringAsync();
        Assert.That(body, Does.Contain(newDesc));
    }

    [Test]
    [Description("REQ-FUN-011: Update journey description via API PATCH")]
    public async Task UpdateJourneyDescription_Api_Succeeds()
    {
        // Arrange
        await LoginAsync();
        var newDesc = $"E2E Journey desc {Guid.NewGuid():N}";
        var patchJson = JsonSerializer.Serialize(new { description = newDesc });

        // Act
        var resp = await AuthPatchJsonAsync($"/api/projects/{Owner}/{Project}/journeys/1/description", patchJson);

        // Assert
        Assert.That(resp.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var getResp = await AuthGetAsync($"/api/projects/{Owner}/{Project}/journeys/1");
        var body = await getResp.Content.ReadAsStringAsync();
        Assert.That(body, Does.Contain(newDesc));
    }

    [Test]
    [Description("REQ-FUN-011: Update flow description via API PATCH")]
    public async Task UpdateFlowDescription_Api_Succeeds()
    {
        // Arrange
        await LoginAsync();
        var newDesc = $"E2E Flow desc {Guid.NewGuid():N}";
        var patchJson = JsonSerializer.Serialize(new { description = newDesc });

        // Act
        var resp = await AuthPatchJsonAsync($"/api/projects/{Owner}/{Project}/flows/1/description", patchJson);

        // Assert
        Assert.That(resp.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var getResp = await AuthGetAsync($"/api/projects/{Owner}/{Project}/flows/1");
        var body = await getResp.Content.ReadAsStringAsync();
        Assert.That(body, Does.Contain(newDesc));
    }

    [Test]
    [Description("REQ-FUN-027: Update moment status via API PATCH")]
    public async Task UpdateMomentStatus_Api_Succeeds()
    {
        // Arrange
        await LoginAsync();
        var momentSeq = await CreateFreshMomentSeqAsync();

        // Act
        var patchJson = JsonSerializer.Serialize(new { newStatus = "InProgress" });
        var resp = await AuthPatchJsonAsync($"/api/projects/{Owner}/{Project}/moments/{momentSeq}/status", patchJson);

        // Assert
        Assert.That(resp.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var getResp = await AuthGetAsync($"/api/projects/{Owner}/{Project}/moments/{momentSeq}");
        var body = await getResp.Content.ReadAsStringAsync();
        Assert.That(body, Does.Contain("InProgress"));
    }

    [Test]
    [Description("REQ-FUN-029: Update moment effort estimate via API PATCH")]
    public async Task UpdateMomentEstimate_Api_Succeeds()
    {
        // Arrange
        await LoginAsync();
        var momentSeq = await CreateFreshMomentSeqAsync();

        // Act
        var patchJson = JsonSerializer.Serialize(new { estimate = "S" });
        var resp = await AuthPatchJsonAsync($"/api/projects/{Owner}/{Project}/moments/{momentSeq}/estimate", patchJson);

        // Assert
        Assert.That(resp.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var getResp = await AuthGetAsync($"/api/projects/{Owner}/{Project}/moments/{momentSeq}");
        var body = await getResp.Content.ReadAsStringAsync();
        Assert.That(body, Does.Contain("\"effortEstimate\":\"S\""));
    }

    [Test]
    [Description("REQ-FUN-008: Update moment type via API PATCH")]
    public async Task UpdateMomentType_Api_Succeeds()
    {
        // Arrange
        await LoginAsync();
        var momentSeq = await CreateFreshMomentSeqAsync();

        // Act
        var patchJson = JsonSerializer.Serialize(new { newType = "Job" });
        var resp = await AuthPatchJsonAsync($"/api/projects/{Owner}/{Project}/moments/{momentSeq}/type", patchJson);

        // Assert
        Assert.That(resp.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var getResp = await AuthGetAsync($"/api/projects/{Owner}/{Project}/moments/{momentSeq}");
        var body = await getResp.Content.ReadAsStringAsync();
        Assert.That(body, Does.Contain("\"type\":\"Job\""));
    }

    [Test]
    [Description("REQ-FUN-020: Update moment owner via API PATCH")]
    public async Task UpdateMomentOwner_Api_Succeeds()
    {
        // Arrange
        await LoginAsync();
        var momentSeq = await CreateFreshMomentSeqAsync();
        using var client = await GetAuthClientAsync();
        var userSearchResp = await client.GetAsync($"/api/users/search?q=pmo_test2");
        Assert.That(userSearchResp.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var usersJson = await userSearchResp.Content.ReadAsStringAsync();
        using var usersDoc = JsonDocument.Parse(usersJson);
        var userId = usersDoc.RootElement[0].GetProperty("id").GetInt32();
        var patchJson = JsonSerializer.Serialize(new { userId });

        // Act
        var resp = await AuthPatchJsonAsync($"/api/projects/{Owner}/{Project}/moments/{momentSeq}/owner", patchJson);

        // Assert
        Assert.That(resp.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var getResp = await AuthGetAsync($"/api/projects/{Owner}/{Project}/moments/{momentSeq}");
        var body = await getResp.Content.ReadAsStringAsync();
        Assert.That(body, Does.Contain($"\"ownerId\":{userId}"));
    }

    [Test]
    [Description("REQ-FUN-011: Update moment description via API PATCH")]
    public async Task UpdateMomentDescription_Api_Succeeds()
    {
        // Arrange
        await LoginAsync();
        var momentSeq = await CreateFreshMomentSeqAsync();

        // Act
        var newDesc = $"E2E Moment desc {Guid.NewGuid():N}";
        var patchJson = JsonSerializer.Serialize(new { description = newDesc });
        var resp = await AuthPatchJsonAsync($"/api/projects/{Owner}/{Project}/moments/{momentSeq}/description", patchJson);

        // Assert
        Assert.That(resp.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var getResp = await AuthGetAsync($"/api/projects/{Owner}/{Project}/moments/{momentSeq}");
        var body = await getResp.Content.ReadAsStringAsync();
        Assert.That(body, Does.Contain(newDesc));
    }

    [Test]
    [Description("REQ-FUN-025: Report stride progress via API (move unfinished moments)")]
    public async Task UpdateStride_Api_Succeeds()
    {
        // Arrange
        await LoginAsync();
        var (strideId, _) = await CreateFreshStrideAsync(Owner, Project);

        // Act
        var patchJson = JsonSerializer.Serialize(new { progressUnfinishedMoments = true });
        var resp = await AuthPatchJsonAsync($"/api/projects/{Owner}/{Project}/strides/{strideId}", patchJson);

        // Assert
        Assert.That(resp.StatusCode, Is.EqualTo(HttpStatusCode.NoContent));
    }

    [Test]
    [Description("REQ-FUN-025: Post stride progress via API (no body, returns 204)")]
    public async Task UpdateStrideProgress_Api_Succeeds()
    {
        // Arrange
        await LoginAsync();
        var (strideId, _) = await CreateFreshStrideAsync(Owner, Project);

        // Act
        var resp = await AuthPostJsonAsync($"/api/projects/{Owner}/{Project}/strides/{strideId}/progress", "{}");

        // Assert
        Assert.That(resp.StatusCode, Is.EqualTo(HttpStatusCode.NoContent));
    }

    // ──────────────────────────────
    //  Entity DELETE tests
    // ──────────────────────────────

    [Test]
    [Description("REQ-FUN-012: Create and delete a promise via API")]
    public async Task DeletePromise_Api_Succeeds()
    {
        // Arrange
        await LoginAsync();
        var seq = await CreateFreshPromiseSeqAsync();

        // Act
        await AssertDeleteEntityReturns2Xx($"/api/projects/{Owner}/{Project}/promises/{seq}");
    }

    [Test]
    [Description("REQ-FUN-012: Create and delete an epic via API")]
    public async Task DeleteEpic_Api_Succeeds()
    {
        // Arrange
        await LoginAsync();
        var seq = await CreateFreshEpicSeqAsync();

        // Act
        await AssertDeleteEntityReturns2Xx($"/api/projects/{Owner}/{Project}/epics/{seq}");
    }

    [Test]
    [Description("REQ-FUN-012: Create and delete a journey via API")]
    public async Task DeleteJourney_Api_Succeeds()
    {
        // Arrange
        await LoginAsync();
        var seq = await CreateFreshJourneySeqAsync();

        // Act
        await AssertDeleteEntityReturns2Xx($"/api/projects/{Owner}/{Project}/journeys/{seq}");
    }

    [Test]
    [Description("REQ-FUN-012: Create and delete a flow via API")]
    public async Task DeleteFlow_Api_Succeeds()
    {
        // Arrange
        await LoginAsync();
        var seq = await CreateFreshFlowSeqAsync();

        // Act
        await AssertDeleteEntityReturns2Xx($"/api/projects/{Owner}/{Project}/flows/{seq}");
    }

    [Test]
    [Description("REQ-FUN-012: Create and delete a moment via API")]
    public async Task DeleteMoment_Api_Succeeds()
    {
        // Arrange
        await LoginAsync();
        var seq = await CreateFreshMomentSeqAsync();

        // Act
        await AssertDeleteEntityReturns2Xx($"/api/projects/{Owner}/{Project}/moments/{seq}");
    }

    // ──────────────────────────────
    //  MomentTask tests
    // ──────────────────────────────

    [Test]
    [Description("REQ-FUN-032: Create a moment task and toggle its completion via API")]
    public async Task ToggleMomentTaskCompletion_Api_Succeeds()
    {
        // Arrange
        await LoginAsync();
        var momentSeq = await CreateFreshMomentSeqAsync();
        using var client = await GetAuthClientAsync();
        var createJson = JsonSerializer.Serialize(new
        {
            name = $"E2E Task {Guid.NewGuid():N}",
            isCompleted = false,
        });
        var createResp = await client.PostAsync(
            $"/api/projects/{Owner}/{Project}/moments/{momentSeq}/tasks",
            new StringContent(createJson, Encoding.UTF8, "application/json"));
        Assert.That(createResp.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var createBody = await createResp.Content.ReadAsStringAsync();
        var taskId = ParseIntFromJson(createBody, "id");

        // Act
        var toggleJson = JsonSerializer.Serialize(new { isCompleted = true });
        var toggleResp = await AuthPatchJsonAsync(
            $"/api/projects/{Owner}/{Project}/moments/{momentSeq}/tasks/{taskId}/completion", toggleJson);

        // Assert
        Assert.That(toggleResp.StatusCode, Is.EqualTo(HttpStatusCode.OK));
    }

    // ──────────────────────────────
    //  Reaction tests
    // ──────────────────────────────

    [Test]
    [Description("REQ-FUN-017: Create, update, and delete a reaction on a moment via API")]
    public async Task ReactionCreateUpdateDelete_Api_Succeeds()
    {
        // Arrange
        await LoginAsync();
        var momentId = await CreateFreshMomentIdAsync();
        using var client = await GetAuthClientAsync();

        // Act
        var createJson = JsonSerializer.Serialize(new
        {
            stackItemType = "Moment",
            stackItemId = momentId,
            emote = "👍",
        });
        var createResp = await client.PostAsync("/api/reactions",
            new StringContent(createJson, Encoding.UTF8, "application/json"));
        Assert.That(createResp.StatusCode, Is.EqualTo(HttpStatusCode.Created));
        var createBody = await createResp.Content.ReadAsStringAsync();
        var reactionId = ParseIntFromJson(createBody, "id");

        var updateJson = JsonSerializer.Serialize(new { emote = "❤️" });
        var updateResp = await AuthPatchJsonAsync($"/api/reactions/{reactionId}", updateJson);
        Assert.That(updateResp.StatusCode, Is.EqualTo(HttpStatusCode.OK));

        var getResp = await client.GetAsync($"/api/reactions?type=Moment&itemId={momentId}");
        var getBody = await getResp.Content.ReadAsStringAsync();
        Assert.That(getBody, Does.Contain("❤️"));

        var deleteResp = await AuthDeleteAsync($"/api/reactions/{reactionId}");
        Assert.That(deleteResp.StatusCode, Is.EqualTo(HttpStatusCode.NoContent));

        var getAfterResp = await client.GetAsync($"/api/reactions?type=Moment&itemId={momentId}");
        var getAfterBody = await getAfterResp.Content.ReadAsStringAsync();

        // Assert
        Assert.That(getAfterBody, Does.Not.Contain("\"id\":" + reactionId));
    }

    // ──────────────────────────────
    //  Pre-existing tests (kept as-is)
    // ──────────────────────────────

    [Test]
    [Description("REQ-FUN-012: Create a project then delete it via settings confirmation workflow")]
    public async Task DeleteProject_CreateAndDeleteViaSettings_Succeeds()
    {
        // Arrange
        await LoginAsync();
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var uniqueName = $"E2E Delete {timestamp}";
        var uniqueSlug = $"e2e-delete-{timestamp}";
        var confirmationPhrase = $"delete {uniqueName}";

        // Act
        await Page.GotoAsync("/projects/add", new() { Timeout = 5000, WaitUntil = WaitUntilState.Load });
        await Page.WaitForSelectorAsync("#add-project-form", new() { Timeout = 5000 });
        await Page.FillAsync("#project-name-input", uniqueName);
        await Page.FillAsync("#first-promise-input", "As a user, manage E2E delete test.");
        await Page.ClickAsync("#create-project-btn");
        await Page.WaitForURLAsync("**/graph", new() { Timeout = 5000 });

        await NavigateForFormAsync($"/{Owner}/{uniqueSlug}/settings", timeout: 5000);

        // Wait for JS to render the confirmation phrase before filling input
        await Page.WaitForSelectorAsync("#project-delete-confirmation-text", new() { Timeout = 5000 });
        await Page.WaitForFunctionAsync(@"expected => {
            const el = document.querySelector('#project-delete-confirmation-text');
            return el && el.textContent === expected;
        }", confirmationPhrase, new() { Timeout = 5000 });
        await Page.FillAsync("#project-delete-confirmation-input", confirmationPhrase);

        await Page.ClickAsync("#delete-project-btn", new() { Timeout = 5000 });
        await Page.WaitForURLAsync("**/projects", new() { Timeout = 5000 });

        // Assert
        Assert.That(Page.Url, Does.Contain("/projects"));
        // Note: not checking CSP here because the graph page (navigated to during project creation)
        // generates inline styles from D3 that trigger CSP violations (pre-existing issue).
    }

    [Test]
    [Description("REQ-FUN-039: Import project via API with valid export document")]
    public async Task ImportProject_WithValidDocument_ImportsSuccessfully()
    {
        // Arrange
        await LoginAsync();
        var projectName = $"E2E Imported {Guid.NewGuid():N}";
        var importJson = JsonSerializer.Serialize(new
        {
            schemaVersion = "1.0",
            exportedAt = DateTime.UtcNow,
            project = new
            {
                name = projectName,
                description = "E2E Import Test",
                productPromises = new[]
                {
                    new { statement = "As a user, test imports." }
                }
            }
        });
        using var client = await GetAuthClientAsync();
        using var content = new StringContent(importJson, Encoding.UTF8, "application/json");

        // Act
        var response = await client.PostAsync($"/api/projects/import", content);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Created));
        var body = await response.Content.ReadAsStringAsync();
        Assert.That(body, Does.Contain("projectId"));
        AssertNoCspViolations();
    }

    // ──────────────────────────────
    //  Private helpers
    // ──────────────────────────────

    private static int ParseIntFromJson(string json, string property)
    {
        using var doc = JsonDocument.Parse(json);
        return doc.RootElement.GetProperty(property).GetInt32();
    }

    /// <summary>Create a fresh moment via API and return its sequence number.</summary>
    private async Task<int> CreateFreshMomentSeqAsync(int flowId = 1, string? statement = null)
    {
        statement ??= $"E2E Moment for delete {Guid.NewGuid():N}";
        using var client = await GetAuthClientAsync();
        var json = JsonSerializer.Serialize(new
        {
            statement,
            flowId,
            type = "Story",
            displayOrder = 0,
        });
        var resp = await client.PostAsync($"/api/projects/{Owner}/{Project}/moments/create",
            new StringContent(json, Encoding.UTF8, "application/json"));
        Assert.That(resp.StatusCode, Is.EqualTo(HttpStatusCode.Created));
        var body = await resp.Content.ReadAsStringAsync();
        return ParseIntFromJson(body, "sequenceNumber");
    }

    /// <summary>Create a fresh moment via API and return its database Id (for stackItemId lookups).</summary>
    private async Task<int> CreateFreshMomentIdAsync(int flowId = 1, string? statement = null)
    {
        statement ??= $"E2E Moment for reaction {Guid.NewGuid():N}";
        using var client = await GetAuthClientAsync();
        var json = JsonSerializer.Serialize(new
        {
            statement,
            flowId,
            type = "Story",
            displayOrder = 0,
        });
        var resp = await client.PostAsync($"/api/projects/{Owner}/{Project}/moments/create",
            new StringContent(json, Encoding.UTF8, "application/json"));
        Assert.That(resp.StatusCode, Is.EqualTo(HttpStatusCode.Created));
        var body = await resp.Content.ReadAsStringAsync();
        return ParseIntFromJson(body, "id");
    }

    /// <summary>Create a fresh promise via API and return its sequence number.</summary>
    private async Task<int> CreateFreshPromiseSeqAsync(string? statement = null)
    {
        statement ??= $"E2E Promise for delete {Guid.NewGuid():N}";
        using var client = await GetAuthClientAsync();
        var json = JsonSerializer.Serialize(new
        {
            statement,
            displayOrder = 999,
            description = "E2E test promise for delete",
        });
        var resp = await client.PostAsync($"/api/projects/{Owner}/{Project}/promises/create",
            new StringContent(json, Encoding.UTF8, "application/json"));
        Assert.That(resp.StatusCode, Is.EqualTo(HttpStatusCode.Created));
        var body = await resp.Content.ReadAsStringAsync();
        return ParseIntFromJson(body, "sequenceNumber");
    }

    /// <summary>Create a fresh epic via API and return its sequence number.</summary>
    private async Task<int> CreateFreshEpicSeqAsync(int productPromiseId = 1, string? statement = null)
    {
        statement ??= $"E2E Epic for delete {Guid.NewGuid():N}";
        using var client = await GetAuthClientAsync();
        var json = JsonSerializer.Serialize(new
        {
            statement,
            productPromiseId,
            displayOrder = 999,
        });
        var resp = await client.PostAsync($"/api/projects/{Owner}/{Project}/epics/create",
            new StringContent(json, Encoding.UTF8, "application/json"));
        Assert.That(resp.StatusCode, Is.EqualTo(HttpStatusCode.Created));
        var body = await resp.Content.ReadAsStringAsync();
        return ParseIntFromJson(body, "sequenceNumber");
    }

    /// <summary>Create a fresh journey via API and return its sequence number.</summary>
    private async Task<int> CreateFreshJourneySeqAsync(int epicId = 1, string? statement = null)
    {
        statement ??= $"E2E Journey for delete {Guid.NewGuid():N}";
        using var client = await GetAuthClientAsync();
        var json = JsonSerializer.Serialize(new
        {
            statement,
            epicId,
            displayOrder = 999,
        });
        var resp = await client.PostAsync($"/api/projects/{Owner}/{Project}/journeys/create",
            new StringContent(json, Encoding.UTF8, "application/json"));
        Assert.That(resp.StatusCode, Is.EqualTo(HttpStatusCode.Created));
        var body = await resp.Content.ReadAsStringAsync();
        return ParseIntFromJson(body, "sequenceNumber");
    }

    /// <summary>Create a fresh flow via API and return its sequence number.</summary>
    private async Task<int> CreateFreshFlowSeqAsync(int journeyId = 1, string? statement = null)
    {
        statement ??= $"E2E Flow for delete {Guid.NewGuid():N}";
        using var client = await GetAuthClientAsync();
        var json = JsonSerializer.Serialize(new
        {
            statement,
            journeyId,
            displayOrder = 999,
        });
        var resp = await client.PostAsync($"/api/projects/{Owner}/{Project}/flows/create",
            new StringContent(json, Encoding.UTF8, "application/json"));
        Assert.That(resp.StatusCode, Is.EqualTo(HttpStatusCode.Created));
        var body = await resp.Content.ReadAsStringAsync();
        return ParseIntFromJson(body, "sequenceNumber");
    }

    /// <summary>Create a fresh stride via API and return (id, iterationId).</summary>
    private async Task<(int strideId, int iterationId)> CreateFreshStrideAsync(string owner, string project)
    {
        using var client = await GetAuthClientAsync();

        var iterResp = await client.GetAsync($"/api/projects/{owner}/{project}/iterations");
        Assert.That(iterResp.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var iterBody = await iterResp.Content.ReadAsStringAsync();
        using var iterDoc = JsonDocument.Parse(iterBody);
        var iterationId = iterDoc.RootElement[0].GetProperty("id").GetInt32();

        var json = JsonSerializer.Serialize(new
        {
            name = $"E2E Stride for Progress {Guid.NewGuid():N}",
            iterationId,
            startDate = DateTime.UtcNow.AddDays(1).ToString("yyyy-MM-dd"),
            endDate = DateTime.UtcNow.AddDays(15).ToString("yyyy-MM-dd"),
            durationDays = 14,
            isActive = true,
        });
        var resp = await client.PostAsync($"/api/projects/{owner}/{project}/strides",
            new StringContent(json, Encoding.UTF8, "application/json"));
        Assert.That(resp.StatusCode, Is.EqualTo(HttpStatusCode.Created));
        var createBody = await resp.Content.ReadAsStringAsync();
        var strideId = ParseIntFromJson(createBody, "id");
        return (strideId, iterationId);
    }

    /// <summary>Delete an entity via API and assert it returns 2xx.</summary>
    private async Task AssertDeleteEntityReturns2Xx(string url)
    {
        var deleteResp = await AuthDeleteAsync(url);
        Assert.That(deleteResp.StatusCode, Is.AnyOf(HttpStatusCode.NoContent, HttpStatusCode.OK));
    }
}
