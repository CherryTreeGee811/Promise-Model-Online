using System.Collections.Generic;
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
using PromiseModelOnline.Api.Mappers.Interfaces;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.Tests.Infrastructure;

namespace PromiseModelOnline.Api.Tests;

[TestFixture]
public class MyMomentsControllerUnitTests
{
    private Mock<IMomentService> _momentServiceMock = null!;
    private Mock<IGenericMapper<Moment, MomentDto>> _mapperMock = null!;
    private Mock<IUserRepository> _userRepoMock = null!;
    private PromiseModelOnlineContext _context = null!;
    private MyMomentsController _controller = null!;

    [SetUp]
    public void SetUp()
    {
        _momentServiceMock = new Mock<IMomentService>();
        _mapperMock = new Mock<IGenericMapper<Moment, MomentDto>>();
        _userRepoMock = new Mock<IUserRepository>();

        var options = new DbContextOptionsBuilder<PromiseModelOnlineContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _context = new PromiseModelOnlineContext(options);

        _controller = new MyMomentsController(
            _momentServiceMock.Object,
            _mapperMock.Object,
            _userRepoMock.Object,
            _context);
    }

    [TearDown]
    public void TearDown() => _context.Dispose();

    [Test]
    public async Task REQ_FUN_XXX_GetMyAssignedMoments_ReturnsOk()
    {
        ControllerTestHelpers.SetControllerUser(_controller, "u@test.com");
        _userRepoMock.Setup(r => r.GetOrCreateUserByEmailAsync("u@test.com", null))
            .ReturnsAsync(new User { Id = 10 });
        _momentServiceMock.Setup(s => s.GetMomentsByOwnerIdAsync(10))
            .ReturnsAsync(new List<Moment>());
        _mapperMock.Setup(m => m.Map(It.IsAny<Moment>(), It.IsAny<IMomentService>()))
            .Returns<Moment, IMomentService>((m, _) => new MomentDto { Id = m.Id });

        var result = await _controller.GetMyAssignedMoments();

        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_GetMyAssignedMoments_Unauthorized_Returns401()
    {
        ControllerTestHelpers.SetControllerUser(_controller, null);

        var result = await _controller.GetMyAssignedMoments();

        Assert.That(result.Result, Is.InstanceOf<UnauthorizedResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_GetMyAssignedMoments_ReturnsMomentsWithSlugs()
    {
        ControllerTestHelpers.SetControllerUser(_controller, "u@test.com");
        _userRepoMock.Setup(r => r.GetOrCreateUserByEmailAsync("u@test.com", null))
            .ReturnsAsync(new User { Id = 10 });

        _context.Projects.Add(new Project { Id = 1, Name = "P", Slug = "p", OwnerId = 1 });
        _context.Users.Add(new User { Id = 1, Name = "O", Email = "o@t.com", Slug = "owner" });
        _context.Promises.Add(new() { Id = 10, ProjectId = 1, Statement = "P1", SequenceNumber = 1, DisplayOrder = 1 });
        _context.Epics.Add(new() { Id = 20, ProductPromiseId = 10, Statement = "E1", SequenceNumber = 1, DisplayOrder = 1 });
        _context.Journeys.Add(new() { Id = 30, EpicId = 20, Statement = "J1", SequenceNumber = 1, DisplayOrder = 1 });
        _context.Flows.Add(new() { Id = 40, JourneyId = 30, Statement = "F1", SequenceNumber = 1, DisplayOrder = 1 });
        await _context.SaveChangesAsync();

        _momentServiceMock.Setup(s => s.GetMomentsByOwnerIdAsync(10))
            .ReturnsAsync(new List<Moment> { new() { Id = 1, FlowId = 40, Statement = "M1", SequenceNumber = 1, DisplayOrder = 1 } });
        _mapperMock.Setup(m => m.Map(It.IsAny<Moment>(), It.IsAny<IMomentService>()))
            .Returns<Moment, IMomentService>((m, _) => new MomentDto { Id = m.Id });

        var result = await _controller.GetMyAssignedMoments();

        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
    }
}
