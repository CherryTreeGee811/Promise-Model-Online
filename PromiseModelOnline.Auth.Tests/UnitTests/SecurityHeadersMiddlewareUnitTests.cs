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
        var context = new DefaultHttpContext();
        var middleware = new SecurityHeadersMiddleware(_ => Task.CompletedTask);

        await middleware.Invoke(context);

        Assert.That(context.Response.Headers["X-Content-Type-Options"].ToString(), Is.EqualTo("nosniff"));
    }

    [Test]
    public async Task Invoke_SetsXFrameOptions()
    {
        var context = new DefaultHttpContext();
        var middleware = new SecurityHeadersMiddleware(_ => Task.CompletedTask);

        await middleware.Invoke(context);

        Assert.That(context.Response.Headers["X-Frame-Options"].ToString(), Is.EqualTo("DENY"));
    }

    [Test]
    public async Task Invoke_HttpsRequest_SetsStrictTransportSecurity()
    {
        var context = new DefaultHttpContext();
        context.Request.Scheme = "https";
        var middleware = new SecurityHeadersMiddleware(_ => Task.CompletedTask);

        await middleware.Invoke(context);

        Assert.That(context.Response.Headers["Strict-Transport-Security"].ToString(),
            Is.EqualTo("max-age=31536000; includeSubDomains"));
    }

    [Test]
    public async Task Invoke_HttpRequest_DoesNotSetStrictTransportSecurity()
    {
        var context = new DefaultHttpContext();
        context.Request.Scheme = "http";
        var middleware = new SecurityHeadersMiddleware(_ => Task.CompletedTask);

        await middleware.Invoke(context);

        Assert.That(context.Response.Headers.ContainsKey("Strict-Transport-Security"), Is.False);
    }

    [Test]
    public async Task Invoke_SetsReferrerPolicy()
    {
        var context = new DefaultHttpContext();
        var middleware = new SecurityHeadersMiddleware(_ => Task.CompletedTask);

        await middleware.Invoke(context);

        Assert.That(context.Response.Headers["Referrer-Policy"].ToString(),
            Is.EqualTo("strict-origin-when-cross-origin"));
    }

    [Test]
    public async Task Invoke_SetsContentSecurityPolicy()
    {
        var context = new DefaultHttpContext();
        var middleware = new SecurityHeadersMiddleware(_ => Task.CompletedTask);

        await middleware.Invoke(context);

        Assert.That(context.Response.Headers["Content-Security-Policy"].ToString(),
            Does.Contain("default-src 'self'"));
    }
}
