using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Moq;
using NUnit.Framework;
using PromiseModelOnline.Api.DAL;
using PromiseModelOnline.Api.Enums;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.Tests.Infrastructure;

namespace PromiseModelOnline.Api.Tests;

[TestFixture]
/// <summary>Unit tests for <see cref="PromiseModelOnlineContext"/> covering audit logging, sequence allocation, and project ID resolution.</summary>
public class PromiseModelOnlineContextUnitTests
{
    private DbContextOptions<PromiseModelOnlineContext> _options = null!;

    [SetUp]
    public void SetUp() =>
        _options = new DbContextOptionsBuilder<PromiseModelOnlineContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

    private PromiseModelOnlineContext CreateContext(IHttpContextAccessor? httpContextAccessor = null)
    {
        httpContextAccessor ??= new HttpContextAccessor();
        return new PromiseModelOnlineContext(_options, httpContextAccessor);
    }

    private static void ClearAuditEvents(PromiseModelOnlineContext context)
    {
        context.Set<AuditEvent>().RemoveRange(context.Set<AuditEvent>().ToList());
        context.SaveChangesAsync().GetAwaiter().GetResult();
    }

    #region SaveChangesAsync - Audit Logging

    [Test]
    public async Task REQ_FUN_XXX_SaveChangesAsync_Insert_CreatesAuditEntry()
    {
        // Arrange
        await using var ctx = CreateContext();
        ctx.Projects.Add(new Project { Id = 1, Name = "P1", Slug = "p1", OwnerId = 1 });
        ClearAuditEvents(ctx);

        // Act
        await ctx.SaveChangesAsync();

        var audits = ctx.Set<AuditEvent>().ToList();
        // Assert
        Assert.That(audits.Count, Is.EqualTo(1));
        Assert.That(audits[0].ActionType, Is.EqualTo("Created"));
        Assert.That(audits[0].EntityType, Is.EqualTo("Project"));
        Assert.That(audits[0].BeforeJson, Is.Null);
        Assert.That(audits[0].AfterJson, Is.Not.Null);
    }

    [Test]
    public async Task REQ_FUN_XXX_SaveChangesAsync_Update_CreatesAuditEntry()
    {
        // Arrange
        await using var ctx = CreateContext();
        ctx.Projects.Add(new Project { Id = 2, Name = "Original", Slug = "orig", OwnerId = 1 });
        await ctx.SaveChangesAsync();
        ClearAuditEvents(ctx);

        var project = ctx.Projects.Find(2)!;
        project.Name = "Updated";
        // Act
        await ctx.SaveChangesAsync();

        var audits = ctx.Set<AuditEvent>().ToList();
        // Assert
        Assert.That(audits.Count, Is.EqualTo(1));
        Assert.That(audits[0].ActionType, Is.EqualTo("Updated"));
    }

    [Test]
    public async Task REQ_FUN_XXX_SaveChangesAsync_Delete_CreatesAuditEntry()
    {
        // Arrange
        await using var ctx = CreateContext();
        ctx.Projects.Add(new Project { Id = 3, Name = "Del", Slug = "del", OwnerId = 1 });
        await ctx.SaveChangesAsync();
        ClearAuditEvents(ctx);

        ctx.Projects.Remove(ctx.Projects.Find(3)!);
        // Act
        await ctx.SaveChangesAsync();

        var audits = ctx.Set<AuditEvent>().ToList();
        // Assert
        Assert.That(audits.Count, Is.EqualTo(1));
        Assert.That(audits[0].ActionType, Is.EqualTo("Deleted"));
        Assert.That(audits[0].AfterJson, Is.Null);
        Assert.That(audits[0].BeforeJson, Is.Not.Null);
    }

    [Test]
    public async Task REQ_FUN_XXX_SaveChangesAsync_NoChanges_DoesNotCreateAuditEntry()
    {
        // Arrange
        await using var ctx = CreateContext();
        ctx.Projects.Add(new Project { Id = 4, Name = "NoChange", Slug = "no-change", OwnerId = 1 });
        await ctx.SaveChangesAsync();
        ClearAuditEvents(ctx);

        // Act
        var result = await ctx.SaveChangesAsync();

        var audits = ctx.Set<AuditEvent>().ToList();
        // Assert
        Assert.That(audits.Count, Is.EqualTo(0));
        _ = result; // suppress unused
    }

