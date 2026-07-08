using System;
using System.Collections.Generic;
using NUnit.Framework;
using PMO.Core.Models;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Enums;
using PromiseModelOnline.Api.Mappers;
using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.Tests.UnitTests.Mappers;

/// <summary>Unit tests for <see cref="GenericMapper{TSource, TDestination}"/>.</summary>
// Requirements: REQ_MAP
public class GenericMapperTests
{
    private class SimpleSource
    {
        public int Id { get; set; }
        public string Name { get; set; } = "";
    }

    private class SimpleDest
    {
        public int Id { get; set; }
        public string Name { get; set; } = "";
    }

    [Test]
    [Description("REQ_MAP - Copies matching properties by name and type between simple classes using convention-based mapping.")]
    public void Map_SimpleTypes_CopiesMatchingProperties()
    {
        // Arrange
        var source = new SimpleSource { Id = 42, Name = "Test" };
        var mapper = new GenericMapper<SimpleSource, SimpleDest>();

        // Act
        var result = mapper.Map(source, null!);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(result.Id, Is.EqualTo(42));
            Assert.That(result.Name, Is.EqualTo("Test"));
        });
    }

    [Test]
    [Description("REQ_MAP - Maps a Moment with tasks to a MomentDto with the Tasks list populated from Moment.Tasks.")]
    public void Map_MomentToMomentDto_PopulatesTasks()
    {
        // Arrange
        var now = DateTime.UtcNow;
        var tasks = new List<MomentTask>
        {
            new MomentTask
            {
                Id = 1,
                Name = "Task 1",
                Description = "Desc 1",
                MomentId = 10,
                OwnerId = 1,
                IsCompleted = true,
                CreatedAt = now,
                CompletedAt = now
            },
            new MomentTask
            {
                Id = 2,
                Name = "Task 2",
                Description = "Desc 2",
                MomentId = 10,
                OwnerId = null,
                IsCompleted = false,
                CreatedAt = now,
                CompletedAt = null
            }
        };
        var moment = new Moment
        {
            Id = 10,
            Statement = "Test moment",
            Tasks = tasks
        };
        var mapper = new GenericMapper<Moment, MomentDto>();

        // Act
        var result = mapper.Map(moment, null!);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(result.Id, Is.EqualTo(10));
            Assert.That(result.Statement, Is.EqualTo("Test moment"));
            Assert.That(result.Tasks, Has.Count.EqualTo(2));
            Assert.That(result.Tasks[0].Id, Is.EqualTo(1));
            Assert.That(result.Tasks[0].Name, Is.EqualTo("Task 1"));
            Assert.That(result.Tasks[0].IsCompleted, Is.True);
            Assert.That(result.Tasks[1].Id, Is.EqualTo(2));
            Assert.That(result.Tasks[1].Name, Is.EqualTo("Task 2"));
            Assert.That(result.Tasks[1].IsCompleted, Is.False);
            Assert.That(result.Tasks[1].OwnerId, Is.Null);
        });
    }

    [Test]
    [Description("REQ_MAP - Maps a Moment with null tasks to a MomentDto with an empty Tasks list.")]
    public void Map_MomentToMomentDto_WithNullTasks_ReturnsEmptyList()
    {
        // Arrange
        var moment = new Moment
        {
            Id = 1,
            Statement = "No tasks",
            Tasks = null!
        };
        var mapper = new GenericMapper<Moment, MomentDto>();

        // Act
        var result = mapper.Map(moment, null!);

        // Assert
        Assert.That(result.Tasks, Is.Empty);
    }

    [Test]
    [Description("REQ_MAP - Maps a Project with an Owner to a ProjectDto with OwnerSlug populated from Owner.Slug.")]
    public void Map_ProjectToProjectDto_SetsOwnerSlug()
    {
        // Arrange
        var user = new User { Id = 1, Slug = "alice-slug" };
        var project = new Project
        {
            Id = 1,
            Name = "Test Project",
            Slug = "test-project",
            Owner = user,
            OwnerId = 1
        };
        var mapper = new GenericMapper<Project, ProjectDto>();

        // Act
        var result = mapper.Map(project, null!);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(result.Id, Is.EqualTo(1));
            Assert.That(result.Name, Is.EqualTo("Test Project"));
            Assert.That(result.Slug, Is.EqualTo("test-project"));
            Assert.That(result.OwnerSlug, Is.EqualTo("alice-slug"));
        });
    }

    [Test]
    [Description("REQ_MAP - Maps a Project with null Owner to a ProjectDto with an empty OwnerSlug.")]
    public void Map_ProjectToProjectDto_WithNullOwner_SetsEmptySlug()
    {
        // Arrange
        var project = new Project
        {
            Id = 1,
            Name = "Test",
            Slug = "test",
            Owner = null!,
            OwnerId = 1
        };
        var mapper = new GenericMapper<Project, ProjectDto>();

        // Act
        var result = mapper.Map(project, null!);

        // Assert
        Assert.That(result.OwnerSlug, Is.EqualTo(""));
    }

    [Test]
    [Description("REQ_MAP - Maps a Notification with an enum Type to a NotificationDto with Type as a string.")]
    public void Map_NotificationToNotificationDto_ConvertsTypeToString()
    {
        // Arrange
        var notification = new Notification
        {
            Id = 1,
            Type = NotificationType.Comment,
            Message = "Test notification",
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };
        var mapper = new GenericMapper<Notification, NotificationDto>();

        // Act
        var result = mapper.Map(notification, null!);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(result.Id, Is.EqualTo(1));
            Assert.That(result.Message, Is.EqualTo("Test notification"));
            Assert.That(result.Type, Is.EqualTo("Comment"));
            Assert.That(result.IsRead, Is.False);
        });
    }
}
