using System.Net;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Playwright;

namespace PromiseModelOnline.E2E.Tests;

[TestFixture]
public class AuthManagementE2ETests : E2ETestBase
{
    private const string NewPassword = "NewPass456*";

    [Test]
    public async Task ChangePassword_Valid_Succeeds()
    {
        var (username, email, userId) = await RegisterAndVerifyUserAsync();

        await LoginAsUser(username, NewPassword);  // the password set during registration

        await NavigateForFormAsync("/account/change-password");
        await Page.WaitForSelectorAsync(".auth-form", new() { Timeout = 5000 });

        await Page.FillAsync("#currentPassword", NewPassword);
        await Page.FillAsync("#newPassword", TestPassword);
        await Page.FillAsync("#confirmPassword", TestPassword);

        await Page.ClickAsync("button.submit-btn");
        await Page.WaitForURLAsync(new Regex("/account/change-password$"), new() { Timeout = 5000 });

        var successText = await Page.Locator(".auth-success").InnerTextAsync();
        Assert.That(successText, Does.Contain("Password changed"));
        AssertNoCspViolations();
    }

    [Test]
    public async Task DeleteAccount_WithPassword_Succeeds()
    {
        var (username, email, userId) = await RegisterAndVerifyUserAsync();

        await LoginAsUser(username, NewPassword);

        var authClient = await GetAuthClientAsync();
        var body = JsonSerializer.Serialize(new { password = NewPassword });
        using var request = new HttpRequestMessage(HttpMethod.Delete, $"{BaseUrl}/account/me")
        {
            Content = new StringContent(body, System.Text.Encoding.UTF8, "application/json")
        };
        var response = await authClient.SendAsync(request);

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NoContent));
    }

    [Test]
    public async Task DeleteAccount_WrongPassword_ReturnsError()
    {
        var (username, email, userId) = await RegisterAndVerifyUserAsync();

        await LoginAsUser(username, NewPassword);

        var authClient = await GetAuthClientAsync();
        var body = JsonSerializer.Serialize(new { password = "WrongPassword1!" });
        using var request = new HttpRequestMessage(HttpMethod.Delete, $"{BaseUrl}/account/me")
        {
            Content = new StringContent(body, System.Text.Encoding.UTF8, "application/json")
        };
        var response = await authClient.SendAsync(request);

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest).Or.EqualTo(HttpStatusCode.Unauthorized));
    }

    private async Task<(string Username, string Email, string UserId)> RegisterAndVerifyUserAsync()
    {
        var suffix = Guid.NewGuid().ToString("N");
        var username = $"e2e_auth_{suffix}";
        var email = $"e2e_auth_{suffix}@example.com";

        // Retry once on anti-CSRF 400 (empty body)
        for (var attempt = 1; attempt <= 2; attempt++)
        {
            if (attempt > 1) await _context.ClearCookiesAsync();
            await NavigateForFormAsync("/account/register");
            await Page.WaitForSelectorAsync(".auth-form", new() { Timeout = 5000 });

            await Page.FillAsync("#Username", username);
            await Page.FillAsync("#Email", email);
            await Page.FillAsync("#Password", NewPassword);
            await Page.FillAsync("#ConfirmPassword", NewPassword);
            await Page.CheckAsync("#privacyConsent");

            await Page.ClickAsync("button.submit-btn");
            try
            {
                await Page.WaitForURLAsync(new Regex("account/verify-email\\?userId="), new() { Timeout = 5000 });
                break;
            }
            catch (TimeoutException) when (attempt < 2)
            {
                var body = (await Page.TextContentAsync("body") ?? "").Trim();
                if (body.Length != 0) throw;
            }
        }

        var match = Regex.Match(Page.Url, @"userId=([^&]+)");
        Assert.That(match.Success, Is.True, "Expected userId in redirect URL");
        var userId = match.Groups[1].Value;

        var code = await GetVerificationCodeAsync(userId);
        Assert.That(code, Is.Not.Null.And.Not.Empty);

        for (var attempt = 1; attempt <= 3; attempt++)
        {
            try
            {
                try
                {
                    await Page.FillAsync("#Code", code);
                }
                catch (TimeoutException)
                {
                    await Page.ScreenshotAsync(new() { Path = $"/tmp/verify-fill-fail-{username}-{attempt}.png" });
                    var url = Page.Url;
                    var hasCodeJson = await Page.EvaluateAsync("document.getElementById('Code') !== null");
                    var hasCode = hasCodeJson?.GetBoolean() ?? false;
                    await TestContext.Out.WriteLineAsync($"FILL FAIL attempt {attempt}: URL={url}, hasCode={hasCode}");
                    if (!hasCode)
                    {
                        try
                        {
                            var title = await Page.TitleAsync();
                            var html = await Page.ContentAsync();
                            var htmlPath = $"/tmp/verify-html-{username}-{attempt}.html";
                            await File.WriteAllTextAsync(htmlPath, html);
                            await TestContext.Out.WriteLineAsync($"  title='{title}' html={htmlPath}");
                        }
                        catch (Exception ex)
                        {
                            await TestContext.Out.WriteLineAsync($"  content capture failed: {ex.Message}");
                        }
                    }
                    throw;
                }

                try
                {
                    await Page.ClickAsync("button.submit-btn");
                    await Page.WaitForURLAsync(new Regex("account/login"), new() { Timeout = 30000 });
                }
                catch (TimeoutException)
                {
                    await Page.ScreenshotAsync(new() { Path = $"/tmp/verify-nav-fail-{username}-{attempt}.png" });
                    var url = Page.Url;
                    await TestContext.Out.WriteLineAsync($"NAV FAIL attempt {attempt}: URL={url}");
                    throw;
                }
                break;
            }
            catch (TimeoutException) when (attempt < 3)
            {
                if (attempt < 3)
                {
                    code = await GetVerificationCodeAsync(userId);
                    await Task.Delay(3000);
                }
            }
        }

        return (username, email, userId);
    }

    private async Task<string> GetVerificationCodeAsync(string userId)
    {
        var response = await GetAsync($"/account/verify-email/debug/code/{userId}");
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var body = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(body);
        return json.RootElement.GetProperty("code").GetString()!;
    }

}
