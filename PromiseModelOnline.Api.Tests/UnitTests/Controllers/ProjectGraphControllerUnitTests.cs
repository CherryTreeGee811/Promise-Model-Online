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
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.Tests.Infrastructure;

namespace PromiseModelOnline.Api.Tests;

[TestFixture]
public class ProjectGraphControllerUnitTests
{
    private Mock<IProjectService> _projectServiceMock = null!;
    private ProjectGraphController _controller = null!;
    private PromiseModelOnlineContext _context = null!;

    [SetUp]
    public void SetUp()
    {
        _projectServiceMock = new Mock<IProjectService>();

        var options = new DbContextOptionsBuilder<PromiseModelOnlineContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _context = new PromiseModelOnlineContext(options);

        _controller = new ProjectGraphController(_projectServiceMock.Object, _context);
    }

    [TearDown]
    public void TearDown() => _context.Dispose();

    [Test]
    public async Task REQ_FUN_XXX_GetGraph_ProjectFound_ReturnsOkResult()
    {
        var owner = new User { Id = 1, Name = "Owner", Email = "o@t.com", Slug = "owner-slug" };
        var project = new Project { Id = 1, Name = "Test", Slug = "test", OwnerId = 1, Owner = owner };
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("owner", "test")).ReturnsAsync(project);

        _context.Users.Add(owner);
        _context.Projects.Add(project);
        await _context.SaveChangesAsync();

        var result = await _controller.GetGraph("owner", "test");

        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
    }

    [Test]
    public async Task REQ_FUN_XXX_GetGraph_ProjectNotFound_Returns404()
    {
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("bad", "bad")).ReturnsAsync((Project?)null);

        var result = await _controller.GetGraph("bad", "bad");

        Assert.That(result.Result, Is.InstanceOf<NotFoundResult>());
    }
}
