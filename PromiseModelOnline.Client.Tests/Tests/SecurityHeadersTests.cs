using System.Text.RegularExpressions;

namespace PromiseModelOnline.Client.Tests.Tests;

/// <summary>Validates security headers in Nginx and middleware config via static source analysis.</summary>
// Requirements: REQ_SEC_001 REQ_SEC_002 REQ_SEC_003
public class SecurityHeadersTests
{
    private static string SolutionDir => Path.GetFullPath(Path.Combine(
        AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Test]
    [Description("Nginx default.conf includes Content-Security-Policy")]
    public void Nginx_HasCsp()
    {
        // Arrange
        // Act
        var conf = ReadNginxConfig();
        // Assert
        Assert.That(conf, Does.Contain("Content-Security-Policy"),
            "Nginx must set Content-Security-Policy header");
    }

    [Test]
    [Description("Nginx CSP includes default-src 'none'")]
    public void Nginx_Csp_HasDefaultSrcNone()
    {
        // Arrange
        // Act
        var csp = ExtractNginxCsp();
        // Assert
        Assert.That(csp, Does.Contain("default-src 'none'"),
            "CSP should start with default-src 'none'");
    }

    [Test]
    [Description("Nginx CSP restricts script-src to 'self'")]
    public void Nginx_Csp_HasScriptSrcSelf()
    {
        // Arrange
        // Act
        var csp = ExtractNginxCsp();
        // Assert
        Assert.That(csp, Does.Contain("script-src 'self'"),
            "CSP should restrict script-src to 'self'");
        Assert.That(csp, Does.Not.Contain("'unsafe-inline'"),
            "CSP must not use unsafe-inline");
        Assert.That(csp, Does.Not.Contain("'unsafe-eval'"),
            "CSP must not use unsafe-eval");
    }

    [Test]
    [Description("Nginx includes Strict-Transport-Security")]
    public void Nginx_HasHsts()
    {
        // Arrange
        // Act
        var conf = ReadNginxConfig();
        // Assert
        Assert.That(conf, Does.Contain("Strict-Transport-Security"),
            "Nginx must set HSTS header");
    }

    [Test]
    [Description("Nginx HSTS max-age is at least 1 year")]
    public void Nginx_Hsts_HasLongMaxAge()
    {
        // Arrange
        // Act
        var conf = ReadNginxConfig();
        var match = Regex.Match(conf, @"Strict-Transport-Security[^;]*max-age=(\d+)");
        // Assert
        Assert.That(match.Success, Is.True, "HSTS must specify max-age");
        var maxAge = int.Parse(match.Groups[1].Value);
        Assert.That(maxAge, Is.GreaterThanOrEqualTo(31536000),
            "HSTS max-age should be at least 1 year (31536000s)");
    }

    [Test]
    [Description("Nginx includes X-Frame-Options: DENY")]
    public void Nginx_HasXfoDeny()
    {
        // Arrange
        // Act
        var conf = ReadNginxConfig();
        // Assert
        Assert.That(conf, Does.Contain("X-Frame-Options"),
            "Nginx must set X-Frame-Options header");
        Assert.That(conf, Does.Contain("DENY"),
            "X-Frame-Options must be DENY");
    }

    [Test]
    [Description("Nginx includes Cross-Origin-Opener-Policy")]
    public void Nginx_HasCoop()
    {
        // Arrange
        // Act
        var conf = ReadNginxConfig();
        // Assert
        Assert.That(conf, Does.Contain("Cross-Origin-Opener-Policy"),
            "Nginx must set Cross-Origin-Opener-Policy header");
        Assert.That(conf, Does.Contain("same-origin"),
            "COOP must be same-origin");
    }

    [Test]
    [Description("Nginx includes Permissions-Policy restricting sensitive features")]
    public void Nginx_HasPermissionsPolicy()
    {
        // Arrange
        // Act
        var conf = ReadNginxConfig();
        // Assert
        Assert.That(conf, Does.Contain("Permissions-Policy"),
            "Nginx must set Permissions-Policy header");
        Assert.That(conf, Does.Contain("camera=()"),
            "Permissions-Policy must disable camera");
        Assert.That(conf, Does.Contain("microphone=()"),
            "Permissions-Policy must disable microphone");
        Assert.That(conf, Does.Contain("geolocation=()"),
            "Permissions-Policy must disable geolocation");
    }

    [Test]
    [Description("Auth SecurityHeadersMiddleware includes Content-Security-Policy")]
    public void AuthMiddleware_HasCsp()
    {
        // Arrange
        // Act
        var source = ReadAuthMiddlewareSource();
        // Assert
        Assert.That(source, Does.Contain("Content-Security-Policy"),
            "Auth middleware must set CSP header");
        Assert.That(source, Does.Not.Contain("'unsafe-inline'"),
            "Auth CSP must not use unsafe-inline");
        Assert.That(source, Does.Not.Contain("'unsafe-eval'"),
            "Auth CSP must not use unsafe-eval");
    }

    [Test]
    [Description("Auth SecurityHeadersMiddleware includes X-Content-Type-Options: nosniff")]
    public void AuthMiddleware_HasXContentTypeOptions()
    {
        // Arrange
        // Act
        var source = ReadAuthMiddlewareSource();
        // Assert
        Assert.That(source, Does.Contain("X-Content-Type-Options"),
            "Auth middleware must set X-Content-Type-Options");
        Assert.That(source, Does.Contain("nosniff"),
            "X-Content-Type-Options must be nosniff");
    }

    [Test]
    [Description("Auth SecurityHeadersMiddleware includes X-Frame-Options: DENY")]
    public void AuthMiddleware_HasXfoDeny()
    {
        // Arrange
        // Act
        var source = ReadAuthMiddlewareSource();
        // Assert
        Assert.That(source, Does.Contain("X-Frame-Options"),
            "Auth middleware must set X-Frame-Options");
        Assert.That(source, Does.Contain("DENY"),
            "X-Frame-Options must be DENY");
    }

    [Test]
    [Description("Auth SecurityHeadersMiddleware includes Strict-Transport-Security")]
    public void AuthMiddleware_HasHsts()
    {
        // Arrange
        // Act
        var source = ReadAuthMiddlewareSource();
        // Assert
        Assert.That(source, Does.Contain("Strict-Transport-Security"),
            "Auth middleware must set HSTS header");
    }

    [Test]
    [Description("Auth SecurityHeadersMiddleware includes Referrer-Policy")]
    public void AuthMiddleware_HasReferrerPolicy()
    {
        // Arrange
        // Act
        var source = ReadAuthMiddlewareSource();
        // Assert
        Assert.That(source, Does.Contain("Referrer-Policy"),
            "Auth middleware must set Referrer-Policy header");
    }

    private string ReadNginxConfig()
    {
        var path = Path.Combine(SolutionDir, "PromiseModelOnline.Client", "default.conf");
        Assert.That(File.Exists(path), Is.True, $"Nginx config not found at {path}");
        return File.ReadAllText(path);
    }

    private string ExtractNginxCsp()
    {
        var conf = ReadNginxConfig();
        var match = Regex.Match(conf, @"Content-Security-Policy\s+""([^""]+)""");
        Assert.That(match.Success, Is.True, "Could not extract CSP value from Nginx config");
        return match.Groups[1].Value;
    }

    private string ReadAuthMiddlewareSource()
    {
        var path = Path.Combine(
            SolutionDir, "PromiseModelOnline.Auth", "Middleware", "SecurityHeadersMiddleware.cs");
        Assert.That(File.Exists(path), Is.True, $"Auth middleware not found at {path}");
        return File.ReadAllText(path);
    }
}
