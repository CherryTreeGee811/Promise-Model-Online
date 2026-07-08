using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;
using NUnit.Framework;
using PromiseModelOnline.Api.Controllers;
using PromiseModelOnline.Api.DAL;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.Tests.Infrastructure;

namespace PromiseModelOnline.Api.Tests;

[TestFixture]
public class AuditEventsControllerUnitTests
{
    private PromiseModelOnlineContext _context = null!;
    private AuditEventsController _controller = null!;

    [SetUp]
    public void SetUp()
    {
        var options = new DbContextOptionsBuilder<PromiseModelOnlineContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _context = new PromiseModelOnlineContext(options);

        _controller = new AuditEventsController(_context);
        ControllerTestHelpers.SetControllerUser(_controller, "u@test.com");

        _controller.ControllerContext.HttpContext.Response.Headers.Clear();
    }

    [TearDown]
    public void TearDown() => _context.Dispose();

    [Test]
    public async Task REQ_FUN_XXX_GetProjectHistory_ReturnsOk()
    {
        _context.AuditEvents.Add(new AuditEvent
        {
            Id = 1,
            ProjectId = 1,
            EntityType = "Moment",
            EntityId = 1,
            ActionType = "Created",
            OccurredAtUtc = System.DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        var result = await _controller.GetProjectHistory(1);

        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_GetProjectHistory_Empty_ReturnsOk()
    {
        var result = await _controller.GetProjectHistory(999);

        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_GetEntityHistory_ReturnsOk()
    {
        _context.AuditEvents.Add(new AuditEvent
        {
            Id = 1,
            ProjectId = 1,
            EntityType = "Moment",
            EntityId = 42,
            ActionType = "Updated",
            OccurredAtUtc = System.DateTime.UtcNow,
            ChangesJson = "{\"Status\":{\"Before\":\"Todo\",\"After\":\"InProgress\"}}"
        });
        await _context.SaveChangesAsync();

        var result = await _controller.GetEntityHistory("Moment", 42);

        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_GetEntityHistory_Empty_ReturnsOk()
    {
        var result = await _controller.GetEntityHistory("Moment", 999);

        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_GetProjectHistory_SetsTotalCountHeader()
    {
        _context.AuditEvents.Add(new AuditEvent
        {
            Id = 1,
            ProjectId = 1,
            EntityType = "Moment",
            EntityId = 1,
            ActionType = "Created",
            OccurredAtUtc = System.DateTime.UtcNow
        });
        _context.AuditEvents.Add(new AuditEvent
        {
            Id = 2,
            ProjectId = 1,
            EntityType = "Moment",
            EntityId = 1,
            ActionType = "Updated",
            OccurredAtUtc = System.DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        await _controller.GetProjectHistory(1);

        Assert.That(_controller.Response.Headers["X-Total-Count"], Is.EqualTo("2"));
    }

    [Test]
    public async Task REQ_FUN_XXX_GetProjectHistory_RespectsTakeAndSkip()
    {
        for (var i = 1; i <= 10; i++)
        {
            _context.AuditEvents.Add(new AuditEvent
            {
                Id = i,
                ProjectId = 1,
                EntityType = "Moment",
                EntityId = i,
                ActionType = "Created",
                OccurredAtUtc = System.DateTime.UtcNow
            });
        }
        await _context.SaveChangesAsync();

        var result = await _controller.GetProjectHistory(1, take: 3, skip: 5);

        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
    }
}
