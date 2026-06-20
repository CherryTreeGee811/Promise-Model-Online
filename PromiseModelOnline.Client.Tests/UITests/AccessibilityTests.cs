using PromiseModelOnline.Client.Tests.Helpers;

namespace PromiseModelOnline.Client.Tests.UITests;

/// <summary>Automated accessibility (a11y) tests using axe-core for WCAG 2.1 AA compliance.</summary>
// Requirements: REQ_WCAG_001 REQ_WCAG_002 REQ_WCAG_003 REQ_WCAG_005 REQ_WCAG_007
public class AccessibilityTests : PlaywrightTestBase
{
    private async Task AssertNoAxeViolations(string pageLabel)
    {
        var violationsJson = await Page.RunAxeScanAsync();
        if (violationsJson == "[]" || string.IsNullOrEmpty(violationsJson))
            return;

        var violations = System.Text.Json.JsonSerializer.Deserialize<System.Text.Json.JsonElement[]>(violationsJson);
        if (violations == null || violations.Length == 0)
            return;

        var messages = violations.Select(v =>
        {
            var id = v.TryGetProperty("id", out var idProp) ? idProp.GetString() : "?";
            var help = v.TryGetProperty("help", out var helpProp) ? helpProp.GetString() : "?";
            var nodes = v.TryGetProperty("nodes", out var nodesProp) ? nodesProp.GetArrayLength() : 0;
            return $"{id}: {help} ({nodes} nodes)";
        });

        Assert.Fail($"{pageLabel} has {violations.Length} axe-core violation(s):\n{string.Join("\n", messages)}");
    }

    [Test]
    public async Task REQ_WCAG_001_HomePage_NoAccessibilityViolations()
    {
        await EnsureLoggedIn();
        await AssertNoAxeViolations("Home page");
    }

    [Test]
    public async Task REQ_WCAG_002_ProjectsList_NoAccessibilityViolations()
    {
        await NavigateAsUser("/projects");
        await AssertNoAxeViolations("Projects list");
    }

    [Test]
    public async Task REQ_WCAG_003_ProjectGraph_NoAccessibilityViolations()
    {
        await NavigateAsUser("/pmo_test/seeded-project/graph");
        await WaitForSelectorAsync("#graph-viewport");
        await AssertNoAxeViolations("Project graph");
    }

    [Test]
    public async Task REQ_WCAG_005_PromiseDetail_NoAccessibilityViolations()
    {
        await NavigateAsUser("/pmo_test/seeded-project/promises/1");
        await AssertNoAxeViolations("Promise detail");
    }

    [Test]
    public async Task REQ_WCAG_007_PrivacyPage_NoAccessibilityViolations()
    {
        await NavigateAsUser("/privacy");
        await AssertNoAxeViolations("Privacy page");
    }

    [Test]
    public async Task REQ_WCAG_007_TermsPage_NoAccessibilityViolations()
    {
        await NavigateAsUser("/tos");
        await AssertNoAxeViolations("Terms of Service");
    }

    [Test]
    public async Task REQ_WCAG_007_NotificationsPage_NoAccessibilityViolations()
    {
        await NavigateAsUser("/notifications");
        await AssertNoAxeViolations("Notifications");
    }

    [Test]
    public async Task REQ_WCAG_007_StrideBoard_NoAccessibilityViolations()
    {
        await NavigateAsUser("/pmo_test/seeded-project/strides");
        await AssertNoAxeViolations("Stride board");
    }
}
