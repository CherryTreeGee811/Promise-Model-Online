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
/// <summary>Unit tests for <see cref="UserRepository"/> covering lookup, auto-provisioning, and search.</summary>
// Requirements: REQ_FUN_001 REQ_FUN_002
public class UserRepositoryUnitTests : RepositoryTestBase
{
    private UserRepository _repo = null!;

    [SetUp]
    public void SetUp() => _repo = new UserRepository(Context);

    [Test]
    public async Task REQ_FUN_001_GetUsersByNameAsync_ReturnsMatchingUsers()
    {
        // Arrange
        Context.Users.AddRange(
            new User { Id = 1, Name = "Alice", Email = "alice@example.com" },
            new User { Id = 2, Name = "Bob", Email = "bob@example.com" },
            new User { Id = 3, Name = "Alice", Email = "alice2@example.com" }
        );
        await Context.SaveChangesAsync();

        // Act
        var result = await _repo.GetUsersByNameAsync("Alice");
        var list = result.ToList();

        // Assert
        Assert.That(list.Count, Is.EqualTo(2));
        Assert.That(list.All(u => u.Name == "Alice"), Is.True);
        Assert.That(list.Select(u => u.Id), Is.EquivalentTo(new[] { 1, 3 }));
    }

    [Test]
    public async Task REQ_FUN_001_GetUsersByNameAsync_NoMatch_ReturnsEmpty()
    {
        // Arrange
        Context.Users.Add(new User { Name = "Charlie", Email = "charlie@example.com" });
        await Context.SaveChangesAsync();

        // Act
        var result = await _repo.GetUsersByNameAsync("Nobody");

        // Assert
        Assert.That(result, Is.Empty);
    }

    [Test]
    public async Task REQ_FUN_001_FindByEmailAsync_ReturnsMatchingUsers()
    {
        // Arrange
        Context.Users.AddRange(
            new User { Id = 1, Email = "alice@example.com", Name = "Alice" },
            new User { Id = 2, Email = "bob@example.com", Name = "Bob" }
        );
        await Context.SaveChangesAsync();

        // Act
        var result = await _repo.FindByEmailAsync("alice@example.com");
        var list = result.ToList();

        // Assert
        Assert.That(list.Count, Is.EqualTo(1));
        Assert.That(list[0].Id, Is.EqualTo(1));
    }

    [Test]
    public async Task REQ_FUN_001_FindByEmailAsync_NoMatch_ReturnsEmpty()
    {
        // Act
        var result = await _repo.FindByEmailAsync("nobody@example.com");

        // Assert
        Assert.That(result, Is.Empty);
    }

    [Test]
    public async Task REQ_FUN_001_GetOrCreateUserByEmailAsync_UserDoesNotExist_CreatesWithUsername()
    {
        // Act
        var user = await _repo.GetOrCreateUserByEmailAsync("test@example.com", "testuser");

        // Assert
        Assert.That(user.Email, Is.EqualTo("test@example.com"));
        Assert.That(user.Name, Is.EqualTo("testuser"));
        Assert.That(user.Role, Is.EqualTo(UserRole.Professional));
        Assert.That(user.CreatedAt, Is.Not.EqualTo(default(DateTime)));

        var saved = await Context.Users.FirstOrDefaultAsync(u => u.Email == "test@example.com");
        Assert.That(saved, Is.Not.Null);
    }

    [Test]
    public async Task REQ_FUN_001_GetOrCreateUserByEmailAsync_UserDoesNotExist_NoUsername_UsesEmailPrefix()
    {
        // Act
        var user = await _repo.GetOrCreateUserByEmailAsync("john.doe@example.com");

        // Assert
        Assert.That(user.Name, Is.EqualTo("john.doe"));
    }

    [Test]
    public async Task REQ_FUN_001_GetOrCreateUserByEmailAsync_UserDoesNotExist_EmailWithoutAt_UsesEmailAsName()
    {
        // Act
        var user = await _repo.GetOrCreateUserByEmailAsync("invalid-email");

        // Assert
        Assert.That(user.Name, Is.EqualTo("invalid-email"));
    }

