using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using PromiseModelOnline.Api.Tests.Infrastructure;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.Controllers;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Mappers.Interfaces;
using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.Tests
{
    /// <summary>Unit tests for <see cref="UserProjectsController"/> covering project CRUD.</summary>
// Requirements: REQ_FUN_003 REQ_FUN_039 REQ_FUN_040
    public class ProjectsControllerTests
    {
        private Mock<IProjectService> _mockProjectService = null!;
        private Mock<IGenericMapper<Project, ProjectDto>> _mockMapper = null!;
        private Mock<IUserRepository> _mockUserRepo = null!;
        private Mock<IProjectImportService> _mockProjectImportService = null!;
        private Mock<IProjectImportValidationService> _mockProjectImportValidationService = null!;
        private Mock<IGenericService<Project>> _mockGenericService = null!;
        private UserProjectsController _controller = null!;

        [SetUp]
        public void SetUp()
        {
            _mockProjectService = new Mock<IProjectService>();
            _mockMapper = new Mock<IGenericMapper<Project, ProjectDto>>();
            _mockUserRepo = new Mock<IUserRepository>();
            _mockProjectImportService = new Mock<IProjectImportService>();
            _mockProjectImportValidationService = new Mock<IProjectImportValidationService>();
            _mockGenericService = new Mock<IGenericService<Project>>();
            _controller = new UserProjectsController(
                _mockProjectService.Object,
                _mockUserRepo.Object,
                _mockMapper.Object,
                _mockGenericService.Object,
                _mockProjectImportService.Object,
                _mockProjectImportValidationService.Object);
        }

        [Test]
        public async Task REQ_FUN_003_GetAll_WithAuthenticatedUser_ReturnsOkMappedDtos()
        {
            // Arrange
            var user = new User { Id = 1, Email = "a@b.com", Slug = "test" };
            _mockUserRepo.Setup(r => r.GetOrCreateUserByEmailAsync("a@b.com", It.IsAny<string?>())).ReturnsAsync(user);

            var projects = new List<Project> {
                new Project { Id = 11, Name = "P1", Slug = "p1", Owner = user },
                new Project { Id = 12, Name = "P2", Slug = "p2", Owner = user }
            };
            _mockProjectService.Setup(s => s.GetAccessibleProjectsAsync(user.Id)).ReturnsAsync(projects);

            _mockMapper.Setup(m => m.Map(It.IsAny<Project>(), It.IsAny<IGenericService<Project>>()))
                       .Returns<Project, IGenericService<Project>>((p, svc) => new ProjectDto { Id = p.Id, Name = p.Name, Slug = p.Slug, OwnerSlug = p.Owner?.Slug ?? "" });

            ControllerTestHelpers.SetControllerUser(_controller, "a@b.com");

            // Act
            var actionResult = await _controller.GetAll();

            // Assert
            Assert.That(actionResult.Result, Is.InstanceOf<OkObjectResult>());
            var ok = actionResult.Result as OkObjectResult;
            Assert.That(ok, Is.Not.Null);
            var dtos = ok!.Value as List<ProjectDto>;
            Assert.That(dtos, Is.Not.Null);
            Assert.That(dtos!.Count, Is.EqualTo(2));
            Assert.That(dtos[0].Id, Is.EqualTo(11));
        }

        [Test]
        public async Task REQ_FUN_003_GetAll_MissingEmail_ReturnsUnauthorized()
        {
            // Arrange
            ControllerTestHelpers.SetControllerUser(_controller, null);
            // Act
            var actionResult = await _controller.GetAll();
            // Assert
            Assert.That(actionResult.Result, Is.InstanceOf<UnauthorizedResult>());
        }

        [Test]
        public async Task REQ_FUN_003_Create_WithValidData_ReturnsCreated()
        {
            // Arrange
            var user = new User { Id = 5, Email = "creator@x.com", Slug = "creator" };
            _mockUserRepo.Setup(r => r.GetOrCreateUserByEmailAsync("creator@x.com", It.IsAny<string?>())).ReturnsAsync(user);
            _mockProjectService.Setup(s => s.GenerateProjectSlugAsync("New Project", 5)).ReturnsAsync("new-project");
            _mockGenericService.Setup(s => s.AddAsync(It.IsAny<Project>())).Returns(Task.CompletedTask);

            _mockMapper.Setup(m => m.Map(It.IsAny<Project>(), It.IsAny<IGenericService<Project>>()))
                       .Returns<Project, IGenericService<Project>>((p, svc) => new ProjectDto { Id = p.Id, Name = p.Name, Slug = p.Slug, OwnerSlug = p.Owner?.Slug ?? "" });

            ControllerTestHelpers.SetControllerUser(_controller, "creator@x.com", "creator");

            var dto = new ProjectCreateDto { Name = "New Project", Description = "Desc" };
            // Act
            var result = await _controller.Create(dto);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<CreatedAtActionResult>());
        }

        [Test]
        public async Task REQ_FUN_003_Create_MissingName_ReturnsBadRequest()
        {
            // Arrange
            var user = new User { Id = 5, Email = "creator@x.com", Slug = "creator" };
            _mockUserRepo.Setup(r => r.GetOrCreateUserByEmailAsync("creator@x.com", It.IsAny<string?>())).ReturnsAsync(user);

            ControllerTestHelpers.SetControllerUser(_controller, "creator@x.com");
            var dto = new ProjectCreateDto { Name = "", Description = "Desc" };
            // Act
            var result = await _controller.Create(dto);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
        }
    }
}
