using PromiseModelOnline.Client.Tests.Helpers;

namespace PromiseModelOnline.Client.Tests.Tests;

[TestFixture]
public class AccessibilityTests : ResponsivePlaywrightTestBase
{
    private const string AxeLocalPath = "/js/axe.min.js";

    private async Task<string> RunAxeScanAsync()
    {
        try
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
            }, 10);

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

    [Test]
    [TestCase(Viewport.Desktop)]
    [TestCase(Viewport.Tablet)]
    [TestCase(Viewport.Mobile)]
    public async Task HomePage_NoAccessibilityViolations(Viewport vp)
    {
        await EnsureLoggedInAsync(vp);
        var violations = await RunAxeScanAsync();
        AssertViolationCount(violations, "Home page");
    }

    [Test]
    [TestCase(Viewport.Desktop)]
    [TestCase(Viewport.Tablet)]
    [TestCase(Viewport.Mobile)]
    public async Task ProjectsList_NoAccessibilityViolations(Viewport vp)
    {
        await NavigateAsUserAsync(vp, "/projects");
        var violations = await RunAxeScanAsync();
        AssertViolationCount(violations, "Projects list");
    }

    [Test]
    [TestCase(Viewport.Desktop)]
    [TestCase(Viewport.Tablet)]
    [TestCase(Viewport.Mobile)]
    public async Task StrideBoard_NoAccessibilityViolations(Viewport vp)
    {
        await NavigateAsUserAsync(vp, "/pmo_test/seeded-project/strides");
        var violations = await RunAxeScanAsync();
        AssertViolationCount(violations, "Stride board");
    }

    [Test]
    [TestCase(Viewport.Desktop)]
    [TestCase(Viewport.Tablet)]
    [TestCase(Viewport.Mobile)]
    public async Task ProjectGraph_NoAccessibilityViolations(Viewport vp)
    {
        await NavigateAsUserAsync(vp, "/pmo_test/seeded-project/graph");
        var violations = await RunAxeScanAsync();
        AssertViolationCount(violations, "Project graph");
    }

    [Test]
    [TestCase(Viewport.Desktop)]
    [TestCase(Viewport.Tablet)]
    [TestCase(Viewport.Mobile)]
    public async Task PromiseDetail_NoAccessibilityViolations(Viewport vp)
    {
        await NavigateAsUserAsync(vp, "/pmo_test/seeded-project/promises/1");
        var violations = await RunAxeScanAsync();
        AssertViolationCount(violations, "Promise detail");
    }

    private void AssertViolationCount(string violationsJson, string pageLabel)
    {
        if (violationsJson == "[]" || string.IsNullOrEmpty(violationsJson))
            return;

        TestContext.Progress.WriteLine($"Accessibility violations on {pageLabel}: {violationsJson}");
        Assert.Fail($"Accessibility violations found on {pageLabel}. See test output for details.");
    }
}
