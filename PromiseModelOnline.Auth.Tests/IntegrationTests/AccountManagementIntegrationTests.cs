using System.Net;
using System.Net.Http.Json;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;

namespace PromiseModelOnline.Auth.Tests.IntegrationTests;

// Requirements: REQ_FUN_001 REQ_USE_012
public class AccountManagementIntegrationTests : IntegrationTestBase
{
    private const string TestPassword = "Hello123*";

    /// <summary>Login as pmo_test and return the full identity cookie header value.</summary>
    private async Task<string> AuthCookieAsync()
    {
        var loginResponse = await Client.GetAsync("/account/login");
        Assert.That(loginResponse.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var loginHtml = await loginResponse.Content.ReadAsStringAsync();
        var token = ExtractAntiforgeryToken(loginHtml);
        var antiforgeryCookie = ExtractSetCookieHeader(loginResponse, ".AspNetCore.Antiforgery");
        Assert.That(antiforgeryCookie, Is.Not.Null);

        var request = CreatePost("/account/login", new Dictionary<string, string>
        {
            { "Username", "pmo_test" },
            { "Password", TestPassword },
            { "__RequestVerificationToken", token }
        }, antiforgeryCookie);
        var response = await Client.SendAsync(request);
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));

        var cookie = ExtractSetCookieHeader(response, "pmo.auth");
        Assert.That(cookie, Is.Not.Null, "Identity cookie not found in login response");
        return cookie!;
    }

    /// <summary>Login as a specific user and return the identity cookie.</summary>
    private async Task<string> AuthCookieForAsync(string username, string password)
    {
        var loginResponse = await Client.GetAsync("/account/login");
        Assert.That(loginResponse.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var loginHtml = await loginResponse.Content.ReadAsStringAsync();
        var token = ExtractAntiforgeryToken(loginHtml);
        var antiforgeryCookie = ExtractSetCookieHeader(loginResponse, ".AspNetCore.Antiforgery");
        Assert.That(antiforgeryCookie, Is.Not.Null);

        var request = CreatePost("/account/login", new Dictionary<string, string>
        {
            { "Username", username },
            { "Password", password },
            { "__RequestVerificationToken", token }
        }, antiforgeryCookie);
        var response = await Client.SendAsync(request);
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));

        var cookie = ExtractSetCookieHeader(response, "pmo.auth");
        Assert.That(cookie, Is.Not.Null, "Identity cookie not found in login response");
        return cookie!;
    }

    // ============================
    // CHANGE PASSWORD PAGE
    // ============================

    [Test]
    public async Task REQ_FUN_001_Get_ChangePasswordPage_WithAuth_Returns200()
    {
        // Arrange
        var auth = await AuthCookieAsync();
        // Act
        var response = await Client.SendAsync(CreateGet("/account/change-password", auth));
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
    }

    [Test]
    public async Task REQ_FUN_001_Post_ChangePasswordPage_Valid_Succeeds()
    {
        // Arrange
        var auth = await AuthCookieAsync();

        var getResponse = await Client.SendAsync(CreateGet("/account/change-password", auth));
        Assert.That(getResponse.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var html = await getResponse.Content.ReadAsStringAsync();
        var token = ExtractAntiforgeryToken(html);
        var antiforgery = ExtractSetCookieHeader(getResponse, ".AspNetCore.Antiforgery");
        Assert.That(antiforgery, Is.Not.Null);
        // Act
        var response = await Client.SendAsync(CreatePost("/account/change-password", new Dictionary<string, string>
        {
            { "currentPassword", TestPassword },
            { "newPassword", "NewPass456!" },
            { "confirmPassword", "NewPass456!" },
            { "__RequestVerificationToken", token }
        }, $"{auth}; {antiforgery}"));

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var body = await response.Content.ReadAsStringAsync();
        Assert.That(body, Does.Contain("Password changed successfully"));

        // Change password back for other tests
        var getResponse2 = await Client.SendAsync(CreateGet("/account/change-password", auth));
        Assert.That(getResponse2.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var html2 = await getResponse2.Content.ReadAsStringAsync();
        var token2 = ExtractAntiforgeryToken(html2);
        var antiforgery2 = ExtractSetCookieHeader(getResponse2, ".AspNetCore.Antiforgery");
        Assert.That(antiforgery2, Is.Not.Null);
        await Client.SendAsync(CreatePost("/account/change-password", new Dictionary<string, string>
        {
            { "currentPassword", "NewPass456!" },
            { "newPassword", TestPassword },
            { "confirmPassword", TestPassword },
            { "__RequestVerificationToken", token2 }
        }, $"{auth}; {antiforgery2}"));
    }

    [Test]
    public async Task REQ_FUN_001_Post_ChangePasswordPage_WrongCurrentPassword_ReturnsError()
    {
        // Arrange
        var auth = await AuthCookieAsync();

        var getResponse = await Client.SendAsync(CreateGet("/account/change-password", auth));
        Assert.That(getResponse.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var html = await getResponse.Content.ReadAsStringAsync();
        var token = ExtractAntiforgeryToken(html);
        var antiforgery = ExtractSetCookieHeader(getResponse, ".AspNetCore.Antiforgery");
        Assert.That(antiforgery, Is.Not.Null);
        // Act
        var response = await Client.SendAsync(CreatePost("/account/change-password", new Dictionary<string, string>
        {
            { "currentPassword", "WrongPassword1!" },
            { "newPassword", "NewPass456!" },
            { "confirmPassword", "NewPass456!" },
            { "__RequestVerificationToken", token }
        }, $"{auth}; {antiforgery}"));

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var body = await response.Content.ReadAsStringAsync();
        Assert.That(body, Does.Contain("Current password is incorrect"));
    }

    // ============================
    // CHANGE PASSWORD API
    // ============================

    [Test]
    public async Task REQ_FUN_001_Patch_ChangePasswordApi_Unauthenticated_ReturnsUnauthorized()
    {
        // Arrange
        var request = new HttpRequestMessage(HttpMethod.Patch, "/account/me/password")
        {
            Content = JsonContent.Create(new
            {
                currentPassword = TestPassword,
                newPassword = "NewPass456!",
                confirmPassword = "NewPass456!"
            })
        };
        // Act
        var response = await Client.SendAsync(request);
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task REQ_FUN_001_Patch_ChangePasswordApi_Valid_Succeeds()
    {
        // Arrange
        var auth = await AuthCookieAsync();

        var request = new HttpRequestMessage(HttpMethod.Patch, "/account/me/password")
        {
            Content = JsonContent.Create(new
            {
                currentPassword = TestPassword,
                newPassword = "NewPass456!",
                confirmPassword = "NewPass456!"
            })
        };
        request.Headers.Add("Cookie", auth);
        // Act
        var response = await Client.SendAsync(request);
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));

        // Change back
        var request2 = new HttpRequestMessage(HttpMethod.Patch, "/account/me/password")
        {
            Content = JsonContent.Create(new
            {
                currentPassword = "NewPass456!",
                newPassword = TestPassword,
                confirmPassword = TestPassword
            })
        };
        request2.Headers.Add("Cookie", auth);
        await Client.SendAsync(request2);
    }

    // ============================
    // DELETE ACCOUNT
    // ============================

    [Test]
    public async Task REQ_FUN_001_Delete_Account_Unauthenticated_ReturnsUnauthorized()
    {
        // Arrange
        var request = new HttpRequestMessage(HttpMethod.Delete, "/account/me")
        {
            Content = JsonContent.Create(new { password = TestPassword })
        };
        // Act
        var response = await Client.SendAsync(request);
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task REQ_FUN_001_Delete_Account_WithoutPassword_ReturnsBadRequest()
    {
        // Arrange
        var auth = await AuthCookieAsync();

        var request = new HttpRequestMessage(HttpMethod.Delete, "/account/me")
        {
            Content = JsonContent.Create(new { })
        };
        request.Headers.Add("Cookie", auth);
        // Act
        var response = await Client.SendAsync(request);
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    public async Task REQ_FUN_001_Delete_Account_WrongPassword_ReturnsUnauthorized()
    {
        // Arrange
        var auth = await AuthCookieAsync();

        var request = new HttpRequestMessage(HttpMethod.Delete, "/account/me")
        {
            Content = JsonContent.Create(new { password = "WrongPassword1!" })
        };
        request.Headers.Add("Cookie", auth);
        // Act
        var response = await Client.SendAsync(request);
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));

        var body = await response.Content.ReadAsStringAsync();
        Assert.That(body, Does.Contain("Invalid password"));
    }

    [Test]
    public async Task REQ_FUN_001_Delete_Account_Valid_Succeeds()
    {
        // Arrange - Register a fresh user
        var antiforgery = await GetAntiforgeryData("/account/register");
        var uniqueUser = "deluser_" + Guid.NewGuid().ToString("N")[..8];
        var uniqueEmail = uniqueUser + "@test.com";
        var regResponse = await Client.SendAsync(CreatePostWithAntiforgery("/account/register?returnUrl=/account/login",
            antiforgery,
            new Dictionary<string, string>
            {
                { "Username", uniqueUser },
                { "Email", uniqueEmail },
                { "Password", TestPassword },
                { "ConfirmPassword", TestPassword }
            }));
        Assert.That(regResponse.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));

        // Confirm email before login (new requirement)
        var location = regResponse.Headers.Location?.ToString() ?? "";
        var userId = ExtractQueryParam(location, "userId");
        var cache = Factory.Server.Services.GetRequiredService<IMemoryCache>();
        Assert.That(cache.TryGetValue($"verify_code:{userId}", out string? verificationCode), Is.True);
        var verifyAntiforgery = await GetAntiforgeryData($"/account/verify-email?userId={userId}");
        var confirmResponse = await Client.SendAsync(CreatePostWithAntiforgery(
            "/account/verify-email/confirm", verifyAntiforgery,
            new Dictionary<string, string> { { "UserId", userId }, { "Code", verificationCode! } }));
        Assert.That(confirmResponse.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));

        // Login as the new user
        var auth = await AuthCookieForAsync(uniqueUser, TestPassword);

        // Act - Delete account
        var delRequest = new HttpRequestMessage(HttpMethod.Delete, "/account/me")
        {
            Content = JsonContent.Create(new { password = TestPassword })
        };
        delRequest.Headers.Add("Cookie", auth);
        var response = await Client.SendAsync(delRequest);
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NoContent));

        // Verify user can no longer log in
        var loginAntiforgery = await GetAntiforgeryData("/account/login");
        var failedResponse = await Client.SendAsync(CreatePostWithAntiforgery("/account/login",
            loginAntiforgery,
            new Dictionary<string, string>
            {
                { "Username", uniqueUser },
                { "Password", TestPassword }
            }));
        var failedBody = await failedResponse.Content.ReadAsStringAsync();
        Assert.That(failedBody, Does.Contain("Invalid username or password"));
    }
}

internal static class HttpClientExtensions
{
    public static async Task<string> SendAndGetStringAsync(this HttpClient client, HttpRequestMessage request)
    {
        var response = await client.SendAsync(request);
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        return await response.Content.ReadAsStringAsync();
    }
}
