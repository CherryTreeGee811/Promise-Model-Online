using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using PromiseModelOnline.Api.Filters;

namespace PromiseModelOnline.Api.Tests;

[TestFixture]
public class AuditLoggingActionFilterUnitTests
{
    private Mock<ILogger<AuditLoggingActionFilter>> _loggerMock = null!;
    private AuditLoggingActionFilter _filter = null!;

    [SetUp]
    public void SetUp()
    {
        _loggerMock = new Mock<ILogger<AuditLoggingActionFilter>>();
        _filter = new AuditLoggingActionFilter(_loggerMock.Object);
    }

    private static (ActionExecutingContext executing, ActionExecutedContext executed) CreateContexts(
        string method,
        int statusCode = 200,
        Claim[]? claims = null,
        RouteValueDictionary? routeValues = null)
    {
        var httpContext = new DefaultHttpContext();
        httpContext.Request.Method = method;
        httpContext.Request.Path = "/api/test";
        httpContext.Response.StatusCode = statusCode;

        if (claims is not null)
        {
            var identity = new ClaimsIdentity(claims, "test");
            httpContext.User = new ClaimsPrincipal(identity);
        }

        var actionContext = new ActionContext(httpContext, new RouteData(), new ActionDescriptor());
        var executing = new ActionExecutingContext(
            actionContext,
            new List<IFilterMetadata>(),
            new Dictionary<string, object?>(),
            new object());

        if (routeValues is not null)
        {
            executing.RouteData = new RouteData(routeValues);
        }

        var executed = new ActionExecutedContext(actionContext, new List<IFilterMetadata>(), new object())
        {
            Canceled = false,
            Exception = null,
            ExceptionHandled = false,
            Result = new OkResult()
        };

        return (executing, executed);
    }

    [Test]
    public async Task REQ_FUN_XXX_PostRequest_LogsAudit()
    {
        var (executing, executed) = CreateContexts("POST", claims: new[]
        {
            new Claim("sub", "user-123"),
            new Claim(ClaimTypes.Email, "u@test.com"),
        });

        var next = new ActionExecutionDelegate(() => Task.FromResult(executed));
        await _filter.OnActionExecutionAsync(executing, next);

        _loggerMock.VerifyLog(LogLevel.Information, "Audit:");
    }

    [Test]
    public async Task REQ_FUN_XXX_PutRequest_LogsAudit()
    {
        var (executing, executed) = CreateContexts("PUT");

        var next = new ActionExecutionDelegate(() => Task.FromResult(executed));
        await _filter.OnActionExecutionAsync(executing, next);

        _loggerMock.VerifyLog(LogLevel.Information, "Audit:");
    }

    [Test]
    public async Task REQ_FUN_XXX_PatchRequest_LogsAudit()
    {
        var (executing, executed) = CreateContexts("PATCH");

        var next = new ActionExecutionDelegate(() => Task.FromResult(executed));
        await _filter.OnActionExecutionAsync(executing, next);

        _loggerMock.VerifyLog(LogLevel.Information, "Audit:");
    }

    [Test]
    public async Task REQ_FUN_XXX_DeleteRequest_LogsAudit()
    {
        var (executing, executed) = CreateContexts("DELETE");

        var next = new ActionExecutionDelegate(() => Task.FromResult(executed));
        await _filter.OnActionExecutionAsync(executing, next);

        _loggerMock.VerifyLog(LogLevel.Information, "Audit:");
    }

    [Test]
    public async Task REQ_FUN_XXX_GetRequest_DoesNotLog()
    {
        // Arrange
        var (executing, executed) = CreateContexts("GET");

        var next = new ActionExecutionDelegate(() => Task.FromResult(executed));
        // Act
        await _filter.OnActionExecutionAsync(executing, next);

        // Assert
        _loggerMock.Verify(x => x.Log(
            It.IsAny<LogLevel>(),
            It.IsAny<EventId>(),
            It.IsAny<It.IsAnyType>(),
            It.IsAny<Exception>(),
            It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Never);
    }

    [Test]
    public async Task REQ_FUN_XXX_NonMutatingMethod_DoesNotLog()
    {
        // Arrange
        var (executing, executed) = CreateContexts("OPTIONS");

        var next = new ActionExecutionDelegate(() => Task.FromResult(executed));
        // Act
        await _filter.OnActionExecutionAsync(executing, next);

        // Assert
        _loggerMock.Verify(x => x.Log(
            It.IsAny<LogLevel>(),
            It.IsAny<EventId>(),
            It.IsAny<It.IsAnyType>(),
            It.IsAny<Exception>(),
            It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Never);
    }

    [Test]
    public async Task REQ_FUN_XXX_NonSuccessStatusCode_DoesNotLog()
    {
        // Arrange
        var (executing, executed) = CreateContexts("POST", statusCode: 400);

        var next = new ActionExecutionDelegate(() => Task.FromResult(executed));
        // Act
        await _filter.OnActionExecutionAsync(executing, next);

        // Assert
        _loggerMock.Verify(x => x.Log(
            It.IsAny<LogLevel>(),
            It.IsAny<EventId>(),
            It.IsAny<It.IsAnyType>(),
            It.IsAny<Exception>(),
            It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Never);
    }

    [Test]
    public async Task REQ_FUN_XXX_UnhandledException_DoesNotLog()
    {
        // Arrange
        var (executing, executed) = CreateContexts("POST");
        executed.Exception = new InvalidOperationException("fail");
        executed.ExceptionHandled = false;

        var next = new ActionExecutionDelegate(() => Task.FromResult(executed));
        // Act
        await _filter.OnActionExecutionAsync(executing, next);

        // Assert
        _loggerMock.Verify(x => x.Log(
            It.IsAny<LogLevel>(),
            It.IsAny<EventId>(),
            It.IsAny<It.IsAnyType>(),
            It.IsAny<Exception>(),
            It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Never);
    }

    [Test]
    public async Task REQ_FUN_XXX_LogContainsMethodPathAndStatusCode()
    {
        var (executing, executed) = CreateContexts("POST", claims: new[]
        {
            new Claim("sub", "user-123"),
        });

        var next = new ActionExecutionDelegate(() => Task.FromResult(executed));
        await _filter.OnActionExecutionAsync(executing, next);

        _loggerMock.VerifyLog(LogLevel.Information, "POST");
        _loggerMock.VerifyLog(LogLevel.Information, "/api/test");
        _loggerMock.VerifyLog(LogLevel.Information, "200");
    }

    [Test]
    public async Task REQ_FUN_XXX_LogContainsRouteValues()
    {
        var (executing, executed) = CreateContexts("POST",
            routeValues: new RouteValueDictionary
            {
                ["controller"] = "Projects",
                ["action"] = "Create",
                ["id"] = "42"
            });

        var next = new ActionExecutionDelegate(() => Task.FromResult(executed));
        await _filter.OnActionExecutionAsync(executing, next);

        _loggerMock.VerifyLog(LogLevel.Information, "Projects");
        _loggerMock.VerifyLog(LogLevel.Information, "Create");
    }

    [Test]
    public async Task REQ_FUN_XXX_NoUserClaims_LogsWithNulls()
    {
        var (executing, executed) = CreateContexts("PUT");

        var next = new ActionExecutionDelegate(() => Task.FromResult(executed));
        await _filter.OnActionExecutionAsync(executing, next);

        _loggerMock.VerifyLog(LogLevel.Information, "Audit:");
    }
}
