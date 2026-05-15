using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Moq;
using NUnit.Framework;
using PromiseModelOnline.Api.BusinessLogic;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Enums;
using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.Tests
{
    [TestFixture]
    public class ProjectServiceUnitTests
    {
        private Mock<IProjectRepository> _projectRepoMock = null!;
        private Mock<IPermissionRepository> _permissionRepoMock = null!;
        private Mock<IUserRepository> _userRepoMock = null!;
        private ProjectService _service = null!;

        [SetUp]
        public void SetUp()
        {
            _projectRepoMock = new Mock<IProjectRepository>();
            _permissionRepoMock = new Mock<IPermissionRepository>();
            _userRepoMock = new Mock<IUserRepository>();
            _service = new ProjectService(
                _projectRepoMock.Object,
                _permissionRepoMock.Object,
                _userRepoMock.Object);
        }

        #region GetAccessibleProjectsAsync

        [Test]
        public async Task GetAccessibleProjectsAsync_OnlyOwnedProjects_ReturnsThem()
        {
            // Arrange
            var owned = new List<Project>
            {
                new Project { Id = 1, Name = "P1", OwnerId = 100 },
                new Project { Id = 2, Name = "P2", OwnerId = 100 }
            };
            _projectRepoMock.Setup(r => r.GetProjectsOwnedByUserAsync(100)).ReturnsAsync(owned);
            _permissionRepoMock.Setup(r => r.GetProjectIdsForUserAsync(100)).ReturnsAsync(new List<int>());

            // Act
            var result = await _service.GetAccessibleProjectsAsync(100);

            // Assert
            Assert.That(result.Count(), Is.EqualTo(2));
            Assert.That(result.All(p => p.OwnerId == 100), Is.True);
        }

        [Test]
        public async Task GetAccessibleProjectsAsync_OnlySharedProjects_ReturnsThem()
        {
            // Arrange
            _projectRepoMock.Setup(r => r.GetProjectsOwnedByUserAsync(200)).ReturnsAsync(new List<Project>());
            _permissionRepoMock.Setup(r => r.GetProjectIdsForUserAsync(200)).ReturnsAsync(new List<int> { 10, 20 });

            var p10 = new Project { Id = 10, Name = "Shared1" };
            var p20 = new Project { Id = 20, Name = "Shared2" };
            _projectRepoMock.Setup(r => r.GetByIdAsync(10)).ReturnsAsync(p10);
            _projectRepoMock.Setup(r => r.GetByIdAsync(20)).ReturnsAsync(p20);

            // Act
            var result = await _service.GetAccessibleProjectsAsync(200);

            // Assert
            Assert.That(result.Count(), Is.EqualTo(2));
            Assert.That(result.Any(p => p.Id == 10), Is.True);
            Assert.That(result.Any(p => p.Id == 20), Is.True);
        }

        [Test]
        public async Task GetAccessibleProjectsAsync_SharedProjectNotFound_SkipsIt()
        {
            // Arrange
            _projectRepoMock.Setup(r => r.GetProjectsOwnedByUserAsync(300)).ReturnsAsync(new List<Project>());
            _permissionRepoMock.Setup(r => r.GetProjectIdsForUserAsync(300)).ReturnsAsync(new List<int> { 99, 100 });

            _projectRepoMock.Setup(r => r.GetByIdAsync(99)).ReturnsAsync((Project?)null);
            _projectRepoMock.Setup(r => r.GetByIdAsync(100)).ReturnsAsync(new Project { Id = 100 });

            // Act
            var result = await _service.GetAccessibleProjectsAsync(300);

            // Assert
            Assert.That(result.Count(), Is.EqualTo(1));
            Assert.That(result.First().Id, Is.EqualTo(100));
        }

        [Test]
        public async Task GetAccessibleProjectsAsync_DuplicateOwnedAndShared_ReturnsSingleProject()
        {
            // Arrange: project 1 is both owned and shared
            var owned = new List<Project> { new Project { Id = 1, Name = "P1", OwnerId = 400 } };
            _projectRepoMock.Setup(r => r.GetProjectsOwnedByUserAsync(400)).ReturnsAsync(owned);
            _permissionRepoMock.Setup(r => r.GetProjectIdsForUserAsync(400)).ReturnsAsync(new List<int> { 1 });
            _projectRepoMock.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(new Project { Id = 1, Name = "P1" });

            // Act
            var result = await _service.GetAccessibleProjectsAsync(400);

            // Assert
            Assert.That(result.Count(), Is.EqualTo(1));
        }

        [Test]
        public async Task GetAccessibleProjectsAsync_NoAccessibleProjects_ReturnsEmpty()
        {
            _projectRepoMock.Setup(r => r.GetProjectsOwnedByUserAsync(500)).ReturnsAsync(new List<Project>());
            _permissionRepoMock.Setup(r => r.GetProjectIdsForUserAsync(500)).ReturnsAsync(new List<int>());

            var result = await _service.GetAccessibleProjectsAsync(500);

            Assert.That(result, Is.Empty);
        }

        #endregion

        #region GetProjectMembersAsync

        [Test]
        public void GetProjectMembersAsync_ProjectNotFound_Throws()
        {
            _projectRepoMock.Setup(r => r.GetByIdAsync(999)).ReturnsAsync((Project?)null);

            Assert.ThrowsAsync<InvalidOperationException>(() => _service.GetProjectMembersAsync(999));
        }

        [Test]
        public async Task GetProjectMembersAsync_OnlyOwner_ReturnsOwnerMember()
        {
            // Arrange
            var project = new Project { Id = 10, OwnerId = 1 };
            var ownerUser = new User { Id = 1, Name = "Owner", Email = "owner@test.com" };

            _projectRepoMock.Setup(r => r.GetByIdAsync(10)).ReturnsAsync(project);
            _userRepoMock.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(ownerUser);
            _permissionRepoMock.Setup(r => r.GetPermissionsByProjectAsync(10)).ReturnsAsync(new List<Permission>());

            // Act
            var result = await _service.GetProjectMembersAsync(10);
            var members = result.ToList();

            // Assert
            Assert.That(members.Count, Is.EqualTo(1));
            Assert.That(members[0].UserId, Is.EqualTo(1));
            Assert.That(members[0].UserName, Is.EqualTo("Owner"));
        }

        [Test]
        public async Task GetProjectMembersAsync_OwnerUserNotFound_SkipsOwner()
        {
            // Arrange
            var project = new Project { Id = 10, OwnerId = 99 };
            _projectRepoMock.Setup(r => r.GetByIdAsync(10)).ReturnsAsync(project);
            _userRepoMock.Setup(r => r.GetByIdAsync(99)).ReturnsAsync((User?)null);
            _permissionRepoMock.Setup(r => r.GetPermissionsByProjectAsync(10)).ReturnsAsync(new List<Permission>());

            // Act
            var result = await _service.GetProjectMembersAsync(10);
            var members = result.ToList();

            // Assert
            Assert.That(members.Count, Is.EqualTo(0));
        }

        [Test]
        public async Task GetProjectMembersAsync_WithActivePermissions_ReturnsMembersExcludingOwnerDuplication()
        {
            // Arrange
            var project = new Project { Id = 20, OwnerId = 5 };
            var owner = new User { Id = 5, Name = "Owner5", Email = "o5@test.com" };
            var user2 = new User { Id = 6, Name = "User6", Email = "u6@test.com" };

            _projectRepoMock.Setup(r => r.GetByIdAsync(20)).ReturnsAsync(project);
            _userRepoMock.Setup(r => r.GetByIdAsync(5)).ReturnsAsync(owner);
            _userRepoMock.Setup(r => r.GetByIdAsync(6)).ReturnsAsync(user2);

            var permissions = new List<Permission>
            {
                new Permission { UserId = 5, ProjectId = 20, Level = PermissionLevel.Edit, Status = PermissionStatus.Active }, // owner, should be ignored by deduplication
                new Permission { UserId = 6, ProjectId = 20, Level = PermissionLevel.View, Status = PermissionStatus.Active }
            };
            _permissionRepoMock.Setup(r => r.GetPermissionsByProjectAsync(20)).ReturnsAsync(permissions);

            // Act
            var result = await _service.GetProjectMembersAsync(20);
            var members = result.ToList();

            // Assert
            Assert.That(members.Count, Is.EqualTo(2)); // owner and user6
            Assert.That(members.Any(m => m.UserId == 5), Is.True);
            Assert.That(members.Any(m => m.UserId == 6), Is.True);
        }

        [Test]
        public async Task GetProjectMembersAsync_PendingPermissions_NotIncluded()
        {
            var project = new Project { Id = 30, OwnerId = 10 };
            var owner = new User { Id = 10, Name = "Owner10" };

            _projectRepoMock.Setup(r => r.GetByIdAsync(30)).ReturnsAsync(project);
            _userRepoMock.Setup(r => r.GetByIdAsync(10)).ReturnsAsync(owner);
            _permissionRepoMock.Setup(r => r.GetPermissionsByProjectAsync(30))
                .ReturnsAsync(new List<Permission>
                {
                    new Permission { UserId = 20, ProjectId = 30, Level = PermissionLevel.Comment, Status = PermissionStatus.Pending }
                });

            var result = await _service.GetProjectMembersAsync(30);
            var members = result.ToList();

            Assert.That(members.Count, Is.EqualTo(1));
            Assert.That(members[0].UserId, Is.EqualTo(10));
        }

        [Test]
        public async Task GetProjectMembersAsync_PermissionUserNotFound_SkipsThatPermission()
        {
            var project = new Project { Id = 40, OwnerId = 99 };
            var owner = new User { Id = 99, Name = "Owner99" };
            _projectRepoMock.Setup(r => r.GetByIdAsync(40)).ReturnsAsync(project);
            _userRepoMock.Setup(r => r.GetByIdAsync(99)).ReturnsAsync(owner);
            _userRepoMock.Setup(r => r.GetByIdAsync(200)).ReturnsAsync((User?)null); // user not found
            _permissionRepoMock.Setup(r => r.GetPermissionsByProjectAsync(40))
                .ReturnsAsync(new List<Permission>
                {
                    new Permission { UserId = 200, ProjectId = 40, Level = PermissionLevel.View, Status = PermissionStatus.Active }
                });

            var result = await _service.GetProjectMembersAsync(40);
            var members = result.ToList();

            Assert.That(members.Count, Is.EqualTo(1));
            Assert.That(members[0].UserId, Is.EqualTo(99));
        }

        #endregion
    }
}