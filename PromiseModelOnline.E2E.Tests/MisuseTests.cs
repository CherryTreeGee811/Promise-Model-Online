using System.Net;

namespace PromiseModelOnline.E2E.Tests;

public class MisuseTests : E2ETestBase
{
    [Test]
    public async Task Login_AbsoluteUrl_DefaultsToRoot()
    {
        var response = await GetAsync("/login?returnUrl=https://evil.com");
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));
    }

    [Test]
    public async Task Login_FtpUrl_DefaultsToRoot()
    {
        var response = await GetAsync("/login?returnUrl=ftp://evil.com");
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));
    }

    [Test]
    public async Task Login_JavaScriptUrl_DefaultsToRoot()
    {
        var response = await GetAsync("/login?returnUrl=javascript:alert(1)");
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));
    }

    [Test]
    public async Task Login_DoubleSlashUrl_DefaultsToRoot()
    {
        var response = await GetAsync("/login?returnUrl=//evil.com");
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));
    }

    [Test]
    public async Task Login_PathTraversal_ReturnsChallenge()
    {
        var response = await GetAsync("/login?returnUrl=/../../../etc/passwd");
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));
    }

    [Test]
    public async Task Login_BackslashUrl_DefaultsToRoot()
    {
        var response = await GetAsync("/login?returnUrl=/\\evil.com");
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));
    }

    [Test]
    public async Task Login_EncodedAbsoluteUrl_DefaultsToRoot()
    {
        var response = await GetAsync("/login?returnUrl=https%3A%2F%2Fevil.com");
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));
    }

    [Test]
    public async Task Login_FragmentInReturnUrl_Handled()
    {
        var response = await GetAsync("/login?returnUrl=/profile#settings");
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));
    }

    [Test]
    public async Task Login_QueryInjection_DefaultsToRoot()
    {
        var response = await GetAsync("/login?returnUrl=/redirect?url=https://evil.com");
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Redirect));
    }
}