    [Test]
    public async Task REQ_FUN_001_GetOrCreateUserByEmailAsync_UserExists_NameIsEmail_GivenRealUsername_UpdatesName()
    {
        // Arrange
        var existing = new User
        {
            Email = "old@example.com",
            Name = "old@example.com",
            Role = UserRole.Student,
            CreatedAt = DateTime.UtcNow.AddDays(-1)
        };
        Context.Users.Add(existing);
        await Context.SaveChangesAsync();

        // Act
        var user = await _repo.GetOrCreateUserByEmailAsync("old@example.com", "newalias");

        // Assert
        Assert.That(user.Id, Is.EqualTo(existing.Id));
        Assert.That(user.Name, Is.EqualTo("newalias"));

        var saved = await Context.Users.FindAsync(existing.Id);
        Assert.That(saved!.Name, Is.EqualTo("newalias"));
    }

    [Test]
    public async Task REQ_FUN_001_GetOrCreateUserByEmailAsync_UserExists_NameAlreadySet_DoesNotOverwrite()
    {
        // Arrange
        var existing = new User
        {
            Email = "keep@example.com",
            Name = "KeepMe",
            Role = UserRole.Professional,
            CreatedAt = DateTime.UtcNow
        };
        Context.Users.Add(existing);
        await Context.SaveChangesAsync();

        // Act
        var user = await _repo.GetOrCreateUserByEmailAsync("keep@example.com", "ignoreme");

        // Assert
        Assert.That(user.Name, Is.EqualTo("KeepMe"));

        var saved = await Context.Users.FindAsync(existing.Id);
        Assert.That(saved!.Name, Is.EqualTo("KeepMe"));
    }

    [Test]
    public async Task REQ_FUN_001_GetOrCreateUserByEmailAsync_UserExists_NullUsername_NoChange()
    {
        // Arrange
        var existing = new User
        {
            Email = "nulluser@example.com",
            Name = "nulluser@example.com",
            CreatedAt = DateTime.UtcNow
        };
        Context.Users.Add(existing);
        await Context.SaveChangesAsync();

        // Act
        var user = await _repo.GetOrCreateUserByEmailAsync("nulluser@example.com", null);

        // Assert
        Assert.That(user.Name, Is.EqualTo("nulluser@example.com"));
    }

    [Test]
    public async Task REQ_FUN_001_GetByIdAsync_ReturnsEntity()
    {
        // Arrange
        var user = new User { Id = 42, Name = "Test", Email = "test@example.com" };
        Context.Users.Add(user);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repo.GetByIdAsync(42);

        // Assert
        Assert.That(result!.Name, Is.EqualTo("Test"));
    }

    [Test]
    public async Task REQ_FUN_001_AddAsync_PersistsEntity()
    {
        // Arrange
        var user = new User { Name = "New", Email = "new@example.com", Role = UserRole.Student };

        // Act
        await _repo.AddAsync(user);
        await Context.SaveChangesAsync();

        // Assert
        var saved = Context.Users.FirstOrDefault(u => u.Email == "new@example.com");
        Assert.That(saved, Is.Not.Null);
        Assert.That(saved!.Role, Is.EqualTo(UserRole.Student));
    }

    #region SearchUsersByProjectAsync

    [Test]
    public async Task REQ_FUN_001_SearchUsersByProjectAsync_ReturnsMatchingUsers()
    {
        var owner = new User { Id = 1, Name = "Alice", Email = "alice@example.com" };
        var userB = new User { Id = 2, Name = "Bob", Email = "bob@example.com" };
        var userC = new User { Id = 3, Name = "Charlie", Email = "charlie@example.com" };
        Context.Users.AddRange(owner, userB, userC);

        var project = new Project { Id = 1, Name = "Proj", OwnerId = 1 };
        project.Permissions = new List<Permission>
            {
                new Permission { UserId = 2, Level = PermissionLevel.Edit, Status = PermissionStatus.Active },
                new Permission { UserId = 3, Level = PermissionLevel.View, Status = PermissionStatus.Active },
            };
        Context.Projects.Add(project);
        await Context.SaveChangesAsync();

        var result = await _repo.SearchUsersByProjectAsync(1, "a", 5);
        var list = result.ToList();

        Assert.That(list.Count, Is.EqualTo(2));
        Assert.That(list.Any(u => u.Name == "Alice"), Is.True);
        Assert.That(list.Any(u => u.Name == "Charlie"), Is.True);
    }

