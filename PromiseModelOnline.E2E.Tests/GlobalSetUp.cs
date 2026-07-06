using System.Text.RegularExpressions;
using Microsoft.Playwright;

namespace PromiseModelOnline.E2E.Tests;

[SetUpFixture]
public class GlobalSetUp
{
    public static string? OwnerSessionValue { get; private set; }
    public static string? SecondUserSessionValue { get; private set; }
    public static IReadOnlyDictionary<string, string>? OwnerSessionChunks { get; private set; }
    public static IReadOnlyDictionary<string, string>? SecondUserSessionChunks { get; private set; }

    [OneTimeSetUp]
    public async Task CaptureSessionCookies()
    {
        var ownerResult = await CaptureSessionCookieAsync("pmo_test", "Hello123*");
        OwnerSessionValue = ownerResult.PrimaryValue;
        OwnerSessionChunks = ownerResult.Chunks;

        var secondResult = await CaptureSessionCookieAsync("pmo_test2", "Hello123*");
        SecondUserSessionValue = secondResult.PrimaryValue;
        SecondUserSessionChunks = secondResult.Chunks;
    }

    private sealed record SessionCaptureResult(string? PrimaryValue, IReadOnlyDictionary<string, string>? Chunks);

    private static async Task<SessionCaptureResult> CaptureSessionCookieAsync(string username, string password)
    {
        var playwright = await Microsoft.Playwright.Playwright.CreateAsync();
        var browser = await playwright.Chromium.LaunchAsync(new BrowserTypeLaunchOptions
        {
            Headless = true,
            Args = new[] { "--ignore-certificate-errors", "--no-sandbox", "--disable-dev-shm-usage", "--host-resolver-rules=MAP localhost 127.0.0.1" },
        });
        var context = await browser.NewContextAsync(new BrowserNewContextOptions
        {
            IgnoreHTTPSErrors = true,
            BaseURL = "https://localhost:9000"
        });
        var page = await context.NewPageAsync();

        try
        {
            // Warm up: initialize Auth server and BFF before Playwright starts.
            using (var warmup = new HttpClient(new HttpClientHandler
            {
                ServerCertificateCustomValidationCallback = (_, _, _, _) => true,
                AllowAutoRedirect = true
            }))
            {
                warmup.BaseAddress = new Uri("https://localhost:9000");
                try { await warmup.GetAsync("/.well-known/openid-configuration"); } catch { }
                try { await warmup.GetAsync("/login?returnUrl=/"); } catch { }
            }
            using (var warmupToken = new HttpClient(new HttpClientHandler
            {
                ServerCertificateCustomValidationCallback = (_, _, _, _) => true
            }))
            {
                warmupToken.BaseAddress = new Uri("https://localhost:9000");
                try { await warmupToken.PostAsync("/connect/token", new FormUrlEncodedContent(new[] { new KeyValuePair<string, string>("grant_type", "none") })); } catch { }
            }

            // Reset Identity lockout and password for this user before attempting Playwright login
            using (var unlockClient = new HttpClient(new HttpClientHandler
            {
                ServerCertificateCustomValidationCallback = (_, _, _, _) => true,
                AllowAutoRedirect = false
            }))
            {
                unlockClient.BaseAddress = new Uri("https://localhost:9000");
                try
                {
                    await unlockClient.PostAsync($"/account/dev/reset-lockout?username={username}&password={Uri.EscapeDataString(password)}", null);
                }
                catch { }
            }

            // Step 1: Log in via Auth server directly to obtain the Identity cookie (__Host-pmo.auth).
            for (var attempt = 1; attempt <= 3; attempt++)
            {
                try
                {
                    await page.GotoAsync("/account/login", new() { Timeout = 15000, WaitUntil = WaitUntilState.DOMContentLoaded });
                    await page.WaitForSelectorAsync("#Username", new() { Timeout = 10000, State = WaitForSelectorState.Attached });
                    await page.EvaluateAsync("(v) => document.getElementById('Username').value = v", username);
                    await page.EvaluateAsync("(v) => document.getElementById('Password').value = v", password);
                    await page.ClickAsync("button[type=\"submit\"]");

                    // Wait for identity server to process login and redirect away from login form.
                    // The redirect target varies (identity server root, BFF callback, or SPA home).
                    // Wait up to 20s for any navigation to complete.
                    await page.WaitForURLAsync(new Regex(".+"), new() { Timeout = 20000 });
                    break;
                }
                catch (TimeoutException) when (attempt < 3)
                {
                    await page.ReloadAsync(new() { Timeout = 15000 });
                    await Task.Delay(3000);
                }
            }

            // Step 2: Complete the OIDC flow so the BFF creates __Host-pmo.session.
            // Navigate to the BFF login endpoint, which initiates OIDC challenge.
            // If the identity cookie from step 1 is valid, the identity server auto-authenticates.
            for (var attempt = 1; attempt <= 3; attempt++)
            {
                try
                {
                    await page.GotoAsync("/login?returnUrl=/", new() { Timeout = 15000 });
                    // Wait for the SPA to render the logged-in navigation bar (proves OIDC completed)
                    await page.WaitForSelectorAsync("#user-dropdown", new() { Timeout = 20000 });
                    break;
                }
                catch (TimeoutException) when (attempt < 3)
                {
                    // Re-establish the Identity cookie before retrying the OIDC flow.
                    for (var retry = 1; retry <= 3; retry++)
                    {
                        try
                        {
                            await page.GotoAsync("/account/login", new() { Timeout = 15000, WaitUntil = WaitUntilState.DOMContentLoaded });
                            await page.WaitForSelectorAsync("#Username", new() { Timeout = 10000, State = WaitForSelectorState.Attached });
                            await page.EvaluateAsync("(v) => document.getElementById('Username').value = v", username);
                            await page.EvaluateAsync("(v) => document.getElementById('Password').value = v", password);
                            await page.ClickAsync("button[type=\"submit\"]");
                            await page.WaitForURLAsync(new Regex(".+"), new() { Timeout = 20000 });
                            break;
                        }
                        catch (TimeoutException) when (retry < 3)
                        {
                            await Task.Delay(3000);
                        }
                    }
                }
            }

            var cookies = await context.CookiesAsync();
            var sessionChunks = cookies
                .Where(c => c.Name.StartsWith("__Host-pmo.session"))
                .ToDictionary(c => c.Name, c => c.Value);
            return new SessionCaptureResult(sessionChunks.Count > 0 ? sessionChunks.Values.First() : null, sessionChunks.Count > 0 ? sessionChunks : null);
        }
        finally
        {
            await context.CloseAsync();
            await browser.DisposeAsync();
            playwright.Dispose();
        }
    }
}
