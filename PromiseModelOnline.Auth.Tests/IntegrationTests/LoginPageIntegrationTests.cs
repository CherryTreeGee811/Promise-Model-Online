using System.Net;

namespace PromiseModelOnline.Auth.Tests.IntegrationTests;

public class LoginPageIntegrationTests : IntegrationTestBase
{
    [Test]
    public async Task Get_LoginPage_Returns200()
    {
        var response = await Client.GetAsync("/account/login");
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
    }

    [Test]
    public async Task Get_LoginPage_ContainsTitle()
    {
        var html = await Client.GetStringAsync("/account/login");
        Assert.That(html, Does.Contain("<h1 class=\"sr-only\">Sign in to Promise Model Online</h1>"));
    }

    [Test]
    public async Task Get_LoginPage_HasFieldsAndAntiforgery()
    {
        var html = await Client.GetStringAsync("/account/login");
        Assert.That(html, Does.Contain("name=\"Username\""));
        Assert.That(html, Does.Contain("name=\"Password\""));
        Assert.That(html, Does.Contain("__RequestVerificationToken"));
    }

    [Test]
    public async Task Get_LoginPage_ShowsSuccessMessage_WhenReturnedFromRegister()
    {
        var html = await Client.GetStringAsync("/account/login?registered=true");
        Assert.That(html, Does.Contain("Account created successfully"));
    }

    [Test]
    public async Task Post_Login_InvalidCredentials_ReturnsPageWithError()
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
        Assert.That(html, Does.Contain("Invalid credentials"));
    }

    [Test]
    public async Task Post_Login_ValidCredentials_WithReturnUrl_RedirectsToReturnUrl()
    {
        var antiforgery = await GetAntiforgeryData("/account/login?returnUrl=%2Faccount%2Fchange-password");

        var formData = new Dictionary<string, string>
        {
            { "Username", "pmo_test" },
            { "Password", "Hello123*" },
            { "ReturnUrl", "/account/change-password" }
        };

        var request = CreatePostWithAntiforgery("/account/login", antiforgery, formData);
        var response = await Client.SendAsync(request);

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));

        var location = await ExtractRedirectLocation(response);
        Assert.That(location, Is.EqualTo("/account/change-password"));
    }

    [Test]
    public async Task Post_Login_ValidCredentials_WithoutReturnUrl_RedirectsToBff()
    {
        var antiforgery = await GetAntiforgeryData("/account/login");

        var formData = new Dictionary<string, string>
        {
            { "Username", "pmo_test" },
            { "Password", "Hello123*" }
        };

        var request = CreatePostWithAntiforgery("/account/login", antiforgery, formData);
        var response = await Client.SendAsync(request);

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));

        var location = await ExtractRedirectLocation(response);
        Assert.That(location, Is.EqualTo("/login"));
    }

    [Test]
    public async Task Post_Login_EmptyFields_ReturnsPageWithValidationError()
    {
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