    [Test]
    public async Task REQ_FUN_XXX_SaveChangesAsync_Insert_EntityIdIsCaptured()
    {
        // Arrange
        await using var ctx = CreateContext();
        var project = new Project { Id = 5, Name = "AuditId", Slug = "audit-id", OwnerId = 1 };
        ctx.Projects.Add(project);
        ClearAuditEvents(ctx);

        // Act
        await ctx.SaveChangesAsync();

        var audit = ctx.Set<AuditEvent>().First();
        // Assert
        Assert.That(audit.EntityId, Is.EqualTo(5));
    }

    [Test]
    public async Task REQ_FUN_XXX_SaveChangesAsync_MomentStatusChange_CreatesStatusChanged()
    {
        // Arrange
        await using var ctx = CreateContext();
        ctx.Flows.Add(new Flow { Id = 10, JourneyId = 1, Statement = "F", SequenceNumber = 1 });
        ctx.Moments.Add(new Moment { Id = 11, FlowId = 10, SequenceNumber = 1, Status = MomentStatus.Todo });
        await ctx.SaveChangesAsync();
        ClearAuditEvents(ctx);

        var moment = ctx.Moments.Find(11)!;
        moment.Status = MomentStatus.Done;
        // Act
        await ctx.SaveChangesAsync();

        var audits = ctx.Set<AuditEvent>().ToList();
        // Assert
        Assert.That(audits.Count, Is.EqualTo(1));
        Assert.That(audits[0].ActionType, Is.EqualTo("StatusChanged"));
    }

    [Test]
    public async Task REQ_FUN_XXX_SaveChangesAsync_MomentNonStatusChange_CreatesUpdated()
    {
        // Arrange
        await using var ctx = CreateContext();
        ctx.Flows.Add(new Flow { Id = 20, JourneyId = 1, Statement = "F", SequenceNumber = 1 });
        ctx.Moments.Add(new Moment { Id = 21, FlowId = 20, SequenceNumber = 1, Statement = "Orig" });
        await ctx.SaveChangesAsync();
        ClearAuditEvents(ctx);

        var moment = ctx.Moments.Find(21)!;
        moment.Statement = "Changed";
        // Act
        await ctx.SaveChangesAsync();

        var audits = ctx.Set<AuditEvent>().ToList();
        // Assert
        Assert.That(audits.Count, Is.EqualTo(1));
        Assert.That(audits[0].ActionType, Is.EqualTo("Updated"));
    }

    [Test]
    public async Task REQ_FUN_XXX_SaveChangesAsync_SkipsAuditEventEntities()
    {
        // Arrange
        await using var ctx = CreateContext();
        ctx.Projects.Add(new Project { Id = 30, Name = "P", Slug = "p", OwnerId = 1 });
        ClearAuditEvents(ctx);

        await ctx.SaveChangesAsync();

        var auditEventCount = ctx.Set<AuditEvent>().Count();
        ctx.Set<AuditEvent>().Add(new AuditEvent
        {
            OccurredAtUtc = DateTime.UtcNow,
            EntityType = "Test",
            ActionType = "Created"
        });
        // Act
        await ctx.SaveChangesAsync();

        // Assert
        Assert.That(ctx.Set<AuditEvent>().Count(), Is.EqualTo(auditEventCount + 1));
    }

