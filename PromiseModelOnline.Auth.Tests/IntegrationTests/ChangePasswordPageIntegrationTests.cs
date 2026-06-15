using System.Net;

namespace PromiseModelOnline.Auth.Tests.IntegrationTests;

/// <summary>Integration tests for the change password page flow.</summary>
// Requirements: REQ_USE_012
public class ChangePasswordPageIntegrationTests : IntegrationTestBase
{
    [Test]
    public async Task REQ_USE_012_Get_ChangePasswordPage_WithoutAuth_RedirectsToLogin()
    {
        // Act
        var response = await Client.GetAsync("/account/change-password");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));

        var location = await ExtractRedirectLocation(response);
        Assert.That(location, Does.Contain("/account/login"));
    }

    [Test]
    public async Task REQ_USE_012_Post_ChangePassword_WithoutAuth_RedirectsToLogin()
    {
        // Arrange
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

        // Act
        var response = await Client.SendAsync(request);
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));

        var location = await ExtractRedirectLocation(response);
        Assert.That(location, Does.Contain("/account/login"));
    }
}
