using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using PMO.Core.Models;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.Controllers;
using PromiseModelOnline.Api.DAL;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Enums;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.Tests.Infrastructure;

namespace PromiseModelOnline.Api.Tests;

[TestFixture]
public class ProjectMomentTasksControllerUnitTests
{
    private Mock<IMomentService> _momentServiceMock = null!;
    private Mock<IMomentTaskService> _momentTaskServiceMock = null!;
    private Mock<IUserRepository> _userRepoMock = null!;
    private Mock<IPermissionService> _permissionServiceMock = null!;
    private PromiseModelOnlineContext _context = null!;
    private Mock<IProjectService> _projectServiceMock = null!;
    private ProjectMomentTasksController _controller = null!;

    [SetUp]
    public void SetUp()
    {
        _momentServiceMock = new Mock<IMomentService>();
        _momentTaskServiceMock = new Mock<IMomentTaskService>();
        _userRepoMock = new Mock<IUserRepository>();
        _permissionServiceMock = new Mock<IPermissionService>();
        _projectServiceMock = new Mock<IProjectService>();

        var options = new DbContextOptionsBuilder<PromiseModelOnlineContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _context = new PromiseModelOnlineContext(options);

        var loggerMock = new Mock<ILogger<ProjectMomentTasksController>>();

        _controller = new ProjectMomentTasksController(
            _momentServiceMock.Object,
            _momentTaskServiceMock.Object,
            _userRepoMock.Object,
            _permissionServiceMock.Object,
            loggerMock.Object,
            _context,
            _projectServiceMock.Object);
        ControllerTestHelpers.SetControllerUser(_controller, "u@test.com");

        _userRepoMock.Setup(r => r.GetOrCreateUserByEmailAsync("u@test.com", null))
            .ReturnsAsync(new User { Id = 10 });
        _permissionServiceMock.Setup(s => s.GetUserPermissionAsync(10, It.IsAny<int>()))
            .ReturnsAsync(PermissionLevel.Edit);
        _momentServiceMock.Setup(s => s.GetProjectIdForMomentAsync(It.IsAny<int>()))
            .ReturnsAsync(1);
    }

    [TearDown]
    public void TearDown() => _context.Dispose();

    private static Project Project(int id = 1) => new() { Id = id, Name = "P", Slug = "p", OwnerId = 1 };

    private async Task SetupHierarchy(int momentId = 50, int seq = 1)
    {
        _context.Promises.Add(new() { Id = 10, ProjectId = 1, Statement = "P1", SequenceNumber = 1, DisplayOrder = 1 });
        _context.Epics.Add(new() { Id = 20, ProductPromiseId = 10, Statement = "E1", SequenceNumber = 1, DisplayOrder = 1 });
        _context.Journeys.Add(new() { Id = 30, EpicId = 20, Statement = "J1", SequenceNumber = 1, DisplayOrder = 1 });
        _context.Flows.Add(new() { Id = 40, JourneyId = 30, Statement = "F1", SequenceNumber = 1, DisplayOrder = 1 });
        _context.Moments.Add(new() { Id = momentId, FlowId = 40, Statement = "M1", SequenceNumber = seq, DisplayOrder = 1 });
        await _context.SaveChangesAsync();
    }

    [Test]
    public async Task REQ_FUN_XXX_Create_Valid_ReturnsOk()
    {
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());
        await SetupHierarchy();
        _momentTaskServiceMock.Setup(s => s.CreateAsync(It.IsAny<MomentTask>()))
            .ReturnsAsync(new MomentTask { Id = 10, Name = "Task" });

        var result = await _controller.Create(1, new CreateMomentTaskRequestDto { Name = "New Task" }, "o", "p");

        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_Create_ProjectNotFound_Returns404()
    {
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("bad", "bad")).ReturnsAsync((Project?)null);

        var result = await _controller.Create(1, new CreateMomentTaskRequestDto { Name = "Task" }, "bad", "bad");

        Assert.That(result.Result, Is.InstanceOf<NotFoundResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_Create_MomentNotFound_Returns404()
    {
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());

        var result = await _controller.Create(999, new CreateMomentTaskRequestDto { Name = "Task" }, "o", "p");

        Assert.That(result.Result, Is.InstanceOf<NotFoundObjectResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_Create_NullBody_Returns400()
    {
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());
        await SetupHierarchy();

        var result = await _controller.Create(1, null!, "o", "p");

        Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_Create_NoPermission_Returns403()
    {
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());
        await SetupHierarchy();
        _permissionServiceMock.Setup(s => s.GetUserPermissionAsync(10, It.IsAny<int>()))
            .ReturnsAsync(PermissionLevel.View);

        var result = await _controller.Create(1, new CreateMomentTaskRequestDto { Name = "Task" }, "o", "p");

        Assert.That(result.Result, Is.InstanceOf<ForbidResult>());

        _permissionServiceMock.Setup(s => s.GetUserPermissionAsync(10, It.IsAny<int>()))
            .ReturnsAsync(PermissionLevel.Edit);
    }

    [Test]
    public async Task REQ_FUN_XXX_UpdateCompletion_Valid_ReturnsOk()
    {
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());
        await SetupHierarchy();
        _momentTaskServiceMock.Setup(s => s.GetByIdAsync(5))
            .ReturnsAsync(new MomentTask { Id = 5, MomentId = 50, Name = "Task" });
        _momentTaskServiceMock.Setup(s => s.UpdateAsync(It.IsAny<MomentTask>()))
            .ReturnsAsync(new MomentTask { Id = 5, MomentId = 50 });

        var result = await _controller.UpdateCompletion(1, 5, new UpdateMomentTaskCompletionRequestDto { IsCompleted = true }, "o", "p");

        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_UpdateCompletion_NullBody_Returns400()
    {
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());
        await SetupHierarchy();

        var result = await _controller.UpdateCompletion(1, 5, null!, "o", "p");

        Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_UpdateCompletion_ProjectNotFound_Returns404()
    {
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("bad", "bad")).ReturnsAsync((Project?)null);

        var result = await _controller.UpdateCompletion(1, 5, new UpdateMomentTaskCompletionRequestDto(), "bad", "bad");

        Assert.That(result.Result, Is.InstanceOf<NotFoundResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_UpdateCompletion_TaskNotFound_Returns404()
    {
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());
        await SetupHierarchy();
        _momentTaskServiceMock.Setup(s => s.GetByIdAsync(999)).ReturnsAsync((MomentTask?)null);

        var result = await _controller.UpdateCompletion(1, 999, new UpdateMomentTaskCompletionRequestDto { IsCompleted = true }, "o", "p");

        Assert.That(result.Result, Is.InstanceOf<NotFoundObjectResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_UpdateCompletion_NoPermission_Returns403()
    {
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());
        await SetupHierarchy();
        _momentTaskServiceMock.Setup(s => s.GetByIdAsync(5))
            .ReturnsAsync(new MomentTask { Id = 5, MomentId = 50, Name = "Task" });
        _permissionServiceMock.Setup(s => s.GetUserPermissionAsync(10, It.IsAny<int>()))
            .ReturnsAsync(PermissionLevel.View);

        var result = await _controller.UpdateCompletion(1, 5, new UpdateMomentTaskCompletionRequestDto { IsCompleted = true }, "o", "p");

        Assert.That(result.Result, Is.InstanceOf<ForbidResult>());

        _permissionServiceMock.Setup(s => s.GetUserPermissionAsync(10, It.IsAny<int>()))
            .ReturnsAsync(PermissionLevel.Edit);
    }

}
