using System.Collections.Generic;
using System.Net;
using System.Threading.Tasks;
using NUnit.Framework;

namespace PromiseModelOnline.Auth.Tests.IntegrationTests;

/// <summary>Integration tests for <see cref="Controllers.ResetPasswordController"/> covering the reset page with valid and invalid tokens.</summary>
public class ResetPasswordIntegrationTests : IntegrationTestBase
{
    [Test]
    public async Task REQ_CA_001_Get_ResetPage_MissingToken_ReturnsError()
    {
        var response = await Client.GetAsync("/account/reset-password?email=test@example.com");
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));

        var html = await response.Content.ReadAsStringAsync();
        Assert.That(html, Does.Contain("Invalid Reset Link"));
    }

    [Test]
    public async Task REQ_CA_001_Get_ResetPage_MissingEmail_ReturnsError()
    {
        var response = await Client.GetAsync("/account/reset-password?token=sometoken");
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));

        var html = await response.Content.ReadAsStringAsync();
        Assert.That(html, Does.Contain("Invalid Reset Link"));
    }

    [Test]
    public async Task REQ_CA_001_Get_ResetPage_BothMissing_ReturnsError()
    {
        var response = await Client.GetAsync("/account/reset-password");
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));

        var html = await response.Content.ReadAsStringAsync();
        Assert.That(html, Does.Contain("Invalid Reset Link"));
    }

    [Test]
    public async Task REQ_CA_001_Get_ResetPage_ValidToken_Returns200()
    {
        var response = await Client.GetAsync("/account/reset-password?email=test@example.com&token=valid-token");
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));

        var html = await response.Content.ReadAsStringAsync();
        Assert.That(html, Does.Contain("Set New Password"));
    }
}
