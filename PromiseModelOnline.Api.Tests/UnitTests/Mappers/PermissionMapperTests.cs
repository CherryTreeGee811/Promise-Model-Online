using NUnit.Framework;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Enums;
using PromiseModelOnline.Api.Mappers;
using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.Tests.UnitTests.Mappers;

/// <summary>Unit tests for <see cref="PermissionMapper"/>.</summary>
// Requirements: REQ_MAP
public class PermissionMapperTests
{
    [Test]
    [Description("REQ_MAP - Maps a permission with a user to a PermissionDto with all properties populated.")]
    public void Map_WithUser_MapsAllProperties()
    {
        // Arrange
        var user = new User { Id = 1, Name = "Alice", Slug = "alice", Email = "alice@example.com" };
        var permission = new Permission
        {
            Id = 1,
            UserId = 1,
            User = user,
            ProjectId = 5,
            Level = PermissionLevel.Edit,
            Status = PermissionStatus.Active
        };
        var mapper = new PermissionMapper();

        // Act
        var result = mapper.Map(permission, null!);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(result.Id, Is.EqualTo(1));
            Assert.That(result.UserId, Is.EqualTo(1));
            Assert.That(result.UserName, Is.EqualTo("alice"));
            Assert.That(result.ProjectId, Is.EqualTo(5));
            Assert.That(result.Level, Is.EqualTo("Edit"));
            Assert.That(result.Status, Is.EqualTo("Active"));
        });
    }

    [Test]
    [Description("REQ_MAP - Maps a permission with null user; UserName falls back to 'Unknown'.")]
    public void Map_WithNullUser_FallsBackToUnknown()
    {
        // Arrange
        var permission = new Permission
        {
            Id = 1,
            UserId = 1,
            User = null!,
            ProjectId = 5,
            Level = PermissionLevel.View,
            Status = PermissionStatus.Pending
        };
        var mapper = new PermissionMapper();

        // Act
        var result = mapper.Map(permission, null!);

        // Assert
        Assert.That(result.UserName, Is.EqualTo("Unknown"));
    }

    [Test]
    [Description("REQ_MAP - Maps permissions with each PermissionLevel; Level converts to corresponding string.")]
    public void Map_WithDifferentLevels_ConvertsToString()
    {
        // Arrange
        var mapper = new PermissionMapper();

        // Act
        var viewResult = mapper.Map(new Permission { Id = 1, UserId = 1, User = null!, ProjectId = 1, Level = PermissionLevel.View, Status = PermissionStatus.Active }, null!);
        var commentResult = mapper.Map(new Permission { Id = 2, UserId = 1, User = null!, ProjectId = 1, Level = PermissionLevel.Comment, Status = PermissionStatus.Active }, null!);
        var editResult = mapper.Map(new Permission { Id = 3, UserId = 1, User = null!, ProjectId = 1, Level = PermissionLevel.Edit, Status = PermissionStatus.Active }, null!);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(viewResult.Level, Is.EqualTo("View"));
            Assert.That(commentResult.Level, Is.EqualTo("Comment"));
            Assert.That(editResult.Level, Is.EqualTo("Edit"));
        });
    }

    [Test]
    [Description("REQ_MAP - Maps permissions with each PermissionStatus; Status converts to corresponding string.")]
    public void Map_WithDifferentStatuses_ConvertsToString()
    {
        // Arrange
        var mapper = new PermissionMapper();

        // Act
        var pendingResult = mapper.Map(new Permission { Id = 1, UserId = 1, User = null!, ProjectId = 1, Level = PermissionLevel.View, Status = PermissionStatus.Pending }, null!);
        var activeResult = mapper.Map(new Permission { Id = 2, UserId = 1, User = null!, ProjectId = 1, Level = PermissionLevel.View, Status = PermissionStatus.Active }, null!);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(pendingResult.Status, Is.EqualTo("Pending"));
            Assert.That(activeResult.Status, Is.EqualTo("Active"));
        });
    }
}
