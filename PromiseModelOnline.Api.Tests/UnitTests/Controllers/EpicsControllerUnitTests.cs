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
    public class EpicsControllerUnitTests
    {
        private Mock<IEpicService> _mockEpicService = null!;
        private Mock<IGenericMapper<Epic, EpicDTO>> _mockMapper = null!;
        private Mock<IUserRepository> _mockUserRepository = null!;
        private Mock<IPermissionService> _mockPermissionService = null!;

        private EpicsController _controller = null!;

        [SetUp]
        public void SetUp()
        {
            _mockEpicService = new Mock<IEpicService>();
            _mockMapper = new Mock<IGenericMapper<Epic, EpicDTO>>();
            _mockUserRepository = new Mock<IUserRepository>();
            _mockPermissionService = new Mock<IPermissionService>();

            _controller = new EpicsController(
                _mockEpicService.Object,
                _mockMapper.Object,
                _mockUserRepository.Object,
                _mockPermissionService.Object
            );
        }

        private void SetupUser()
        {
            var user = new User { Id = 1 };

            _mockUserRepository
                .Setup(r => r.GetOrCreateUserByEmailAsync(It.IsAny<string>(), It.IsAny<string?>()))
                .ReturnsAsync(user);

            _mockPermissionService
                .Setup(p => p.HasPermissionAsync(
                    It.IsAny<int>(),
                    It.IsAny<int>(),
                    It.IsAny<PermissionLevel>()))
                .ReturnsAsync(true);

            var identity = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.Email, "user@test.com"),
                new Claim("nameid", "testUser")
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
        public async Task GetAll_WithValidPromiseId_ReturnsOk()
        {
            int promiseId = 10;

            var epics = new List<Epic>
            {
                new Epic { Id = 1, ProductPromiseId = promiseId }
            };

            _mockEpicService
                .Setup(s => s.GetEpicsByPromiseAsync(promiseId))
                .ReturnsAsync(epics);

            _mockEpicService
                .Setup(s => s.GetProjectIdFromPromiseAsync(promiseId))
                .ReturnsAsync(5);

            _mockMapper
                .Setup(m => m.Map(It.IsAny<Epic>(), It.IsAny<IGenericService<Epic>>()))
                .Returns<Epic, IGenericService<Epic>>((e, _) => new EpicDTO { Id = e.Id });

            SetupUser();

            _controller.Request.QueryString = new QueryString($"?promiseId={promiseId}");

            var result = await _controller.GetAll();

            var ok = result.Result as OkObjectResult;
            Assert.That(ok, Is.Not.Null);

            var list = ok!.Value as List<EpicDTO>;
            Assert.That(list!.Count, Is.EqualTo(1));
        }

        [Test]
        public async Task GetAll_MissingPromiseId_ReturnsBadRequest()
        {
            SetupUser();

            var result = await _controller.GetAll();

            Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
        }

        // =========================================
        // ✅ GET BY ID
        // =========================================

        [Test]
        public async Task GetById_Valid_ReturnsOk()
        {
            var epic = new Epic { Id = 1 };

            _mockEpicService.Setup(s => s.GetByIdAsync(1)).ReturnsAsync(epic);
            _mockMapper.Setup(m => m.Map(epic, _mockEpicService.Object))
                       .Returns(new EpicDTO { Id = 1 });

            var result = await _controller.GetById(1);

            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        }

        // =========================================
        // ✅ CREATE
        // =========================================

        [Test]
        public async Task Create_ReturnsCreated()
        {
            var epic = new Epic { Id = 1 };

            _mockEpicService.Setup(s => s.AddAsync(epic)).Returns(Task.CompletedTask);
            _mockMapper.Setup(m => m.Map(epic, _mockEpicService.Object))
                       .Returns(new EpicDTO { Id = 1 });

            var result = await _controller.Create(epic);

            Assert.That(result.Result, Is.InstanceOf<CreatedAtActionResult>());
        }

        // =========================================
        // ✅ UPDATE
        // =========================================

        [Test]
        public async Task Update_Mismatch_ReturnsBadRequest()
        {
            var result = await _controller.Update(1, new Epic { Id = 2 });

            Assert.That(result, Is.InstanceOf<BadRequestResult>());
        }

        // =========================================
        // ✅ DELETE
        // =========================================

        [Test]
        public async Task Delete_NotFound_ReturnsNotFound()
        {
            _mockEpicService.Setup(s => s.DeleteByIdAsync(1)).ReturnsAsync(false);

            var result = await _controller.Delete(1);

            Assert.That(result, Is.InstanceOf<NotFoundResult>());
        }
    }
}