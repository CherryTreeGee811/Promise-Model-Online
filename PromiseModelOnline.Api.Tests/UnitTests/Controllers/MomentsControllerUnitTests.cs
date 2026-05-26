using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using NUnit.Framework;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.Controllers;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Enums;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.Mappers.Interfaces;
using PromiseModelOnline.Api.Hubs;

namespace PromiseModelOnline.Api.Tests.UnitTests.Controllers
{
    public class MomentsControllerUnitTests
    {
        private Mock<IMomentService> _mockMomentService = null!;
        private Mock<IGenericMapper<Moment, MomentDTO>> _mockMapper = null!;
        private Mock<IUserRepository> _mockUserRepo = null!;
        private Mock<IPermissionService> _mockPermissionService = null!;
        private Mock<IHubContext<NotificationHub>> _mockHub = null!;

        private MomentsController _controller = null!;

        [SetUp]
        public void SetUp()
        {
            _mockMomentService = new Mock<IMomentService>();
            _mockMapper = new Mock<IGenericMapper<Moment, MomentDTO>>();
            _mockUserRepo = new Mock<IUserRepository>();
            _mockPermissionService = new Mock<IPermissionService>();
            _mockHub = new Mock<IHubContext<NotificationHub>>();

            _controller = new MomentsController(
                _mockMomentService.Object,
                _mockMapper.Object,
                _mockUserRepo.Object,
                _mockPermissionService.Object,
                NullLogger<MomentsController>.Instance,
                _mockHub.Object // ✅ FIXED
            );
        }

