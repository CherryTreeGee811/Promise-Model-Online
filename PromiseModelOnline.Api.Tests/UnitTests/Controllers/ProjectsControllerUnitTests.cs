using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.Controllers;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Mappers.Interfaces;
using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.Tests
{
    public class ProjectsControllerTests
    {
        private Mock<IProjectService> _mockProjectService = null!;
        private Mock<IGenericMapper<Project, ProjectDTO>> _mockMapper = null!;
        private Mock<IUserRepository> _mockUserRepo = null!;
        private Mock<IPermissionService> _mockPermissionService = null!;
        private Mock<IGenericService<Promise>> _mockPromiseService = null!;
        private Mock<IGenericMapper<Promise, PromiseDTO>> _mockPromiseMapper = null!;
        private ProjectsController _controller = null!;

        [SetUp]
        public void SetUp()
        {
            _mockProjectService = new Mock<IProjectService>();
            _mockMapper = new Mock<IGenericMapper<Project, ProjectDTO>>();
            _mockUserRepo = new Mock<IUserRepository>();
            _mockPermissionService = new Mock<IPermissionService>();
            _mockPromiseService = new Mock<IGenericService<Promise>>();
            _mockPromiseMapper = new Mock<IGenericMapper<Promise, PromiseDTO>>();
        }

        private void InitControllerWithUser(string? email, string? nameid = null)
        {
            _controller = new ProjectsController(
                _mockProjectService.Object,
                _mockMapper.Object,
                _mockUserRepo.Object,
                _mockPermissionService.Object,
                _mockPromiseService.Object,
                _mockPromiseMapper.Object);
            var claims = new List<Claim>();
            if (email is not null) claims.Add(new Claim(ClaimTypes.Email, email));
            if (nameid is not null) claims.Add(new Claim("nameid", nameid));
            var identity = new ClaimsIdentity(claims, "test");
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) }
            };
        }

        [Test]
        public async Task GetAll_WithAuthenticatedUser_ReturnsOkMappedDtos()
        {
            var user = new User { Id = 1, Email = "a@b.com" };
            _mockUserRepo.Setup(r => r.GetOrCreateUserByEmailAsync("a@b.com", It.IsAny<string?>())).ReturnsAsync(user);

            var projects = new List<Project> {
                new Project { Id = 11, Name = "P1" },
                new Project { Id = 12, Name = "P2" }
            };
            _mockProjectService.Setup(s => s.GetAccessibleProjectsAsync(user.Id)).ReturnsAsync(projects);

            _mockMapper.Setup(m => m.Map(It.IsAny<Project>(), It.IsAny<IGenericService<Project>>()))
                       .Returns<Project, IGenericService<Project>>((p, svc) => new ProjectDTO { Id = p.Id, Name = p.Name });

            InitControllerWithUser("a@b.com");

            var actionResult = await _controller.GetAll();

            Assert.That(actionResult.Result, Is.InstanceOf<OkObjectResult>());
            var ok = actionResult.Result as OkObjectResult;
            Assert.That(ok, Is.Not.Null);
            var dtos = ok!.Value as List<ProjectDTO>;
            Assert.That(dtos, Is.Not.Null);
            Assert.That(dtos!.Count, Is.EqualTo(2));
            Assert.That(dtos[0].Id, Is.EqualTo(11));
        }

        [Test]
        public async Task GetAll_MissingEmail_ReturnsUnauthorized()
        {
            InitControllerWithUser(null);
            var actionResult = await _controller.GetAll();
            Assert.That(actionResult.Result, Is.InstanceOf<UnauthorizedResult>());
        }

        [Test]
        public async Task GetMembers_WithAuthenticatedUser_ReturnsOkMembers()
        {
            var user = new User { Id = 2, Email = "x@y.com" };
            _mockUserRepo.Setup(r => r.GetOrCreateUserByEmailAsync("x@y.com", It.IsAny<string?>())).ReturnsAsync(user);

            var members = new List<ProjectMemberDTO> { new ProjectMemberDTO { UserId = 5, Email = "m1@e" } };
            _mockProjectService.Setup(s => s.GetProjectMembersAsync(99)).ReturnsAsync(members);

            InitControllerWithUser("x@y.com");

            var actionResult = await _controller.GetMembers(99);

            Assert.That(actionResult.Result, Is.InstanceOf<OkObjectResult>());
            var ok = actionResult.Result as OkObjectResult;
            Assert.That(ok, Is.Not.Null);
            var returned = ok!.Value as List<ProjectMemberDTO>;
            Assert.That(returned, Is.Not.Null);
            Assert.That(returned!.Count, Is.EqualTo(1));
            Assert.That(returned[0].UserId, Is.EqualTo(5));
        }

        [Test]
        public async Task GetMembers_MissingEmail_ReturnsUnauthorized()
        {
            InitControllerWithUser(null);
            var result = await _controller.GetMembers(1);
            Assert.That(result.Result, Is.InstanceOf<UnauthorizedResult>());
        }

        [Test]
        public async Task GetById_WhenExists_ReturnsOkDto()
        {
            var project = new Project { Id = 7, Name = "P7" };
            _mockProjectService.Setup(s => s.GetByIdAsync(7)).ReturnsAsync(project);
            _mockMapper.Setup(m => m.Map(project, It.IsAny<IGenericService<Project>>()))
                       .Returns(new ProjectDTO { Id = 7, Name = "P7" });

            InitControllerWithUser("u@u.com");

            var result = await _controller.GetById(7);

            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var ok = result.Result as OkObjectResult;
            var dto = ok!.Value as ProjectDTO;
            Assert.That(dto, Is.Not.Null);
            Assert.That(dto!.Id, Is.EqualTo(7));
        }

        [Test]
        public async Task GetById_WhenMissing_ReturnsNotFound()
        {
            _mockProjectService.Setup(s => s.GetByIdAsync(99)).ReturnsAsync((Project?)null);
            InitControllerWithUser("u@u.com");
            var result = await _controller.GetById(99);
            Assert.That(result.Result, Is.InstanceOf<NotFoundResult>());
        }

        [Test]
        public async Task Create_ReturnsCreatedAtActionWithDto()
        {
            var project = new Project { Id = 21, Name = "New" };
            _mockMapper.Setup(m => m.Map(project, It.IsAny<IGenericService<Project>>()))
                       .Returns(new ProjectDTO { Id = 21, Name = "New" });

            InitControllerWithUser("creator@x.com");

            var result = await _controller.Create(project);

            Assert.That(result.Result, Is.InstanceOf<CreatedAtActionResult>());
            var created = result.Result as CreatedAtActionResult;
            var dto = created!.Value as ProjectDTO;
            Assert.That(dto, Is.Not.Null);
            Assert.That(dto!.Id, Is.EqualTo(21));
        }

        [Test]
        public async Task Update_WithMatchingId_ReturnsNoContent()
        {
            var project = new Project { Id = 31, Name = "Up" };
            InitControllerWithUser("u@u.com");

            var result = await _controller.Update(31, project);

            Assert.That(result, Is.InstanceOf<NoContentResult>());
            _mockProjectService.Verify(s => s.UpdateAsync(project), Times.Once);
        }

        [Test]
        public async Task Update_IdMismatch_ReturnsBadRequest()
        {
            var project = new Project { Id = 40, Name = "Mismatch" };
            InitControllerWithUser("u@u.com");
            var result = await _controller.Update(41, project);
            Assert.That(result, Is.InstanceOf<BadRequestResult>());
        }

        [Test]
        public async Task Delete_WhenDeleted_ReturnsNoContent()
        {
            _mockProjectService.Setup(s => s.DeleteByIdAsync(55)).ReturnsAsync(true);
            InitControllerWithUser("u@u.com");
            var result = await _controller.Delete(55);
            Assert.That(result, Is.InstanceOf<NoContentResult>());
        }

        [Test]
        public async Task Delete_WhenNotFound_ReturnsNotFound()
        {
            _mockProjectService.Setup(s => s.DeleteByIdAsync(66)).ReturnsAsync(false);
            InitControllerWithUser("u@u.com");
            var result = await _controller.Delete(66);
            Assert.That(result, Is.InstanceOf<NotFoundResult>());
        }
    }
}
