using System.Collections.Generic;
using System.Net;
using System.Threading.Tasks;
using NUnit.Framework;

namespace PromiseModelOnline.Auth.Tests.IntegrationTests;

/// <summary>Integration tests for <see cref="Controllers.ForgotPasswordController"/> covering the forgot-password page and form submission.</summary>
public class ForgotPasswordIntegrationTests : IntegrationTestBase
{
    [Test]
    public async Task REQ_CA_001_Get_ForgotPasswordPage_Returns200()
    {
        // Arrange

        // Act
        var response = await Client.GetAsync("/account/forgot-password");

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));

        var html = await response.Content.ReadAsStringAsync();
        Assert.That(html, Does.Contain("Forgot Password"));
        Assert.That(html, Does.Contain("Email"));
    }

    [Test]
    public async Task REQ_CA_001_Post_SendResetLink_KnownUser_ShowsSuccess()
    {
        // Arrange
        var antiforgery = await GetAntiforgeryData("/account/forgot-password");
        var formData = new Dictionary<string, string>
        {
            { "Email", "pmo_test@example.com" }
        };
        var request = CreatePostWithAntiforgery("/account/forgot-password", antiforgery, formData);

        // Act
        var response = await Client.SendAsync(request);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var html = await response.Content.ReadAsStringAsync();
        Assert.That(html, Does.Contain("sent"));
    }

    [Test]
    public async Task REQ_CA_001_Post_SendResetLink_UnknownEmail_ShowsSuccess()
    {
        // Arrange
        var antiforgery = await GetAntiforgeryData("/account/forgot-password");
        var formData = new Dictionary<string, string>
        {
            { "Email", "nonexistent@example.com" }
        };
        var request = CreatePostWithAntiforgery("/account/forgot-password", antiforgery, formData);

        // Act
        var response = await Client.SendAsync(request);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var html = await response.Content.ReadAsStringAsync();
        Assert.That(html, Does.Contain("sent"));
    }

    [Test]
    public async Task REQ_CA_001_Post_SendResetLink_EmptyEmail_ReturnsValidationError()
    {
        // Arrange
        var antiforgery = await GetAntiforgeryData("/account/forgot-password");
        var formData = new Dictionary<string, string>
        {
            { "Email", "" }
        };
        var request = CreatePostWithAntiforgery("/account/forgot-password", antiforgery, formData);

        // Act
        var response = await Client.SendAsync(request);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var html = await response.Content.ReadAsStringAsync();
        Assert.That(html, Does.Contain("Invalid email format"));
    }
}