        private void SetupUser()
        {
            var user = new User { Id = 1 };

            _mockUserRepo
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
        public async Task GetAll_WithoutQuery_ReturnsBadRequest()
        {
            SetupUser();

            var result = await _controller.GetAll();

            Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task GetAll_WithStrideId_ReturnsOk()
        {
            int strideId = 5;

            SetupUser();

            _mockMomentService
                .Setup(s => s.GetProjectIdFromStrideAsync(strideId))
                .ReturnsAsync(1);

            _mockPermissionService
                .Setup(p => p.HasPermissionAsync(It.IsAny<int>(), 1, PermissionLevel.View))
                .ReturnsAsync(true);

            _mockMomentService
                .Setup(s => s.GetMomentsByStrideAsync(strideId))
                .ReturnsAsync(new List<Moment> { new Moment { Id = 10 } });

            _mockMapper
                .Setup(m => m.Map(It.IsAny<Moment>(), It.IsAny<IGenericService<Moment>>()))
                .Returns(new MomentDTO());

            _controller.Request.QueryString = new QueryString($"?strideId={strideId}");

            var result = await _controller.GetAll();

            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        }

        [Test]
        public async Task GetAll_NoPermission_ReturnsForbid()
        {
            int strideId = 5;

            SetupUser();

            _mockMomentService
                .Setup(s => s.GetProjectIdFromStrideAsync(strideId))
                .ReturnsAsync(1);

            _mockPermissionService
                .Setup(p => p.HasPermissionAsync(It.IsAny<int>(), 1, PermissionLevel.View))
                .ReturnsAsync(false);

            _controller.Request.QueryString = new QueryString($"?strideId={strideId}");

            var result = await _controller.GetAll();

            Assert.That(result.Result, Is.InstanceOf<ForbidResult>());
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

            _controller.Request.QueryString = new QueryString("?strideId=5");

            var result = await _controller.GetAll();

            Assert.That(result.Result, Is.InstanceOf<UnauthorizedResult>());
        }

        [Test]
        public async Task GetAll_WithFlowId_ReturnsOk()
        {
            int flowId = 3;

            SetupUser();

            _mockMomentService
                .Setup(s => s.GetProjectIdFromFlowAsync(flowId))
                .ReturnsAsync(1);

            _mockPermissionService
                .Setup(p => p.HasPermissionAsync(It.IsAny<int>(), 1, PermissionLevel.View))
                .ReturnsAsync(true);

            _mockMomentService
                .Setup(s => s.GetMomentsByFlowAsync(flowId))
                .ReturnsAsync(new List<Moment> { new Moment { Id = 1 } });

            _mockMapper
                .Setup(m => m.Map(It.IsAny<Moment>(), It.IsAny<IGenericService<Moment>>()))
                .Returns(new MomentDTO());

            _controller.Request.QueryString = new QueryString($"?flowId={flowId}");

            var result = await _controller.GetAll();

            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        }

        [Test]
        public async Task GetAll_WithIterationIdAndUnassigned_ReturnsOk()
        {
            int iterationId = 2;

            SetupUser();

            _mockMomentService
                .Setup(s => s.GetProjectIdFromIterationAsync(iterationId))
                .ReturnsAsync(1);

            _mockPermissionService
                .Setup(p => p.HasPermissionAsync(It.IsAny<int>(), 1, PermissionLevel.View))
                .ReturnsAsync(true);

            _mockMomentService
                .Setup(s => s.GetMomentsByIterationAsync(iterationId, true))
                .ReturnsAsync(new List<Moment> { new Moment { Id = 1 } });

            _mockMapper
                .Setup(m => m.Map(It.IsAny<Moment>(), It.IsAny<IGenericService<Moment>>()))
                .Returns(new MomentDTO());

            _controller.Request.QueryString = new QueryString($"?iterationId={iterationId}&unassigned=true");

            var result = await _controller.GetAll();

            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        }

        // =========================================
        // ✅ UPDATE OWNER
        // =========================================

        [Test]
        public async Task UpdateMomentOwner_ValidRequest_ReturnsOk()
        {
            int momentId = 10;
            int newOwnerId = 5;

            SetupUser();

            _mockMomentService
                .Setup(s => s.GetProjectIdForMomentAsync(momentId))
                .ReturnsAsync(2);

            _mockPermissionService
                .Setup(p => p.GetUserPermissionAsync(It.IsAny<int>(), 2))
                .ReturnsAsync(PermissionLevel.Edit);

            var updatedMoment = new Moment { Id = momentId, OwnerId = newOwnerId };

            _mockMomentService
                .Setup(s => s.AssignOwnerAsync(momentId, newOwnerId))
                .ReturnsAsync(updatedMoment);

            _mockMapper
                .Setup(m => m.Map(updatedMoment, _mockMomentService.Object))
                .Returns(new MomentDTO { Id = momentId, OwnerId = newOwnerId });

            var result = await _controller.UpdateMomentOwner(
                momentId,
                new UpdateMomentOwnerRequest { UserId = newOwnerId });

            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        }

        [Test]
        public async Task UpdateMomentOwner_NoPermission_ReturnsForbid()
        {
            int momentId = 10;

            SetupUser();

            _mockMomentService
                .Setup(s => s.GetProjectIdForMomentAsync(momentId))
                .ReturnsAsync(2);

            _mockPermissionService
                .Setup(p => p.GetUserPermissionAsync(It.IsAny<int>(), 2))
                .ReturnsAsync(PermissionLevel.View);

            var result = await _controller.UpdateMomentOwner(
                momentId,
                new UpdateMomentOwnerRequest { UserId = 99 });

            Assert.That(result.Result, Is.InstanceOf<ForbidResult>());
        }

        [Test]
        public async Task UpdateMomentType_WhenMomentNotFound_ReturnsNotFound()
        {
            int momentId = 10;

            SetupUser();

            _mockMomentService
                .Setup(s => s.GetProjectIdForMomentAsync(momentId))
                .ReturnsAsync(2);

            _mockPermissionService
                .Setup(p => p.GetUserPermissionAsync(It.IsAny<int>(), 2))
                .ReturnsAsync(PermissionLevel.Edit); // ✅ allow past permission check

            _mockMomentService
                .Setup(s => s.GetByIdAsync(momentId))
                .ReturnsAsync((Moment?)null);

            var result = await _controller.UpdateMomentType(
                momentId,
                new UpdateMomentTypeRequest { NewType = MomentType.Story });

            Assert.That(result.Result, Is.InstanceOf<NotFoundResult>());
        }
    }
}