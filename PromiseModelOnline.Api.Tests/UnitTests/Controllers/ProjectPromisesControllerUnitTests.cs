using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
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
public class ProjectPromisesControllerUnitTests
{
    private Mock<IProjectService> _projectServiceMock = null!;
    private Mock<IGenericService<Promise>> _serviceMock = null!;
    private Mock<IGenericMapper<Promise, PromiseDto>> _mapperMock = null!;
    private Mock<IMomentService> _momentServiceMock = null!;
    private Mock<IGenericRepository<Promise>> _promiseRepoMock = null!;
    private PromiseModelOnlineContext _context = null!;
    private ProjectPromisesController _controller = null!;

    [SetUp]
    public void SetUp()
    {
        _projectServiceMock = new Mock<IProjectService>();
        _serviceMock = new Mock<IGenericService<Promise>>();
        _mapperMock = new Mock<IGenericMapper<Promise, PromiseDto>>();
        _momentServiceMock = new Mock<IMomentService>();
        _promiseRepoMock = new Mock<IGenericRepository<Promise>>();

        var options = new DbContextOptionsBuilder<PromiseModelOnlineContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _context = new PromiseModelOnlineContext(options);

        _controller = new ProjectPromisesController(
            _serviceMock.Object,
            _mapperMock.Object,
            _momentServiceMock.Object,
            _context,
            _projectServiceMock.Object,
            _promiseRepoMock.Object);
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
    public async Task REQ_FUN_XXX_GetBySeq_Found_ReturnsOk()
    {
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());
        _context.Promises.Add(Promise()); await _context.SaveChangesAsync();
        _mapperMock.Setup(m => m.Map(It.IsAny<Promise>(), It.IsAny<IGenericService<Promise>>()))
            .Returns<Promise, IGenericService<Promise>>((p, _) => new PromiseDto { Id = p.Id, Statement = p.Statement });

        var result = await _controller.GetBySeq(1, "o", "p");

        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_GetBySeq_NotFound_Returns404()
    {
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());

        var result = await _controller.GetBySeq(999, "o", "p");

        Assert.That(result.Result, Is.InstanceOf<NotFoundResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_GetBySeq_ProjectNotFound_Returns404()
    {
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("bad", "bad")).ReturnsAsync((Project?)null);

        var result = await _controller.GetBySeq(1, "bad", "bad");

        Assert.That(result.Result, Is.InstanceOf<NotFoundResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_GetById_Found_ReturnsOk()
    {
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());
        var promise = Promise(id: 42);
        _promiseRepoMock.Setup(r => r.GetByIdAsync(42, It.IsAny<CancellationToken>())).ReturnsAsync(promise);
        _mapperMock.Setup(m => m.Map(It.IsAny<Promise>(), It.IsAny<IGenericService<Promise>>()))
            .Returns<Promise, IGenericService<Promise>>((p, _) => new PromiseDto { Id = p.Id });

        var result = await _controller.GetById(42, "o", "p");

        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_GetById_NotFound_Returns404()
    {
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());
        _promiseRepoMock.Setup(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>())).ReturnsAsync((Promise?)null);

        var result = await _controller.GetById(999, "o", "p");

        Assert.That(result.Result, Is.InstanceOf<NotFoundResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_CreateFromDto_Valid_Returns201()
    {
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());
        SetupEditPermission();
        _serviceMock.Setup(s => s.AddAsync(It.IsAny<Promise>())).Returns(Task.CompletedTask);
        _mapperMock.Setup(m => m.Map(It.IsAny<Promise>(), It.IsAny<IGenericService<Promise>>()))
            .Returns<Promise, IGenericService<Promise>>((p, _) => new PromiseDto { Id = p.Id });

        var request = new CreatePromiseRequestDto { Statement = "New" };
        var result = await _controller.CreateFromDto(request, "o", "p");

        Assert.That(result.Result, Is.InstanceOf<CreatedAtActionResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_CreateFromDto_NullBody_Returns400()
    {
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());
        SetupEditPermission();

        var result = await _controller.CreateFromDto(null!, "o", "p");

        Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_CreateFromDto_NoPermission_Returns403()
    {
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

        var result = await _controller.CreateFromDto(new CreatePromiseRequestDto(), "o", "p");

        Assert.That(result.Result, Is.InstanceOf<ForbidResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_Update_Valid_Returns204()
    {
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());
        SetupEditPermission();
        _context.Promises.Add(Promise(id: 10, seq: 1)); await _context.SaveChangesAsync();

        var dto = new UpdatePromiseRequestDto { Id = 10, Statement = "Updated" };
        var result = await _controller.Update(1, dto, "o", "p");

        Assert.That(result, Is.InstanceOf<NoContentResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_Update_IdMismatch_Returns400()
    {
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());
        SetupEditPermission();
        _context.Promises.Add(Promise(id: 10, seq: 1)); await _context.SaveChangesAsync();

        var dto = new UpdatePromiseRequestDto { Id = 99, Statement = "Bad" };
        var result = await _controller.Update(1, dto, "o", "p");

        Assert.That(result, Is.InstanceOf<BadRequestResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_Delete_Valid_Returns204()
    {
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());
        SetupEditPermission();
        _context.Promises.Add(Promise(id: 10, seq: 1)); await _context.SaveChangesAsync();
        _serviceMock.Setup(s => s.DeleteByIdAsync(10)).ReturnsAsync(true);

        var result = await _controller.Delete(1, "o", "p");

        Assert.That(result, Is.InstanceOf<NoContentResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_Delete_NotFound_Returns404()
    {
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());
        SetupEditPermission();

        var result = await _controller.Delete(999, "o", "p");

        Assert.That(result, Is.InstanceOf<NotFoundResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_GetTotalEffort_Valid_ReturnsEffort()
    {
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());
        _context.Promises.Add(Promise(id: 10, seq: 1)); await _context.SaveChangesAsync();
        _momentServiceMock.Setup(s => s.GetTotalEffortForPromiseAsync(10)).ReturnsAsync(42);

        var result = await _controller.GetTotalEffort(1, "o", "p");

        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        var ok = result.Result as OkObjectResult;
        Assert.That(ok!.Value, Is.EqualTo(42));
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
