using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.Controllers;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Enums;
using PromiseModelOnline.Api.Mappers.Interfaces;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.Tests.Infrastructure;

namespace PromiseModelOnline.Api.Tests;

[TestFixture]
public class ProjectIterationsControllerUnitTests
{
    private Mock<IProjectService> _projectServiceMock = null!;
    private Mock<IGenericService<Iteration>> _serviceMock = null!;
    private Mock<IGenericMapper<Iteration, IterationDto>> _mapperMock = null!;
    private Mock<IIterationService> _iterationServiceMock = null!;
    private Mock<IMomentService> _momentServiceMock = null!;
    private ProjectIterationsController _controller = null!;

    [SetUp]
    public void SetUp()
    {
        _projectServiceMock = new Mock<IProjectService>();
        _serviceMock = new Mock<IGenericService<Iteration>>();
        _mapperMock = new Mock<IGenericMapper<Iteration, IterationDto>>();
        _iterationServiceMock = new Mock<IIterationService>();
        _momentServiceMock = new Mock<IMomentService>();
        _controller = new ProjectIterationsController(
            _serviceMock.Object,
            _mapperMock.Object,
            _iterationServiceMock.Object,
            _momentServiceMock.Object,
            _projectServiceMock.Object);
        ControllerTestHelpers.SetControllerUser(_controller, "u@test.com");
    }

    [Test]
    public async Task REQ_FUN_XXX_GetAll_ProjectFound_ReturnsMappedIterations()
    {
        // Arrange
        var project = new Project { Id = 1, Name = "Test" };
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(project);

        var iterations = new List<Iteration> { new() { Id = 1, Name = "S1", ProjectId = 1 } };
        _iterationServiceMock.Setup(s => s.GetIterationsByProjectAsync(1)).ReturnsAsync(iterations);
        _mapperMock.Setup(m => m.Map(It.IsAny<Iteration>(), It.IsAny<IGenericService<Iteration>>()))
            .Returns<Iteration, IGenericService<Iteration>>((i, _) => new IterationDto { Id = i.Id, Name = i.Name });

        // Act
        var result = await _controller.GetAll("o", "p");

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        var ok = result.Result as OkObjectResult;
        var list = ok!.Value as List<IterationDto>;
        Assert.That(list, Is.Not.Null);
        Assert.That(list!.Count, Is.EqualTo(1));
    }

    [Test]
    public async Task REQ_FUN_XXX_GetAll_ProjectNotFound_Returns404()
    {
        // Arrange
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("bad", "bad")).ReturnsAsync((Project?)null);

        // Act
        var result = await _controller.GetAll("bad", "bad");

        // Assert
        Assert.That(result.Result, Is.InstanceOf<NotFoundResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_Create_ValidRequest_Returns201()
    {
        // Arrange
        var project = new Project { Id = 1, Name = "Test" };
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(project);

        var permissionServiceMock = new Mock<IPermissionService>();
        var userRepoMock = new Mock<IUserRepository>();

        _controller.ControllerContext.HttpContext.RequestServices = CreateServiceProvider(
            (typeof(IPermissionService), permissionServiceMock.Object),
            (typeof(IUserRepository), userRepoMock.Object));

        userRepoMock.Setup(r => r.GetOrCreateUserByEmailAsync("u@test.com", null))
            .ReturnsAsync(new User { Id = 10 });
        permissionServiceMock.Setup(s => s.GetUserPermissionAsync(10, 1))
            .ReturnsAsync(PermissionLevel.Edit);

        var entity = new Iteration { Name = "New Sprint" };

        // Act
        var result = await _controller.Create(entity, "o", "p");

        // Assert
        Assert.That(result.Result, Is.InstanceOf<CreatedAtActionResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_Create_NullBody_Returns400()
    {
        // Arrange
        var project = new Project { Id = 1, Name = "Test" };
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(project);

        // Act
        var result = await _controller.Create(null!, "o", "p");

        // Assert
        Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_Create_ProjectNotFound_Returns404()
    {
        // Arrange
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("bad", "bad")).ReturnsAsync((Project?)null);

        // Act
        var result = await _controller.Create(new Iteration(), "bad", "bad");

        // Assert
        Assert.That(result.Result, Is.InstanceOf<NotFoundResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_Create_NoEditPermission_Returns403()
    {
        // Arrange
        var project = new Project { Id = 1, Name = "Test" };
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(project);

        var permissionServiceMock = new Mock<IPermissionService>();
        var userRepoMock = new Mock<IUserRepository>();

        _controller.ControllerContext.HttpContext.RequestServices = CreateServiceProvider(
            (typeof(IPermissionService), permissionServiceMock.Object),
            (typeof(IUserRepository), userRepoMock.Object));

        userRepoMock.Setup(r => r.GetOrCreateUserByEmailAsync("u@test.com", null))
            .ReturnsAsync(new User { Id = 10 });
        permissionServiceMock.Setup(s => s.GetUserPermissionAsync(10, 1))
            .ReturnsAsync(PermissionLevel.View);

        // Act
        var result = await _controller.Create(new Iteration(), "o", "p");

        // Assert
        Assert.That(result.Result, Is.InstanceOf<ForbidResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_GetIterationBurndown_Valid_ReturnsData()
    {
        // Arrange
        var project = new Project { Id = 1, Name = "Test" };
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(project);

        var iteration = new Iteration { Id = 5, ProjectId = 1, Name = "S1" };
        _iterationServiceMock.Setup(s => s.GetByIdAsync(5)).ReturnsAsync(iteration);

        var burndown = new List<BurndownPointDto>
        {
            new() { Date = System.DateTime.UtcNow, RemainingEffort = 10 }
        };
        _momentServiceMock.Setup(s => s.GetIterationBurndownAsync(5)).ReturnsAsync(burndown);

        // Act
        var result = await _controller.GetIterationBurndown(5, "o", "p");

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        var ok = result.Result as OkObjectResult;
        var list = ok!.Value as List<BurndownPointDto>;
        Assert.That(list, Is.Not.Null);
        Assert.That(list!.Count, Is.EqualTo(1));
    }

    [Test]
    public async Task REQ_FUN_XXX_GetIterationBurndown_IterationNotFound_Returns404()
    {
        // Arrange
        var project = new Project { Id = 1, Name = "Test" };
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(project);
        _iterationServiceMock.Setup(s => s.GetByIdAsync(999)).ReturnsAsync((Iteration?)null);

        // Act
        var result = await _controller.GetIterationBurndown(999, "o", "p");

        // Assert
        Assert.That(result.Result, Is.InstanceOf<NotFoundResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_GetIterationBurndown_WrongProject_Returns404()
    {
        // Arrange
        var project = new Project { Id = 1, Name = "Test" };
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(project);

        var iteration = new Iteration { Id = 5, ProjectId = 99, Name = "Other" };
        _iterationServiceMock.Setup(s => s.GetByIdAsync(5)).ReturnsAsync(iteration);

        // Act
        var result = await _controller.GetIterationBurndown(5, "o", "p");

        // Assert
        Assert.That(result.Result, Is.InstanceOf<NotFoundResult>());
    }

    private static IServiceProvider CreateServiceProvider(params (Type type, object service)[] services)
    {
        var dict = new Dictionary<Type, object>();
        foreach (var (type, service) in services) dict[type] = service;
        return new MockServiceProvider(dict);
    }

    private sealed class MockServiceProvider(Dictionary<Type, object> services) : IServiceProvider
    {
        public object? GetService(Type serviceType) =>
            services.TryGetValue(serviceType, out var service) ? service : null;
    }
}
