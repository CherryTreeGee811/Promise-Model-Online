using System;
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
using PromiseModelOnline.Api.Enums;
using PromiseModelOnline.Api.Mappers.Interfaces;
using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.Tests
{
    public class IterationsControllerUnitTests
    {
        private Mock<IIterationService> _mockIterationService = null!;
        private Mock<IGenericMapper<Iteration, IterationDTO>> _mockMapper = null!;
        private Mock<IMomentService> _momentServiceMock = null!;
        private Mock<IUserRepository> _userRepoMock = null!;
        private Mock<IPermissionService> _permissionMock = null!;

        private IterationsController _controller = null!;

        [SetUp]
        public void SetUp()
        {
            _mockIterationService = new Mock<IIterationService>();
            _mockMapper = new Mock<IGenericMapper<Iteration, IterationDTO>>();
            _momentServiceMock = new Mock<IMomentService>();
            _userRepoMock = new Mock<IUserRepository>();
            _permissionMock = new Mock<IPermissionService>();

            _controller = new IterationsController(
                _mockIterationService.Object,
                _mockMapper.Object,
                _momentServiceMock.Object,
                _userRepoMock.Object,
                _permissionMock.Object
            );
        }

        private void SetupUser()
        {
            var user = new User { Id = 1 };

            _userRepoMock
                .Setup(r => r.GetOrCreateUserByEmailAsync(It.IsAny<string>(), It.IsAny<string?>()))
                .ReturnsAsync(user);

            _permissionMock
                .Setup(p => p.HasPermissionAsync(
                    It.IsAny<int>(),
                    It.IsAny<int>(),
                    It.IsAny<PermissionLevel>()))
                .ReturnsAsync(true);

            var identity = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.Email, "user@test.com"),
                new Claim("nameid", "tester")
            }, "test");

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(identity)
                }
            };
        }

        // =========================================
        // ✅ GET ALL
        // =========================================

        [Test]
        public async Task GetAll_WithValidProjectId_ReturnsOk()
        {
            int projectId = 42;

            var iterations = new List<Iteration>
            {
                new Iteration { Id = 1, ProjectId = projectId }
            };

            _mockIterationService
                .Setup(s => s.GetIterationsByProjectAsync(projectId))
                .ReturnsAsync(iterations);

            _mockMapper
                .Setup(m => m.Map(It.IsAny<Iteration>(), It.IsAny<IGenericService<Iteration>>()))
                .Returns<Iteration, IGenericService<Iteration>>((i, _) => new IterationDTO { Id = i.Id });

            SetupUser();

            _controller.Request.QueryString = new QueryString($"?projectId={projectId}");

            var result = await _controller.GetAll();

            var ok = result.Result as OkObjectResult;
            Assert.That(ok, Is.Not.Null);
        }

        [Test]
        public async Task GetAll_WithoutProjectId_ReturnsBadRequest()
        {
            SetupUser();

            var result = await _controller.GetAll();

            Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
        }

        // =========================================
        // ✅ GET BY ID
        // =========================================

        [Test]
        public async Task GetById_ReturnsOk()
        {
            var iteration = new Iteration { Id = 1 };

            _mockIterationService.Setup(s => s.GetByIdAsync(1)).ReturnsAsync(iteration);
            _mockMapper.Setup(m => m.Map(iteration, _mockIterationService.Object))
                       .Returns(new IterationDTO { Id = 1 });

            var result = await _controller.GetById(1);

            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        }

        // =========================================
        // ✅ CREATE
        // =========================================

        [Test]
        public async Task Create_ReturnsCreated()
        {
            var iteration = new Iteration { Id = 1 };

            _mockIterationService.Setup(s => s.AddAsync(iteration)).Returns(Task.CompletedTask);
            _mockMapper.Setup(m => m.Map(iteration, _mockIterationService.Object))
                       .Returns(new IterationDTO { Id = 1 });

            var result = await _controller.Create(iteration);

            Assert.That(result.Result, Is.InstanceOf<CreatedAtActionResult>());
        }

        // =========================================
        // ✅ UPDATE
        // =========================================

        [Test]
        public async Task Update_Mismatch_ReturnsBadRequest()
        {
            var result = await _controller.Update(1, new Iteration { Id = 2 });

            Assert.That(result, Is.InstanceOf<BadRequestResult>());
        }

        // =========================================
        // ✅ DELETE
        // =========================================

        [Test]
        public async Task Delete_NotFound_ReturnsNotFound()
        {
            _mockIterationService.Setup(s => s.DeleteByIdAsync(1)).ReturnsAsync(false);

            var result = await _controller.Delete(1);

            Assert.That(result, Is.InstanceOf<NotFoundResult>());
        }
    }
}