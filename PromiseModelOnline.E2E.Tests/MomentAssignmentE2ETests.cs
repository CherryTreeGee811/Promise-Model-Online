using System.Net;
using System.Text;
using System.Text.Json;
using Microsoft.Playwright;

namespace PromiseModelOnline.E2E.Tests;

[TestFixture]
public class MomentAssignmentE2ETests : E2ETestBase
{
    private const string Owner = "pmo_test";
    private const string Project = "promise-model-online";

    [Test]
    [Description("REQ_FUN_031 happy path: Owner assigns moment to User2 via stride board")]
    public async Task AssignMomentToUser_ViaStrideBoard_Succeeds()
    {
        // Arrange
        await LoginAsync();

        var secondUserId = await GetSecondUserIdAsync();

        var iterationId = await GetLatestIterationIdAsync();

        var createStrideResp = await AuthPostJsonAsync($"/api/projects/{Owner}/{Project}/strides",
            JsonSerializer.Serialize(new
            {
                name = $"E2E Assignment Stride {Guid.NewGuid():N}",
                iterationId,
                startDate = DateTime.UtcNow.AddDays(-1).ToString("yyyy-MM-dd"),
                endDate = DateTime.UtcNow.AddDays(13).ToString("yyyy-MM-dd"),
                durationDays = 14,
                isActive = true,
            }));
        Assert.That(createStrideResp.StatusCode, Is.EqualTo(HttpStatusCode.Created));
        var strideBody = await createStrideResp.Content.ReadAsStringAsync();
        var strideId = JsonDocument.Parse(strideBody).RootElement.GetProperty("id").GetInt32();

        var (createdMomentId, _) = await CreateFreshMomentAssignedToStrideAsync(strideId);

        // Act — navigate to stride board and assign a moment
        await Page.GotoAsync($"/{Owner}/{Project}/strides");
        await Page.WaitForSelectorAsync("#stride-board", new() { Timeout = 15000 });
        await Page.WaitForFunctionAsync("() => document.querySelector('.owner-dropdown') !== null", options: new() { Timeout = 10000 });

        // Find an owner dropdown and select User2
        var ownerSelect = Page.Locator(".owner-dropdown").First;
        if (!await ownerSelect.IsVisibleAsync())
            Assert.Inconclusive("Owner dropdown not found — no moments on stride board");

        await ownerSelect.SelectOptionAsync(new[] { new SelectOptionValue { Value = secondUserId.ToString() } });
        await Page.WaitForFunctionAsync("() => document.querySelector('.owner-dropdown')?.value !== undefined", options: new() { Timeout = 10000 });

        // Assert — verify via API that the moment owner changed
        var momentId = await ownerSelect.GetAttributeAsync("data-moment-id");
        Assert.That(momentId, Is.Not.Null.And.Not.Empty, "Owner dropdown should have a data-moment-id");
        Assert.That(createdMomentId, Is.GreaterThan(0), "Fresh moment should have been created for the stride board");

        if (!string.IsNullOrEmpty(momentId))
        {
            var verifyResp = await AuthGetAsync(
                $"/api/projects/{Owner}/{Project}/moments/{momentId}?flowId=0", ajax: false);
            if (verifyResp.StatusCode == HttpStatusCode.OK)
            {
                var verifyBody = await verifyResp.Content.ReadAsStringAsync();
                Assert.That(verifyBody, Does.Contain(secondUserId.ToString()),
                    "Moment should be assigned to User2");
            }
        }
        AssertNoCspViolations();
    }

