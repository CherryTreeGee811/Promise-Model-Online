using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using NUnit.Framework;
using PromiseModelOnline.Api.DAL;
using PromiseModelOnline.Api.Enums;
using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.Tests
{
    [TestFixture]
    public class PermissionRepositoryUnitTests
    {
        private PromiseModelOnlineContext _context = null!;
        private PermissionRepository _repo = null!;

        [SetUp]
        public void SetUp()
        {
            var options = new DbContextOptionsBuilder<PromiseModelOnlineContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;
            _context = new PromiseModelOnlineContext(options);
            _repo = new PermissionRepository(_context);
        }

        [TearDown]
        public void TearDown()
        {
            _context.Dispose();
        }

        private async Task SeedAsync()
        {
            var user1 = new User { Id = 1, Name = "Alice", Email = "alice@example.com" };
            var user2 = new User { Id = 2, Name = "Bob", Email = "bob@example.com" };
            var project1 = new Project { Id = 10, Name = "Project X", OwnerId = 1 };
            var project2 = new Project { Id = 20, Name = "Project Y", OwnerId = 1 };

            _context.Users.AddRange(user1, user2);
            _context.Projects.AddRange(project1, project2);

            var permissions = new List<Permission>
            {
                new Permission { Id = 1, UserId = 1, ProjectId = 10, Level = PermissionLevel.Edit, Status = PermissionStatus.Active, User = user1 },
                new Permission { Id = 2, UserId = 2, ProjectId = 10, Level = PermissionLevel.View, Status = PermissionStatus.Active, User = user2 },
                new Permission { Id = 3, UserId = 2, ProjectId = 20, Level = PermissionLevel.Comment, Status = PermissionStatus.Pending },
                new Permission { Id = 4, UserId = 1, ProjectId = 20, Level = PermissionLevel.View, Status = PermissionStatus.Active }
            };
            _context.Set<Permission>().AddRange(permissions);
            await _context.SaveChangesAsync();
        }

        [Test]
        public async Task GetPermissionsByProjectAsync_ReturnsPermissionsWithUser()
        {
            await SeedAsync();
            var result = await _repo.GetPermissionsByProjectAsync(10);
            var list = result.ToList();
            Assert.That(list.Count, Is.EqualTo(2));
            Assert.That(list.All(p => p.ProjectId == 10), Is.True);
            Assert.That(list[0].User, Is.Not.Null);
            Assert.That(list[0].User!.Name, Is.EqualTo("Alice"));
        }

        [Test]
        public async Task GetPendingInvitationsForUserAsync_ReturnsPendingWithProject()
        {
            await SeedAsync();
            var result = await _repo.GetPendingInvitationsForUserAsync(2);
            var list = result.ToList();
            Assert.That(list.Count, Is.EqualTo(1));
            Assert.That(list[0].Status, Is.EqualTo(PermissionStatus.Pending));
            Assert.That(list[0].Project, Is.Not.Null);
            Assert.That(list[0].Project!.Name, Is.EqualTo("Project Y"));
        }

        [Test]
        public async Task GetByUserAndProjectAsync_ReturnsMatchingPermission()
        {
            await SeedAsync();
            var perm = await _repo.GetByUserAndProjectAsync(2, 10);
            Assert.That(perm, Is.Not.Null);
            Assert.That(perm!.Level, Is.EqualTo(PermissionLevel.View));
        }

        [Test]
        public async Task GetByUserAndProjectAsync_NoMatch_ReturnsNull()
        {
            await SeedAsync();
            var perm = await _repo.GetByUserAndProjectAsync(99, 10);
            Assert.That(perm, Is.Null);
        }

        [Test]
        public async Task GetProjectIdsForUserAsync_ReturnsDistinctProjectIds()
        {
            await SeedAsync();
            var ids = await _repo.GetProjectIdsForUserAsync(1);
            var list = ids.ToList();
            Assert.That(list.Count, Is.EqualTo(2));
            Assert.That(list, Is.EquivalentTo(new[] { 10, 20 }));
        }

        [Test]
        public async Task GetProjectIdsForUserAsync_UserWithNoPermissions_ReturnsEmpty()
        {
            await SeedAsync();
            var ids = await _repo.GetProjectIdsForUserAsync(99);
            Assert.That(ids, Is.Empty);
        }
    }
}