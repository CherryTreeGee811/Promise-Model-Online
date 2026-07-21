using Microsoft.AspNetCore.Http;

namespace PromiseModelOnline.BFF.Tests.Helpers;

// Requirements: REQ_SYS_021
public class BffHelpersTests
{
    // ============================
    // IsSafeLocalReturnUrl
    // ============================

    [Test]
    public void REQ_SYS_021_IsSafeLocalReturnUrl_Null_ReturnsFalse() => Assert.That(BffHelpers.IsSafeLocalReturnUrl(null), Is.False);

    [Test]
    public void REQ_SYS_021_IsSafeLocalReturnUrl_Empty_ReturnsFalse() => Assert.That(BffHelpers.IsSafeLocalReturnUrl(""), Is.False);

    [Test]
    public void REQ_SYS_021_IsSafeLocalReturnUrl_Whitespace_ReturnsFalse() => Assert.That(BffHelpers.IsSafeLocalReturnUrl("   "), Is.False);

    [Test]
    public void REQ_SYS_021_IsSafeLocalReturnUrl_AbsoluteHttp_ReturnsFalse() => Assert.That(BffHelpers.IsSafeLocalReturnUrl("http://evil.com"), Is.False);

    [Test]
    public void REQ_SYS_021_IsSafeLocalReturnUrl_AbsoluteHttps_ReturnsFalse() => Assert.That(BffHelpers.IsSafeLocalReturnUrl("https://evil.com"), Is.False);

    [Test]
    public void REQ_SYS_021_IsSafeLocalReturnUrl_DoubleSlash_ReturnsFalse() => Assert.That(BffHelpers.IsSafeLocalReturnUrl("//evil.com"), Is.False);

    [Test]
    public void REQ_SYS_021_IsSafeLocalReturnUrl_BackslashPrefix_ReturnsFalse() => Assert.That(BffHelpers.IsSafeLocalReturnUrl("/\\evil.com"), Is.False);

    [Test]
    public void REQ_SYS_021_IsSafeLocalReturnUrl_Root_ReturnsTrue() => Assert.That(BffHelpers.IsSafeLocalReturnUrl("/"), Is.True);

    [Test]
    public void REQ_SYS_021_IsSafeLocalReturnUrl_RelativePath_ReturnsTrue() => Assert.That(BffHelpers.IsSafeLocalReturnUrl("/projects/1"), Is.True);

    [Test]
    public void REQ_SYS_021_IsSafeLocalReturnUrl_PathWithQuery_ReturnsTrue() => Assert.That(BffHelpers.IsSafeLocalReturnUrl("/?returnUrl=test"), Is.True);

    // ============================
    // IsAjax
    // ============================

    private static HttpRequest CreateRequest(Action<Dictionary<string, string>>? configureHeaders = null)
    {
        var context = new DefaultHttpContext();
        var headers = new Dictionary<string, string>();
        configureHeaders?.Invoke(headers);

        foreach (var (key, value) in headers)
            context.Request.Headers[key] = value;

        return context.Request;
    }

    [Test]
    public void REQ_SYS_021_IsAjax_XmlHttpRequestHeader_ReturnsTrue()
    {
        // Arrange
        var request = CreateRequest(h => h["X-Requested-With"] = "XMLHttpRequest");
        // Act & Assert
        Assert.That(BffHelpers.IsAjax(request), Is.True);
    }

    [Test]
    public void REQ_SYS_021_IsAjax_AcceptJson_ReturnsTrue()
    {
        // Arrange
        var request = CreateRequest(h => h["Accept"] = "application/json");
        // Act & Assert
        Assert.That(BffHelpers.IsAjax(request), Is.True);
    }

    [Test]
    public void REQ_SYS_021_IsAjax_AcceptAnyJson_ReturnsTrue()
    {
        // Arrange
        var request = CreateRequest(h => h["Accept"] = "text/html, application/json, */*");
        // Act & Assert
        Assert.That(BffHelpers.IsAjax(request), Is.True);
    }

    [Test]
    public void REQ_SYS_021_IsAjax_NoRelevantHeaders_ReturnsFalse()
    {
        // Arrange
        var request = CreateRequest(h => h["Accept"] = "text/html");
        // Act & Assert
        Assert.That(BffHelpers.IsAjax(request), Is.False);
    }

    [Test]
    public void REQ_SYS_021_IsAjax_EmptyHeaders_ReturnsFalse()
    {
        // Arrange
        var request = CreateRequest();
        // Act & Assert
        Assert.That(BffHelpers.IsAjax(request), Is.False);
    }
}