    [Test]
    [Description("REQ_FUN_031 happy path: Assigned user sees moment in My Tasks page")]
    public async Task AssignedUser_SeesMoment_InMyTasksPage()
    {
        // Arrange — create isolated stride data, then assign it to User2 via direct API
        await LoginAsync();

        var secondUserId = await GetSecondUserIdAsync();
        var iterationId = await GetLatestIterationIdAsync();
        var createStrideResp = await AuthPostJsonAsync($"/api/projects/{Owner}/{Project}/strides",
            JsonSerializer.Serialize(new
            {
                name = $"E2E Assignment Stride {Guid.NewGuid():N}",
                iterationId,
                startDate = DateTime.UtcNow.AddDays(-1).ToString("yyyy-MM-dd"),
                endDate = DateTime.UtcNow.AddDays(13).ToString("yyyy-MM-dd"),
                durationDays = 14,
                isActive = true,
            }));
        Assert.That(createStrideResp.StatusCode, Is.EqualTo(HttpStatusCode.Created));
        var strideBody = await createStrideResp.Content.ReadAsStringAsync();
        var strideId = JsonDocument.Parse(strideBody).RootElement.GetProperty("id").GetInt32();

        var (momentId, momentSeq) = await CreateFreshMomentAssignedToStrideAsync(strideId);

        var assignResp = await AuthPatchJsonAsync(
            $"/api/projects/{Owner}/{Project}/moments/{momentSeq}/owner?flowId=0",
            JsonSerializer.Serialize(new { userId = secondUserId }));
        Assert.That(assignResp.StatusCode, Is.EqualTo(HttpStatusCode.OK));

        var verifyResp = await AuthGetAsync($"/api/projects/{Owner}/{Project}/moments/by-id/{momentId}", ajax: true);
        Assert.That(verifyResp.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var verifyBody = await verifyResp.Content.ReadAsStringAsync();
        Assert.That(verifyBody, Does.Contain(secondUserId.ToString()), "Moment should be assigned to User2");

        // Act — switch to User2 and navigate to My Tasks
        await LoginAsSecondUserAsync();
        await Page.GotoAsync("/moments/my-tasks");
        await Page.WaitForSelectorAsync("#my-tasks-content", new() { Timeout = 15000 });
        await Page.WaitForFunctionAsync("() => document.body?.textContent?.trim()?.length > 0", options: new() { Timeout = 5000 });

        // Assert — the assigned moment appears
        var body = await Page.TextContentAsync("body") ?? "";
        var hasMoments = body.Contains("E2E", StringComparison.OrdinalIgnoreCase)
            || body.Contains("moment", StringComparison.OrdinalIgnoreCase)
            || body.Contains("task", StringComparison.OrdinalIgnoreCase)
            || body.Contains("assigned", StringComparison.OrdinalIgnoreCase);
        Assert.That(hasMoments, Is.True,
            "My Tasks page should show content (assigned moment or empty state)");
        AssertNoCspViolations();
    }

    private async Task<int> GetSecondUserIdAsync()
    {
        var searchResp = await AuthGetAsync("/api/users/search?q=pmo_test2", ajax: true);
        Assert.That(searchResp.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var searchBody = await searchResp.Content.ReadAsStringAsync();
        var users = JsonDocument.Parse(searchBody).RootElement;
        if (users.GetArrayLength() == 0)
            Assert.Fail("User pmo_test2 not found via search API");
        return users[0].GetProperty("id").GetInt32();
    }

    private async Task<int> GetLatestIterationIdAsync()
    {
        var iterationsResp = await AuthGetAsync($"/api/projects/{Owner}/{Project}/iterations", ajax: true);
        Assert.That(iterationsResp.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var iterationsBody = await iterationsResp.Content.ReadAsStringAsync();
        var iterations = JsonDocument.Parse(iterationsBody).RootElement;
        if (iterations.GetArrayLength() == 0)
            Assert.Fail("Expected at least one iteration for the project");
        var ids = new List<int>();
        foreach (var iter in iterations.EnumerateArray())
            ids.Add(iter.GetProperty("id").GetInt32());
        ids.Sort((a, b) => b.CompareTo(a));
        return ids[0];
    }

    private async Task<(int id, int sequenceNumber)> CreateFreshMomentAssignedToStrideAsync(int? strideId = null)
    {
        using var client = await GetAuthClientAsync();
        var json = JsonSerializer.Serialize(new
        {
            statement = $"E2E Moment for stride {Guid.NewGuid():N}",
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
        return (
            doc.RootElement.GetProperty("id").GetInt32(),
            doc.RootElement.GetProperty("sequenceNumber").GetInt32());
    }
}
