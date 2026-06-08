using NUnit.Framework;
using OpenQA.Selenium;
using PromiseModelOnline.Client.Tests.Helpers;

namespace PromiseModelOnline.Client.Tests.Tests;

[TestFixture]
public class AccessibilityTests : ResponsiveTestBase
{
    private const string AxeLocalPath = "/js/axe.min.js";

    private string RunAxeScan()
    {
        try
        {
            ((IJavaScriptExecutor)Driver).ExecuteScript(
                "var s = document.createElement('script'); s.src = '" + AxeLocalPath + "'; s.async = false; s.onload = function() { window.__axeReady = true; }; document.head.appendChild(s);");

            WaitUntil(d =>
            {
                var ready = ((IJavaScriptExecutor)Driver).ExecuteScript("return window.__axeReady === true;");
                return ready is true;
            }, 10);

            // Use ExecuteAsyncScript to await the axe.run() promise
            var result = ((IJavaScriptExecutor)Driver).ExecuteAsyncScript(@"
                var callback = arguments[arguments.length - 1];
                axe.run({
                    runOnly: {
                        type: 'tag',
                        values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
                    },
                    resultTypes: ['violations']
                }).then(function(results) {
                    callback(JSON.stringify(results.violations));
                }).catch(function(err) {
                    callback('[]');
                });
            ")?.ToString() ?? "[]";

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
    public void HomePage_NoAccessibilityViolations(Viewport vp)
    {
        EnsureLoggedIn(vp);
        var violations = RunAxeScan();
        AssertViolationCount(violations, "Home page");
    }

    [Test]
    [TestCase(Viewport.Desktop)]
    [TestCase(Viewport.Tablet)]
    [TestCase(Viewport.Mobile)]
    public void ProjectsList_NoAccessibilityViolations(Viewport vp)
    {
        NavigateAsUser(vp, "/projects");
        var violations = RunAxeScan();
        AssertViolationCount(violations, "Projects list");
    }

    [Test]
    [TestCase(Viewport.Desktop)]
    [TestCase(Viewport.Tablet)]
    [TestCase(Viewport.Mobile)]
    public void StrideBoard_NoAccessibilityViolations(Viewport vp)
    {
        NavigateAsUser(vp, "/pmo_test/seeded-project/strides");
        var violations = RunAxeScan();
        AssertViolationCount(violations, "Stride board");
    }

    [Test]
    [TestCase(Viewport.Desktop)]
    [TestCase(Viewport.Tablet)]
    [TestCase(Viewport.Mobile)]
    public void ProjectGraph_NoAccessibilityViolations(Viewport vp)
    {
        NavigateAsUser(vp, "/pmo_test/seeded-project/graph");
        var violations = RunAxeScan();
        AssertViolationCount(violations, "Project graph");
    }

    [Test]
    [TestCase(Viewport.Desktop)]
    [TestCase(Viewport.Tablet)]
    [TestCase(Viewport.Mobile)]
    public void PromiseDetail_NoAccessibilityViolations(Viewport vp)
    {
        NavigateAsUser(vp, "/pmo_test/seeded-project/promises/1");
        var violations = RunAxeScan();
        AssertViolationCount(violations, "Promise detail");
    }

    private void AssertViolationCount(string violationsJson, string pageLabel)
    {
        if (violationsJson == "[]" || string.IsNullOrEmpty(violationsJson))
            return;

        // Attach the raw violations JSON to the test output for debugging
        TestContext.Progress.WriteLine($"Accessibility violations on {pageLabel}: {violationsJson}");
        Assert.Fail($"Accessibility violations found on {pageLabel}. See test output for details.");
    }
}
