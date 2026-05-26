using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;
using PromiseModelOnline.Api.Enums;
using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.Tests.Helpers
{
    public static class ControllerTestHelper
    {
        public static void SetupAuthenticatedUser(
            ControllerBase controller,
            Mock<IUserRepository> userRepoMock,
            Mock<IPermissionService>? permissionMock = null,
            int userId = 1)
        {
            var user = new User
            {
                Id = userId,
                Email = "user@test.com",
                Name = "Test User"
            };

            userRepoMock
                .Setup(r => r.GetOrCreateUserByEmailAsync(
                    It.IsAny<string>(),
                    It.IsAny<string?>()))
                .ReturnsAsync(user);

            if (permissionMock != null)
            {
                permissionMock
                    .Setup(p => p.HasPermissionAsync(
                        It.IsAny<int>(),
                        It.IsAny<int>(),
                        It.IsAny<PermissionLevel>()))
                    .ReturnsAsync(true);
            }

            var identity = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.Email, "user@test.com"),
                new Claim("nameid", "tester")
            }, "test");

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(identity)
                }
            };
        }
    }
}