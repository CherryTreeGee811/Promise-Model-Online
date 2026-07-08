using System;
using System.Collections.Generic;
using NUnit.Framework;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Mappers;
using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.Tests.UnitTests.Mappers;

/// <summary>Unit tests for <see cref="CommentMapper"/>.</summary>
// Requirements: REQ_MAP
public class CommentMapperTests
{
    [Test]
    [Description("REQ_MAP - Maps a comment with a user and mentions to a CommentDto with all properties populated.")]
    public void Map_WithUserAndMentions_MapsAllProperties()
    {
        // Arrange
        var user = new User { Id = 1, Name = "Alice" };
        var mentionUser = new User { Id = 2, Name = "Bob" };
        var mention = new CommentMention { Id = 1, MentionedUser = mentionUser };
        var comment = new Comment
        {
            Id = 10,
            Text = "Hello!",
            CreatedAt = new DateTime(2024, 1, 1, 12, 0, 0, DateTimeKind.Utc),
            User = user,
            ParentCommentId = null,
            Mentions = new List<CommentMention> { mention },
            Replies = new List<Comment>()
        };
        var mapper = new CommentMapper();

        // Act
        var result = mapper.Map(comment, null!);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(result.Id, Is.EqualTo(10));
            Assert.That(result.Text, Is.EqualTo("Hello!"));
            Assert.That(result.CreatedAt, Is.EqualTo(new DateTime(2024, 1, 1, 12, 0, 0, DateTimeKind.Utc)));
            Assert.That(result.UserName, Is.EqualTo("Alice"));
            Assert.That(result.ParentCommentId, Is.Null);
            Assert.That(result.MentionedUsers, Is.EquivalentTo(new List<string> { "Bob" }));
            Assert.That(result.Replies, Is.Empty);
        });
    }

    [Test]
    [Description("REQ_MAP - Maps a comment with a null user; UserName falls back to 'Unknown'.")]
    public void Map_WithNullUser_FallsBackToUnknown()
    {
        // Arrange
        var comment = new Comment
        {
            Id = 1,
            Text = "No user",
            CreatedAt = DateTime.UtcNow,
            User = null!,
            Mentions = new List<CommentMention>(),
            Replies = new List<Comment>()
        };
        var mapper = new CommentMapper();

        // Act
        var result = mapper.Map(comment, null!);

        // Assert
        Assert.That(result.UserName, Is.EqualTo("Unknown"));
    }

    [Test]
    [Description("REQ_MAP - Maps a comment with nested replies recursively.")]
    public void Map_WithReplies_MapsRecursively()
    {
        // Arrange
        var user = new User { Id = 1, Name = "Alice" };
        var reply = new Comment
        {
            Id = 2,
            Text = "Reply text",
            CreatedAt = DateTime.UtcNow,
            User = user,
            Mentions = new List<CommentMention>(),
            Replies = new List<Comment>(),
            ParentCommentId = 1
        };
        var comment = new Comment
        {
            Id = 1,
            Text = "Parent",
            CreatedAt = DateTime.UtcNow,
            User = user,
            Mentions = new List<CommentMention>(),
            Replies = new List<Comment> { reply },
            ParentCommentId = null
        };
        var mapper = new CommentMapper();

        // Act
        var result = mapper.Map(comment, null!);

        // Assert
        Assert.Multiple(() =>
        {
            Assert.That(result.Replies, Has.Count.EqualTo(1));
            Assert.That(result.Replies[0].Id, Is.EqualTo(2));
            Assert.That(result.Replies[0].Text, Is.EqualTo("Reply text"));
            Assert.That(result.Replies[0].UserName, Is.EqualTo("Alice"));
            Assert.That(result.Replies[0].ParentCommentId, Is.EqualTo(1));
        });
    }

    [Test]
    [Description("REQ_MAP - Maps a comment with null mentions; MentionedUsers returns empty list.")]
    public void Map_WithNullMentions_ReturnsEmptyList()
    {
        // Arrange
        var comment = new Comment
        {
            Id = 1,
            Text = "No mentions",
            CreatedAt = DateTime.UtcNow,
            User = new User { Id = 1, Name = "Alice" },
            Mentions = null!,
            Replies = new List<Comment>()
        };
        var mapper = new CommentMapper();

        // Act
        var result = mapper.Map(comment, null!);

        // Assert
        Assert.That(result.MentionedUsers, Is.Empty);
    }

    [Test]
    [Description("REQ_MAP - Maps a comment with null replies; Replies returns empty list.")]
    public void Map_WithNullReplies_ReturnsEmptyList()
    {
        // Arrange
        var comment = new Comment
        {
            Id = 1,
            Text = "No replies",
            CreatedAt = DateTime.UtcNow,
            User = new User { Id = 1, Name = "Alice" },
            Mentions = new List<CommentMention>(),
            Replies = null!
        };
        var mapper = new CommentMapper();

        // Act
        var result = mapper.Map(comment, null!);

        // Assert
        Assert.That(result.Replies, Is.Empty);
    }
}
