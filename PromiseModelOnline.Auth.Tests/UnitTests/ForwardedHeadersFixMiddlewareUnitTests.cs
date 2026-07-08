using Microsoft.AspNetCore.Http;
using NUnit.Framework;
using PromiseModelOnline.Auth.Middleware;
using System.Threading.Tasks;

namespace PromiseModelOnline.Auth.Tests;

[TestFixture]
public class ForwardedHeadersFixMiddlewareUnitTests
{
    [Test]
    public async Task Invoke_NoForwardedHeaders_DoesNotChangeHostOrScheme()
    {
        var context = new DefaultHttpContext();
        context.Request.Host = new HostString("localhost:5000");
        context.Request.Scheme = "http";
        var middleware = new ForwardedHeadersFixMiddleware(_ => Task.CompletedTask);

        await middleware.Invoke(context);

        Assert.That(context.Request.Host.Value, Is.EqualTo("localhost:5000"));
        Assert.That(context.Request.Scheme, Is.EqualTo("http"));
    }

    [Test]
    public async Task Invoke_XForwardedHost_UpdatesRequestHost()
    {
        var context = new DefaultHttpContext();
        context.Request.Host = new HostString("localhost:5000");
        context.Request.Headers["X-Forwarded-Host"] = "app.example.com";
        var middleware = new ForwardedHeadersFixMiddleware(_ => Task.CompletedTask);

        await middleware.Invoke(context);

        Assert.That(context.Request.Host.Value, Is.EqualTo("app.example.com"));
    }

    [Test]
    public async Task Invoke_XForwardedProto_UpdatesRequestScheme()
    {
        var context = new DefaultHttpContext();
        context.Request.Scheme = "http";
        context.Request.Headers["X-Forwarded-Proto"] = "https";
        var middleware = new ForwardedHeadersFixMiddleware(_ => Task.CompletedTask);

        await middleware.Invoke(context);

        Assert.That(context.Request.Scheme, Is.EqualTo("https"));
    }
}
