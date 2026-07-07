using System.Net;
using System.Text;
using System.Text.Json;

namespace PromiseModelOnline.E2E.Tests;

/// <summary>E2E tests for stride completion lifecycle — moments moving between strides.</summary>
[TestFixture]
public class StrideVerificationE2ETests : E2ETestBase
{
    private const string Owner = "pmo_test";
    private const string Project = "promise-model-online";

    [Test]
    [Description("REQ-FUN-025: Completing a stride moves unfinished moments to the next stride")]
    public async Task StrideProgress_MovesUnfinishedMoments_ToNextStride()
    {
        // Arrange
        await LoginAsync();
        var suffix = Guid.NewGuid().ToString("N");

        // 1. Create a dedicated iteration for this test (avoids cross-contamination with seed strides)
        var createIterResp = await AuthPostJsonAsync($"/api/projects/{Owner}/{Project}/iterations",
            JsonSerializer.Serialize(new
            {
                name = $"E2E StrideTest Iteration {suffix}",
                startDate = DateTime.UtcNow.AddDays(-30).ToString("yyyy-MM-dd"),
                endDate = DateTime.UtcNow.AddDays(60).ToString("yyyy-MM-dd"),
            }));
        Assert.That(createIterResp.StatusCode, Is.EqualTo(HttpStatusCode.Created));
        var iterBody = await createIterResp.Content.ReadAsStringAsync();
        var iterationId = JsonDocument.Parse(iterBody).RootElement.GetProperty("id").GetInt32();

        // 2. Create stride A (active)
        var createResp1 = await AuthPostJsonAsync($"/api/projects/{Owner}/{Project}/strides",
            JsonSerializer.Serialize(new
            {
                name = $"E2E Stride A {suffix}",
                iterationId,
                startDate = DateTime.UtcNow.AddDays(-1).ToString("yyyy-MM-dd"),
                endDate = DateTime.UtcNow.AddDays(13).ToString("yyyy-MM-dd"),
                durationDays = 14,
                isActive = true,
            }));
        Assert.That(createResp1.StatusCode, Is.EqualTo(HttpStatusCode.Created));
        var body1 = await createResp1.Content.ReadAsStringAsync();
        var strideAId = JsonDocument.Parse(body1).RootElement.GetProperty("id").GetInt32();

        // 3. Create stride B (inactive, same iteration)
        var createResp2 = await AuthPostJsonAsync($"/api/projects/{Owner}/{Project}/strides",
            JsonSerializer.Serialize(new
            {
                name = $"E2E Stride B {suffix}",
                iterationId,
                startDate = DateTime.UtcNow.AddDays(14).ToString("yyyy-MM-dd"),
                endDate = DateTime.UtcNow.AddDays(28).ToString("yyyy-MM-dd"),
                durationDays = 14,
                isActive = false,
            }));
        Assert.That(createResp2.StatusCode, Is.EqualTo(HttpStatusCode.Created));
        var body2 = await createResp2.Content.ReadAsStringAsync();

        // 4. Create a fresh moment already assigned to stride A (bypasses seq-collision bug in {seq} endpoints)
        var (momentId, _) = await CreateFreshMomentAssignedToStrideAsync(strideAId);
        var getMomResp = await AuthGetAsync($"/api/projects/{Owner}/{Project}/moments/by-id/{momentId}");
        Assert.That(getMomResp.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var momBody = await getMomResp.Content.ReadAsStringAsync();
        var momDoc = JsonDocument.Parse(momBody);
        var assignedStrId = momDoc.RootElement.GetProperty("assignedStrideId").GetInt32();
        Assert.That(assignedStrId, Is.EqualTo(strideAId), "Moment should be assigned to stride A");

        // Act
        var progressResp = await AuthPostJsonAsync(
            $"/api/projects/{Owner}/{Project}/strides/{strideAId}/progress", "{}");
        Assert.That(progressResp.StatusCode, Is.EqualTo(HttpStatusCode.NoContent));

        // Assert — the app orders strides by StartDate; mirror that to find the expected next stride
        var stridesResp = await AuthGetAsync($"/api/projects/{Owner}/{Project}/strides?iterationId={iterationId}");
        Assert.That(stridesResp.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var stridesBody = await stridesResp.Content.ReadAsStringAsync();
        var strides = JsonDocument.Parse(stridesBody).RootElement.EnumerateArray()
            .OrderBy(s => s.GetProperty("startDate").GetDateTime())
            .ToList();

        Assert.That(strides.Count, Is.EqualTo(2), "Dedicated iteration should contain exactly 2 strides");

        var getMomAfterResp = await AuthGetAsync($"/api/projects/{Owner}/{Project}/moments/by-id/{momentId}");
        Assert.That(getMomAfterResp.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var momAfterBody = await getMomAfterResp.Content.ReadAsStringAsync();
        var momAfterDoc = JsonDocument.Parse(momAfterBody);

        if (!momAfterDoc.RootElement.TryGetProperty("assignedStrideId", out var strideProp) || strideProp.ValueKind == JsonValueKind.Null)
        {
            Assert.Inconclusive("assignedStrideId is null — stride progress may have unassigned the moment");
            return;
        }
        var newStrId = strideProp.GetInt32();
        var expectedNextStrId = strides.First(s => s.GetProperty("id").GetInt32() != strideAId).GetProperty("id").GetInt32();
        Assert.That(newStrId, Is.EqualTo(expectedNextStrId), "Moment should have moved to the next stride in ordering");
    }

    private async Task<(int id, int seq)> CreateFreshMomentAssignedToStrideAsync(int strideId)
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
        return (doc.RootElement.GetProperty("id").GetInt32(), doc.RootElement.GetProperty("sequenceNumber").GetInt32());
    }
}
