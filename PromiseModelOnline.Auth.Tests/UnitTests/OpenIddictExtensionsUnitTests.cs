using System.Reflection;
using Microsoft.Extensions.Configuration;
using Moq;
using OpenIddict.Abstractions;
using PromiseModelOnline.Auth.Common;

namespace PromiseModelOnline.Auth.Tests;

[TestFixture]
public class OpenIddictExtensionsUnitTests
{
    [SetUp]
    public void SetUp() => AppUrls.BaseUrl = "https://app.example.com";
    private static void InvokeAddPermissions(OpenIddictApplicationDescriptor descriptor)
    {
        var method = typeof(PromiseModelOnline.Auth.Extensions.OpenIddictExtensions).GetMethod("AddPermissions",
            BindingFlags.NonPublic | BindingFlags.Static)
            ?? throw new InvalidOperationException("AddPermissions method not found");
        method.Invoke(null, [descriptor]);
    }

    [Test]
    public void AddPermissions_AddsAllEndpointPermissions()
    {
        var descriptor = new OpenIddictApplicationDescriptor();
        InvokeAddPermissions(descriptor);

        Assert.That(descriptor.Permissions, Does.Contain(OpenIddictConstants.Permissions.Endpoints.Authorization));
        Assert.That(descriptor.Permissions, Does.Contain(OpenIddictConstants.Permissions.Endpoints.Token));
        Assert.That(descriptor.Permissions, Does.Contain(OpenIddictConstants.Permissions.Endpoints.EndSession));
        Assert.That(descriptor.Permissions, Does.Contain(OpenIddictConstants.Permissions.Endpoints.Revocation));
    }

    [Test]
    public void AddPermissions_AddsAllGrantTypeAndResponseTypePermissions()
    {
        var descriptor = new OpenIddictApplicationDescriptor();
        InvokeAddPermissions(descriptor);

        Assert.That(descriptor.Permissions, Does.Contain(OpenIddictConstants.Permissions.GrantTypes.AuthorizationCode));
        Assert.That(descriptor.Permissions, Does.Contain(OpenIddictConstants.Permissions.GrantTypes.RefreshToken));
        Assert.That(descriptor.Permissions, Does.Contain(OpenIddictConstants.Permissions.ResponseTypes.Code));
    }

    [Test]
    public void AddPermissions_AddsAllScopePermissions()
    {
        var descriptor = new OpenIddictApplicationDescriptor();
        InvokeAddPermissions(descriptor);

        Assert.That(descriptor.Permissions, Does.Contain(OpenIddictConstants.Permissions.Prefixes.Scope + OpenIddictConstants.Scopes.OpenId));
        Assert.That(descriptor.Permissions, Does.Contain(OpenIddictConstants.Permissions.Prefixes.Scope + OpenIddictConstants.Scopes.Profile));
        Assert.That(descriptor.Permissions, Does.Contain(OpenIddictConstants.Permissions.Prefixes.Scope + OpenIddictConstants.Scopes.Email));
        Assert.That(descriptor.Permissions, Does.Contain(OpenIddictConstants.Permissions.Prefixes.Scope + OpenIddictConstants.Scopes.OfflineAccess));
        Assert.That(descriptor.Permissions, Does.Contain("scp:projects.read"));
        Assert.That(descriptor.Permissions, Does.Contain("scp:projects.write"));
    }

    [Test]
    public void AddPermissions_AddsProofKeyForCodeExchangeRequirement()
    {
        var descriptor = new OpenIddictApplicationDescriptor();
        InvokeAddPermissions(descriptor);

        Assert.That(descriptor.Requirements, Does.Contain(OpenIddictConstants.Requirements.Features.ProofKeyForCodeExchange));
    }

    [Test]
    public void AddPermissions_AddsExpectedTotalPermissionCount()
    {
        var descriptor = new OpenIddictApplicationDescriptor();
        InvokeAddPermissions(descriptor);

        Assert.That(descriptor.Permissions, Has.Count.EqualTo(13));
    }

