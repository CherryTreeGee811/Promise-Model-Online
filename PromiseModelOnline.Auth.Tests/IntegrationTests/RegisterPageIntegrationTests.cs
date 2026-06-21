using System.Net;

namespace PromiseModelOnline.Auth.Tests.IntegrationTests;

/// <summary>Integration tests for the registration page flow with email verification.</summary>
// Requirements: REQ_FUN_001 REQ_FUN_047
public class RegisterPageIntegrationTests : IntegrationTestBase
{
    private const string TestPassword = "TestPass123!";

    [Test]
    public async Task REQ_FUN_001_Get_RegisterPage_Returns200()
    {
        // Act
        var response = await Client.GetAsync("/account/register");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
    }

    [Test]
    public async Task REQ_FUN_001_Get_RegisterPage_ContainsTitle()
    {
        // Act
        var html = await Client.GetStringAsync("/account/register");
        // Assert
        Assert.That(html, Does.Contain("<h1 class=\"sr-only\">Create your Promise Model Online account</h1>"));
    }

    [Test]
    public async Task REQ_FUN_001_Get_RegisterPage_HasAllFieldsAndAntiforgery()
    {
        // Act
        var html = await Client.GetStringAsync("/account/register");
        // Assert
        Assert.That(html, Does.Contain("name=\"Username\""));
        Assert.That(html, Does.Contain("name=\"Email\""));
        Assert.That(html, Does.Contain("name=\"Password\""));
        Assert.That(html, Does.Contain("name=\"ConfirmPassword\""));
        Assert.That(html, Does.Contain("__RequestVerificationToken"));
    }

    [Test]
    public async Task REQ_FUN_001_Get_RegisterPage_HasLoginLink()
    {
        // Act
        var html = await Client.GetStringAsync("/account/register");
        // Assert
        Assert.That(html, Does.Contain("Sign in here"));
    }

    [Test]
    public async Task REQ_FUN_001_Post_Register_EmptyFields_ReturnsValidationError()
    {
        // Arrange
        var antiforgery = await GetAntiforgeryData("/account/register");

        var formData = new Dictionary<string, string>
        {
            { "Username", "" },
            { "Email", "" },
            { "Password", "" },
            { "ConfirmPassword", "" }
        };

        var request = CreatePostWithAntiforgery("/account/register", antiforgery, formData);
        // Act
        var response = await Client.SendAsync(request);
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));

        var html = await response.Content.ReadAsStringAsync();
        Assert.That(html, Does.Contain("auth-error"));
    }

    [Test]
    public async Task REQ_FUN_001_Post_Register_PasswordMismatch_ReturnsError()
    {
        // Arrange
        var antiforgery = await GetAntiforgeryData("/account/register");

        var formData = new Dictionary<string, string>
        {
            { "Username", "mismatch_user" },
            { "Email", "mismatch@test.com" },
            { "Password", "Password1!" },
            { "ConfirmPassword", "DifferentPass1!" }
        };

        var request = CreatePostWithAntiforgery("/account/register", antiforgery, formData);
        // Act
        var response = await Client.SendAsync(request);
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));

        var html = await response.Content.ReadAsStringAsync();
        Assert.That(html, Does.Contain("auth-error"));
    }

    [Test]
    public async Task REQ_FUN_001_Post_Register_ValidUser_RedirectsToEmailVerification()
    {
        // Arrange
        var uniqueUser = "inttest_" + Guid.NewGuid().ToString("N")[..8];
        var uniqueEmail = uniqueUser + "@test.com";

        var antiforgery = await GetAntiforgeryData("/account/register");

        var formData = new Dictionary<string, string>
        {
            { "Username", uniqueUser },
            { "Email", uniqueEmail },
            { "Password", TestPassword },
            { "ConfirmPassword", TestPassword }
        };

        var request = CreatePostWithAntiforgery("/account/register", antiforgery, formData);
        // Act
        var response = await Client.SendAsync(request);
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));

        var location = await ExtractRedirectLocation(response);
        Assert.That(location, Does.Contain("/account/verify-email"));
        Assert.That(location, Does.Contain("userId="));
    }

    [Test]
    public async Task REQ_FUN_001_Post_Register_DuplicateEmail_ReturnsError()
    {
        // Arrange
        var uniqueUser = "dup_email_" + Guid.NewGuid().ToString("N")[..8];
        var sharedEmail = "shared_" + Guid.NewGuid().ToString("N")[..8] + "@test.com";

        // First registration
        var antiforgery1 = await GetAntiforgeryData("/account/register?returnUrl=/account/login");
        var formData1 = new Dictionary<string, string>
        {
            { "Username", uniqueUser },
            { "Email", sharedEmail },
            { "Password", TestPassword },
            { "ConfirmPassword", TestPassword }
        };
        var request1 = CreatePostWithAntiforgery("/account/register?returnUrl=/account/login", antiforgery1, formData1);
        var response1 = await Client.SendAsync(request1);
        Assert.That(response1.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));

        // Act - Second registration with same email
        var antiforgery2 = await GetAntiforgeryData("/account/register");
        var formData2 = new Dictionary<string, string>
        {
            { "Username", uniqueUser + "_alt" },
            { "Email", sharedEmail },
            { "Password", TestPassword },
            { "ConfirmPassword", TestPassword }
        };
        var request2 = CreatePostWithAntiforgery("/account/register", antiforgery2, formData2);
        var response2 = await Client.SendAsync(request2);
        // Assert
        Assert.That(response2.StatusCode, Is.EqualTo(HttpStatusCode.OK));

        var html = await response2.Content.ReadAsStringAsync();
        Assert.That(html, Does.Contain("already taken"));
    }

    [Test]
    public async Task REQ_FUN_001_Post_Register_DuplicateUsername_ReturnsError()
    {
        // Arrange
        var sharedUser = "dup_user_" + Guid.NewGuid().ToString("N")[..8];

        // First registration
        var antiforgery1 = await GetAntiforgeryData("/account/register?returnUrl=/account/login");
        var formData1 = new Dictionary<string, string>
        {
            { "Username", sharedUser },
            { "Email", sharedUser + "@test.com" },
            { "Password", TestPassword },
            { "ConfirmPassword", TestPassword }
        };
        var request1 = CreatePostWithAntiforgery("/account/register?returnUrl=/account/login", antiforgery1, formData1);
        var response1 = await Client.SendAsync(request1);
        Assert.That(response1.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));

        // Act - Second registration with same username
        var antiforgery2 = await GetAntiforgeryData("/account/register");
        var formData2 = new Dictionary<string, string>
        {
            { "Username", sharedUser },
            { "Email", "other_" + sharedUser + "@test.com" },
            { "Password", TestPassword },
            { "ConfirmPassword", TestPassword }
        };
        var request2 = CreatePostWithAntiforgery("/account/register", antiforgery2, formData2);
        var response2 = await Client.SendAsync(request2);
        // Assert
        Assert.That(response2.StatusCode, Is.EqualTo(HttpStatusCode.OK));

        var html = await response2.Content.ReadAsStringAsync();
        Assert.That(html, Does.Contain("already taken"));
    }
}
