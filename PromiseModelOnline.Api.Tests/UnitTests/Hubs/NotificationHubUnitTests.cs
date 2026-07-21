using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Moq;
using NUnit.Framework;
using PromiseModelOnline.Api.Hubs;

namespace PromiseModelOnline.Api.Tests;

[TestFixture]
public class NotificationHubUnitTests
{
    private Mock<HubCallerContext> _contextMock = null!;
    private Mock<IGroupManager> _groupsMock = null!;
    private NotificationHub _hub = null!;

    [SetUp]
    public void SetUp()
    {
        _contextMock = new Mock<HubCallerContext>();
        _groupsMock = new Mock<IGroupManager>();
        _hub = new NotificationHub();

        _hub.Context = _contextMock.Object;
        _hub.Groups = _groupsMock.Object;
    }

    [TearDown]
    public void TearDown() => _hub.Dispose();

    [Test]
    public async Task REQ_FUN_XXX_OnConnectedAsync_WithSubClaim_AddsToGroup()
    {
        // Arrange
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim("sub", "user-abc"),
        }, "test"));
        _contextMock.Setup(c => c.User).Returns(user);
        _contextMock.Setup(c => c.ConnectionId).Returns("conn-1");

        // Act
        await _hub.OnConnectedAsync();

        // Assert
        _groupsMock.Verify(g => g.AddToGroupAsync("conn-1", "user-user-abc", default), Times.Once);
    }

    [Test]
    public async Task REQ_FUN_XXX_OnConnectedAsync_WithIdClaim_AddsToGroup()
    {
        // Arrange
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim("id", "user-xyz"),
        }, "test"));
        _contextMock.Setup(c => c.User).Returns(user);
        _contextMock.Setup(c => c.ConnectionId).Returns("conn-2");

        // Act
        await _hub.OnConnectedAsync();

        // Assert
        _groupsMock.Verify(g => g.AddToGroupAsync("conn-2", "user-user-xyz", default), Times.Once);
    }

    [Test]
    public async Task REQ_FUN_XXX_OnConnectedAsync_WithoutUser_DoesNotAddToGroup()
    {
        // Arrange
        _contextMock.Setup(c => c.User).Returns((ClaimsPrincipal?)null!);
        _contextMock.Setup(c => c.ConnectionId).Returns("conn-3");

        // Act
        await _hub.OnConnectedAsync();

        // Assert
        _groupsMock.Verify(g => g.AddToGroupAsync(It.IsAny<string>(), It.IsAny<string>(), default), Times.Never);
    }

    [Test]
    public async Task REQ_FUN_XXX_OnConnectedAsync_WithoutUserIdClaim_DoesNotAddToGroup()
    {
        // Arrange
        var user = new ClaimsPrincipal(new ClaimsIdentity("test"));
        _contextMock.Setup(c => c.User).Returns(user);
        _contextMock.Setup(c => c.ConnectionId).Returns("conn-4");

        // Act
        await _hub.OnConnectedAsync();

        // Assert
        _groupsMock.Verify(g => g.AddToGroupAsync(It.IsAny<string>(), It.IsAny<string>(), default), Times.Never);
    }

    [Test]
    public async Task REQ_FUN_XXX_OnDisconnectedAsync_WithSubClaim_RemovesFromGroup()
    {
        // Arrange
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim("sub", "user-abc"),
        }, "test"));
        _contextMock.Setup(c => c.User).Returns(user);
        _contextMock.Setup(c => c.ConnectionId).Returns("conn-1");

        // Act
        await _hub.OnDisconnectedAsync(null);

        // Assert
        _groupsMock.Verify(g => g.RemoveFromGroupAsync("conn-1", "user-user-abc", default), Times.Once);
    }

    [Test]
    public async Task REQ_FUN_XXX_OnDisconnectedAsync_WithoutUser_DoesNotRemoveFromGroup()
    {
        // Arrange
        _contextMock.Setup(c => c.User).Returns((ClaimsPrincipal?)null!);
        _contextMock.Setup(c => c.ConnectionId).Returns("conn-3");

        // Act
        await _hub.OnDisconnectedAsync(null);

        // Assert
        _groupsMock.Verify(g => g.RemoveFromGroupAsync(It.IsAny<string>(), It.IsAny<string>(), default), Times.Never);
    }
}
