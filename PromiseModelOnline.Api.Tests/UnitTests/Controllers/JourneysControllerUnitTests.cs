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
    public class JourneysControllerUnitTests
    {
        private Mock<IJourneyService> _mockJourneyService = null!;
        private Mock<IGenericMapper<Journey, JourneyDTO>> _mockMapper = null!;
        private Mock<IUserRepository> _userRepoMock = null!;
        private Mock<IPermissionService> _permissionMock = null!;

        private JourneysController _controller = null!;

        [SetUp]
        public void SetUp()
        {
            _mockJourneyService = new Mock<IJourneyService>();
            _mockMapper = new Mock<IGenericMapper<Journey, JourneyDTO>>();
            _userRepoMock = new Mock<IUserRepository>();
            _permissionMock = new Mock<IPermissionService>();

            _controller = new JourneysController(
                _mockJourneyService.Object,
                _mockMapper.Object,
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
        public async Task GetAll_WithValidEpicId_ReturnsOk()
        {
            int epicId = 10;

            SetupUser();

            var journeys = new List<Journey>
            {
                new Journey { Id = 1, EpicId = epicId }
            };

            _mockJourneyService
                .Setup(s => s.GetJourneysByEpicAsync(epicId))
                .ReturnsAsync(journeys);

            _mockJourneyService
                .Setup(s => s.GetProjectIdFromEpicAsync(epicId))
                .ReturnsAsync(5);

            _permissionMock
                .Setup(p => p.HasPermissionAsync(
                    It.IsAny<int>(),
                    5,
                    PermissionLevel.View))
                .ReturnsAsync(true);

            _mockMapper
                .Setup(m => m.Map(It.IsAny<Journey>(), It.IsAny<IGenericService<Journey>>()))
                .Returns<Journey, IGenericService<Journey>>((j, _) => new JourneyDTO { Id = j.Id });

            _controller.Request.QueryString = new QueryString($"?epicId={epicId}");

            var result = await _controller.GetAll();

            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        }

        [Test]
        public async Task GetAll_MissingEpicId_ReturnsBadRequest()
        {
            SetupUser();

            var result = await _controller.GetAll();

            Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task GetAll_InvalidEpicId_ReturnsBadRequest()
        {
            SetupUser();

            _controller.Request.QueryString = new QueryString("?epicId=abc");

            var result = await _controller.GetAll();

            Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task GetAll_NoUser_ReturnsUnauthorized()
        {
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity())
                }
            };

            _controller.Request.QueryString = new QueryString("?epicId=1");

            var result = await _controller.GetAll();

            Assert.That(result.Result, Is.InstanceOf<UnauthorizedResult>());
        }

        [Test]
        public async Task GetAll_NoPermission_ReturnsForbid()
        {
            int epicId = 10;

            SetupUser();

            _mockJourneyService
                .Setup(s => s.GetProjectIdFromEpicAsync(epicId))
                .ReturnsAsync(5);

            _permissionMock
                .Setup(p => p.HasPermissionAsync(
                    It.IsAny<int>(),
                    5,
                    PermissionLevel.View))
                .ReturnsAsync(false);

            _controller.Request.QueryString = new QueryString($"?epicId={epicId}");

            var result = await _controller.GetAll();

            Assert.That(result.Result, Is.InstanceOf<ForbidResult>());
        }

        [Test]
        public async Task GetAll_NoJourneys_ReturnsOkWithEmptyList()
        {
            int epicId = 10;

            SetupUser();

            _mockJourneyService
                .Setup(s => s.GetJourneysByEpicAsync(epicId))
                .ReturnsAsync(new List<Journey>());

            _mockJourneyService
                .Setup(s => s.GetProjectIdFromEpicAsync(epicId))
                .ReturnsAsync(5);

            _permissionMock
                .Setup(p => p.HasPermissionAsync(It.IsAny<int>(), 5, PermissionLevel.View))
                .ReturnsAsync(true);

            _mockMapper
                .Setup(m => m.Map(It.IsAny<Journey>(), It.IsAny<IGenericService<Journey>>()))
                .Returns(new JourneyDTO());

            _controller.Request.QueryString = new QueryString($"?epicId={epicId}");

            var result = await _controller.GetAll();

            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        }

        // =========================================
        // ✅ GENERIC (BASE CONTROLLER)
        // =========================================

        [Test]
        public async Task GetById_ReturnsOk()
        {
            var journey = new Journey { Id = 1 };

            _mockJourneyService.Setup(s => s.GetByIdAsync(1)).ReturnsAsync(journey);
            _mockMapper.Setup(m => m.Map(journey, _mockJourneyService.Object))
                       .Returns(new JourneyDTO { Id = 1 });

            var result = await _controller.GetById(1);

            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        }

        [Test]
        public async Task Create_ReturnsCreated()
        {
            var journey = new Journey { Id = 1 };

            _mockJourneyService.Setup(s => s.AddAsync(journey)).Returns(Task.CompletedTask);
            _mockMapper.Setup(m => m.Map(journey, _mockJourneyService.Object))
                       .Returns(new JourneyDTO { Id = 1 });

            var result = await _controller.Create(journey);

            Assert.That(result.Result, Is.InstanceOf<CreatedAtActionResult>());
        }

        [Test]
        public async Task Update_Mismatch_ReturnsBadRequest()
        {
            var result = await _controller.Update(1, new Journey { Id = 2 });

            Assert.That(result, Is.InstanceOf<BadRequestResult>());
        }

        [Test]
        public async Task Delete_NotFound_ReturnsNotFound()
        {
            _mockJourneyService.Setup(s => s.DeleteByIdAsync(1)).ReturnsAsync(false);

            var result = await _controller.Delete(1);

            Assert.That(result, Is.InstanceOf<NotFoundResult>());
        }
    }
}