    [Test]
    public async Task REQ_FUN_001_SearchUsersByProjectAsync_IncludesProjectOwner()
    {
        var owner = new User { Id = 5, Name = "Owner", Email = "owner@example.com" };
        Context.Users.Add(owner);

        var project = new Project { Id = 10, Name = "Proj", OwnerId = 5 };
        Context.Projects.Add(project);
        await Context.SaveChangesAsync();

        var result = await _repo.SearchUsersByProjectAsync(10, "own", 5);
        var list = result.ToList();

        Assert.That(list.Count, Is.EqualTo(1));
        Assert.That(list[0].Name, Is.EqualTo("Owner"));
    }

    [Test]
    public async Task REQ_FUN_001_SearchUsersByProjectAsync_ExcludesPendingPermissions()
    {
        var user = new User { Id = 1, Name = "PendingUser", Email = "pending@example.com" };
        Context.Users.Add(user);

        var project = new Project { Id = 1, Name = "Proj", OwnerId = 99 };
        project.Permissions = new List<Permission>
            {
                new Permission { UserId = 1, Level = PermissionLevel.View, Status = PermissionStatus.Pending }
            };
        Context.Projects.Add(project);
        await Context.SaveChangesAsync();

        var result = await _repo.SearchUsersByProjectAsync(1, "pending", 5);
        Assert.That(result, Is.Empty);
    }

    [Test]
    public async Task REQ_FUN_001_SearchUsersByProjectAsync_NameContainsSearch()
    {
        var userA = new User { Id = 1, Name = "John", Email = "john@example.com" };
        var userB = new User { Id = 2, Name = "Johnny", Email = "johnny@example.com" };
        Context.Users.AddRange(userA, userB);

        var project = new Project { Id = 1, Name = "Proj", OwnerId = 1 };
        project.Permissions = new List<Permission>
            {
                new Permission { UserId = 2, Level = PermissionLevel.View, Status = PermissionStatus.Active }
            };
        Context.Projects.Add(project);
        await Context.SaveChangesAsync();

        var result = await _repo.SearchUsersByProjectAsync(1, "john", 5);
        var list = result.ToList();

        Assert.That(list.Count, Is.EqualTo(2));
    }

    [Test]
    public async Task REQ_FUN_001_SearchUsersByProjectAsync_NoMatch_ReturnsEmpty()
    {
        var owner = new User { Id = 1, Name = "Alice", Email = "alice@example.com" };
        Context.Users.Add(owner);
        Context.Projects.Add(new Project { Id = 1, Name = "Proj", OwnerId = 1 });
        await Context.SaveChangesAsync();

        var result = await _repo.SearchUsersByProjectAsync(1, "nonexistent", 5);
        Assert.That(result, Is.Empty);
    }

    [Test]
    public async Task REQ_FUN_001_SearchUsersByProjectAsync_EmptySearch_ReturnsEmpty()
    {
        var result = await _repo.SearchUsersByProjectAsync(1, "", 5);
        Assert.That(result, Is.Empty);
    }

