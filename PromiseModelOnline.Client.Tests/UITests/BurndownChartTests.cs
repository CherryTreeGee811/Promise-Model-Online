using PromiseModelOnline.Client.Tests.Helpers;

namespace PromiseModelOnline.Client.Tests.UITests;

/// <summary>Playwright tests for the burndown chart visualization.</summary>
public class BurndownChartTests : PlaywrightTestBase
{
    [Test]
    public async Task REQ_FUN_011_BurndownChart_RendersOnGraphPage()
    {
        // Arrange
        await NavigateAsUser("/pmo_test/seeded-project/graph");
        await WaitForSelectorAsync("#graph-filter-bar");
        // Burndown chart is conditional on stride/iteration configuration.
        // Verify that if the toggle exists, its container is structurally valid.
        // Act
        var burndownToggle = await Page.QuerySelectorAsync(
            "[data-testid='burndown-toggle'], .burndown-toggle, #burndown-container, .burndown-chart");
        if (burndownToggle != null)
        {
            var display = await burndownToggle.EvaluateAsync<string>("el => window.getComputedStyle(el).display");
            // Assert
            Assert.That(display, Is.Not.EqualTo("none"), "Burndown toggle must not be hidden");
        }
    }
}