    [Test]
    public async Task REQ_FUN_XXX_SaveChangesAsync_ActorInfoFromHttpContext()
    {
        // Arrange
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "user-abc"),
            new Claim(ClaimTypes.Email, "test@example.com"),
        }, "test"));

        var httpContext = new DefaultHttpContext { User = user };
        var accessorMock = new Mock<IHttpContextAccessor>();
        accessorMock.Setup(a => a.HttpContext).Returns(httpContext);

        await using var ctx = CreateContext(accessorMock.Object);
        ctx.Projects.Add(new Project { Id = 40, Name = "Actor", Slug = "actor", OwnerId = 1 });
        ClearAuditEvents(ctx);

        // Act
        await ctx.SaveChangesAsync();

        var audit = ctx.Set<AuditEvent>().First();
        // Assert
        Assert.That(audit.ActorUserId, Is.EqualTo("user-abc"));
        Assert.That(audit.ActorEmail, Is.EqualTo("test@example.com"));
    }

    [Test]
    public async Task REQ_FUN_XXX_SaveChangesAsync_NoHttpContext_ActorInfoIsNull()
    {
        // Arrange
        await using var ctx = CreateContext();
        ctx.Projects.Add(new Project { Id = 45, Name = "NoActor", Slug = "no-actor", OwnerId = 1 });
        ClearAuditEvents(ctx);

        // Act
        await ctx.SaveChangesAsync();

        var audit = ctx.Set<AuditEvent>().First();
        // Assert
        Assert.That(audit.ActorUserId, Is.Null);
        Assert.That(audit.ActorEmail, Is.Null);
    }

    [Test]
    public async Task REQ_FUN_XXX_SaveChangesAsync_Insert_RecordsChangesJson()
    {
        // Arrange
        await using var ctx = CreateContext();
        ctx.Projects.Add(new Project { Id = 50, Name = "Changes", Slug = "changes", OwnerId = 1 });
        ClearAuditEvents(ctx);

        // Act
        await ctx.SaveChangesAsync();

        var audit = ctx.Set<AuditEvent>().First();
        // Assert
        Assert.That(audit.ChangesJson, Is.Not.Null);
        Assert.That(audit.ChangesJson, Does.Contain("Name"));
        Assert.That(audit.ChangesJson, Does.Contain("Slug"));
    }

    #endregion

    #region SaveChanges (Synchronous)

    [Test]
    public void REQ_FUN_XXX_SaveChanges_Sync_ThrowsNotSupportedException()
    {
        // Arrange
        using var ctx = CreateContext();
        // Assert
        Assert.Throws<NotSupportedException>(() => ctx.SaveChanges());
    }

    #endregion

    #region Sequence Allocation

    [Test]
    public async Task REQ_FUN_XXX_GetNextPromiseSequenceAsync_FirstCall_ReturnsOne()
    {
        // Arrange
        await using var ctx = CreateContext();

        // Act
        var seq = await ctx.GetNextPromiseSequenceAsync(99);

        // Assert
        Assert.That(seq, Is.EqualTo(1));
    }

    [Test]
    public async Task REQ_FUN_XXX_GetNextPromiseSequenceAsync_SecondCall_ReturnsTwo()
    {
        // Arrange
        await using var ctx = CreateContext();
        _ = await ctx.GetNextPromiseSequenceAsync(99);

        // Act
        var seq = await ctx.GetNextPromiseSequenceAsync(99);

        // Assert
        Assert.That(seq, Is.EqualTo(2));
    }

    [Test]
    public async Task REQ_FUN_XXX_GetNextPromiseSequenceAsync_DifferentParentIds_EachStartsAtOne()
    {
        // Arrange
        await using var ctx = CreateContext();

        var seq1 = await ctx.GetNextPromiseSequenceAsync(100);
        // Act
        var seq2 = await ctx.GetNextPromiseSequenceAsync(200);

        // Assert
        Assert.That(seq1, Is.EqualTo(1));
        Assert.That(seq2, Is.EqualTo(1));
    }

    [Test]
    public async Task REQ_FUN_XXX_GetNextSequenceAsync_AllTypes_StartAtOne()
    {
        // Arrange
        await using var ctx = CreateContext();

        var promiseSeq = await ctx.GetNextPromiseSequenceAsync(1);
        var epicSeq = await ctx.GetNextEpicSequenceAsync(1);
        var journeySeq = await ctx.GetNextJourneySequenceAsync(1);
        var flowSeq = await ctx.GetNextFlowSequenceAsync(1);
        // Act
        var momentSeq = await ctx.GetNextMomentSequenceAsync(1);

        // Assert
        Assert.That(promiseSeq, Is.EqualTo(1));
        Assert.That(epicSeq, Is.EqualTo(1));
        Assert.That(journeySeq, Is.EqualTo(1));
        Assert.That(flowSeq, Is.EqualTo(1));
        Assert.That(momentSeq, Is.EqualTo(1));
    }

    #endregion

    #region Model Configuration

    [Test]
    public async Task REQ_FUN_XXX_ProjectOwnerSlugIndex_AllowsSameSlugDifferentOwner()
    {
        // Arrange
        await using var ctx = CreateContext();
        ctx.Projects.Add(new Project { Id = 1, Name = "P1", Slug = "same", OwnerId = 10 });
        await ctx.SaveChangesAsync();

        // Act
        ctx.Projects.Add(new Project { Id = 2, Name = "P2", Slug = "same", OwnerId = 20 });

        // Assert
        Assert.DoesNotThrowAsync(() => ctx.SaveChangesAsync());
    }

    #endregion
}