    [Test]
    public async Task SeedAsync_WhenClientDoesNotExist_CreatesNewApplication()
    {
        var appManagerMock = new Mock<IOpenIddictApplicationManager>();
        var configMock = new Mock<IConfiguration>();
        var serviceProviderMock = new Mock<IServiceProvider>();

        serviceProviderMock
            .Setup(s => s.GetService(typeof(IOpenIddictApplicationManager)))
            .Returns(appManagerMock.Object);
        serviceProviderMock
            .Setup(s => s.GetService(typeof(IConfiguration)))
            .Returns(configMock.Object);

        configMock
            .Setup(c => c[It.IsAny<string>()])
            .Returns((string?)null);

        appManagerMock
            .Setup(m => m.FindByClientIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((object?)null);

        appManagerMock
            .Setup(m => m.CreateAsync(It.IsAny<OpenIddictApplicationDescriptor>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new object());

        await PromiseModelOnline.Auth.Extensions.OpenIddictExtensions.SeedAsync(serviceProviderMock.Object);

        appManagerMock.Verify(m => m.CreateAsync(
            It.IsAny<OpenIddictApplicationDescriptor>(),
            It.IsAny<CancellationToken>()), Times.Once);
        appManagerMock.Verify(m => m.UpdateAsync(
            It.IsAny<object>(),
            It.IsAny<OpenIddictApplicationDescriptor>(),
            It.IsAny<CancellationToken>()), Times.Never);
    }

    [Test]
    public async Task SeedAsync_WhenClientExists_UpdatesExistingApplication()
    {
        var appManagerMock = new Mock<IOpenIddictApplicationManager>();
        var configMock = new Mock<IConfiguration>();
        var serviceProviderMock = new Mock<IServiceProvider>();

        serviceProviderMock
            .Setup(s => s.GetService(typeof(IOpenIddictApplicationManager)))
            .Returns(appManagerMock.Object);
        serviceProviderMock
            .Setup(s => s.GetService(typeof(IConfiguration)))
            .Returns(configMock.Object);

        configMock
            .Setup(c => c[It.IsAny<string>()])
            .Returns((string?)null);

        var existingApp = new object();
        appManagerMock
            .Setup(m => m.FindByClientIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingApp);

        appManagerMock
            .Setup(m => m.UpdateAsync(It.IsAny<object>(), It.IsAny<OpenIddictApplicationDescriptor>(), It.IsAny<CancellationToken>()))
            .Returns(ValueTask.CompletedTask);

        await PromiseModelOnline.Auth.Extensions.OpenIddictExtensions.SeedAsync(serviceProviderMock.Object);

        appManagerMock.Verify(m => m.CreateAsync(
            It.IsAny<OpenIddictApplicationDescriptor>(),
            It.IsAny<CancellationToken>()), Times.Never);
        appManagerMock.Verify(m => m.UpdateAsync(
            existingApp,
            It.IsAny<OpenIddictApplicationDescriptor>(),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Test]
    public async Task SeedAsync_WithAdditionalRedirectUris_AddsExtraUris()
    {
        var appManagerMock = new Mock<IOpenIddictApplicationManager>();
        var configMock = new Mock<IConfiguration>();
        var serviceProviderMock = new Mock<IServiceProvider>();

        serviceProviderMock
            .Setup(s => s.GetService(typeof(IOpenIddictApplicationManager)))
            .Returns(appManagerMock.Object);
        serviceProviderMock
            .Setup(s => s.GetService(typeof(IConfiguration)))
            .Returns(configMock.Object);

        configMock
            .Setup(c => c[It.IsAny<string>()])
            .Returns((string?)null);

        appManagerMock
            .Setup(m => m.FindByClientIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((object?)null);

        appManagerMock
            .Setup(m => m.CreateAsync(It.IsAny<OpenIddictApplicationDescriptor>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new object());

        configMock
            .Setup(c => c["Auth:AdditionalRedirectUris"])
            .Returns("https://other.example.com/callback,https://another.example.com/callback");

        await PromiseModelOnline.Auth.Extensions.OpenIddictExtensions.SeedAsync(serviceProviderMock.Object);

        appManagerMock.Verify(m => m.CreateAsync(
            It.Is<OpenIddictApplicationDescriptor>(d =>
                d.RedirectUris.Count == 3 &&
                d.RedirectUris.Any(u => u.ToString().Contains("other.example.com")) &&
                d.RedirectUris.Any(u => u.ToString().Contains("another.example.com"))),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Test]
    public async Task SeedAsync_SetsCorrectDescriptorProperties()
    {
        var appManagerMock = new Mock<IOpenIddictApplicationManager>();
        var configMock = new Mock<IConfiguration>();
        var serviceProviderMock = new Mock<IServiceProvider>();

        serviceProviderMock
            .Setup(s => s.GetService(typeof(IOpenIddictApplicationManager)))
            .Returns(appManagerMock.Object);
        serviceProviderMock
            .Setup(s => s.GetService(typeof(IConfiguration)))
            .Returns(configMock.Object);

        configMock
            .Setup(c => c[It.IsAny<string>()])
            .Returns((string?)null);

        appManagerMock
            .Setup(m => m.FindByClientIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((object?)null);

        appManagerMock
            .Setup(m => m.CreateAsync(It.IsAny<OpenIddictApplicationDescriptor>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new object());

        await PromiseModelOnline.Auth.Extensions.OpenIddictExtensions.SeedAsync(serviceProviderMock.Object);

        appManagerMock.Verify(m => m.CreateAsync(
            It.Is<OpenIddictApplicationDescriptor>(d =>
                d.ClientId == "pmo-spa" &&
                d.ClientType == OpenIddictConstants.ClientTypes.Public &&
                d.ConsentType == OpenIddictConstants.ConsentTypes.Implicit &&
                d.DisplayName == "PMO BFF Client" &&
                d.RedirectUris.Count == 1 &&
                d.PostLogoutRedirectUris.Count == 1 &&
                d.Permissions.Contains(OpenIddictConstants.Permissions.Endpoints.Authorization) &&
                d.Permissions.Contains(OpenIddictConstants.Permissions.GrantTypes.AuthorizationCode) &&
                d.Requirements.Contains(OpenIddictConstants.Requirements.Features.ProofKeyForCodeExchange)),
            It.IsAny<CancellationToken>()), Times.Once);
    }
}
