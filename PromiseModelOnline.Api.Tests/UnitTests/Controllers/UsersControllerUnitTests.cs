using System;
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
using PromiseModelOnline.Api.Enums;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.Tests.Infrastructure;

namespace PromiseModelOnline.Api.Tests;

[TestFixture]
/// <summary>Unit tests for <see cref="UsersController"/> covering user profile and search.</summary>
// Requirements: REQ_SYS_014
public class UsersControllerUnitTests
{
    private Mock<IUserRepository> _mockUserRepo = null!;
    private Mock<IProjectRepository> _mockProjectRepo = null!;
    private PromiseModelOnlineContext _context = null!;
    private UsersController _controller = null!;

    [SetUp]
    public void SetUp()
    {
        _mockUserRepo = new Mock<IUserRepository>();
        _mockProjectRepo = new Mock<IProjectRepository>();

        var options = new DbContextOptionsBuilder<PromiseModelOnlineContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _context = new PromiseModelOnlineContext(options);

        _controller = new UsersController(
            _mockUserRepo.Object,
            _mockProjectRepo.Object,
            _context);
    }

    [TearDown]
    public void TearDown() => _context.Dispose();

    [Test]
    public async Task REQ_SYS_014_Me_ReturnsUserInfo_WhenAuthenticated()
    {
        // Arrange
        ControllerTestHelpers.SetControllerUser(_controller, "owner@example.com");
        _mockUserRepo.Setup(r => r.FindByEmailAsync("owner@example.com"))
            .ReturnsAsync(new List<User> { new() { Id = 1, Name = "Test Owner", Email = "owner@example.com" } });

        // Act
        var result = await _controller.Me();

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var ok = (OkObjectResult)result;
        var data = ok.Value!;
        Assert.That(data.GetType().GetProperty("email")!.GetValue(data), Is.EqualTo("owner@example.com"));
        Assert.That(data.GetType().GetProperty("userId")!.GetValue(data), Is.EqualTo(1));
    }

    [Test]
    public async Task REQ_SYS_014_SearchUsers_ReturnsEmpty_WhenQueryIsEmpty()
    {
        // Arrange
        ControllerTestHelpers.SetControllerUser(_controller, "owner@example.com");

        // Act
        var result = await _controller.SearchUsers("");

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
    }

    [Test]
    public async Task REQ_SYS_014_SearchUsers_ReturnsUsers_WhenQueryIsValid()
    {
        // Arrange
        ControllerTestHelpers.SetControllerUser(_controller, "owner@example.com");
        _mockUserRepo.Setup(r => r.SearchUsersAsync("test", 10))
            .ReturnsAsync(new List<User> { new() { Id = 1, Name = "Test User", Email = "test@example.com" } });

        // Act
        var result = await _controller.SearchUsers("test");

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
    }

    [Test]
    public async Task REQ_SYS_014_ExportMyData_ReturnsUnauthorized_WhenNotAuthenticated()
    {
        // Arrange
        ControllerTestHelpers.SetControllerUser(_controller, null);

        // Act
        var result = await _controller.ExportMyData();

        // Assert
        Assert.That(result, Is.InstanceOf<UnauthorizedResult>());
    }

    [Test]
    public async Task REQ_SYS_014_ExportMyData_ReturnsNotFound_WhenUserNotInDb()
    {
        // Arrange
        ControllerTestHelpers.SetControllerUser(_controller, "missing@example.com");
        _mockUserRepo.Setup(r => r.FindByEmailAsync("missing@example.com"))
            .ReturnsAsync(new List<User>());

        // Act
        var result = await _controller.ExportMyData();

        // Assert
        Assert.That(result, Is.InstanceOf<NotFoundResult>());
    }

    [Test]
    public async Task REQ_SYS_014_ExportMyData_ReturnsData_WhenAuthenticated()
    {
        // Arrange
        ControllerTestHelpers.SetControllerUser(_controller, "owner@example.com");
        _mockUserRepo.Setup(r => r.FindByEmailAsync("owner@example.com"))
            .ReturnsAsync(new List<User> { new() { Id = 1, Name = "Test Owner", Email = "owner@example.com", Slug = "pmo_test", CreatedAt = DateTime.UtcNow } });
        _mockProjectRepo.Setup(r => r.GetProjectsOwnedByUserAsync(1))
            .ReturnsAsync(new List<Project>());

        // Act
        var result = await _controller.ExportMyData();

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        var ok = (OkObjectResult)result;
        var data = ok.Value!;
        Assert.That(data.GetType().GetProperty("exportedAt")!.GetValue(data), Is.Not.Null);
        Assert.That(data.GetType().GetProperty("schemaVersion")!.GetValue(data), Is.EqualTo("1.0"));
    }

    [Test]
    public async Task REQ_SYS_014_DeleteMyData_ReturnsUnauthorized_WhenNotAuthenticated()
    {
        // Arrange
        ControllerTestHelpers.SetControllerUser(_controller, null);

        // Act
        var result = await _controller.DeleteMyData();

        // Assert
        Assert.That(result, Is.InstanceOf<UnauthorizedResult>());
    }

    [Test]
    public async Task REQ_SYS_014_DeleteMyData_ReturnsNotFound_WhenUserNotInDb()
    {
        // Arrange
        ControllerTestHelpers.SetControllerUser(_controller, "missing@example.com");
        _mockUserRepo.Setup(r => r.FindByEmailAsync("missing@example.com"))
            .ReturnsAsync(new List<User>());

        // Act
        var result = await _controller.DeleteMyData();

        // Assert
        Assert.That(result, Is.InstanceOf<NotFoundResult>());
    }

    [Test]
    public async Task REQ_SYS_014_DeleteMyData_PurgesAllUserData()
    {
        // Arrange
        var userId = 1;
        ControllerTestHelpers.SetControllerUser(_controller, "owner@example.com");

        var user = new User { Id = userId, Name = "Test Owner", Email = "owner@example.com", Slug = "pmo_test", CreatedAt = DateTime.UtcNow };

        _mockUserRepo.Setup(r => r.FindByEmailAsync("owner@example.com"))
            .ReturnsAsync(new List<User> { user });

        _context.Users.Add(user);
        _context.Reactions.Add(new Reaction { Id = 1, UserId = userId, Emote = "thumbsup", StackItemType = "Moment", StackItemId = 1 });
        _context.Set<Notification>().Add(new Notification { Id = 1, UserId = userId, Type = NotificationType.Mention, Message = "test", IsRead = false, CreatedAt = DateTime.UtcNow });
        _context.Set<Permission>().Add(new Permission { Id = 1, UserId = userId, Level = PermissionLevel.Edit, Status = PermissionStatus.Active, ProjectId = 1 });
        _context.Set<MomentAssignment>().Add(new MomentAssignment { Id = 1, UserId = userId, MomentId = 1, Role = "Owner" });
        await _context.SaveChangesAsync();

        // Act
        var result = await _controller.DeleteMyData();

        // Assert
        Assert.That(result, Is.InstanceOf<NoContentResult>());
        Assert.That(_context.Users.Any(u => u.Id == userId), Is.False);
        Assert.That(_context.Reactions.Any(r => r.UserId == userId), Is.False);
        Assert.That(_context.Set<Notification>().Any(n => n.UserId == userId), Is.False);
        Assert.That(_context.Set<Permission>().Any(p => p.UserId == userId), Is.False);
        Assert.That(_context.Set<MomentAssignment>().Any(ma => ma.UserId == userId), Is.False);
    }
}
