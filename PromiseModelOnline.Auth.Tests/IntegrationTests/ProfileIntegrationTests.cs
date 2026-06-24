using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using NUnit.Framework;

namespace PromiseModelOnline.Auth.Tests.IntegrationTests;

/// <summary>Integration tests for <see cref="Controllers.ProfileController"/> covering the profile page for authenticated and unauthenticated users.</summary>
public class ProfileIntegrationTests : IntegrationTestBase
{
    private const string TestPassword = "Hello123*";

    /// <summary>Login as pmo_test and return the auth cookie header value.</summary>
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

        var cookie = ExtractSetCookieHeader(response, "__Host-pmo.auth");
        Assert.That(cookie, Is.Not.Null, "Identity cookie not found in login response");
        return cookie!;
    }

    [Test]
    public async Task REQ_CA_001_Get_ProfilePage_Authenticated_Returns200()
    {
        var auth = await AuthCookieAsync();

        var getRequest = CreateGet("/account/me/profile", auth);
        var response = await Client.SendAsync(getRequest);

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var html = await response.Content.ReadAsStringAsync();
        Assert.That(html, Does.Contain("My Profile"));
        Assert.That(html, Does.Contain("Save Changes"));
    }

    [Test]
    public async Task REQ_CA_001_Get_ProfilePage_Unauthenticated_ReturnsRedirect()
    {
        var response = await Client.GetAsync("/account/me/profile");
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));
    }

    [Test]
    public async Task REQ_CA_001_Post_UpdateDisplayName_Authenticated_ReturnsSuccess()
    {
        var uniqueName = "user_" + System.Guid.NewGuid().ToString("N")[..8];
        var auth = await AuthCookieAsync();

        // GET profile page with auth cookie to obtain antiforgery token + cookie
        var getRequest = CreateGet("/account/me/profile", auth);
        var getResponse = await Client.SendAsync(getRequest);
        Assert.That(getResponse.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var html = await getResponse.Content.ReadAsStringAsync();
        var profileToken = ExtractAntiforgeryToken(html);
        var profileAntiforgeryCookie = ExtractSetCookieHeader(getResponse, ".AspNetCore.Antiforgery");
        Assert.That(profileAntiforgeryCookie, Is.Not.Null);

        // POST update with both auth and antiforgery cookies.
        // Include Email to satisfy model validation (read-only field, but the ViewModel marks it [Required]).
        var postRequest = new HttpRequestMessage(HttpMethod.Post, "/account/me/profile");
        postRequest.Headers.Add("Cookie", auth + "; " + profileAntiforgeryCookie!);
        postRequest.Content = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            { "Username", uniqueName },
            { "Email", "pmo_test@example.com" },
            { "__RequestVerificationToken", profileToken }
        });
        var postResponse = await Client.SendAsync(postRequest);

        Assert.That(postResponse.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var responseHtml = await postResponse.Content.ReadAsStringAsync();
        Assert.That(responseHtml, Does.Contain("profile has been updated"));
    }

    [Test]
    public async Task REQ_CA_001_Post_UpdateDisplayName_Unauthenticated_ReturnsRedirect()
    {
        var response = await Client.PostAsync("/account/me/profile", new FormUrlEncodedContent(
            new Dictionary<string, string> { { "Username", "newuser" } }));
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));
    }
}
