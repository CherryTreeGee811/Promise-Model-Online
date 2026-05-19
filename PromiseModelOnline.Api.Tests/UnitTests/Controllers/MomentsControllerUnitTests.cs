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
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Mappers.Interfaces;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Enums;

namespace PromiseModelOnline.Api.Tests
{
    public class MomentsControllerUnitTests
    {
        private Mock<IMomentService> _mockMomentService = null!;
        private Mock<IGenericMapper<Moment, MomentDTO>> _mockMapper = null!;
        private Mock<IUserRepository> _mockUserRepo = null!;
        private Mock<IPermissionService> _mockPermissionService = null!;
        private MomentsController _controller = null!;

        [SetUp]
        public void SetUp()
        {
            _mockMomentService = new Mock<IMomentService>();
            _mockMapper = new Mock<IGenericMapper<Moment, MomentDTO>>();
            _mockUserRepo = new Mock<IUserRepository>();
            _mockPermissionService = new Mock<IPermissionService>();
            // Initialize controller with a default HttpContext to prevent null Request/ControllerContext in tests
            _controller = new MomentsController(
                _mockMomentService.Object,
                _mockMapper.Object,
                _mockUserRepo.Object,
                _mockPermissionService.Object,
                NullLogger<MomentsController>.Instance);
            _controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };
        }

        private void InitControllerWithUser(string? email, string? nameid = null)
        {
            _controller = new MomentsController(
                _mockMomentService.Object,
                _mockMapper.Object,
                _mockUserRepo.Object,
                _mockPermissionService.Object,
                NullLogger<MomentsController>.Instance);

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
        public async Task GetAll_WithoutQuery_ReturnsAllMoments()
        {
            // Arrange
            var moments = new List<Moment>
            {
                new Moment { Id = 1, Statement = "M1" },
                new Moment { Id = 2, Statement = "M2" }
            };

            _mockMomentService.Setup(s => s.GetAllAsync()).ReturnsAsync(moments);
            _mockMapper.Setup(m => m.Map(It.IsAny<Moment>(), It.IsAny<IGenericService<Moment>>() ))
                .Returns<Moment, IGenericService<Moment>>((m, svc) => new MomentDTO
                {
                    Id = m.Id,
                    Statement = m.Statement,
                    FlowId = m.FlowId,
                    OwnerId = m.OwnerId,
                    AssignedStrideId = m.AssignedStrideId,
                    Status = m.Status,
                    EffortEstimate = m.EffortEstimate,
                    CreatedAt = m.CreatedAt,
                    UpdatedAt = m.UpdatedAt,
                    CompletedAt = m.CompletedAt,
                    DisplayOrder = m.DisplayOrder,
                    IsZombie = m.IsZombie,
                    OriginalStrideId = m.OriginalStrideId,
                    StatusColor = m.StatusColor
                });

            // Setup HttpContext with empty query string
            var httpContext = new DefaultHttpContext();
            httpContext.Request.QueryString = QueryString.Empty;
            _controller.ControllerContext = new ControllerContext { HttpContext = httpContext };

            // Act
            var result = await _controller.GetAll();

            // Assert
            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var okResult = result.Result as OkObjectResult;
            var dtos = okResult!.Value as List<MomentDTO>;
            Assert.That(dtos, Is.Not.Null);
            Assert.That(dtos!.Count, Is.EqualTo(2));
            _mockMomentService.Verify(s => s.GetAllAsync(), Times.Once);
        }

        [Test]
        public async Task GetAll_WithStrideIdParameter_ReturnsFilteredByStride()
        {
            // Arrange
            int strideId = 5;
            var moments = new List<Moment>
            {
                new Moment { Id = 10, Statement = "M10", AssignedStrideId = strideId },
            };

            _mockMomentService.Setup(s => s.GetMomentsByStrideAsync(strideId)).ReturnsAsync(moments);
            _mockMapper.Setup(m => m.Map(It.IsAny<Moment>(), It.IsAny<IGenericService<Moment>>() ))
                .Returns<Moment, IGenericService<Moment>>((m, svc) => new MomentDTO { Id = m.Id, AssignedStrideId = m.AssignedStrideId });

            var httpContext = new DefaultHttpContext();
            httpContext.Request.QueryString = new QueryString($"?strideId={strideId}");
            _controller.ControllerContext = new ControllerContext { HttpContext = httpContext };

            // Act
            var result = await _controller.GetAll();

            // Assert
            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var okResult = result.Result as OkObjectResult;
            var dtos = okResult!.Value as List<MomentDTO>;
            Assert.That(dtos, Is.Not.Null);
            Assert.That(dtos!.Count, Is.EqualTo(1));
            Assert.That(dtos[0].AssignedStrideId, Is.EqualTo(strideId));
            _mockMomentService.Verify(s => s.GetMomentsByStrideAsync(strideId), Times.Once);
        }

        [Test]
        public async Task GetById_WithValidId_ReturnsOkWithMomentDTO()
        {
            // Arrange
            int momentId = 2;
            var moment = new Moment { Id = momentId, Statement = "Find me" };
            var expectedDto = new MomentDTO { Id = momentId, Statement = "Find me" };

            _mockMomentService.Setup(s => s.GetByIdAsync(momentId)).ReturnsAsync(moment);
            _mockMapper.Setup(m => m.Map(moment, _mockMomentService.Object)).Returns(expectedDto);

            // Act
            var result = await _controller.GetById(momentId);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var ok = result.Result as OkObjectResult;
            var dto = ok!.Value as MomentDTO;
            Assert.That(dto, Is.Not.Null);
            Assert.That(dto!.Id, Is.EqualTo(momentId));
            Assert.That(dto.Statement, Is.EqualTo("Find me"));
        }

        [Test]
        public async Task GetById_WithNonexistentId_ReturnsNotFound()
        {
            // Arrange
            int momentId = 999;
            _mockMomentService.Setup(s => s.GetByIdAsync(momentId)).ReturnsAsync((Moment?)null);

            // Act
            var result = await _controller.GetById(momentId);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<NotFoundResult>());
            _mockMomentService.Verify(s => s.GetByIdAsync(momentId), Times.Once);
        }

