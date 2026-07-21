using Microsoft.AspNetCore.Http;
using NUnit.Framework;
using PromiseModelOnline.Auth.Middleware;
using System.Threading.Tasks;

namespace PromiseModelOnline.Auth.Tests;

[TestFixture]
public class SecurityHeadersMiddlewareUnitTests
{
    [Test]
    public async Task Invoke_SetsXContentTypeOptions()
    {
        // Arrange
        var context = new DefaultHttpContext();
        var middleware = new SecurityHeadersMiddleware(_ => Task.CompletedTask);

        // Act
        await middleware.Invoke(context);

        // Assert
        Assert.That(context.Response.Headers["X-Content-Type-Options"].ToString(), Is.EqualTo("nosniff"));
    }

    [Test]
    public async Task Invoke_SetsXFrameOptions()
    {
        // Arrange
        var context = new DefaultHttpContext();
        var middleware = new SecurityHeadersMiddleware(_ => Task.CompletedTask);

        // Act
        await middleware.Invoke(context);

        // Assert
        Assert.That(context.Response.Headers["X-Frame-Options"].ToString(), Is.EqualTo("DENY"));
    }

    [Test]
    public async Task Invoke_HttpsRequest_SetsStrictTransportSecurity()
    {
        // Arrange
        var context = new DefaultHttpContext();
        context.Request.Scheme = "https";
        var middleware = new SecurityHeadersMiddleware(_ => Task.CompletedTask);

        // Act
        await middleware.Invoke(context);

        // Assert
        Assert.That(context.Response.Headers["Strict-Transport-Security"].ToString(),
            Is.EqualTo("max-age=31536000; includeSubDomains"));
    }

    [Test]
    public async Task Invoke_HttpRequest_DoesNotSetStrictTransportSecurity()
    {
        // Arrange
        var context = new DefaultHttpContext();
        context.Request.Scheme = "http";
        var middleware = new SecurityHeadersMiddleware(_ => Task.CompletedTask);

        // Act
        await middleware.Invoke(context);

        // Assert
        Assert.That(context.Response.Headers.ContainsKey("Strict-Transport-Security"), Is.False);
    }

    [Test]
    public async Task Invoke_SetsReferrerPolicy()
    {
        // Arrange
        var context = new DefaultHttpContext();
        var middleware = new SecurityHeadersMiddleware(_ => Task.CompletedTask);

        // Act
        await middleware.Invoke(context);

        // Assert
        Assert.That(context.Response.Headers["Referrer-Policy"].ToString(),
            Is.EqualTo("strict-origin-when-cross-origin"));
    }

    [Test]
    public async Task Invoke_SetsContentSecurityPolicy()
    {
        // Arrange
        var context = new DefaultHttpContext();
        var middleware = new SecurityHeadersMiddleware(_ => Task.CompletedTask);

        // Act
        await middleware.Invoke(context);

        // Assert
        Assert.That(context.Response.Headers["Content-Security-Policy"].ToString(),
            Does.Contain("default-src 'self'"));
    }
}
