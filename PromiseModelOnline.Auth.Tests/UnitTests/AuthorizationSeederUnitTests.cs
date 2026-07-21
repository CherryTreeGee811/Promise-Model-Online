using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Moq;
using OpenIddict.Abstractions;
using PromiseModelOnline.Auth.Extensions;

namespace PromiseModelOnline.Auth.Tests;

[TestFixture]
public class AuthorizationSeederUnitTests
{
    private Mock<IWebHostEnvironment> _envMock = null!;
    private Mock<IServiceProvider> _serviceProviderMock = null!;
    private Mock<IServiceScopeFactory> _scopeFactoryMock = null!;
    private Mock<IServiceScope> _scopeMock = null!;
    private Mock<IServiceProvider> _scopeServiceProviderMock = null!;
    private Mock<UserManager<IdentityUser>> _userManagerMock = null!;
    private Mock<IOpenIddictScopeManager> _scopeManagerMock = null!;

    [SetUp]
    public void SetUp()
    {
        _envMock = new Mock<IWebHostEnvironment>();

        _scopeFactoryMock = new Mock<IServiceScopeFactory>();
        _scopeMock = new Mock<IServiceScope>();
        _scopeServiceProviderMock = new Mock<IServiceProvider>();

        var userStore = new Mock<IUserStore<IdentityUser>>();
        _userManagerMock = new Mock<UserManager<IdentityUser>>(
            userStore.Object, null!, null!, null!, null!, null!, null!, null!, null!);

        _scopeManagerMock = new Mock<IOpenIddictScopeManager>();

        _serviceProviderMock = new Mock<IServiceProvider>();

        _serviceProviderMock
            .Setup(s => s.GetService(typeof(IWebHostEnvironment)))
            .Returns(_envMock.Object);

        _serviceProviderMock
            .Setup(s => s.GetService(typeof(IServiceScopeFactory)))
            .Returns(_scopeFactoryMock.Object);

        _scopeFactoryMock
            .Setup(f => f.CreateScope())
            .Returns(_scopeMock.Object);

        _scopeMock
            .Setup(s => s.ServiceProvider)
            .Returns(_scopeServiceProviderMock.Object);

        _scopeServiceProviderMock
            .Setup(s => s.GetService(typeof(UserManager<IdentityUser>)))
            .Returns(_userManagerMock.Object);

        _scopeServiceProviderMock
            .Setup(s => s.GetService(typeof(IOpenIddictScopeManager)))
            .Returns(_scopeManagerMock.Object);
    }

    [Test]
    public async Task SeedAsync_NonDevelopmentEnvironment_ReturnsEarly()
    {
        // Arrange
        _envMock.Setup(e => e.EnvironmentName).Returns("Production");

        // Act
        await AuthorizationSeeder.SeedAsync(_serviceProviderMock.Object);

        // Assert
        _scopeFactoryMock.Verify(f => f.CreateScope(), Times.Never);
    }

    [Test]
    public async Task SeedAsync_DevelopmentEnvironment_SeedsUsersAndScopes()
    {
        // Arrange
        _envMock.Setup(e => e.EnvironmentName).Returns("Development");

        _userManagerMock
            .Setup(m => m.FindByNameAsync("pmo_test"))
            .ReturnsAsync((IdentityUser?)null);
        _userManagerMock
            .Setup(m => m.FindByNameAsync("pmo_test2"))
            .ReturnsAsync((IdentityUser?)null);

        _userManagerMock
            .Setup(m => m.CreateAsync(It.IsAny<IdentityUser>(), "Hello123*"))
            .ReturnsAsync(IdentityResult.Success);

        _scopeManagerMock
            .Setup(m => m.FindByNameAsync("projects.read", It.IsAny<CancellationToken>()))
            .ReturnsAsync((object?)null);
        _scopeManagerMock
            .Setup(m => m.FindByNameAsync("projects.write", It.IsAny<CancellationToken>()))
            .ReturnsAsync((object?)null);
        _scopeManagerMock
            .Setup(m => m.CreateAsync(It.IsAny<OpenIddictScopeDescriptor>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new object());

        // Act
        await AuthorizationSeeder.SeedAsync(_serviceProviderMock.Object);

        // Assert
        _userManagerMock.Verify(m => m.CreateAsync(
            It.Is<IdentityUser>(u =>
                u.UserName == "pmo_test" &&
                u.Email == "pmo@gmail.com" &&
                u.EmailConfirmed),
            "Hello123*"), Times.Once);

        _userManagerMock.Verify(m => m.CreateAsync(
            It.Is<IdentityUser>(u =>
                u.UserName == "pmo_test2" &&
                u.Email == "pmo2@gmail.com" &&
                u.EmailConfirmed),
            "Hello123*"), Times.Once);

        _scopeManagerMock.Verify(m => m.CreateAsync(
            It.Is<OpenIddictScopeDescriptor>(d => d.Name == "projects.read"),
            It.IsAny<CancellationToken>()), Times.Once);

        _scopeManagerMock.Verify(m => m.CreateAsync(
            It.Is<OpenIddictScopeDescriptor>(d => d.Name == "projects.write"),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Test]
    public async Task SeedAsync_ExistingUsers_DoesNotReSeed()
    {
        // Arrange
        _envMock.Setup(e => e.EnvironmentName).Returns("Development");

        var existingUser1 = new IdentityUser { UserName = "pmo_test", Email = "pmo@gmail.com" };
        var existingUser2 = new IdentityUser { UserName = "pmo_test2", Email = "pmo2@gmail.com" };

        _userManagerMock
            .Setup(m => m.FindByNameAsync("pmo_test"))
            .ReturnsAsync(existingUser1);
        _userManagerMock
            .Setup(m => m.FindByNameAsync("pmo_test2"))
            .ReturnsAsync(existingUser2);

        _scopeManagerMock
            .Setup(m => m.FindByNameAsync("projects.read", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new object());
        _scopeManagerMock
            .Setup(m => m.FindByNameAsync("projects.write", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new object());

        // Act
        await AuthorizationSeeder.SeedAsync(_serviceProviderMock.Object);

        // Assert
        _userManagerMock.Verify(m => m.CreateAsync(It.IsAny<IdentityUser>(), It.IsAny<string>()), Times.Never);
    }

    [Test]
    public async Task SeedAsync_ExistingScopes_DoesNotReSeed()
    {
        // Arrange
        _envMock.Setup(e => e.EnvironmentName).Returns("Development");

        _userManagerMock
            .Setup(m => m.FindByNameAsync("pmo_test"))
            .ReturnsAsync((IdentityUser?)null);
        _userManagerMock
            .Setup(m => m.FindByNameAsync("pmo_test2"))
            .ReturnsAsync((IdentityUser?)null);

        _userManagerMock
            .Setup(m => m.CreateAsync(It.IsAny<IdentityUser>(), "Hello123*"))
            .ReturnsAsync(IdentityResult.Success);

        _scopeManagerMock
            .Setup(m => m.FindByNameAsync("projects.read", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new object());
        _scopeManagerMock
            .Setup(m => m.FindByNameAsync("projects.write", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new object());

        // Act
        await AuthorizationSeeder.SeedAsync(_serviceProviderMock.Object);

        // Assert
        _scopeManagerMock.Verify(m => m.CreateAsync(
            It.IsAny<OpenIddictScopeDescriptor>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}