        [Test]
        public async Task Create_WithValidMoment_ReturnsCreatedAtAction()
        {
            // Arrange
            var moment = new Moment { Id = 33, Statement = "New" };
            var expectedDto = new MomentDTO { Id = 33, Statement = "New" };

            _mockMomentService.Setup(s => s.AddAsync(moment)).Returns(Task.CompletedTask);
            _mockMapper.Setup(m => m.Map(moment, _mockMomentService.Object)).Returns(expectedDto);

            // Act
            var result = await _controller.Create(moment);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<CreatedAtActionResult>());
            var created = result.Result as CreatedAtActionResult;
            Assert.That(created!.ActionName, Is.EqualTo(nameof(MomentsController.GetById)));
            Assert.That(created.RouteValues![("id")], Is.EqualTo(33));
            var dto = created.Value as MomentDTO;
            Assert.That(dto, Is.Not.Null);
            Assert.That(dto!.Id, Is.EqualTo(33));
        }

        [Test]
        public async Task Update_WithValidIdAndMoment_ReturnsNoContent()
        {
            // Arrange
            int momentId = 44;
            var moment = new Moment { Id = momentId, Statement = "Up" };

            _mockMomentService.Setup(s => s.UpdateAsync(moment)).Returns(Task.CompletedTask);

            // Act
            var result = await _controller.Update(momentId, moment);

            // Assert
            Assert.That(result, Is.InstanceOf<NoContentResult>());
            _mockMomentService.Verify(s => s.UpdateAsync(moment), Times.Once);
        }

        [Test]
        public async Task Update_WithMismatchedId_ReturnsBadRequest()
        {
            // Arrange
            int momentId = 1;
            var moment = new Moment { Id = 2, Statement = "Bad" };

            // Act
            var result = await _controller.Update(momentId, moment);

            // Assert
            Assert.That(result, Is.InstanceOf<BadRequestResult>());
            _mockMomentService.Verify(s => s.UpdateAsync(It.IsAny<Moment>()), Times.Never);
        }

        [Test]
        public async Task Delete_WithValidId_ReturnsNoContent()
        {
            // Arrange
            int momentId = 77;
            _mockMomentService.Setup(s => s.DeleteByIdAsync(momentId)).ReturnsAsync(true);

            // Act
            var result = await _controller.Delete(momentId);

            // Assert
            Assert.That(result, Is.InstanceOf<NoContentResult>());
            _mockMomentService.Verify(s => s.DeleteByIdAsync(momentId), Times.Once);
        }

        [Test]
        public async Task Delete_WithNonexistentId_ReturnsNotFound()
        {
            // Arrange
            int momentId = 9999;
            _mockMomentService.Setup(s => s.DeleteByIdAsync(momentId)).ReturnsAsync(false);

            // Act
            var result = await _controller.Delete(momentId);

            // Assert
            Assert.That(result, Is.InstanceOf<NotFoundResult>());
            _mockMomentService.Verify(s => s.DeleteByIdAsync(momentId), Times.Once);
        }

        [Test]
        public async Task UpdateMomentOwner_UserCannotEdit_ReturnsForbid()
        {
            // Arrange
            int momentId = 7;
            var user = new User { Id = 42, Email = "u@u.com", Name = "User" };
            _mockUserRepo.Setup(r => r.GetOrCreateUserByEmailAsync("u@u.com", It.IsAny<string?>())).ReturnsAsync(user);
            _mockMomentService.Setup(s => s.GetProjectIdForMomentAsync(momentId)).ReturnsAsync(99);
            _mockPermissionService.Setup(p => p.GetUserPermissionAsync(user.Id, 99)).ReturnsAsync(PermissionLevel.View);

            InitControllerWithUser("u@u.com", "uname");

            // Act
            var result = await _controller.UpdateMomentOwner(momentId, new UpdateMomentOwnerRequest { UserId = 5 });

            // Assert
            Assert.That(result.Result, Is.TypeOf<ForbidResult>());
            _mockMomentService.Verify(s => s.AssignOwnerAsync(It.IsAny<int>(), It.IsAny<int?>()), Times.Never);
        }

        [Test]
        public async Task UpdateMomentOwner_Success_ReturnsOkWithDto()
        {
            // Arrange
            int momentId = 3;
            int newOwnerId = 99;
            var user = new User { Id = 2, Email = "a@b.com", Name = "A" };
            _mockUserRepo.Setup(r => r.GetOrCreateUserByEmailAsync("a@b.com", It.IsAny<string?>())).ReturnsAsync(user);
            _mockMomentService.Setup(s => s.GetProjectIdForMomentAsync(momentId)).ReturnsAsync(7);
            _mockPermissionService.Setup(p => p.GetUserPermissionAsync(user.Id, 7)).ReturnsAsync(PermissionLevel.Edit);

            var returnedMoment = new Moment { Id = momentId, OwnerId = newOwnerId };
            _mockMomentService.Setup(s => s.AssignOwnerAsync(momentId, newOwnerId)).ReturnsAsync(returnedMoment);

            _mockMapper.Setup(m => m.Map(returnedMoment, _mockMomentService.Object))
                .Returns(new MomentDTO { Id = momentId, OwnerId = newOwnerId });

            InitControllerWithUser("a@b.com", "a");

            // Act
            var result = await _controller.UpdateMomentOwner(momentId, new UpdateMomentOwnerRequest { UserId = newOwnerId });

            // Assert
            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var ok = result.Result as OkObjectResult;
            var dto = ok!.Value as MomentDTO;
            Assert.That(dto, Is.Not.Null);
            Assert.That(dto!.OwnerId, Is.EqualTo(newOwnerId));
            _mockMomentService.Verify(s => s.AssignOwnerAsync(momentId, newOwnerId), Times.Once);
        }

        [Test]
        public async Task UpdateMomentOwner_WhenServiceThrowsKeyNotFound_ReturnsNotFound()
        {
            // Arrange
            int momentId = 55;
            var user = new User { Id = 10, Email = "x@y.com", Name = "X" };
            _mockUserRepo.Setup(r => r.GetOrCreateUserByEmailAsync("x@y.com", It.IsAny<string?>())).ReturnsAsync(user);
            _mockMomentService.Setup(s => s.GetProjectIdForMomentAsync(momentId)).ReturnsAsync(2);
            _mockPermissionService.Setup(p => p.GetUserPermissionAsync(user.Id, 2)).ReturnsAsync(PermissionLevel.Edit);

            _mockMomentService.Setup(s => s.AssignOwnerAsync(momentId, 123)).ThrowsAsync(new KeyNotFoundException("not found"));

            InitControllerWithUser("x@y.com", "x");

            // Act
            var result = await _controller.UpdateMomentOwner(momentId, new UpdateMomentOwnerRequest { UserId = 123 });

            // Assert
            Assert.That(result.Result, Is.InstanceOf<NotFoundObjectResult>());
        }

        [Test]
        public async Task UpdateMomentOwner_WithNullUserId_UnassignsExistingOwnerAndReturnsOk()
        {
            // Arrange
            int momentId = 88;
            int previousOwnerId = 17;
            var user = new User { Id = 5, Email = "y@z.com", Name = "Y" };
            _mockUserRepo.Setup(r => r.GetOrCreateUserByEmailAsync("y@z.com", It.IsAny<string?>())).ReturnsAsync(user);
            _mockMomentService.Setup(s => s.GetProjectIdForMomentAsync(momentId)).ReturnsAsync(11);
            _mockPermissionService.Setup(p => p.GetUserPermissionAsync(user.Id, 11)).ReturnsAsync(PermissionLevel.Edit);

            // Simulate clearing an existing owner to null.
            var momentWithExistingOwner = new Moment { Id = momentId, OwnerId = previousOwnerId };
            var returnedMoment = new Moment { Id = momentId, OwnerId = null };
            _mockMomentService.Setup(s => s.AssignOwnerAsync(momentId, null)).ReturnsAsync(returnedMoment);

            _mockMapper.Setup(m => m.Map(returnedMoment, _mockMomentService.Object))
                .Returns(new MomentDTO { Id = momentId, OwnerId = null });

            InitControllerWithUser("y@z.com", "y");

            // Act
            var result = await _controller.UpdateMomentOwner(momentId, new UpdateMomentOwnerRequest { UserId = null });

            _mockMomentService.Verify(s => s.AssignOwnerAsync(momentId, null), Times.Once);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var ok = result.Result as OkObjectResult;
            var dto = ok!.Value as MomentDTO;
            Assert.That(dto, Is.Not.Null);
            Assert.That(dto!.OwnerId, Is.Null);
        }
    }
}
