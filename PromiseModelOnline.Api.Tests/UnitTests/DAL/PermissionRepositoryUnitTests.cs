using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using NUnit.Framework;
using PromiseModelOnline.Api.DAL;
using PromiseModelOnline.Api.Enums;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.Tests.Infrastructure;

namespace PromiseModelOnline.Api.Tests;

[TestFixture]
/// <summary>Unit tests for <see cref="PermissionRepository"/> covering permission queries.</summary>
// Requirements: REQ_FUN_013
public class PermissionRepositoryUnitTests : RepositoryTestBase
{
    private PermissionRepository _repo = null!;

    [SetUp]
    public void SetUp()
    {
        _repo = new PermissionRepository(Context);
    }

    private async Task SeedAsync()
    {
        var user1 = new User { Id = 1, Name = "Alice", Email = "alice@example.com" };
        var user2 = new User { Id = 2, Name = "Bob", Email = "bob@example.com" };
        var project1 = new Project { Id = 10, Name = "Project X", OwnerId = 1 };
        var project2 = new Project { Id = 20, Name = "Project Y", OwnerId = 1 };

        Context.Users.AddRange(user1, user2);
        Context.Projects.AddRange(project1, project2);

        var permissions = new List<Permission>
            {
                new Permission { Id = 1, UserId = 1, ProjectId = 10, Level = PermissionLevel.Edit, Status = PermissionStatus.Active, User = user1 },
                new Permission { Id = 2, UserId = 2, ProjectId = 10, Level = PermissionLevel.View, Status = PermissionStatus.Active, User = user2 },
                new Permission { Id = 3, UserId = 2, ProjectId = 20, Level = PermissionLevel.Comment, Status = PermissionStatus.Pending },
                new Permission { Id = 4, UserId = 1, ProjectId = 20, Level = PermissionLevel.View, Status = PermissionStatus.Active }
            };
        Context.Set<Permission>().AddRange(permissions);
        await Context.SaveChangesAsync();
    }

    [Test]
    public async Task REQ_FUN_013_GetPermissionsByProjectAsync_ReturnsPermissionsWithUser()
    {
        // Arrange
        await SeedAsync();
        // Act
        var result = await _repo.GetPermissionsByProjectAsync(10);
        var list = result.ToList();
        // Assert
        Assert.That(list.Count, Is.EqualTo(2));
        Assert.That(list.All(p => p.ProjectId == 10), Is.True);
        Assert.That(list[0].User, Is.Not.Null);
        Assert.That(list[0].User!.Name, Is.EqualTo("Alice"));
    }

    [Test]
    public async Task REQ_FUN_013_GetPendingInvitationsForUserAsync_ReturnsPendingWithProject()
    {
        // Arrange
        await SeedAsync();
        // Act
        var result = await _repo.GetPendingInvitationsForUserAsync(2);
        var list = result.ToList();
        // Assert
        Assert.That(list.Count, Is.EqualTo(1));
        Assert.That(list[0].Status, Is.EqualTo(PermissionStatus.Pending));
        Assert.That(list[0].Project, Is.Not.Null);
        Assert.That(list[0].Project!.Name, Is.EqualTo("Project Y"));
    }

    [Test]
    public async Task REQ_FUN_013_GetByUserAndProjectAsync_ReturnsMatchingPermission()
    {
        // Arrange
        await SeedAsync();
        // Act
        var perm = await _repo.GetByUserAndProjectAsync(2, 10);
        // Assert
        Assert.That(perm, Is.Not.Null);
        Assert.That(perm!.Level, Is.EqualTo(PermissionLevel.View));
    }

    [Test]
    public async Task REQ_FUN_013_GetByUserAndProjectAsync_NoMatch_ReturnsNull()
    {
        // Arrange
        await SeedAsync();
        // Act
        var perm = await _repo.GetByUserAndProjectAsync(99, 10);
        // Assert
        Assert.That(perm, Is.Null);
    }

    [Test]
    public async Task REQ_FUN_013_GetProjectIdsForUserAsync_ReturnsDistinctActiveProjectIds()
    {
        // Arrange
        await SeedAsync();
        // Act
        var ids = await _repo.GetProjectIdsForUserAsync(1);
        var list = ids.ToList();
        // Assert
        Assert.That(list.Count, Is.EqualTo(2));
        Assert.That(list, Is.EquivalentTo(new[] { 10, 20 }));
    }

    [Test]
    public async Task REQ_FUN_013_GetProjectIdsForUserAsync_ExcludesPendingPermissions()
    {
        // Arrange
        await SeedAsync();
        // Act
        var ids = await _repo.GetProjectIdsForUserAsync(2);
        var list = ids.ToList();
        // Assert
        Assert.That(list.Count, Is.EqualTo(1));
        Assert.That(list, Is.EquivalentTo(new[] { 10 }));
    }

    [Test]
    public async Task REQ_FUN_013_GetProjectIdsForUserAsync_UserWithNoPermissions_ReturnsEmpty()
    {
        // Arrange
        await SeedAsync();
        // Act
        var ids = await _repo.GetProjectIdsForUserAsync(99);
        // Assert
        Assert.That(ids, Is.Empty);
    }
}
