using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
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
    public class StridesControllerUnitTests
    {
        private Mock<IStrideService> _mockStrideService = null!;
        private Mock<IGenericMapper<Stride, StrideDTO>> _mockMapper = null!;
        private Mock<IMomentService> _mockMomentService = null!;
        private Mock<IUserRepository> _userRepoMock = null!;
        private Mock<IPermissionService> _permissionMock = null!;

        private StridesController _controller = null!;

        [SetUp]
        public void SetUp()
        {
            _mockStrideService = new Mock<IStrideService>();
            _mockMapper = new Mock<IGenericMapper<Stride, StrideDTO>>();
            _mockMomentService = new Mock<IMomentService>();
            _userRepoMock = new Mock<IUserRepository>();
            _permissionMock = new Mock<IPermissionService>();

            _controller = new StridesController(
                _mockStrideService.Object,
                _mockMapper.Object,
                _mockMomentService.Object,
                NullLogger<StridesController>.Instance,
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
        public async Task GetAll_WithValidIterationId_ReturnsOk()
        {
            int iterationId = 10;

            var strides = new List<Stride>
            {
                new Stride { Id = 1, IterationId = iterationId }
            };

            _mockStrideService
                .Setup(s => s.GetStridesByIterationAsync(iterationId))
                .ReturnsAsync(strides);

            _mockStrideService
                .Setup(s => s.GetProjectIdFromIterationAsync(iterationId))
                .ReturnsAsync(5);

            _mockMapper
                .Setup(m => m.Map(It.IsAny<Stride>(), It.IsAny<IGenericService<Stride>>()))
                .Returns<Stride, IGenericService<Stride>>((s, _) => new StrideDTO { Id = s.Id });

            SetupUser();

            _permissionMock
                .Setup(p => p.HasPermissionAsync(
                    It.IsAny<int>(),
                    5,
                    PermissionLevel.View))
                .ReturnsAsync(true);

            _controller.Request.QueryString = new QueryString($"?iterationId={iterationId}");

            var result = await _controller.GetAll();

            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        }

        [Test]
        public async Task GetAll_MissingIterationId_ReturnsBadRequest()
        {
            SetupUser();

            var result = await _controller.GetAll();

            Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task GetAll_InvalidIterationId_ReturnsBadRequest()
        {
            SetupUser();

            _controller.Request.QueryString = new QueryString("?iterationId=abc");

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

            _controller.Request.QueryString = new QueryString("?iterationId=10");

            var result = await _controller.GetAll();

            Assert.That(result.Result, Is.InstanceOf<UnauthorizedResult>());
        }

        [Test]
        public async Task GetAll_NoPermission_ReturnsForbid()
        {
            int iterationId = 10;

            SetupUser();

            _mockStrideService
                .Setup(s => s.GetProjectIdFromIterationAsync(iterationId))
                .ReturnsAsync(5);

            _permissionMock
                .Setup(p => p.HasPermissionAsync(
                    It.IsAny<int>(),
                    5,
                    PermissionLevel.View))
                .ReturnsAsync(false);

            _controller.Request.QueryString = new QueryString($"?iterationId={iterationId}");

            var result = await _controller.GetAll();

            Assert.That(result.Result, Is.InstanceOf<ForbidResult>());
        }

        // =========================================
        // ✅ UPDATE STRIDE
        // =========================================

        [Test]
        public async Task UpdateStride_ProgressUnfinishedMoments_ReturnsNoContent()
        {
            int strideId = 12;

            SetupUser();

            _mockStrideService
                .Setup(s => s.GetProjectIdAsync(strideId))
                .ReturnsAsync(5);

            _permissionMock
                .Setup(p => p.HasPermissionAsync(
                    It.IsAny<int>(),
                    5,
                    PermissionLevel.Edit))
                .ReturnsAsync(true);

            _mockMomentService
                .Setup(s => s.MoveUnfinishedMomentsToNextStrideAsync(strideId))
                .Returns(Task.CompletedTask);

            var result = await _controller.UpdateStride(
                strideId,
                new UpdateStrideRequestDTO { ProgressUnfinishedMoments = true });

            Assert.That(result, Is.InstanceOf<NoContentResult>());
        }

        [Test]
        public async Task UpdateStride_NoPermission_ReturnsForbid()
        {
            int strideId = 12;

            SetupUser();

            _mockStrideService
                .Setup(s => s.GetProjectIdAsync(strideId))
                .ReturnsAsync(5);

            _permissionMock
                .Setup(p => p.HasPermissionAsync(
                    It.IsAny<int>(),
                    5,
                    PermissionLevel.Edit))
                .ReturnsAsync(false);

            var result = await _controller.UpdateStride(
                strideId,
                new UpdateStrideRequestDTO { ProgressUnfinishedMoments = true });

            Assert.That(result, Is.InstanceOf<ForbidResult>());
        }

        [Test]
        public async Task UpdateStride_WhenServiceThrows_ReturnsBadRequest()
        {
            int strideId = 12;

            SetupUser();

            _mockStrideService
                .Setup(s => s.GetProjectIdAsync(strideId))
                .ReturnsAsync(5);

            _permissionMock
                .Setup(p => p.HasPermissionAsync(
                    It.IsAny<int>(),
                    5,
                    PermissionLevel.Edit))
                .ReturnsAsync(true);

            _mockMomentService
                .Setup(s => s.MoveUnfinishedMomentsToNextStrideAsync(strideId))
                .ThrowsAsync(new System.Exception());

            var result = await _controller.UpdateStride(
                strideId,
                new UpdateStrideRequestDTO { ProgressUnfinishedMoments = true });

            Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        }
    }
}