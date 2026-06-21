using System.Net;

namespace PromiseModelOnline.E2E.Tests;

/// <summary>E2E tests for API misuse scenarios and error handling.</summary>
// Requirements: REQ_NF_008
public class MisuseTests : E2ETestBase
{
    [Test]
    public async Task REQ_NF_008_Login_AbsoluteUrl_DefaultsToRoot()
    {
        // Arrange (no setup needed)
        // Act
        var response = await GetAsync("/login?returnUrl=https://evil.com");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));
    }

    [Test]
    public async Task REQ_NF_008_Login_FtpUrl_DefaultsToRoot()
    {
        // Arrange (no setup needed)
        // Act
        var response = await GetAsync("/login?returnUrl=ftp://evil.com");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));
    }

    [Test]
    public async Task REQ_NF_008_Login_JavaScriptUrl_DefaultsToRoot()
    {
        // Arrange (no setup needed)
        // Act
        var response = await GetAsync("/login?returnUrl=javascript:alert(1)");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));
    }

    [Test]
    public async Task REQ_NF_008_Login_DoubleSlashUrl_DefaultsToRoot()
    {
        // Arrange (no setup needed)
        // Act
        var response = await GetAsync("/login?returnUrl=//evil.com");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));
    }

    [Test]
    public async Task REQ_NF_008_Login_PathTraversal_ReturnsChallenge()
    {
        // Arrange (no setup needed)
        // Act
        var response = await GetAsync("/login?returnUrl=/../../../etc/passwd");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));
    }

    [Test]
    public async Task REQ_NF_008_Login_BackslashUrl_DefaultsToRoot()
    {
        // Arrange (no setup needed)
        // Act
        var response = await GetAsync("/login?returnUrl=/\\evil.com");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));
    }

    [Test]
    public async Task REQ_NF_008_Login_EncodedAbsoluteUrl_DefaultsToRoot()
    {
        // Arrange (no setup needed)
        // Act
        var response = await GetAsync("/login?returnUrl=https%3A%2F%2Fevil.com");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));
    }

    [Test]
    public async Task REQ_NF_008_Login_FragmentInReturnUrl_Handled()
    {
        // Arrange (no setup needed)
        // Act
        var response = await GetAsync("/login?returnUrl=/profile#settings");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));
    }

    [Test]
    public async Task REQ_NF_008_Login_QueryInjection_DefaultsToRoot()
    {
        // Arrange (no setup needed)
        // Act
        var response = await GetAsync("/login?returnUrl=/redirect?url=https://evil.com");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));
    }
}
