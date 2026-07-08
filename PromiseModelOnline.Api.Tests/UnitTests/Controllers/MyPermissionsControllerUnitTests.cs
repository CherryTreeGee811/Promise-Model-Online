using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.Controllers;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.Tests.Infrastructure;

namespace PromiseModelOnline.Api.Tests;

[TestFixture]
public class MyPermissionsControllerUnitTests
{
    private Mock<IPermissionService> _permissionServiceMock = null!;
    private Mock<IUserRepository> _userRepoMock = null!;
    private MyPermissionsController _controller = null!;

    [SetUp]
    public void SetUp()
    {
        _permissionServiceMock = new Mock<IPermissionService>();
        _userRepoMock = new Mock<IUserRepository>();

        _controller = new MyPermissionsController(
            _permissionServiceMock.Object,
            _userRepoMock.Object);
    }

    [Test]
    public async Task REQ_FUN_XXX_GetPendingInvitations_ReturnsOk()
    {
        ControllerTestHelpers.SetControllerUser(_controller, "u@test.com");
        _userRepoMock.Setup(r => r.GetOrCreateUserByEmailAsync("u@test.com", null))
            .ReturnsAsync(new User { Id = 10 });
        _permissionServiceMock.Setup(s => s.GetPendingInvitationsForUserAsync(10))
            .ReturnsAsync(new List<PendingInvitationDto>());

        var result = await _controller.GetPendingInvitations();

        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_GetPendingInvitations_Unauthorized_Returns401()
    {
        ControllerTestHelpers.SetControllerUser(_controller, null);

        var result = await _controller.GetPendingInvitations();

        Assert.That(result.Result, Is.InstanceOf<UnauthorizedResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_UpdatePermissionStatus_Valid_ReturnsOk()
    {
        ControllerTestHelpers.SetControllerUser(_controller, "u@test.com");
        _userRepoMock.Setup(r => r.GetOrCreateUserByEmailAsync("u@test.com", null))
            .ReturnsAsync(new User { Id = 10 });
        _permissionServiceMock.Setup(s => s.AcceptInvitationAsync(1, 10))
            .ReturnsAsync(new PermissionDto());

        var result = await _controller.UpdatePermissionStatus(1, new UpdatePermissionRequestDto { Status = "Active" });

        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_UpdatePermissionStatus_NullBody_Returns400()
    {
        ControllerTestHelpers.SetControllerUser(_controller, "u@test.com");

        var result = await _controller.UpdatePermissionStatus(1, null!);

        Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_UpdatePermissionStatus_Unauthorized_Returns401()
    {
        ControllerTestHelpers.SetControllerUser(_controller, null);

        var result = await _controller.UpdatePermissionStatus(1, new UpdatePermissionRequestDto { Status = "Active" });

        Assert.That(result.Result, Is.InstanceOf<UnauthorizedResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_UpdatePermissionStatus_Exception_Returns400()
    {
        ControllerTestHelpers.SetControllerUser(_controller, "u@test.com");
        _userRepoMock.Setup(r => r.GetOrCreateUserByEmailAsync("u@test.com", null))
            .ReturnsAsync(new User { Id = 10 });
        _permissionServiceMock.Setup(s => s.AcceptInvitationAsync(1, 10))
            .ThrowsAsync(new InvalidOperationException("Already active"));

        var result = await _controller.UpdatePermissionStatus(1, new UpdatePermissionRequestDto { Status = "Active" });

        Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
    }
}
