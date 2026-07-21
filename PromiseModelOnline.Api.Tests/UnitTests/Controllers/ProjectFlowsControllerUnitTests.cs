using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;
using NUnit.Framework;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.Controllers;
using PromiseModelOnline.Api.DAL;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Enums;
using PromiseModelOnline.Api.Mappers.Interfaces;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.Tests.Infrastructure;

namespace PromiseModelOnline.Api.Tests;

[TestFixture]
public class ProjectFlowsControllerUnitTests
{
    private Mock<IProjectService> _projectServiceMock = null!;
    private Mock<IGenericService<Flow>> _serviceMock = null!;
    private Mock<IGenericMapper<Flow, FlowDto>> _mapperMock = null!;
    private PromiseModelOnlineContext _context = null!;
    private ProjectFlowsController _controller = null!;

    [SetUp]
    public void SetUp()
    {
        _projectServiceMock = new Mock<IProjectService>();
        _serviceMock = new Mock<IGenericService<Flow>>();
        _mapperMock = new Mock<IGenericMapper<Flow, FlowDto>>();

        var options = new DbContextOptionsBuilder<PromiseModelOnlineContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _context = new PromiseModelOnlineContext(options);

        _controller = new ProjectFlowsController(
            _serviceMock.Object,
            _mapperMock.Object,
            _context,
            _projectServiceMock.Object);
        ControllerTestHelpers.SetControllerUser(_controller, "u@test.com");
    }

    [TearDown]
    public void TearDown() => _context.Dispose();

    private static Project Project(int id = 1) => new() { Id = id, Name = "P", Slug = "p", OwnerId = 1 };

    private static Promise Promise(int id = 10, int projectId = 1, int seq = 1) => new()
    {
        Id = id,
        ProjectId = projectId,
        Statement = $"P{seq}",
        SequenceNumber = seq,
        DisplayOrder = seq
    };

    private static Epic Epic(int id = 20, int promiseId = 10, int seq = 1) => new()
    {
        Id = id,
        ProductPromiseId = promiseId,
        Statement = $"E{seq}",
        SequenceNumber = seq,
        DisplayOrder = seq
    };

    private static Journey Journey(int id = 30, int epicId = 20, int seq = 1) => new()
    {
        Id = id,
        EpicId = epicId,
        Statement = $"J{seq}",
        SequenceNumber = seq,
        DisplayOrder = seq
    };

    private static Flow Flow(int id = 40, int journeyId = 30, int seq = 1) => new()
    {
        Id = id,
        JourneyId = journeyId,
        Statement = $"F{seq}",
        SequenceNumber = seq,
        DisplayOrder = seq
    };

    private void SetupEditPermission()
    {
        var permissionServiceMock = new Mock<IPermissionService>();
        var userRepoMock = new Mock<IUserRepository>();
        _controller.ControllerContext.HttpContext.RequestServices = CreateServiceProvider(
            (typeof(IPermissionService), permissionServiceMock.Object),
            (typeof(IUserRepository), userRepoMock.Object));
        userRepoMock.Setup(r => r.GetOrCreateUserByEmailAsync("u@test.com", null))
            .ReturnsAsync(new User { Id = 10 });
        permissionServiceMock.Setup(s => s.GetUserPermissionAsync(10, 1))
            .ReturnsAsync(PermissionLevel.Edit);
    }

    [Test]
    public async Task REQ_FUN_XXX_GetAll_ReturnsOk()
    {
        // Arrange
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());
        await SetupFullHierarchy();
        _mapperMock.Setup(m => m.Map(It.IsAny<Flow>(), It.IsAny<IGenericService<Flow>>()))
            .Returns<Flow, IGenericService<Flow>>((f, _) => new FlowDto { Id = f.Id });

        // Act
        var result = await _controller.GetAll("o", "p");

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
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
    public async Task REQ_FUN_XXX_GetAll_FilterByJourneySeq_ReturnsOk()
    {
        // Arrange
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());
        await SetupFullHierarchy();
        _mapperMock.Setup(m => m.Map(It.IsAny<Flow>(), It.IsAny<IGenericService<Flow>>()))
            .Returns<Flow, IGenericService<Flow>>((f, _) => new FlowDto { Id = f.Id });

        // Act
        var result = await _controller.GetAll("o", "p", journeySeq: 1);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_GetAll_FilterByJourneySeq_JourneyNotFound_Returns404()
    {
        // Arrange
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());

        // Act
        var result = await _controller.GetAll("o", "p", journeySeq: 999);

