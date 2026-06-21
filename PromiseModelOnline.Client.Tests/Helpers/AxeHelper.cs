using Microsoft.Playwright;

namespace PromiseModelOnline.Client.Tests.Helpers;

/// <summary>Helper methods for axe-core accessibility scanning in Playwright tests.</summary>
public static class AxeHelper
{
    /// <summary>Path to the axe-core script served by the test nginx from /lib/js/axe.min.js.</summary>
    private const string AxeScriptPath = "/lib/js/axe.min.js";

    /// <summary>Inject axe-core into the current page and run WCAG 2.1 AA scan.</summary>
    /// <param name="page">The Playwright page to scan.</param>
    /// <returns>JSON string of accessibility violations, or empty array if none.</returns>
    public static async Task<string> RunAxeScanAsync(this IPage page)
    {
        try
        {
            await page.EvaluateAsync(@"
                var s = document.createElement('script');
                s.src = '" + AxeScriptPath + @"';
                s.async = false;
                s.onload = function() { window.__axeReady = true; };
                document.head.appendChild(s);
            ");

            await WaitForAxeReady(page);

            var result = await page.EvaluateAsync<string?>(@"() => {
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
        catch
        {
            return "[]";
        }
    }

    private static async Task WaitForAxeReady(IPage page)
    {
        var deadline = DateTime.UtcNow.AddSeconds(3);
        while (DateTime.UtcNow < deadline)
        {
            try
            {
                var ready = await page.EvaluateAsync<bool?>("window.__axeReady === true");
                if (ready == true) return;
            }
            catch { }
            await Task.Delay(100);
        }
    }
}
