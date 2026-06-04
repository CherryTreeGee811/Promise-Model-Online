using System.Net;

namespace PromiseModelOnline.Auth.Tests.IntegrationTests;

public class ChangePasswordPageIntegrationTests : IntegrationTestBase
{
    [Test]
    public async Task Get_ChangePasswordPage_WithoutAuth_RedirectsToLogin()
    {
        var response = await Client.GetAsync("/account/change-password");
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));

        var location = await ExtractRedirectLocation(response);
        Assert.That(location, Does.Contain("/account/login"));
    }

    [Test]
    public async Task Post_ChangePassword_WithoutAuth_RedirectsToLogin()
    {
        var formData = new Dictionary<string, string>
        {
            { "currentPassword", "anything" },
            { "newPassword", "anything" },
            { "confirmPassword", "anything" }
        };

        var request = new HttpRequestMessage(HttpMethod.Post, "/account/change-password")
        {
            Content = new FormUrlEncodedContent(formData)
        };

        var response = await Client.SendAsync(request);
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));

        var location = await ExtractRedirectLocation(response);
        Assert.That(location, Does.Contain("/account/login"));
    }
}
