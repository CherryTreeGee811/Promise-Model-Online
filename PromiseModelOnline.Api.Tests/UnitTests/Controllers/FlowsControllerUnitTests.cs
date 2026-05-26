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
    public class FlowsControllerUnitTests
    {
        private Mock<IFlowService> _mockFlowService = null!;
        private Mock<IGenericMapper<Flow, FlowDTO>> _mockMapper = null!;
        private Mock<IUserRepository> _mockUserRepository = null!;
        private Mock<IPermissionService> _mockPermissionService = null!;

        private FlowsController _controller = null!;

        [SetUp]
        public void SetUp()
        {
            _mockFlowService = new Mock<IFlowService>();
            _mockMapper = new Mock<IGenericMapper<Flow, FlowDTO>>();
            _mockUserRepository = new Mock<IUserRepository>();
            _mockPermissionService = new Mock<IPermissionService>();

            _controller = new FlowsController(
                _mockFlowService.Object,
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
        public async Task GetAll_WithValidJourneyId_ReturnsOk()
        {
            int journeyId = 10;

            var flows = new List<Flow>
            {
                new Flow { Id = 1, JourneyId = journeyId }
            };

            _mockFlowService
                .Setup(s => s.GetFlowsByJourneyAsync(journeyId))
                .ReturnsAsync(flows);

            _mockFlowService
                .Setup(s => s.GetProjectIdFromJourneyAsync(journeyId))
                .ReturnsAsync(5);

            _mockMapper
                .Setup(m => m.Map(It.IsAny<Flow>(), It.IsAny<IGenericService<Flow>>()))
                .Returns<Flow, IGenericService<Flow>>((f, _) => new FlowDTO { Id = f.Id });

            SetupUser();

            _controller.Request.QueryString = new QueryString($"?journeyId={journeyId}");

            var result = await _controller.GetAll();

            var ok = result.Result as OkObjectResult;

            Assert.That(ok, Is.Not.Null);
        }

        [Test]
        public async Task GetAll_MissingJourneyId_ReturnsBadRequest()
        {
            SetupUser();

            var result = await _controller.GetAll();

            Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task GetAll_NoUser_ReturnsUnauthorized()
        {
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext() // no claims
            };

            var result = await _controller.GetAll();

            Assert.That(result.Result, Is.InstanceOf<UnauthorizedResult>());
        }

        [Test]
        public async Task GetAll_NoPermission_ReturnsForbid()
        {
            int journeyId = 10;

            var user = new User { Id = 1 };

            _mockUserRepository
                .Setup(r => r.GetOrCreateUserByEmailAsync(It.IsAny<string>(), It.IsAny<string?>()))
                .ReturnsAsync(user);

            _mockFlowService
                .Setup(s => s.GetProjectIdFromJourneyAsync(journeyId))
                .ReturnsAsync(5);

            _mockPermissionService
                .Setup(p => p.HasPermissionAsync(user.Id, 5, PermissionLevel.View))
                .ReturnsAsync(false); // ❌ no permission

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                    {
                        new Claim(ClaimTypes.Email, "user@test.com")
                    }))
                }
            };

            _controller.Request.QueryString = new QueryString($"?journeyId={journeyId}");

            var result = await _controller.GetAll();

            Assert.That(result.Result, Is.InstanceOf<ForbidResult>());
        }

        [Test]
        public async Task GetAll_InvalidJourneyId_ReturnsBadRequest()
        {
            SetupUser();

            _controller.Request.QueryString = new QueryString("?journeyId=abc");

            var result = await _controller.GetAll();

            Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task GetAll_NoFlows_ReturnsOkWithEmptyList()
        {
            int journeyId = 10;

            _mockFlowService
                .Setup(s => s.GetFlowsByJourneyAsync(journeyId))
                .ReturnsAsync(new List<Flow>());

            _mockFlowService
                .Setup(s => s.GetProjectIdFromJourneyAsync(journeyId))
                .ReturnsAsync(5);

            _mockMapper
                .Setup(m => m.Map(It.IsAny<Flow>(), It.IsAny<IGenericService<Flow>>()))
                .Returns(new FlowDTO());

            SetupUser();

            _controller.Request.QueryString = new QueryString($"?journeyId={journeyId}");

            var result = await _controller.GetAll();

            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        }

        // =========================================
        // ✅ GET BY ID
        // =========================================

        [Test]
        public async Task GetById_ReturnsOk()
        {
            var flow = new Flow { Id = 1 };

            _mockFlowService.Setup(s => s.GetByIdAsync(1)).ReturnsAsync(flow);
            _mockMapper.Setup(m => m.Map(flow, _mockFlowService.Object))
                       .Returns(new FlowDTO { Id = 1 });

            var result = await _controller.GetById(1);

            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        }

        // =========================================
        // ✅ CREATE
        // =========================================

        [Test]
        public async Task Create_ReturnsCreated()
        {
            var flow = new Flow { Id = 1 };

            _mockFlowService.Setup(s => s.AddAsync(flow)).Returns(Task.CompletedTask);
            _mockMapper.Setup(m => m.Map(flow, _mockFlowService.Object))
                       .Returns(new FlowDTO { Id = 1 });

            var result = await _controller.Create(flow);

            Assert.That(result.Result, Is.InstanceOf<CreatedAtActionResult>());
        }

        // =========================================
        // ✅ UPDATE
        // =========================================

        [Test]
        public async Task Update_Mismatch_ReturnsBadRequest()
        {
            var result = await _controller.Update(1, new Flow { Id = 2 });

            Assert.That(result, Is.InstanceOf<BadRequestResult>());
        }

        // =========================================
        // ✅ DELETE
        // =========================================

        [Test]
        public async Task Delete_NotFound_ReturnsNotFound()
        {
            _mockFlowService.Setup(s => s.DeleteByIdAsync(1)).ReturnsAsync(false);

            var result = await _controller.Delete(1);

            Assert.That(result, Is.InstanceOf<NotFoundResult>());
        }
    }
}