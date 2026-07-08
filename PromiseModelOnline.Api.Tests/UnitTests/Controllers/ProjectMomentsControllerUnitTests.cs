using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using PromiseModelOnline.Api.BusinessLogic;
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
public class ProjectMomentsControllerUnitTests
{
    private Mock<IMomentService> _momentServiceMock = null!;
    private Mock<IGenericMapper<Moment, MomentDto>> _mapperMock = null!;
    private Mock<IUserRepository> _userRepoMock = null!;
    private Mock<IPermissionService> _permissionServiceMock = null!;
    private PromiseModelOnlineContext _context = null!;
    private Mock<IProjectService> _projectServiceMock = null!;
    private Mock<ILogger<ProjectMomentsController>> _loggerMock = null!;
    private ProjectMomentsController _controller = null!;

    [SetUp]
    public void SetUp()
    {
        _momentServiceMock = new Mock<IMomentService>();
        _mapperMock = new Mock<IGenericMapper<Moment, MomentDto>>();
        _userRepoMock = new Mock<IUserRepository>();
        _permissionServiceMock = new Mock<IPermissionService>();
        _projectServiceMock = new Mock<IProjectService>();
        _loggerMock = new Mock<ILogger<ProjectMomentsController>>();

        var options = new DbContextOptionsBuilder<PromiseModelOnlineContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _context = new PromiseModelOnlineContext(options);

        _controller = new ProjectMomentsController(
            _momentServiceMock.Object,
            _mapperMock.Object,
            _userRepoMock.Object,
            _permissionServiceMock.Object,
            _context,
            _loggerMock.Object,
            _projectServiceMock.Object);
        ControllerTestHelpers.SetControllerUser(_controller, "u@test.com");

        _controller.ControllerContext.HttpContext.RequestServices = CreateServiceProvider(
            (typeof(IUserRepository), _userRepoMock.Object),
            (typeof(IPermissionService), _permissionServiceMock.Object));
        _userRepoMock.Setup(r => r.GetOrCreateUserByEmailAsync("u@test.com", null))
            .ReturnsAsync(new User { Id = 10 });
        _permissionServiceMock.Setup(s => s.GetUserPermissionAsync(10, 1))
            .ReturnsAsync(PermissionLevel.Edit);
        _momentServiceMock.Setup(s => s.GetProjectIdForMomentAsync(It.IsAny<int>()))
            .ReturnsAsync(1);
    }

    [TearDown]
    public void TearDown() => _context.Dispose();

    private static Project Project(int id = 1) => new() { Id = id, Name = "P", Slug = "p", OwnerId = 1 };

    private async Task SetupHierarchy(int momentId = 50, int flowId = 40, int seq = 1)
    {
        _context.Projects.Add(Project());
        _context.Promises.Add(new() { Id = 10, ProjectId = 1, Statement = "P1", SequenceNumber = 1, DisplayOrder = 1 });
        _context.Epics.Add(new() { Id = 20, ProductPromiseId = 10, Statement = "E1", SequenceNumber = 1, DisplayOrder = 1 });
        _context.Journeys.Add(new() { Id = 30, EpicId = 20, Statement = "J1", SequenceNumber = 1, DisplayOrder = 1 });
        _context.Flows.Add(new() { Id = flowId, JourneyId = 30, Statement = "F1", SequenceNumber = 1, DisplayOrder = 1 });
        _context.Moments.Add(new() { Id = momentId, FlowId = flowId, Statement = "M1", SequenceNumber = seq, DisplayOrder = 1 });
        await _context.SaveChangesAsync();
    }

    [Test]
    public async Task REQ_FUN_XXX_GetBySeq_Found_ReturnsOk()
    {
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());
        await SetupHierarchy();
        _mapperMock.Setup(m => m.Map(It.IsAny<Moment>(), It.IsAny<IMomentService>()))
            .Returns<Moment, IMomentService>((m, _) => new MomentDto { Id = m.Id });

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
        await SetupHierarchy(momentId: 42);
        _mapperMock.Setup(m => m.Map(It.IsAny<Moment>(), It.IsAny<IMomentService>()))
            .Returns<Moment, IMomentService>((m, _) => new MomentDto { Id = m.Id });

        var result = await _controller.GetById(42, "o", "p");

        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_GetById_NotFound_Returns404()
    {
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());

        var result = await _controller.GetById(999, "o", "p");

