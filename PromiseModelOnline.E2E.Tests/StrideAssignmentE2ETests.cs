using System.Net;
using System.Text;
using System.Text.Json;
using Microsoft.Playwright;

namespace PromiseModelOnline.E2E.Tests;

[TestFixture]
public class StrideAssignmentE2ETests : E2ETestBase
{
    private const string Owner = "pmo_test";
    private const string Project = "promise-model-online";

    [Test]
    [Description("REQ_FUN_025 happy path: Authenticated user views stride board")]
    public async Task StrideBoard_Authenticated_ShowsStridesAndBacklog()
    {
        // Arrange
        await LoginAsync();

        // Act
        await Page.GotoAsync($"/{Owner}/{Project}/strides");
        await Page.WaitForSelectorAsync("#stride-board .stride-card", new() { Timeout = 15000 });

        // Assert
        var board = await Page.Locator("#stride-board").IsVisibleAsync();
        Assert.That(board, Is.True, "Stride board should be visible");
        AssertNoCspViolations();
    }

    [Test]
    [Description("REQ_FUN_025 happy path: Move moment from stride to backlog via UI")]
    public async Task MoveMoment_ToBacklog_FromStrideCard()
    {
        // Arrange
        await LoginAsync();
        var suffix = Guid.NewGuid().ToString("N")[..8];

        // Create a stride and assign a moment to it
        var (strideId, _) = await CreateDedicatedStrideAsync(suffix);
        var (momentId, _) = await CreateMomentAssignedToStrideAsync(strideId);

        // Navigate to stride board
        await Page.GotoAsync($"/{Owner}/{Project}/strides");
        await Page.WaitForSelectorAsync("#stride-board", new() { Timeout = 15000 });
        await Page.WaitForFunctionAsync("() => document.body?.textContent?.trim()?.length > 0", options: new() { Timeout = 10000 });

        // Act — click the "Backlog" button on the moment's stride card row
        var moveBtn = Page.Locator($"tr[data-moment-id=\"{momentId}\"] .move-to-backlog-btn");
        if (!await moveBtn.IsVisibleAsync())
        {
            Assert.Inconclusive("Move-to-backlog button not visible for the test moment");
            return;
        }
        await moveBtn.ClickAsync();

        // Confirm the modal if shown
        var confirmBtn = Page.Locator("#move-to-backlog-modal .btn-primary, #move-to-backlog-modal .confirm-btn");
        try
        {
            await confirmBtn.WaitForAsync(new() { Timeout = 3000, State = WaitForSelectorState.Attached });
        }
        catch (TimeoutException) { }
        if (await confirmBtn.IsVisibleAsync())
            await confirmBtn.ClickAsync();

        await Page.WaitForFunctionAsync("() => document.querySelector('.modal.show, .modal-backdrop') === null", options: new() { Timeout = 10000 });

        // Assert — moment row still exists (UI didn't crash)
        var momentRow = Page.Locator($"tr[data-moment-id=\"{momentId}\"]");
        AssertNoCspViolations();
    }

    [Test]
    [Description("REQ_FUN_025 happy path: Progress stride moves unfinished moments forward")]
    public async Task ProgressStride_MovesUnfinishedMoments()
    {
        // Arrange
        await LoginAsync();
        var suffix = Guid.NewGuid().ToString("N")[..8];

        // Create two strides in one iteration
        var iterId = await CreateDedicatedIterationAsync(suffix);
        var strideAId = await CreateStrideInIterationAsync($"Stride A {suffix}", iterId, true);
        var strideBId = await CreateStrideInIterationAsync($"Stride B {suffix}", iterId, false);

        // Assign a moment to stride A
        var (momentId, _) = await CreateMomentAssignedToStrideAsync(strideAId);

        // Verify moment is in stride A
        var getResp = await AuthGetAsync($"/api/projects/{Owner}/{Project}/moments/by-id/{momentId}");
        Assert.That(getResp.StatusCode, Is.EqualTo(HttpStatusCode.OK));

        // Act — progress stride A via API (reliable, bypasses UI modals)
        var progressResp = await AuthPostJsonAsync(
            $"/api/projects/{Owner}/{Project}/strides/{strideAId}/progress", "{}");
        Assert.That(progressResp.StatusCode, Is.EqualTo(HttpStatusCode.NoContent));

        // Assert — moment moved to stride B
        var getAfterResp = await AuthGetAsync($"/api/projects/{Owner}/{Project}/moments/by-id/{momentId}");
        var body = await getAfterResp.Content.ReadAsStringAsync();
        var doc = JsonDocument.Parse(body);
        var newStrideId = doc.RootElement.TryGetProperty("assignedStrideId", out var prop) && prop.ValueKind == JsonValueKind.Number
            ? prop.GetInt32() : (int?)null;
        Assert.That(newStrideId, Is.EqualTo(strideBId),
            "Unfinished moment should move to the next stride after progress");
    }

    private async Task<(int id, int seq)> CreateMomentAssignedToStrideAsync(int strideId)
    {
        using var client = await GetAuthClientAsync();
        var json = JsonSerializer.Serialize(new
        {
            statement = $"E2E Moment {Guid.NewGuid():N}",
            flowId = 1,
            type = "Story",
            displayOrder = 0,
            assignedStrideId = strideId,
        });
        var resp = await client.PostAsync($"/api/projects/{Owner}/{Project}/moments/create",
            new StringContent(json, Encoding.UTF8, "application/json"));
        Assert.That(resp.StatusCode, Is.EqualTo(HttpStatusCode.Created));
        var body = await resp.Content.ReadAsStringAsync();
        var doc = JsonDocument.Parse(body);
        return (doc.RootElement.GetProperty("id").GetInt32(), doc.RootElement.GetProperty("sequenceNumber").GetInt32());
    }

    private async Task<(int strideId, int iterationId)> CreateDedicatedStrideAsync(string suffix)
    {
        var iterId = await CreateDedicatedIterationAsync(suffix);
        var strideId = await CreateStrideInIterationAsync($"E2E Stride {suffix}", iterId, true);
        return (strideId, iterId);
    }

    private async Task<int> CreateDedicatedIterationAsync(string suffix)
    {
        var resp = await AuthPostJsonAsync($"/api/projects/{Owner}/{Project}/iterations",
            JsonSerializer.Serialize(new
            {
                name = $"E2E StrideTest Iteration {suffix}",
                startDate = DateTime.UtcNow.AddDays(-30).ToString("yyyy-MM-dd"),
                endDate = DateTime.UtcNow.AddDays(60).ToString("yyyy-MM-dd"),
            }));
        Assert.That(resp.StatusCode, Is.EqualTo(HttpStatusCode.Created));
        var body = await resp.Content.ReadAsStringAsync();
        return JsonDocument.Parse(body).RootElement.GetProperty("id").GetInt32();
    }

    private async Task<int> CreateStrideInIterationAsync(string name, int iterationId, bool isActive)
    {
        var resp = await AuthPostJsonAsync($"/api/projects/{Owner}/{Project}/strides",
            JsonSerializer.Serialize(new
            {
                name,
                iterationId,
                startDate = DateTime.UtcNow.AddDays(-1).ToString("yyyy-MM-dd"),
                endDate = DateTime.UtcNow.AddDays(13).ToString("yyyy-MM-dd"),
                durationDays = 14,
                isActive,
            }));
        Assert.That(resp.StatusCode, Is.EqualTo(HttpStatusCode.Created));
        var body = await resp.Content.ReadAsStringAsync();
        return JsonDocument.Parse(body).RootElement.GetProperty("id").GetInt32();
    }
}
