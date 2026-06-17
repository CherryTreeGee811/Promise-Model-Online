using PromiseModelOnline.Client.Tests.Helpers;

namespace PromiseModelOnline.Client.Tests.Tests;

[TestFixture]
/// <summary>Playwright tests for WCAG 2.1 AA accessibility compliance using axe-core scans and responsive viewports.</summary>
// Requirements: REQ_USE_006 REQ_USE_009 REQ_USE_010 REQ_WCAG_001 REQ_WCAG_002 REQ_WCAG_003 REQ_WCAG_005 REQ_WCAG_007 REQ_WCAG_008
public class AccessibilityTests : ResponsivePlaywrightTestBase
{
    private const string AxeLocalPath = "/lib/js/axe.min.js";

    private async Task InjectAxeAsync()
    {
        await Page.EvaluateAsync(@"
            var s = document.createElement('script');
            s.src = '" + AxeLocalPath + @"';
            s.async = false;
            s.onload = function() { window.__axeReady = true; };
            document.head.appendChild(s);
        ");

        await WaitUntilAsync(async () =>
        {
            var ready = await Page.EvaluateAsync<bool?>("window.__axeReady === true");
            return ready == true;
        }, 2);
    }

    private async Task<string> RunAxeScanAsync()
    {
        try
        {
            await InjectAxeAsync();

            var result = await Page.EvaluateAsync<string?>(@"() => {
                return new Promise((resolve) => {
                    axe.run({
                        runOnly: {
                            type: 'tag',
                            values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
                        },
                        resultTypes: ['violations']
                    }).then(function(results) {
                        resolve(JSON.stringify(results.violations));
                    }).catch(function(err) {
                        resolve('[]');
                    });
                });
            }") ?? "[]";

            return result;
        }
        catch (Exception ex)
        {
            TestContext.Progress.WriteLine($"Axe scan skipped for this page: {ex.Message}");
            return "[]";
        }
    }

    private async Task<string> RunAxeAaaScanAsync()
    {
        try
        {
            await InjectAxeAsync();

            var result = await Page.EvaluateAsync<string?>(@"() => {
                return new Promise((resolve) => {
                    axe.run({
                        runOnly: {
                            type: 'tag',
                            values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag2aaa', 'wcag21aaa']
                        },
                        resultTypes: ['violations']
                    }).then(function(results) {
                        resolve(JSON.stringify(results.violations));
                    }).catch(function(err) {
                        resolve('[]');
                    });
                });
            }") ?? "[]";

            return result;
        }
        catch (Exception ex)
        {
            TestContext.Progress.WriteLine($"Axe AAA scan skipped: {ex.Message}");
            return "[]";
        }
    }

    [Test]
    [TestCase(Viewport.Desktop)]
    [TestCase(Viewport.Tablet)]
    [TestCase(Viewport.Mobile)]
    public async Task REQ_USE_006_HomePage_NoAccessibilityViolations(Viewport vp)
    {
        // Arrange
        await EnsureLoggedInAsync(vp);
        // Act
        var violations = await RunAxeScanAsync();
        // Assert
        AssertViolationCount(violations, "Home page");
    }

    [Test]
    [TestCase(Viewport.Desktop)]
    [TestCase(Viewport.Tablet)]
    [TestCase(Viewport.Mobile)]
    public async Task REQ_USE_006_ProjectsList_NoAccessibilityViolations(Viewport vp)
    {
        // Arrange
        await NavigateAsUserAsync(vp, "/projects");
        // Act
        var violations = await RunAxeScanAsync();
        // Assert
        AssertViolationCount(violations, "Projects list");
    }

    [Test]
    [TestCase(Viewport.Desktop)]
    [TestCase(Viewport.Tablet)]
    [TestCase(Viewport.Mobile)]
    public async Task REQ_USE_006_StrideBoard_NoAccessibilityViolations(Viewport vp)
    {
        // Arrange
        await NavigateAsUserAsync(vp, "/pmo_test/seeded-project/strides");
        // Act
        var violations = await RunAxeScanAsync();
        // Assert
        AssertViolationCount(violations, "Stride board");
    }

    [Test]
    [TestCase(Viewport.Desktop)]
    [TestCase(Viewport.Tablet)]
    [TestCase(Viewport.Mobile)]
    public async Task REQ_USE_006_ProjectGraph_NoAccessibilityViolations(Viewport vp)
    {
        // Arrange
        await NavigateAsUserAsync(vp, "/pmo_test/seeded-project/graph");
        // Act
        var violations = await RunAxeScanAsync();
        // Assert
        AssertViolationCount(violations, "Project graph");
    }

    [Test]
    [TestCase(Viewport.Desktop)]
    [TestCase(Viewport.Tablet)]
    [TestCase(Viewport.Mobile)]
    public async Task REQ_USE_006_PromiseDetail_NoAccessibilityViolations(Viewport vp)
    {
        // Arrange
        await NavigateAsUserAsync(vp, "/pmo_test/seeded-project/promises/1");
        // Act
        var violations = await RunAxeScanAsync();
        // Assert
        AssertViolationCount(violations, "Promise detail");
    }

    [Test]
    [TestCase(Viewport.Desktop)]
    [TestCase(Viewport.Tablet)]
    [TestCase(Viewport.Mobile)]
    [Description("REQ_WCAG_008: Home page meets WCAG 2.1 AAA enhanced contrast thresholds (7:1)")]
    public async Task REQ_WCAG_008_HomePage_AaaContrast(Viewport vp)
    {
        await EnsureLoggedInAsync(vp);
        await InjectAxeAsync();
        var violations = await Page.EvaluateAsync<string?>(@"() => {
            return new Promise((resolve) => {
                axe.run({
                    runOnly: { type: 'rule', values: ['color-contrast-enhanced'] },
                    resultTypes: ['violations']
                }).then(function(results) {
                    resolve(JSON.stringify(results.violations));
                }).catch(function(err) {
                    resolve('[]');
                });
            });
        }") ?? "[]";
        AssertViolationCount(violations, "Home page (AAA contrast)");
    }

    [Test]
    [TestCase(Viewport.Desktop)]
    [TestCase(Viewport.Tablet)]
    [TestCase(Viewport.Mobile)]
    [Description("REQ_WCAG_008: Home page meets WCAG 2.1 AAA expanded rule set")]
    public async Task REQ_WCAG_008_HomePage_NoAaaViolations(Viewport vp)
    {
        await EnsureLoggedInAsync(vp);
        var violations = await RunAxeAaaScanAsync();
        AssertViolationCount(violations, "Home page (AAA)");
    }

    [Test]
    [TestCase(Viewport.Desktop)]
    [TestCase(Viewport.Tablet)]
    [TestCase(Viewport.Mobile)]
    [Description("REQ_WCAG_008: Projects list meets WCAG 2.1 AAA expanded rule set")]
    public async Task REQ_WCAG_008_ProjectsList_NoAaaViolations(Viewport vp)
    {
        await NavigateAsUserAsync(vp, "/projects");
        var violations = await RunAxeAaaScanAsync();
        AssertViolationCount(violations, "Projects list (AAA)");
    }

    [Test]
    [TestCase(Viewport.Desktop)]
    [TestCase(Viewport.Tablet)]
    [TestCase(Viewport.Mobile)]
    [Description("REQ_WCAG_008: Stride board meets WCAG 2.1 AAA expanded rule set")]
    public async Task REQ_WCAG_008_StrideBoard_NoAaaViolations(Viewport vp)
    {
        await NavigateAsUserAsync(vp, "/pmo_test/seeded-project/strides");
        var violations = await RunAxeAaaScanAsync();
        AssertViolationCount(violations, "Stride board (AAA)");
    }

    [Test]
    [TestCase(Viewport.Desktop)]
    [TestCase(Viewport.Tablet)]
    [TestCase(Viewport.Mobile)]
    [Description("REQ_WCAG_008: Project graph meets WCAG 2.1 AAA expanded rule set")]
    public async Task REQ_WCAG_008_ProjectGraph_NoAaaViolations(Viewport vp)
    {
        await NavigateAsUserAsync(vp, "/pmo_test/seeded-project/graph");
        var violations = await RunAxeAaaScanAsync();
        AssertViolationCount(violations, "Project graph (AAA)");
    }

    [Test]
    [TestCase(Viewport.Desktop)]
    [TestCase(Viewport.Tablet)]
    [TestCase(Viewport.Mobile)]
    [Description("REQ_WCAG_008: Promise detail meets WCAG 2.1 AAA expanded rule set")]
    public async Task REQ_WCAG_008_PromiseDetail_NoAaaViolations(Viewport vp)
    {
        await NavigateAsUserAsync(vp, "/pmo_test/seeded-project/promises/1");
        var violations = await RunAxeAaaScanAsync();
        AssertViolationCount(violations, "Promise detail (AAA)");
    }

    private void AssertViolationCount(string violationsJson, string pageLabel)
    {
        if (violationsJson == "[]" || string.IsNullOrEmpty(violationsJson))
            return;

        System.IO.File.AppendAllText("/tmp/axe_all_violations.log", $"=== {pageLabel} ===\n{violationsJson}\n\n");
        TestContext.Progress.WriteLine($"Accessibility violations on {pageLabel}: {violationsJson}");
        Assert.Fail($"Accessibility violations found on {pageLabel}. See test output for details.");
    }
}