        Assert.That(result.Result, Is.InstanceOf<NotFoundResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_GetAll_ReturnsOk()
    {
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());
        await SetupHierarchy();
        _mapperMock.Setup(m => m.Map(It.IsAny<Moment>(), It.IsAny<IMomentService>()))
            .Returns<Moment, IMomentService>((m, _) => new MomentDto { Id = m.Id });

        var result = await _controller.GetAll("o", "p");

        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_GetAll_ProjectNotFound_Returns404()
    {
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("bad", "bad")).ReturnsAsync((Project?)null);

        var result = await _controller.GetAll("bad", "bad");

        Assert.That(result.Result, Is.InstanceOf<NotFoundResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_GetAll_FilterByFlowSeq_ReturnsOk()
    {
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());
        await SetupHierarchy();
        _momentServiceMock.Setup(s => s.GetMomentsByFlowAsync(40)).ReturnsAsync(new List<Moment>());
        _mapperMock.Setup(m => m.Map(It.IsAny<Moment>(), It.IsAny<IMomentService>()))
            .Returns<Moment, IMomentService>((m, _) => new MomentDto { Id = m.Id });

        var result = await _controller.GetAll("o", "p", flowSeq: 1);

        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_GetAll_FilterByFlowSeq_FlowNotFound_Returns404()
    {
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());

        var result = await _controller.GetAll("o", "p", flowSeq: 999);

        Assert.That(result.Result, Is.InstanceOf<NotFoundObjectResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_GetAll_FilterByStride_ReturnsOk()
    {
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());
        _context.Projects.Add(Project()); await _context.SaveChangesAsync();
        _context.Iterations.Add(new() { Id = 1, ProjectId = 1, Name = "I1" }); await _context.SaveChangesAsync();
        _context.Strides.Add(new() { Id = 5, Name = "S1", IterationId = 1, StartDate = DateTime.UtcNow, EndDate = DateTime.UtcNow.AddDays(14) }); await _context.SaveChangesAsync();
        _momentServiceMock.Setup(s => s.GetMomentsByStrideAsync(5)).ReturnsAsync(new List<Moment>());
        _mapperMock.Setup(m => m.Map(It.IsAny<Moment>(), It.IsAny<IMomentService>()))
            .Returns<Moment, IMomentService>((m, _) => new MomentDto { Id = m.Id });

        var result = await _controller.GetAll("o", "p", strideId: 5);

        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_CreateFromDto_Valid_Returns201()
    {
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());
        await SetupHierarchy();
        _momentServiceMock.Setup(s => s.AddAsync(It.IsAny<Moment>())).Returns(Task.CompletedTask);
        _mapperMock.Setup(m => m.Map(It.IsAny<Moment>(), It.IsAny<IMomentService>()))
            .Returns<Moment, IMomentService>((m, _) => new MomentDto { Id = m.Id });

        var request = new CreateMomentRequestDto { FlowId = 40, Type = MomentType.Story, Status = MomentStatus.Todo };
        var result = await _controller.CreateFromDto(request, "o", "p");

        Assert.That(result.Result, Is.InstanceOf<CreatedAtActionResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_CreateFromDto_NullBody_Returns400()
    {
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());

        var result = await _controller.CreateFromDto(null!, "o", "p");

        Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_CreateFromDto_ProjectNotFound_Returns404()
    {
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("bad", "bad")).ReturnsAsync((Project?)null);

        var result = await _controller.CreateFromDto(new CreateMomentRequestDto(), "bad", "bad");

        Assert.That(result.Result, Is.InstanceOf<NotFoundResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_Update_Valid_Returns204()
    {
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());
        await SetupHierarchy();
        _momentServiceMock.Setup(s => s.UpdateAsync(It.IsAny<Moment>())).Returns(Task.CompletedTask);

        var dto = new UpdateMomentRequestDto { Id = 50, Statement = "Updated" };
        var result = await _controller.Update(1, dto, "o", "p");

        Assert.That(result, Is.InstanceOf<NoContentResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_Update_IdMismatch_Returns400()
    {
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());
        await SetupHierarchy();

        var dto = new UpdateMomentRequestDto { Id = 99, Statement = "Bad" };
        var result = await _controller.Update(1, dto, "o", "p");

        Assert.That(result, Is.InstanceOf<BadRequestResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_Update_NullBody_Returns400()
    {
        var result = await _controller.Update(1, null!, "o", "p");

        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_Delete_Valid_Returns204()
    {
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());
        await SetupHierarchy();
        _momentServiceMock.Setup(s => s.DeleteByIdAsync(50)).ReturnsAsync(true);

        var result = await _controller.Delete(1, "o", "p");

        Assert.That(result, Is.InstanceOf<NoContentResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_Delete_NotFound_Returns404()
    {
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());

        var result = await _controller.Delete(999, "o", "p");

        Assert.That(result, Is.InstanceOf<NotFoundResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_AssignMomentToStride_Valid_ReturnsOk()
    {
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());
        await SetupHierarchy();
        var updated = new Moment { Id = 50, Statement = "M1", FlowId = 40, SequenceNumber = 1 };
        _momentServiceMock.Setup(s => s.AssignMomentToStrideAsync(50, 5)).ReturnsAsync(updated);
        _mapperMock.Setup(m => m.Map(It.IsAny<Moment>(), It.IsAny<IMomentService>()))
            .Returns<Moment, IMomentService>((m, _) => new MomentDto { Id = m.Id });

        var result = await _controller.AssignMomentToStride(1, new UpdateMomentStrideAssignmentRequest { StrideId = 5 }, "o", "p");

        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_AssignMomentToStride_NullBody_Returns400()
    {
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());
        await SetupHierarchy();

        var result = await _controller.AssignMomentToStride(1, null!, "o", "p");

        Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_UpdateMomentStatus_Valid_ReturnsOk()
    {
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());
        await SetupHierarchy();
        var updated = new Moment { Id = 50, Statement = "M1", FlowId = 40, SequenceNumber = 1, Status = MomentStatus.InProgress };
        _momentServiceMock.Setup(s => s.UpdateMomentStatusAsync(50, It.IsAny<MomentStatus>())).ReturnsAsync(updated);
        _mapperMock.Setup(m => m.Map(It.IsAny<Moment>(), It.IsAny<IMomentService>()))
            .Returns<Moment, IMomentService>((m, _) => new MomentDto { Id = m.Id });

        var result = await _controller.UpdateMomentStatus(1, new UpdateMomentStatusRequest { NewStatus = MomentStatus.InProgress }, "o", "p");

        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_UpdateMomentStatus_NullBody_Returns400()
    {
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());
        await SetupHierarchy();

        var result = await _controller.UpdateMomentStatus(1, null!, "o", "p");

        Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_UpdateMomentEstimate_Valid_ReturnsOk()
    {
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());
        await SetupHierarchy();
        var updated = new Moment { Id = 50, Statement = "M1", FlowId = 40, SequenceNumber = 1 };
        _momentServiceMock.Setup(s => s.UpdateMomentEstimateAsync(50, It.IsAny<Estimate?>())).ReturnsAsync(updated);
        _mapperMock.Setup(m => m.Map(It.IsAny<Moment>(), It.IsAny<IMomentService>()))
            .Returns<Moment, IMomentService>((m, _) => new MomentDto { Id = m.Id });

        var result = await _controller.UpdateMomentEstimate(1, new UpdateMomentEstimateRequest { Estimate = Estimate.M }, "o", "p");

        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_UpdateMomentEstimate_NullBody_Returns400()
    {
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());
        await SetupHierarchy();

        var result = await _controller.UpdateMomentEstimate(1, null!, "o", "p");

        Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_UpdateMomentType_Valid_ReturnsOk()
    {
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());
        await SetupHierarchy();
        _momentServiceMock.Setup(s => s.UpdateAsync(It.IsAny<Moment>())).Returns(Task.CompletedTask);
        _mapperMock.Setup(m => m.Map(It.IsAny<Moment>(), It.IsAny<IMomentService>()))
            .Returns<Moment, IMomentService>((m, _) => new MomentDto { Id = m.Id });

        var result = await _controller.UpdateMomentType(1, new UpdateMomentTypeRequest { NewType = MomentType.Job }, "o", "p");

        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_UpdateMomentType_NullBody_Returns400()
    {
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());
        await SetupHierarchy();

        var result = await _controller.UpdateMomentType(1, null!, "o", "p");

        Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_UpdateMomentOwner_Valid_ReturnsOk()
    {
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());
        await SetupHierarchy();
        var updated = new Moment { Id = 50, Statement = "M1", FlowId = 40, SequenceNumber = 1, OwnerId = 5 };
        _momentServiceMock.Setup(s => s.AssignOwnerAsync(50, 5)).ReturnsAsync(updated);
        _mapperMock.Setup(m => m.Map(It.IsAny<Moment>(), It.IsAny<IMomentService>()))
            .Returns<Moment, IMomentService>((m, _) => new MomentDto { Id = m.Id });

        var result = await _controller.UpdateMomentOwner(1, new UpdateMomentOwnerRequest { UserId = 5 }, "o", "p");

        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_UpdateMomentOwner_NullBody_Returns400()
    {
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());
        await SetupHierarchy();

        var result = await _controller.UpdateMomentOwner(1, null!, "o", "p");

        Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_UpdateMomentDescription_Valid_ReturnsOk()
    {
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());
        await SetupHierarchy();
        _momentServiceMock.Setup(s => s.UpdateAsync(It.IsAny<Moment>())).Returns(Task.CompletedTask);
        _mapperMock.Setup(m => m.Map(It.IsAny<Moment>(), It.IsAny<IMomentService>()))
            .Returns<Moment, IMomentService>((m, _) => new MomentDto { Id = m.Id });

        var result = await _controller.UpdateMomentDescription(1, new UpdateDescriptionRequestDto { Description = "New desc" }, "o", "p");

        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_UpdateMomentDescription_NullBody_Returns400()
    {
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("o", "p")).ReturnsAsync(Project());
        await SetupHierarchy();

        var result = await _controller.UpdateMomentDescription(1, null!, "o", "p");

        Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
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
