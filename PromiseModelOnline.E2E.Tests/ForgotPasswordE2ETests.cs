using System.Net;
using System.Text.RegularExpressions;

namespace PromiseModelOnline.E2E.Tests;

[TestFixture]
public class ForgotPasswordE2ETests : E2ETestBase
{
    private const string TestUserEmail = "pmo@gmail.com";
    private const string NewPassword = "NewPass123*";

    [Test]
    public async Task ForgotPassword_ShowsForm()
    {
        // Arrange (no setup needed)

        // Act
        await Page.GotoAsync("/account/forgot-password");
        await Page.WaitForSelectorAsync(".auth-form", new() { Timeout = 10000 });

        // Assert
        Assert.That(await Page.Locator("#Email").CountAsync(), Is.EqualTo(1));
        Assert.That(await Page.Locator("button.submit-btn").InnerTextAsync(), Does.Contain("Send Reset Link"));
    }

    [Test]
    public async Task ForgotPassword_ValidEmail_ShowsConfirmation()
    {
        // Arrange (no setup needed)

        // Act
        await NavigateForFormAsync("/account/forgot-password");
        await Page.WaitForSelectorAsync(".auth-form", new() { Timeout = 5000 });
        await Page.FillAsync("#Email", TestUserEmail);
        await Page.ClickAsync("button.submit-btn");
        await Page.WaitForSelectorAsync(".auth-success", new() { Timeout = 5000 });
        var text = await Page.Locator(".auth-success").InnerTextAsync();
        Assert.That(text, Does.Contain("reset link"));
        AssertNoCspViolations();
    }

    [Test]
    public async Task ResetPassword_WithValidToken_Succeeds()
    {
        // Arrange
        var token = await GetResetTokenAsync(TestUserEmail);
        Assert.That(token, Is.Not.Null.And.Not.Empty);

        // Act
        await NavigateForFormAsync($"/account/reset-password?email={Uri.EscapeDataString(TestUserEmail)}&token={Uri.EscapeDataString(token)}");
        await Page.WaitForSelectorAsync(".auth-form", new() { Timeout = 5000 });
        await Page.FillAsync("#Password", NewPassword);
        await Page.FillAsync("#ConfirmPassword", NewPassword);
        await Page.ClickAsync("button.submit-btn");

        // Assert
        await Page.WaitForSelectorAsync("h2", new() { Timeout = 5000 });
        var heading = await Page.Locator("h2").InnerTextAsync();
        Assert.That(heading, Does.Contain("Password Reset Successful"));
        AssertNoCspViolations();
    }

    [Test]
    public async Task ResetPassword_WithInvalidToken_ShowsError()
    {
        // Arrange (no setup needed)

        // Act
        await NavigateForFormAsync($"/account/reset-password?email={Uri.EscapeDataString(TestUserEmail)}&token=invalid-token");
        await Page.WaitForSelectorAsync(".auth-form", new() { Timeout = 5000 });
        await Page.FillAsync("#Password", NewPassword);
        await Page.FillAsync("#ConfirmPassword", NewPassword);
        await Page.ClickAsync("button.submit-btn");

        // Assert
        await Page.WaitForSelectorAsync(".auth-error", new() { Timeout = 5000 });
        var errorText = await Page.Locator(".auth-error").InnerTextAsync();
        Assert.That(errorText, Does.Contain("Invalid").Or.Contain("invalid"));
        AssertNoCspViolations();
    }

    private async Task<string> GetResetTokenAsync(string email)
    {
        var response = await GetAsync($"/account/forgot-password/debug/token?email={Uri.EscapeDataString(email)}");
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK),
            "Debug token endpoint should return 200 in Development environment");
        var body = await response.Content.ReadAsStringAsync();
        var json = System.Text.Json.JsonDocument.Parse(body);
        return json.RootElement.GetProperty("token").GetString()!;
    }
}
