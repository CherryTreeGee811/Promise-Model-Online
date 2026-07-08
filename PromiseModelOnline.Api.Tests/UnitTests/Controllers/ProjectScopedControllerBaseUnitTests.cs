using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.Controllers;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Enums;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.Tests.Infrastructure;

namespace PromiseModelOnline.Api.Tests;

public class TestProjectScopedController(IProjectService projectService) : ProjectScopedControllerBase(projectService)
{

    public Task<Project?> PublicResolveProjectAsync(string ownerSlug, string projectSlug)
        => ResolveProjectAsync(ownerSlug, projectSlug);

    public Task<bool> PublicRequireProjectEditPermissionAsync(Project project)
        => RequireProjectEditPermissionAsync(project);
}

[TestFixture]
public class ProjectScopedControllerBaseUnitTests
{
    private Mock<IProjectService> _projectServiceMock = null!;
    private TestProjectScopedController _controller = null!;

    [SetUp]
    public void SetUp()
    {
        _projectServiceMock = new Mock<IProjectService>();
        _controller = new TestProjectScopedController(_projectServiceMock.Object);
    }

    [Test]
    public async Task REQ_FUN_XXX_ResolveProjectAsync_Found_ReturnsProject()
    {
        var project = new Project { Id = 1, Name = "Test", Slug = "test-slug" };
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("owner", "test-slug")).ReturnsAsync(project);

        var result = await _controller.PublicResolveProjectAsync("owner", "test-slug");

        Assert.That(result, Is.Not.Null);
        Assert.That(result!.Id, Is.EqualTo(1));
    }

    [Test]
    public async Task REQ_FUN_XXX_ResolveProjectAsync_NotFound_ReturnsNull()
    {
        _projectServiceMock.Setup(s => s.GetByOwnerAndSlugAsync("bad", "bad")).ReturnsAsync((Project?)null);

        var result = await _controller.PublicResolveProjectAsync("bad", "bad");

        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task REQ_FUN_XXX_RequireProjectEditPermissionAsync_EditPermission_ReturnsTrue()
    {
        var userRepoMock = new Mock<IUserRepository>();
        var permServiceMock = new Mock<IPermissionService>();

        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.Email, "admin@test.com"),
            new Claim("nameid", "admin-123"),
        }, "test"));

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = user }
        };
        _controller.ControllerContext.HttpContext.RequestServices = CreateServiceProvider(
            (typeof(IPermissionService), permServiceMock.Object),
            (typeof(IUserRepository), userRepoMock.Object));

        userRepoMock.Setup(r => r.GetOrCreateUserByEmailAsync("admin@test.com", "admin-123"))
            .ReturnsAsync(new User { Id = 10 });
        permServiceMock.Setup(s => s.GetUserPermissionAsync(10, 1))
            .ReturnsAsync(PermissionLevel.Edit);

        var result = await _controller.PublicRequireProjectEditPermissionAsync(
            new Project { Id = 1 });

        Assert.That(result, Is.True);
    }

    [Test]
    public async Task REQ_FUN_XXX_RequireProjectEditPermissionAsync_ViewPermission_ReturnsFalse()
    {
        var userRepoMock = new Mock<IUserRepository>();
        var permServiceMock = new Mock<IPermissionService>();

        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.Email, "viewer@test.com"),
        }, "test"));

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = user }
        };
        _controller.ControllerContext.HttpContext.RequestServices = CreateServiceProvider(
            (typeof(IPermissionService), permServiceMock.Object),
            (typeof(IUserRepository), userRepoMock.Object));

        userRepoMock.Setup(r => r.GetOrCreateUserByEmailAsync("viewer@test.com", null))
            .ReturnsAsync(new User { Id = 20 });
        permServiceMock.Setup(s => s.GetUserPermissionAsync(20, 2))
            .ReturnsAsync(PermissionLevel.View);

        var result = await _controller.PublicRequireProjectEditPermissionAsync(
            new Project { Id = 2 });

        Assert.That(result, Is.False);
    }

    [Test]
    public async Task REQ_FUN_XXX_RequireProjectEditPermissionAsync_NoEmail_ReturnsFalse()
    {
        var user = new ClaimsPrincipal(new ClaimsIdentity("test"));

        var userRepoMock = new Mock<IUserRepository>();
        var permServiceMock = new Mock<IPermissionService>();

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = user }
        };
        _controller.ControllerContext.HttpContext.RequestServices = CreateServiceProvider(
            (typeof(IPermissionService), permServiceMock.Object),
            (typeof(IUserRepository), userRepoMock.Object));

        var result = await _controller.PublicRequireProjectEditPermissionAsync(
            new Project { Id = 1 });

        Assert.That(result, Is.False);
    }

    private static IServiceProvider CreateServiceProvider(params (Type type, object service)[] services)
    {
        var dict = new System.Collections.Generic.Dictionary<Type, object>();
        foreach (var (type, service) in services)
        {
            dict[type] = service;
        }
        return new MockServiceProvider(dict);
    }

    private sealed class MockServiceProvider(System.Collections.Generic.Dictionary<Type, object> services) : IServiceProvider
    {
        public object? GetService(Type serviceType) =>
            services.TryGetValue(serviceType, out var service) ? service : null;
    }
}
