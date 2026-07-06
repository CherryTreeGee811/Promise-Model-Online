using System.Net;
using System.Text.RegularExpressions;
using Microsoft.Playwright;

namespace PromiseModelOnline.E2E.Tests;

[TestFixture]
public class RegistrationE2ETests : E2ETestBase
{
    [Test]
    public async Task Register_ShowsForm()
    {
        // Arrange (no setup needed)

        // Act
        await Page.GotoAsync("/account/register");
        await Page.WaitForSelectorAsync(".auth-form", new() { Timeout = 5000 });

        // Assert
        Assert.That(await Page.Locator("#Username").CountAsync(), Is.EqualTo(1));
        Assert.That(await Page.Locator("#Email").CountAsync(), Is.EqualTo(1));
        Assert.That(await Page.Locator("#Password").CountAsync(), Is.EqualTo(1));
        Assert.That(await Page.Locator("#ConfirmPassword").CountAsync(), Is.EqualTo(1));
        Assert.That(await Page.Locator("#privacyConsent").CountAsync(), Is.EqualTo(1));
        Assert.That(await Page.Locator("button.submit-btn").InnerTextAsync(), Does.Contain("Register"));
    }

    [Test]
    public async Task Register_ValidSubmission_RedirectsToVerification()
    {
        // Arrange
        var (username, email) = NewUser();

        // Act — retry once on anti-CSRF 400
        for (var attempt = 1; attempt <= 2; attempt++)
        {
            if (attempt > 1) await _context.ClearCookiesAsync();
            await NavigateForFormAsync("/account/register");
            await Page.WaitForSelectorAsync(".auth-form", new() { Timeout = 5000 });
            await FillRegistrationForm(username, email, TestPassword);
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

        // Assert
        Assert.That(Page.Url, Does.Contain("account/verify-email"));
        AssertNoCspViolations();
    }

    [Test]
    public async Task VerifyEmail_WithValidCode_Succeeds()
    {
        // Arrange
        var userId = await RegisterNewUserAsync();
        var code = await GetVerificationCodeAsync(userId);
        Assert.That(code, Is.Not.Null.And.Not.Empty, "Verification code should be retrievable from debug endpoint");

        // Act
        await Page.FillAsync("#Code", code);
        await Page.ClickAsync("button.submit-btn");

        // Assert
        await Page.WaitForURLAsync(new Regex("account/login"), new() { Timeout = 5000 });
        Assert.That(Page.Url, Does.Contain("verified=true"));
        AssertNoCspViolations();
    }

    [Test]
    public async Task VerifyEmail_WithInvalidCode_ShowsError()
    {
        // Arrange
        await RegisterNewUserAsync();

        // Act
        await Page.FillAsync("#Code", "000000");
        await Page.ClickAsync("button.submit-btn");

        // Assert
        await Page.WaitForSelectorAsync(".auth-error", new() { Timeout = 5000 });
        var errorText = await Page.Locator(".auth-error").InnerTextAsync();
        Assert.That(errorText, Does.Contain("Invalid or expired"));
        AssertNoCspViolations();
    }

    [Test]
    public async Task Registration_DuplicateEmail_ReturnsError()
    {
        // Arrange — register a user with a known email first so the duplicate exists
        var dupEmail = $"dupe-{Guid.NewGuid().ToString("N")[..8]}@example.com";
        await _context.ClearCookiesAsync();
        await NavigateForFormAsync("/account/register");
        await Page.WaitForSelectorAsync(".auth-form", new() { Timeout = 5000 });
        await FillRegistrationForm(NewUser().Username, dupEmail, TestPassword);
        await Page.ClickAsync("button.submit-btn");
        await Page.WaitForURLAsync(new Regex("account/verify-email\\?userId="), new() { Timeout = 5000 });

        // Act — try to register the same email again
        await _context.ClearCookiesAsync();
        await NavigateForFormAsync("/account/register");
        await Page.WaitForSelectorAsync(".auth-form", new() { Timeout = 5000 });
        await FillRegistrationForm(NewUser().Username, dupEmail, TestPassword);
        await Page.ClickAsync("button.submit-btn");

        // Assert
        await Page.WaitForSelectorAsync(".auth-error", new() { Timeout = 5000 });
        var errorText = await Page.Locator(".auth-error").InnerTextAsync();
        Assert.That(errorText, Does.Contain("already").Or.Contain("taken").Or.Contain("exists"));
        AssertNoCspViolations();
    }

    [Test]
    public async Task Registration_WeakPassword_ReturnsError()
    {
        // Arrange
        var (username, email) = NewUser();

        // Act
        await NavigateForFormAsync("/account/register");
        await Page.WaitForSelectorAsync(".auth-form", new() { Timeout = 5000 });
        await FillRegistrationForm(username, email, "password");
        await Page.ClickAsync("button.submit-btn");

        // Assert
        await Page.WaitForSelectorAsync(".auth-error", new() { Timeout = 5000 });
        var errorText = await Page.Locator(".auth-error").InnerTextAsync();
        Assert.That(errorText, Does.Contain("password").Or.Contain("Password"));
        AssertNoCspViolations();
    }

    private static (string Username, string Email) NewUser()
    {
        var suffix = Guid.NewGuid().ToString("N");
        return ($"e2e_reg_{suffix}", $"e2e_reg_{suffix}@example.com");
    }

    private async Task FillRegistrationForm(string username, string email, string password)
    {
        await Page.FillAsync("#Username", username);
        await Page.FillAsync("#Email", email);
        await Page.FillAsync("#Password", password);
        await Page.FillAsync("#ConfirmPassword", password);
        await Page.CheckAsync("#privacyConsent");
    }

    private async Task<string> RegisterNewUserAsync()
    {
        var (username, email) = NewUser();

        // Retry once on anti-CSRF 400
        for (var attempt = 1; attempt <= 2; attempt++)
        {
            if (attempt > 1) await _context.ClearCookiesAsync();
            await NavigateForFormAsync("/account/register");
            await Page.WaitForSelectorAsync(".auth-form", new() { Timeout = 5000 });

            await FillRegistrationForm(username, email, TestPassword);

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
        return match.Groups[1].Value;
    }

    private async Task<string> GetVerificationCodeAsync(string userId)
    {
        var response = await GetAsync($"/account/verify-email/debug/code/{userId}");
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK),
            "Debug endpoint should return 200 in Development environment");
        var body = await response.Content.ReadAsStringAsync();
        var json = System.Text.Json.JsonDocument.Parse(body);
        return json.RootElement.GetProperty("code").GetString()!;
    }
}
