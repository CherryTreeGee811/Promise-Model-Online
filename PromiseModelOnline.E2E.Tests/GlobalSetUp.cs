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

    public static void RefreshOwnerSession(IReadOnlyDictionary<string, string>? chunks)
    {
        OwnerSessionChunks = chunks;
        OwnerSessionValue = chunks?.Values.FirstOrDefault();
    }

    public static void RefreshSecondUserSession(IReadOnlyDictionary<string, string>? chunks)
    {
        SecondUserSessionChunks = chunks;
        SecondUserSessionValue = chunks?.Values.FirstOrDefault();
    }

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

    private static async Task<SessionCaptureResult?> CompleteOidcViaHttpAsync(string username, string password)
    {
        try
        {
            using var handler = new HttpClientHandler
            {
                ServerCertificateCustomValidationCallback = (_, _, _, _) => true,
                AllowAutoRedirect = false
            };
            using var client = new HttpClient(handler);
            client.BaseAddress = new Uri("https://localhost:9000");

            // 1. Get the login page for CSRF token
            var loginPage = await client.GetAsync("/account/login");
            var loginHtml = await loginPage.Content.ReadAsStringAsync();
            var csrfMatch = Regex.Match(loginHtml, @"__RequestVerificationToken.*?value=""([^""]+)""");
            if (!csrfMatch.Success) return null;
            var csrfToken = csrfMatch.Groups[1].Value;

            // 2. POST login form
            var loginContent = new FormUrlEncodedContent(new[]
            {
                new KeyValuePair<string, string>("Username", username),
                new KeyValuePair<string, string>("Password", password),
                new KeyValuePair<string, string>("__RequestVerificationToken", csrfToken)
            });
            // Clear existing cookies and copy the response Set-Cookie to the handler's cookie container
            using var loginResponse = await client.PostAsync("/account/login?returnUrl=/", loginContent);

            // 3. Trigger OIDC challenge
            using var oidcChallenge = await client.GetAsync("/login?returnUrl=/");

            // 4. Follow redirect to auth server's authorize endpoint
            var authorizeUrl = oidcChallenge.Headers.Location?.ToString();
            if (string.IsNullOrEmpty(authorizeUrl)) return null;
            using var authResponse = await client.GetAsync(authorizeUrl);

            // 5. Follow redirect to signin-oidc callback
            var callbackUrl = authResponse.Headers.Location?.ToString();
            if (string.IsNullOrEmpty(callbackUrl)) return null;
            using var callbackResponse = await client.GetAsync(callbackUrl);

            // 6. Extract Set-Cookie headers from the callback response
            var chunks = new Dictionary<string, string>();
            if (callbackResponse.Headers.TryGetValues("Set-Cookie", out var setCookieHeaders))
            {
                foreach (var header in setCookieHeaders)
                {
                    var eqIdx = header.IndexOf('=');
                    var semiIdx = header.IndexOf(';');
                    if (eqIdx > 0 && semiIdx > eqIdx)
                    {
                        var name = header[..eqIdx];
                        var value = header[(eqIdx + 1)..semiIdx];
                        if (name.StartsWith("__Host-pmo.session"))
                            chunks[name] = value;
                    }
                }
            }

            if (chunks.Count > 0)
                return new SessionCaptureResult(chunks.Values.FirstOrDefault(), chunks);
        }
        catch { }
        return null;
    }

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

        var consoleMessages = new List<string>();
        page.Console += (_, msg) => { try { consoleMessages.Add($"[{msg.Type}] {msg.Text}"); } catch { } };
        page.PageError += (_, msg) => { try { consoleMessages.Add($"[PAGE_ERROR] {msg}"); } catch { } };
        page.RequestFailed += (_, req) => { try { consoleMessages.Add($"[REQUEST_FAILED] {req.Url} ({req.Failure})"); } catch { } };

        bool TryLog(string label) { try { Console.WriteLine($"[GlobalSetUp] {label}"); } catch { return false; } return true; }

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
            TryLog($"Step 1: Logging in as {username}");
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
                    TryLog($"Step 1: Login succeeded, URL = {page.Url}");
                    break;
                }
                catch (TimeoutException) when (attempt < 3)
                {
                    TryLog($"Step 1: Attempt {attempt} timed out, reloading login page");
                    await page.ReloadAsync(new() { Timeout = 15000 });
                    await Task.Delay(3000);
                }
            }

            // Verify we have the Identity cookie before attempting OIDC.
            var identityCookie = (await context.CookiesAsync()).FirstOrDefault(c => c.Name == "__Host-pmo.auth");
            TryLog($"Identity cookie present: {identityCookie is not null}");

            // Step 2: Complete the OIDC flow so the BFF creates __Host-pmo.session.
            // Navigate to the BFF login endpoint, which initiates OIDC challenge.
            // If the identity cookie from step 1 is valid, the identity server auto-authenticates.
            TryLog($"Step 2: Navigating to /login?returnUrl=/");
            for (var attempt = 1; attempt <= 3; attempt++)
            {
                try
                {
                    await page.GotoAsync("/login?returnUrl=/", new() { Timeout = 15000 });
                    TryLog($"Step 2: GotoAsync completed, URL = {page.Url}");
                    // Wait for the SPA to render the logged-in navigation bar (proves OIDC completed)
                    await page.WaitForSelectorAsync("#user-dropdown", new() { Timeout = 20000 });
                    TryLog($"Step 2: user-dropdown found");
                    break;
                }
                catch (TimeoutException) when (attempt < 3)
                {
                    TryLog($"Step 2: Attempt {attempt} failed. URL={page.Url}. Console output:");
                    foreach (var msg in consoleMessages.TakeLast(20))
                        TryLog($"  {msg}");
                    consoleMessages.Clear();

                    // Re-establish the Identity cookie before retrying the OIDC flow.
                    TryLog("Re-establishing Identity cookie");
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

            TryLog($"Step 2: Final URL = {page.Url}");
            TryLog($"Console errors during capture: {string.Join(" | ", consoleMessages.TakeLast(10))}");

            var cookies = await context.CookiesAsync();
            var sessionChunks = cookies
                .Where(c => c.Name.StartsWith("__Host-pmo.session"))
                .ToDictionary(c => c.Name, c => c.Value);

            // Fallback: if the browser OIDC flow didn't produce session cookies, complete the
            // OIDC flow via HttpClient (which the proxy handles correctly) and inject the
            // captured cookies into the browser via document.cookie.
            if (sessionChunks.Count == 0 && identityCookie is not null)
            {
                TryLog("Browser OIDC flow did not produce session cookies. Falling back to HttpClient OIDC flow.");
                var httpResult = await CompleteOidcViaHttpAsync(username, password);
                if (httpResult is not null)
                {
                    foreach (var kv in httpResult.Chunks!)
                    {
                        await page.EvaluateAsync(
                            $"document.cookie = '{kv.Key}={kv.Value}; path=/; secure; samesite=lax'");
                    }
                    sessionChunks = httpResult.Chunks.ToDictionary(kv => kv.Key, kv => kv.Value);
                    TryLog($"Fallback injected {sessionChunks.Count} session cookies via document.cookie");
                }
            }

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
