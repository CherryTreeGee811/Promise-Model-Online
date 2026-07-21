using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using PMO.Core.Models;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.Controllers;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Enums;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.Tests.Infrastructure;

namespace PromiseModelOnline.Api.Tests;

[TestFixture]
public class MomentTasksControllerUnitTests
{
    private Mock<IMomentService> _momentServiceMock = null!;
    private Mock<IMomentTaskService> _momentTaskServiceMock = null!;
    private Mock<IUserRepository> _userRepoMock = null!;
    private Mock<IPermissionService> _permissionServiceMock = null!;
    private MomentTasksController _controller = null!;

    [SetUp]
    public void SetUp()
    {
        _momentServiceMock = new Mock<IMomentService>();
        _momentTaskServiceMock = new Mock<IMomentTaskService>();
        _userRepoMock = new Mock<IUserRepository>();
        _permissionServiceMock = new Mock<IPermissionService>();

        var loggerMock = new Mock<ILogger<MomentTasksController>>();

        _controller = new MomentTasksController(
            _momentServiceMock.Object,
            _momentTaskServiceMock.Object,
            _userRepoMock.Object,
            _permissionServiceMock.Object,
            loggerMock.Object);
        ControllerTestHelpers.SetControllerUser(_controller, "u@test.com");

        _userRepoMock.Setup(r => r.GetOrCreateUserByEmailAsync("u@test.com", null))
            .ReturnsAsync(new User { Id = 10 });
        _permissionServiceMock.Setup(s => s.GetUserPermissionAsync(10, It.IsAny<int>()))
            .ReturnsAsync(PermissionLevel.Edit);
        _momentServiceMock.Setup(s => s.GetProjectIdForMomentAsync(It.IsAny<int>()))
            .ReturnsAsync(1);
    }

    [Test]
    public async Task REQ_FUN_XXX_Create_Valid_ReturnsOk()
    {
        // Arrange
        _momentServiceMock.Setup(s => s.GetByIdAsync(1)).ReturnsAsync(new Moment { Id = 1 });
        _momentTaskServiceMock.Setup(s => s.CreateAsync(It.IsAny<MomentTask>()))
            .ReturnsAsync(new MomentTask { Id = 10, Name = "Task" });

        // Act
        var result = await _controller.Create(1, new CreateMomentTaskRequestDto { Name = "New Task" });

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_Create_NullBody_Returns400()
    {
        // Arrange
        var result = await _controller.Create(1, null!);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_Create_MomentNotFound_Returns404()
    {
        // Arrange
        _momentServiceMock.Setup(s => s.GetByIdAsync(999)).ReturnsAsync((Moment?)null);

        // Act
        var result = await _controller.Create(999, new CreateMomentTaskRequestDto { Name = "Task" });

        // Assert
        Assert.That(result.Result, Is.InstanceOf<NotFoundObjectResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_Create_NoPermission_Returns403()
    {
        // Arrange
        _momentServiceMock.Setup(s => s.GetByIdAsync(1)).ReturnsAsync(new Moment { Id = 1 });
        _permissionServiceMock.Setup(s => s.GetUserPermissionAsync(10, It.IsAny<int>()))
            .ReturnsAsync(PermissionLevel.View);

        // Act
        var result = await _controller.Create(1, new CreateMomentTaskRequestDto { Name = "Task" });

        // Assert
        Assert.That(result.Result, Is.InstanceOf<ForbidResult>());

        _permissionServiceMock.Setup(s => s.GetUserPermissionAsync(10, It.IsAny<int>()))
            .ReturnsAsync(PermissionLevel.Edit);
    }

    [Test]
    public async Task REQ_FUN_XXX_UpdateCompletion_Valid_ReturnsOk()
    {
        // Arrange
        _momentTaskServiceMock.Setup(s => s.GetByIdAsync(5))
            .ReturnsAsync(new MomentTask { Id = 5, MomentId = 1, Name = "Task" });
        _momentTaskServiceMock.Setup(s => s.UpdateAsync(It.IsAny<MomentTask>()))
            .ReturnsAsync(new MomentTask { Id = 5, MomentId = 1 });

        // Act
        var result = await _controller.UpdateCompletion(1, 5, new UpdateMomentTaskCompletionRequestDto { IsCompleted = true });

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_UpdateCompletion_NullBody_Returns400()
    {
        // Arrange
        var result = await _controller.UpdateCompletion(1, 5, null!);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_UpdateCompletion_TaskNotFound_Returns404()
    {
        // Arrange
        _momentTaskServiceMock.Setup(s => s.GetByIdAsync(999)).ReturnsAsync((MomentTask?)null);

        // Act
        var result = await _controller.UpdateCompletion(1, 999, new UpdateMomentTaskCompletionRequestDto { IsCompleted = true });

        // Assert
        Assert.That(result.Result, Is.InstanceOf<NotFoundObjectResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_UpdateCompletion_NoPermission_Returns403()
    {
        // Arrange
        _momentTaskServiceMock.Setup(s => s.GetByIdAsync(5))
            .ReturnsAsync(new MomentTask { Id = 5, MomentId = 1, Name = "Task" });
        _permissionServiceMock.Setup(s => s.GetUserPermissionAsync(10, It.IsAny<int>()))
            .ReturnsAsync(PermissionLevel.View);

        // Act
        var result = await _controller.UpdateCompletion(1, 5, new UpdateMomentTaskCompletionRequestDto { IsCompleted = true });

        // Assert
        Assert.That(result.Result, Is.InstanceOf<ForbidResult>());

        _permissionServiceMock.Setup(s => s.GetUserPermissionAsync(10, It.IsAny<int>()))
            .ReturnsAsync(PermissionLevel.Edit);
    }

}