    [Test]
    public async Task REQ_FUN_001_SearchUsersByProjectAsync_RespectsMaxResults()
    {
        var project = new Project { Id = 1, Name = "Proj", OwnerId = 1 };
        project.Permissions = new List<Permission>();
        for (var i = 2; i <= 10; i++)
        {
            project.Permissions.Add(new Permission
            {
                UserId = i,
                Level = PermissionLevel.View,
                Status = PermissionStatus.Active
            });
        }
        Context.Projects.Add(project);

        var users = new List<User>();
        for (var i = 2; i <= 10; i++)
        {
            users.Add(new User { Id = i, Name = "User" + i, Email = "user" + i + "@example.com" });
        }
        Context.Users.AddRange(users);
        await Context.SaveChangesAsync();

        var result = await _repo.SearchUsersByProjectAsync(1, "user", 3);
        Assert.That(result.Count(), Is.EqualTo(3));
    }

    #endregion

    #region SearchUsersAsync

    [Test]
    public async Task REQ_FUN_001_SearchUsersAsync_MatchesByName()
    {
        Context.Users.AddRange(
            new User { Id = 1, Name = "Alice", Email = "alice@example.com" },
            new User { Id = 2, Name = "Bob", Email = "bob@example.com" }
        );
        await Context.SaveChangesAsync();

        var result = await _repo.SearchUsersAsync("ali", 10);
        var list = result.ToList();

        Assert.That(list.Count, Is.EqualTo(1));
        Assert.That(list[0].Name, Is.EqualTo("Alice"));
    }

    [Test]
    public async Task REQ_FUN_001_SearchUsersAsync_MatchesByEmail()
    {
        Context.Users.AddRange(
            new User { Id = 1, Name = "Alice", Email = "alice@example.com" },
            new User { Id = 2, Name = "Bob", Email = "bob@example.com" }
        );
        await Context.SaveChangesAsync();

        var result = await _repo.SearchUsersAsync("bob@example", 10);
        var list = result.ToList();

        Assert.That(list.Count, Is.EqualTo(1));
        Assert.That(list[0].Name, Is.EqualTo("Bob"));
    }

    [Test]
    public async Task REQ_FUN_001_SearchUsersAsync_MatchesNameOrEmail()
    {
        Context.Users.AddRange(
            new User { Id = 1, Name = "Alice", Email = "alice@example.com" },
            new User { Id = 2, Name = "Charlie", Email = "charlie@test.com" },
            new User { Id = 3, Name = "Bob", Email = "bob@example.com" }
        );
        await Context.SaveChangesAsync();

        var result = await _repo.SearchUsersAsync("charlie", 10);
        var list = result.ToList();

        Assert.That(list.Count, Is.EqualTo(1));
        Assert.That(list[0].Email, Is.EqualTo("charlie@test.com"));
    }

    [Test]
    public async Task REQ_FUN_001_SearchUsersAsync_NoMatch_ReturnsEmpty()
    {
        Context.Users.Add(new User { Name = "Alice", Email = "alice@example.com" });
        await Context.SaveChangesAsync();

        var result = await _repo.SearchUsersAsync("nonexistent", 10);
        Assert.That(result, Is.Empty);
    }

    [Test]
    public async Task REQ_FUN_001_SearchUsersAsync_EmptySearch_ReturnsEmpty()
    {
        var result = await _repo.SearchUsersAsync("", 10);
        Assert.That(result, Is.Empty);
    }

    [Test]
    public async Task REQ_FUN_001_SearchUsersAsync_RespectsMaxResults()
    {
        for (var i = 1; i <= 10; i++)
        {
            Context.Users.Add(new User { Id = i, Name = "User" + i, Email = "user" + i + "@example.com" });
        }
        await Context.SaveChangesAsync();

        var result = await _repo.SearchUsersAsync("user", 3);
        Assert.That(result.Count(), Is.EqualTo(3));
    }

    [Test]
    public async Task REQ_FUN_001_SearchUsersAsync_CaseInsensitive()
    {
        Context.Users.Add(new User { Id = 1, Name = "Alice", Email = "alice@EXAMPLE.com" });
        await Context.SaveChangesAsync();

        var result = await _repo.SearchUsersAsync("ALICE", 10);
        Assert.That(result.Count(), Is.EqualTo(1));
    }

    #endregion
}
