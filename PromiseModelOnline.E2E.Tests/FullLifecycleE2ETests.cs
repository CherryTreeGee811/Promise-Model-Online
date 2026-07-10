using System.Net;
using System.Text.Json;
using Microsoft.Playwright;

namespace PromiseModelOnline.E2E.Tests;

[TestFixture]
public class FullLifecycleE2ETests : E2ETestBase
{
    private const string Owner = "pmo_test";
    private const string SecondUserEmail = "pmo2@gmail.com";

    [Test]
    [Description("PMO-178: Full lifecycle — Login -> Create Project -> Add Promise/Epic/Journey/Flow/Moment -> Share with second user")]
    public async Task FullProjectLifecycle_LoginCreateAddStackShare_EndToEnd()
    {
        // ════════════════════════════════════════════
        //  Step 1: Log in and create a fresh project
        // ════════════════════════════════════════════
        await LoginAsync();
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var projectName = $"Lifecycle {timestamp}";

        await Page.GotoAsync("/projects/add");
        await Page.WaitForSelectorAsync("#add-project-form", new() { Timeout = 10000 });
        await Page.FillAsync("#project-name-input", projectName);
        await Page.FillAsync("#first-promise-input", "E2E lifecycle promise.");
        await Page.ClickAsync("#create-project-btn");
        await Page.WaitForURLAsync("**/graph", new() { Timeout = 30000 });
        await Page.WaitForSelectorAsync("#graph-content svg", new() { Timeout = 15000 });
        var urlParts = Page.Url.TrimEnd('/').Split('/');
        var slug = urlParts[^2];
        var graphNodeCount = await Page.Locator(".graph-node").CountAsync();
        Assert.That(graphNodeCount, Is.GreaterThan(0), "Graph should show nodes after project creation");
        AssertNoCspViolations();

        // ════════════════════════════════════════════
        //  Step 2: Navigate to project/promises/1 and add an Epic via inline form
        // ════════════════════════════════════════════
        await Page.GotoAsync($"/{Owner}/{slug}/promises/1");
        await Page.WaitForSelectorAsync("#promise-detail-content", new() { Timeout = 15000 });
        await Page.WaitForSelectorAsync("#add-epic-statement", new() { Timeout = 10000 });
        var epicStatement = $"Lifecycle Epic {Guid.NewGuid():N}";
        await Page.FillAsync("#add-epic-statement", epicStatement);
        await Page.ClickAsync("#add-epic-submit");
        await Page.WaitForSelectorAsync($"text={epicStatement}", new() { Timeout = 10000 });
        AssertNoCspViolations();

        // ════════════════════════════════════════════
        //  Step 3: Navigate to epic/1 and add a Journey via inline form
        // ════════════════════════════════════════════
        await Page.GotoAsync($"/{Owner}/{slug}/epics/1");
        await Page.WaitForSelectorAsync("#epic-detail-content", new() { Timeout = 15000 });
        await Page.WaitForSelectorAsync("#add-journey-statement", new() { Timeout = 10000 });
        var journeyStatement = $"Lifecycle Journey {Guid.NewGuid():N}";
        await Page.FillAsync("#add-journey-statement", journeyStatement);
        await Page.ClickAsync("#add-journey-submit");
        await Page.WaitForSelectorAsync($"text={journeyStatement}", new() { Timeout = 10000 });
        AssertNoCspViolations();

        // ════════════════════════════════════════════
        //  Step 4: Navigate to journey/1 and add a Flow via inline form
        // ════════════════════════════════════════════
        await Page.GotoAsync($"/{Owner}/{slug}/journeys/1");
        await Page.WaitForSelectorAsync("#journey-detail-content", new() { Timeout = 15000 });
        await Page.WaitForSelectorAsync("#add-flow-statement", new() { Timeout = 10000 });
        var flowStatement = $"Lifecycle Flow {Guid.NewGuid():N}";
        await Page.FillAsync("#add-flow-statement", flowStatement);
        await Page.ClickAsync("#add-flow-submit");
        await Page.WaitForSelectorAsync($"text={flowStatement}", new() { Timeout = 10000 });
        AssertNoCspViolations();

        // ════════════════════════════════════════════
        //  Step 5: Navigate to flow/1 and add a Moment via inline form
        // ════════════════════════════════════════════
        await Page.GotoAsync($"/{Owner}/{slug}/flows/1");
        await Page.WaitForSelectorAsync("#flow-detail-content", new() { Timeout = 15000 });
        await Page.WaitForSelectorAsync("#add-moment-statement", new() { Timeout = 10000 });
        var momentStatement = $"Lifecycle Moment {Guid.NewGuid():N}";
        await Page.FillAsync("#add-moment-statement", momentStatement);
        await Page.SelectOptionAsync("#add-moment-type", new SelectOptionValue { Label = "Story" });
        await Page.ClickAsync("#add-moment-submit");
        await Page.WaitForSelectorAsync($"text={momentStatement}", new() { Timeout = 10000 });
        AssertNoCspViolations();

        // ════════════════════════════════════════════
        //  Step 6: Share project with second user via API
        // ════════════════════════════════════════════
        var inviteBody = JsonSerializer.Serialize(new { email = SecondUserEmail, level = "View" });
        var inviteResp = await AuthPostJsonAsync($"/api/projects/{Owner}/{slug}/permissions", inviteBody);
        Assert.That(inviteResp.StatusCode, Is.EqualTo(HttpStatusCode.Created));

        // ════════════════════════════════════════════
        //  Step 7: Switch to second user, accept invitation, verify access
        // ════════════════════════════════════════════
        await LoginAsSecondUserAsync();

        // Accept invitation
        await Page.GotoAsync("/invitations");
        await Page.WaitForSelectorAsync("#invitations-list", new() { Timeout = 15000 });
        var acceptBtn = Page.Locator(".accept-btn").First;
        if (await acceptBtn.IsVisibleAsync())
        {
            await acceptBtn.ClickAsync();
            await acceptBtn.WaitForAsync(new() { State = WaitForSelectorState.Detached, Timeout = 10000 });
        }

        // Verify second user can see the project's stack via API
        var getPromiseResp = await AuthGetAsync($"/api/projects/{Owner}/{slug}/promises/1");
        Assert.That(getPromiseResp.StatusCode, Is.EqualTo(HttpStatusCode.OK));

        var getEpicResp = await AuthGetAsync($"/api/projects/{Owner}/{slug}/epics/1");
        Assert.That(getEpicResp.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var epicBody = await getEpicResp.Content.ReadAsStringAsync();
        Assert.That(epicBody, Does.Contain(epicStatement));

        var getJourneyResp = await AuthGetAsync($"/api/projects/{Owner}/{slug}/journeys/1");
        Assert.That(getJourneyResp.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var journeyBody = await getJourneyResp.Content.ReadAsStringAsync();
        Assert.That(journeyBody, Does.Contain(journeyStatement));

        var getFlowResp = await AuthGetAsync($"/api/projects/{Owner}/{slug}/flows/1");
        Assert.That(getFlowResp.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var flowBody = await getFlowResp.Content.ReadAsStringAsync();
        Assert.That(flowBody, Does.Contain(flowStatement));

        var getMomentResp = await AuthGetAsync($"/api/projects/{Owner}/{slug}/moments/1");
        Assert.That(getMomentResp.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var momentBody = await getMomentResp.Content.ReadAsStringAsync();
        Assert.That(momentBody, Does.Contain(momentStatement));

        AssertNoCspViolations();
    }
}
