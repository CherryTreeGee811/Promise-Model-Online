namespace PromiseModelOnline.Auth.Tests
{
	using System;
	using System.Reflection;
	using System.Threading.Tasks;
	using Microsoft.AspNetCore.Http;
	using Microsoft.AspNetCore.Identity;
	using Microsoft.AspNetCore.Mvc;
	using Microsoft.Extensions.Configuration;
	using Moq;
	using NUnit.Framework;
	using PromiseModelOnline.Auth.Controllers;
	using PromiseModelOnline.Auth.Models;

	public class RegisterControllerUnitTests
	{
		private Mock<IConfiguration> _configMock;
		private Mock<UserManager<IdentityUser>> _userManagerMock;
		private RegisterController _controller;

		[SetUp]
		public void Setup()
		{
			_configMock = new Mock<IConfiguration>();

			var store = new Mock<IUserStore<IdentityUser>>();
			_userManagerMock = new Mock<UserManager<IdentityUser>>(store.Object, null!, null!, null!, null!, null!, null!, null!, null!);

			_controller = new RegisterController(_configMock.Object, _userManagerMock.Object)
			{
				ControllerContext = new ControllerContext
				{
					HttpContext = new DefaultHttpContext(),
				},
			};
		}

		[Test]
		public async Task Register_RequiredRegistrationKey_MissingHeader_ReturnsForbid()
		{
			_configMock.SetupGet(x => x["Auth:RegistrationKey"]).Returns("required-key");

			var result = await _controller.Register(new RegisterRequest
			{
				UserName = "user",
				Email = "user@example.com",
				Password = "pass",
			});

			Assert.That(result, Is.TypeOf<ForbidResult>());
			_userManagerMock.Verify(x => x.FindByNameAsync(It.IsAny<string>()), Times.Never);
			_userManagerMock.Verify(x => x.CreateAsync(It.IsAny<IdentityUser>(), It.IsAny<string>()), Times.Never);
		}

		[Test]
		public async Task Register_RequiredRegistrationKey_WrongHeader_ReturnsForbid()
		{
			_configMock.SetupGet(x => x["Auth:RegistrationKey"]).Returns("required-key");
			_controller.Request.Headers["X-Registration-Key"] = "wrong-key";

			var result = await _controller.Register(new RegisterRequest
			{
				UserName = "user",
				Email = "user@example.com",
				Password = "pass",
			});

			Assert.That(result, Is.TypeOf<ForbidResult>());
			_userManagerMock.Verify(x => x.FindByNameAsync(It.IsAny<string>()), Times.Never);
			_userManagerMock.Verify(x => x.CreateAsync(It.IsAny<IdentityUser>(), It.IsAny<string>()), Times.Never);
		}

		[Test]
		public async Task Register_RequiredRegistrationKey_CorrectHeader_DoesNotForbid()
		{
			_configMock.SetupGet(x => x["Auth:RegistrationKey"]).Returns("required-key");
			_controller.Request.Headers["X-Registration-Key"] = "required-key";

			var result = await _controller.Register(new RegisterRequest
			{
				UserName = "",
				Email = "user@example.com",
				Password = "pass",
			});

			Assert.That(result, Is.TypeOf<BadRequestObjectResult>());
		}

		[Test]
		public async Task Register_NoRequiredKey_NullRequest_ReturnsBadRequest()
		{
			_configMock.SetupGet(x => x["Auth:RegistrationKey"]).Returns(string.Empty);

			var result = await _controller.Register(null!);

			Assert.That(result, Is.TypeOf<BadRequestObjectResult>());
			var badRequest = (BadRequestObjectResult)result;
			Assert.That(badRequest.Value, Is.EqualTo("UserName, Email and Password are required."));
		}

		[Test]
		public async Task Register_NoRequiredKey_MissingFields_ReturnsBadRequest()
		{
			_configMock.SetupGet(x => x["Auth:RegistrationKey"]).Returns(string.Empty);

			var result = await _controller.Register(new RegisterRequest
			{
				UserName = "user",
				Email = "",
				Password = "pass",
			});

			Assert.That(result, Is.TypeOf<BadRequestObjectResult>());
		}

		[Test]
		public async Task Register_UserAlreadyExists_ReturnsConflict()
		{
			_configMock.SetupGet(x => x["Auth:RegistrationKey"]).Returns(string.Empty);
			_userManagerMock
				.Setup(x => x.FindByNameAsync("existing"))
				.ReturnsAsync(new IdentityUser { Id = "id1", UserName = "existing" });

			var result = await _controller.Register(new RegisterRequest
			{
				UserName = "existing",
				Email = "existing@example.com",
				Password = "pass",
			});

			Assert.That(result, Is.TypeOf<ConflictObjectResult>());
			var conflict = (ConflictObjectResult)result;
			Assert.That(GetAnonymousProperty(conflict.Value, "message"), Is.EqualTo("The username provided Is already taken"));

			_userManagerMock.Verify(x => x.CreateAsync(It.IsAny<IdentityUser>(), It.IsAny<string>()), Times.Never);
		}

		[Test]
		public async Task Register_CreateFails_ReturnsBadRequestWithErrors()
		{
			_configMock.SetupGet(x => x["Auth:RegistrationKey"]).Returns(string.Empty);
			_userManagerMock
				.Setup(x => x.FindByNameAsync("newuser"))
				.ReturnsAsync((IdentityUser?)null);

			_userManagerMock
				.Setup(x => x.CreateAsync(It.IsAny<IdentityUser>(), "pass"))
				.ReturnsAsync(IdentityResult.Failed(
					new IdentityError { Description = "err1" },
					new IdentityError { Description = "err2" }));

			var result = await _controller.Register(new RegisterRequest
			{
				UserName = "newuser",
				Email = "newuser@example.com",
				Password = "pass",
			});

			Assert.That(result, Is.TypeOf<BadRequestObjectResult>());
			var bad = (BadRequestObjectResult)result;
			Assert.That(GetAnonymousProperty(bad.Value, "message"), Is.EqualTo("Could not create user"));
			var errors = GetAnonymousProperty(bad.Value, "errors") as string;
			Assert.That(errors, Is.Not.Null);
			Assert.That(errors!, Does.Contain("err1"));
			Assert.That(errors!, Does.Contain("err2"));
		}

		[Test]
		public async Task Register_CreateSucceeds_ReturnsCreatedResponse()
		{
			_configMock.SetupGet(x => x["Auth:RegistrationKey"]).Returns(string.Empty);
			_userManagerMock
				.Setup(x => x.FindByNameAsync("newuser"))
				.ReturnsAsync((IdentityUser?)null);

			IdentityUser? createdUser = null;
			string? createdPassword = null;

			_userManagerMock
				.Setup(x => x.CreateAsync(It.IsAny<IdentityUser>(), It.IsAny<string>()))
				.Callback<IdentityUser, string>((u, p) =>
				{
					createdUser = u;
					createdPassword = p;
				})
				.ReturnsAsync(IdentityResult.Success);

			var result = await _controller.Register(new RegisterRequest
			{
				UserName = "newuser",
				Email = "newuser@example.com",
				Password = "pass",
			});

			Assert.That(result, Is.TypeOf<CreatedResult>());
			var created = (CreatedResult)result;
			Assert.That(created.Value, Is.TypeOf<RegisterResponse>());
			var resp = (RegisterResponse)created.Value!;
			Assert.That(resp.Created, Is.True);
			Assert.That(resp.UserName, Is.EqualTo("newuser"));
			Assert.That(resp.Email, Is.EqualTo("newuser@example.com"));

			Assert.That(createdUser, Is.Not.Null);
			Assert.That(createdPassword, Is.EqualTo("pass"));
			Assert.That(createdUser!.EmailConfirmed, Is.True);
			Assert.That(createdUser.UserName, Is.EqualTo("newuser"));
			Assert.That(createdUser.Email, Is.EqualTo("newuser@example.com"));
		}

		private static object? GetAnonymousProperty(object? obj, string propertyName)
		{
			if (obj == null)
			{
				return null;
			}

			var type = obj.GetType();
			var prop = type.GetProperty(propertyName, BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase);
			return prop?.GetValue(obj);
		}
	}
}

