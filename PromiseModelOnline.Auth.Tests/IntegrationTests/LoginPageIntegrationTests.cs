using System.Net;

namespace PromiseModelOnline.Auth.Tests.IntegrationTests;

/// <summary>Integration tests for <see cref="LoginController"/> login page rendering and form submission.</summary>
// Requirements: REQ_FUN_002
public class LoginPageIntegrationTests : IntegrationTestBase
{
    [Test]
    public async Task REQ_FUN_002_Get_LoginPage_Returns200()
    {
        // Act
        var response = await Client.GetAsync("/account/login");

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
    }

    [Test]
    public async Task REQ_FUN_002_Get_LoginPage_ContainsTitle()
    {
        // Act
        var html = await Client.GetStringAsync("/account/login");

        // Assert
        Assert.That(html, Does.Contain("<h1 class=\"sr-only\">Sign in to Promise Model Online</h1>"));
    }

    [Test]
    public async Task REQ_FUN_002_Get_LoginPage_HasFieldsAndAntiforgery()
    {
        // Act
        var html = await Client.GetStringAsync("/account/login");

        // Assert
        Assert.That(html, Does.Contain("name=\"Username\""));
        Assert.That(html, Does.Contain("name=\"Password\""));
        Assert.That(html, Does.Contain("__RequestVerificationToken"));
    }

    [Test]
    public async Task REQ_FUN_002_Get_LoginPage_ShowsSuccessMessage_WhenReturnedFromRegister()
    {
        // Act
        var html = await Client.GetStringAsync("/account/login?registered=true");

        // Assert
        Assert.That(html, Does.Contain("Account created successfully"));
    }

    [Test]
    public async Task REQ_FUN_002_Post_Login_InvalidCredentials_ReturnsPageWithError()
    {
        var antiforgery = await GetAntiforgeryData("/account/login");

        var formData = new Dictionary<string, string>
        {
            { "Username", "nonexistent_user" },
            { "Password", "wrong_password" }
        };

        var request = CreatePostWithAntiforgery("/account/login", antiforgery, formData);
        var response = await Client.SendAsync(request);

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));

        var html = await response.Content.ReadAsStringAsync();
        Assert.That(html, Does.Contain("Invalid username or password"));
    }

    [Test]
    public async Task REQ_FUN_002_Post_Login_ValidCredentials_WithReturnUrl_RedirectsToReturnUrl()
    {
        // Arrange
        var antiforgery = await GetAntiforgeryData("/account/login?returnUrl=%2Faccount%2Fchange-password");
        var formData = new Dictionary<string, string>
        {
            { "Username", "pmo_test" },
            { "Password", "Hello123*" },
            { "ReturnUrl", "/account/change-password" }
        };
        var request = CreatePostWithAntiforgery("/account/login", antiforgery, formData);

        // Act
        var response = await Client.SendAsync(request);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));
        var location = await ExtractRedirectLocation(response);
        Assert.That(location, Is.EqualTo("/account/change-password"));
    }

    [Test]
    public async Task REQ_FUN_002_Post_Login_ValidCredentials_WithoutReturnUrl_RedirectsToBff()
    {
        // Arrange
        var antiforgery = await GetAntiforgeryData("/account/login");
        var formData = new Dictionary<string, string>
        {
            { "Username", "pmo_test" },
            { "Password", "Hello123*" }
        };
        var request = CreatePostWithAntiforgery("/account/login", antiforgery, formData);

        // Act
        var response = await Client.SendAsync(request);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));
        var location = await ExtractRedirectLocation(response);
        Assert.That(location, Is.EqualTo("https://localhost:9000/projects"));
    }

    [Test]
    public async Task REQ_FUN_002_Post_Login_EmptyFields_ReturnsPageWithValidationError()
    {
        // Arrange
        var antiforgery = await GetAntiforgeryData("/account/login");

        var formData = new Dictionary<string, string>
        {
            { "Username", "" },
            { "Password", "" }
        };

        var request = CreatePostWithAntiforgery("/account/login", antiforgery, formData);
        var response = await Client.SendAsync(request);

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));

        var html = await response.Content.ReadAsStringAsync();
        Assert.That(html, Does.Contain("auth-error"));
    }
}