        // Assert
        Assert.That(result.Result, Is.InstanceOf<NotFoundObjectResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_GetBySeq_Found_ReturnsOk()
    {
        // Arrange
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());
        await SetupFullHierarchy();
        _mapperMock.Setup(m => m.Map(It.IsAny<Flow>(), It.IsAny<IGenericService<Flow>>()))
            .Returns<Flow, IGenericService<Flow>>((f, _) => new FlowDto { Id = f.Id });

        // Act
        var result = await _controller.GetBySeq(1, "o", "p");

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_GetBySeq_NotFound_Returns404()
    {
        // Arrange
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());

        // Act
        var result = await _controller.GetBySeq(999, "o", "p");

        // Assert
        Assert.That(result.Result, Is.InstanceOf<NotFoundResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_GetBySeq_ProjectNotFound_Returns404()
    {
        // Arrange
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("bad", "bad")).ReturnsAsync((Project?)null);

        // Act
        var result = await _controller.GetBySeq(1, "bad", "bad");

        // Assert
        Assert.That(result.Result, Is.InstanceOf<NotFoundResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_GetById_Found_ReturnsOk()
    {
        // Arrange
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());
        await SetupFullHierarchy();
        _mapperMock.Setup(m => m.Map(It.IsAny<Flow>(), It.IsAny<IGenericService<Flow>>()))
            .Returns<Flow, IGenericService<Flow>>((f, _) => new FlowDto { Id = f.Id });

        // Act
        var result = await _controller.GetById(40, "o", "p");

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_GetById_NotFound_Returns404()
    {
        // Arrange
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());

        // Act
        var result = await _controller.GetById(999, "o", "p");

        // Assert
        Assert.That(result.Result, Is.InstanceOf<NotFoundResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_CreateFromDto_Valid_Returns201()
    {
        // Arrange
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());
        SetupEditPermission();
        await SetupFullHierarchy();
        _serviceMock.Setup(s => s.AddAsync(It.IsAny<Flow>())).Returns(Task.CompletedTask);
        _mapperMock.Setup(m => m.Map(It.IsAny<Flow>(), It.IsAny<IGenericService<Flow>>()))
            .Returns<Flow, IGenericService<Flow>>((f, _) => new FlowDto { Id = f.Id });

        // Act
        var result = await _controller.CreateFromDto(new CreateFlowRequestDto { JourneyId = 30 }, "o", "p");

        // Assert
        Assert.That(result.Result, Is.InstanceOf<CreatedAtActionResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_CreateFromDto_NullBody_Returns400()
    {
        // Arrange
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());
        SetupEditPermission();

        // Act
        var result = await _controller.CreateFromDto(null!, "o", "p");

        // Assert
        Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_CreateFromDto_NoPermission_Returns403()
    {
        // Arrange
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());
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
        var result = await _controller.CreateFromDto(new CreateFlowRequestDto(), "o", "p");

        // Assert
        Assert.That(result.Result, Is.InstanceOf<ForbidResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_Update_Valid_Returns204()
    {
        // Arrange
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());
        SetupEditPermission();
        await SetupFullHierarchy();
        _serviceMock.Setup(s => s.UpdateAsync(It.IsAny<Flow>())).Returns(Task.CompletedTask);

        var dto = new UpdateFlowRequestDto { Id = 40, Statement = "Updated" };
        // Act
        var result = await _controller.Update(1, dto, "o", "p");

        // Assert
        Assert.That(result, Is.InstanceOf<NoContentResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_Update_IdMismatch_Returns400()
    {
        // Arrange
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());
        SetupEditPermission();
        await SetupFullHierarchy();

        var dto = new UpdateFlowRequestDto { Id = 99, Statement = "Bad" };
        // Act
        var result = await _controller.Update(1, dto, "o", "p");

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_Update_NullBody_Returns400()
    {
        // Arrange
        var result = await _controller.Update(1, null!, "o", "p");

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_Delete_Valid_Returns204()
    {
        // Arrange
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());
        SetupEditPermission();
        await SetupFullHierarchy();
        _serviceMock.Setup(s => s.DeleteByIdAsync(40)).ReturnsAsync(true);

        // Act
        var result = await _controller.Delete(1, "o", "p");

        // Assert
        Assert.That(result, Is.InstanceOf<NoContentResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_Delete_NotFound_Returns404()
    {
        // Arrange
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());
        SetupEditPermission();

        // Act
        var result = await _controller.Delete(999, "o", "p");

        // Assert
        Assert.That(result, Is.InstanceOf<NotFoundResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_UpdateDescription_Valid_ReturnsOk()
    {
        // Arrange
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());
        SetupEditPermission();
        await SetupFullHierarchy();
        _serviceMock.Setup(s => s.UpdateAsync(It.IsAny<Flow>())).Returns(Task.CompletedTask);
        _mapperMock.Setup(m => m.Map(It.IsAny<Flow>(), It.IsAny<IGenericService<Flow>>()))
            .Returns<Flow, IGenericService<Flow>>((f, _) => new FlowDto { Id = f.Id });

        // Act
        var result = await _controller.UpdateDescription(1, new UpdateDescriptionRequestDto { Description = "New desc" }, "o", "p");

        // Assert
        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_UpdateDescription_NullBody_Returns400()
    {
        // Arrange
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());
        SetupEditPermission();

        // Act
        var result = await _controller.UpdateDescription(1, null!, "o", "p");

        // Assert
        Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
    }

    private async Task SetupFullHierarchy()
    {
        _context.Promises.Add(Promise());
        _context.Epics.Add(Epic());
        _context.Journeys.Add(Journey());
        _context.Flows.Add(Flow());
        await _context.SaveChangesAsync();
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
