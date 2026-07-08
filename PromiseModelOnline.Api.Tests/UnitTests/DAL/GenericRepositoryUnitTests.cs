using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using NUnit.Framework;
using PMO.Core.Models;
using PromiseModelOnline.Api.DAL;
using PromiseModelOnline.Api.Enums;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.Tests.Infrastructure;

namespace PromiseModelOnline.Api.Tests;

[TestFixture]
public class GenericRepositoryUnitTests : RepositoryTestBase
{
    private GenericRepository<Project> _projectRepo = null!;
    private GenericRepository<Promise> _promiseRepo = null!;
    private GenericRepository<Epic> _epicRepo = null!;
    private GenericRepository<Journey> _journeyRepo = null!;
    private GenericRepository<Flow> _flowRepo = null!;
    private GenericRepository<Moment> _momentRepo = null!;
    private GenericRepository<Comment> _commentRepo = null!;

    [SetUp]
    public void SetUp()
    {
        _projectRepo = new GenericRepository<Project>(Context);
        _promiseRepo = new GenericRepository<Promise>(Context);
        _epicRepo = new GenericRepository<Epic>(Context);
        _journeyRepo = new GenericRepository<Journey>(Context);
        _flowRepo = new GenericRepository<Flow>(Context);
        _momentRepo = new GenericRepository<Moment>(Context);
        _commentRepo = new GenericRepository<Comment>(Context);
    }

    #region GetAllAsync

    [Test]
    public async Task REQ_FUN_XXX_GetAllAsync_ReturnsAllEntities()
    {
        Context.Projects.AddRange(
            new Project { Id = 1, Name = "A", Slug = "a", OwnerId = 1 },
            new Project { Id = 2, Name = "B", Slug = "b", OwnerId = 1 });
        await Context.SaveChangesAsync();

        var result = await _projectRepo.GetAllAsync();

        Assert.That(result.Count(), Is.EqualTo(2));
    }

    [Test]
    public async Task REQ_FUN_XXX_GetAllAsync_EmptyDatabase_ReturnsEmpty()
    {
        var result = await _projectRepo.GetAllAsync();
        Assert.That(result, Is.Empty);
    }

    #endregion

    #region GetByIdAsync

    [Test]
    public async Task REQ_FUN_XXX_GetByIdAsync_ExistingId_ReturnsEntity()
    {
        var project = new Project { Id = 10, Name = "Test", Slug = "test", OwnerId = 1 };
        Context.Projects.Add(project);
        await Context.SaveChangesAsync();

        var result = await _projectRepo.GetByIdAsync(10);

        Assert.That(result, Is.Not.Null);
        Assert.That(result!.Name, Is.EqualTo("Test"));
    }

    [Test]
    public async Task REQ_FUN_XXX_GetByIdAsync_NonExistingId_ReturnsNull()
    {
        var result = await _projectRepo.GetByIdAsync(999);
        Assert.That(result, Is.Null);
    }

    #endregion

    #region AddAsync

    [Test]
    public async Task REQ_FUN_XXX_AddAsync_StagesEntityForInsert()
    {
        var project = new Project { Name = "New", Slug = "new", OwnerId = 42 };

        await _projectRepo.AddAsync(project);
        await Context.SaveChangesAsync();

        var saved = Context.Projects.FirstOrDefault(p => p.Slug == "new");
        Assert.That(saved, Is.Not.Null);
        Assert.That(saved!.OwnerId, Is.EqualTo(42));
    }

    #endregion

    #region Update

    [Test]
    public async Task REQ_FUN_XXX_Update_MarksEntityAsModified()
    {
        var project = new Project { Id = 20, Name = "Original", Slug = "original", OwnerId = 1 };
        Context.Projects.Add(project);
        await Context.SaveChangesAsync();

        project.Name = "Updated";
        _projectRepo.Update(project);
        await Context.SaveChangesAsync();

        var saved = Context.Projects.Find(20);
        Assert.That(saved, Is.Not.Null);
        Assert.That(saved!.Name, Is.EqualTo("Updated"));
    }

    #endregion

    #region DeleteByIdAsync

    [Test]
    public async Task REQ_FUN_XXX_DeleteByIdAsync_ExistingEntity_RemovesAndReturnsTrue()
    {
        var project = new Project { Id = 30, Name = "DeleteMe", Slug = "delete-me", OwnerId = 1 };
        Context.Projects.Add(project);
        await Context.SaveChangesAsync();

        var result = await _projectRepo.DeleteByIdAsync(30);

        Assert.That(result, Is.True);
        Assert.That(Context.Projects.Find(30), Is.Null);
    }

    [Test]
    public async Task REQ_FUN_XXX_DeleteByIdAsync_NonExistingId_ReturnsFalse()
    {
        var result = await _projectRepo.DeleteByIdAsync(999);
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task REQ_FUN_XXX_DeleteByIdAsync_Project_CascadesToPromises()
    {
        var project = new Project { Id = 40, Name = "Cascade", Slug = "cascade", OwnerId = 1 };
        Context.Projects.Add(project);
        Context.Promises.AddRange(
            new Promise { Id = 41, ProjectId = 40, Statement = "P1", SequenceNumber = 1 },
            new Promise { Id = 42, ProjectId = 40, Statement = "P2", SequenceNumber = 2 });
        await Context.SaveChangesAsync();

        await _projectRepo.DeleteByIdAsync(40);

        Assert.That(Context.Promises.Find(41), Is.Null);
        Assert.That(Context.Promises.Find(42), Is.Null);
        Assert.That(Context.Projects.Find(40), Is.Null);
    }

    [Test]
    public async Task REQ_FUN_XXX_DeleteByIdAsync_Project_CascadesToIterationsAndUnlinksMoments()
    {
        var project = new Project { Id = 50, Name = "CascadeIter", Slug = "cascade-iter", OwnerId = 1 };
        Context.Projects.Add(project);
        var iteration = new Iteration { Id = 51, ProjectId = 50, Name = "Sprint 1" };
        Context.Iterations.Add(iteration);
        var stride = new Stride { Id = 52, IterationId = 51, Name = "Week 1", StartDate = DateTime.UtcNow, EndDate = DateTime.UtcNow.AddDays(7) };
        Context.Strides.Add(stride);
        var flow = new Flow { Id = 1, JourneyId = 1, Statement = "F1", SequenceNumber = 1 };
        Context.Flows.Add(flow);
        var moment = new Moment { Id = 53, FlowId = 1, SequenceNumber = 1, AssignedStrideId = 52, OriginalStrideId = 52 };
        Context.Moments.Add(moment);
        await Context.SaveChangesAsync();

        await _projectRepo.DeleteByIdAsync(50);

        Assert.That(Context.Iterations.Find(51), Is.Null);
        Assert.That(Context.Strides.Find(52), Is.Null);
        var unlinkedMoment = Context.Moments.Find(53);
        Assert.That(unlinkedMoment, Is.Not.Null);
        Assert.That(unlinkedMoment!.AssignedStrideId, Is.Null);
        Assert.That(unlinkedMoment.OriginalStrideId, Is.Null);
    }

    [Test]
    public async Task REQ_FUN_XXX_DeleteByIdAsync_Project_CascadesToPermissions()
    {
        var project = new Project { Id = 55, Name = "CascadePerm", Slug = "cascade-perm", OwnerId = 1 };
        Context.Projects.Add(project);
        Context.Set<Permission>().Add(new Permission { Id = 56, ProjectId = 55, UserId = 2, Level = PermissionLevel.Edit });
        await Context.SaveChangesAsync();

        await _projectRepo.DeleteByIdAsync(55);

        Assert.That(Context.Set<Permission>().Find(56), Is.Null);
    }

    [Test]
    public async Task REQ_FUN_XXX_DeleteByIdAsync_Promise_CascadesToEpics()
    {
        var promise = new Promise { Id = 60, ProjectId = 1, Statement = "Root", SequenceNumber = 1 };
        Context.Promises.Add(promise);
        Context.Epics.AddRange(
            new Epic { Id = 61, ProductPromiseId = 60, Statement = "E1", SequenceNumber = 1 },
            new Epic { Id = 62, ProductPromiseId = 60, Statement = "E2", SequenceNumber = 2 });
        await Context.SaveChangesAsync();

        await _promiseRepo.DeleteByIdAsync(60);

        Assert.That(Context.Epics.Find(61), Is.Null);
        Assert.That(Context.Epics.Find(62), Is.Null);
    }

    [Test]
    public async Task REQ_FUN_XXX_DeleteByIdAsync_Promise_CascadesToComments()
    {
        var promise = new Promise { Id = 65, ProjectId = 1, Statement = "WithComments", SequenceNumber = 1 };
        Context.Promises.Add(promise);
        Context.Set<Comment>().Add(new Comment { Id = 66, Text = "C1", ProductPromiseId = 65 });
        await Context.SaveChangesAsync();

        await _promiseRepo.DeleteByIdAsync(65);

        Assert.That(Context.Set<Comment>().Find(66), Is.Null);
    }

    [Test]
    public async Task REQ_FUN_XXX_DeleteByIdAsync_Epic_CascadesToJourneys()
    {
        var epic = new Epic { Id = 70, ProductPromiseId = 1, Statement = "Epic1", SequenceNumber = 1 };
        Context.Epics.Add(epic);
        Context.Journeys.AddRange(
            new Journey { Id = 71, EpicId = 70, Statement = "J1", SequenceNumber = 1 },
            new Journey { Id = 72, EpicId = 70, Statement = "J2", SequenceNumber = 2 });
        await Context.SaveChangesAsync();

        await _epicRepo.DeleteByIdAsync(70);

        Assert.That(Context.Journeys.Find(71), Is.Null);
        Assert.That(Context.Journeys.Find(72), Is.Null);
    }

    [Test]
    public async Task REQ_FUN_XXX_DeleteByIdAsync_Journey_CascadesToFlows()
    {
        var journey = new Journey { Id = 80, EpicId = 1, Statement = "Journey1", SequenceNumber = 1 };
        Context.Journeys.Add(journey);
        Context.Flows.AddRange(
            new Flow { Id = 81, JourneyId = 80, Statement = "F1", SequenceNumber = 1 },
            new Flow { Id = 82, JourneyId = 80, Statement = "F2", SequenceNumber = 2 });
        await Context.SaveChangesAsync();

        await _journeyRepo.DeleteByIdAsync(80);

        Assert.That(Context.Flows.Find(81), Is.Null);
        Assert.That(Context.Flows.Find(82), Is.Null);
    }

    [Test]
    public async Task REQ_FUN_XXX_DeleteByIdAsync_Flow_CascadesToMoments()
    {
        var flow = new Flow { Id = 90, JourneyId = 1, Statement = "Flow1", SequenceNumber = 1 };
        Context.Flows.Add(flow);
        Context.Moments.AddRange(
            new Moment { Id = 91, FlowId = 90, SequenceNumber = 1 },
            new Moment { Id = 92, FlowId = 90, SequenceNumber = 2 });
        await Context.SaveChangesAsync();

        await _flowRepo.DeleteByIdAsync(90);

        Assert.That(Context.Moments.Find(91), Is.Null);
        Assert.That(Context.Moments.Find(92), Is.Null);
    }

    [Test]
    public async Task REQ_FUN_XXX_DeleteByIdAsync_Moment_RemovesAssignmentsAndTasks()
    {
        var flow = new Flow { Id = 95, JourneyId = 1, Statement = "FlowM", SequenceNumber = 1 };
        Context.Flows.Add(flow);
        var moment = new Moment { Id = 96, FlowId = 95, SequenceNumber = 1 };
        Context.Moments.Add(moment);
        Context.Set<MomentAssignment>().Add(new MomentAssignment { Id = 97, MomentId = 96, UserId = 1 });
        Context.Set<MomentTask>().Add(new MomentTask { Id = 98, MomentId = 96, Name = "Task" });
        Context.Set<BugReworkTask>().Add(new BugReworkTask { Id = 99, MomentId = 96, Title = "Bug" });
        await Context.SaveChangesAsync();

        await _momentRepo.DeleteByIdAsync(96);

        Assert.That(Context.Moments.Find(96), Is.Null);
        Assert.That(Context.Set<MomentAssignment>().Find(97), Is.Null);
        Assert.That(Context.Set<MomentTask>().Find(98), Is.Null);
        Assert.That(Context.Set<BugReworkTask>().Find(99), Is.Null);
    }

    [Test]
    public async Task REQ_FUN_XXX_DeleteByIdAsync_Comment_RemovesRepliesAndMentions()
    {
        Context.Set<Comment>().AddRange(
            new Comment { Id = 200, Text = "Parent" },
            new Comment { Id = 201, Text = "Reply", ParentCommentId = 200 });
        Context.Set<CommentMention>().Add(new CommentMention { Id = 202, CommentId = 200, MentionedUserId = 1 });
        await Context.SaveChangesAsync();

        await _commentRepo.DeleteByIdAsync(200);

        Assert.That(Context.Set<Comment>().Find(200), Is.Null);
        Assert.That(Context.Set<Comment>().Find(201), Is.Null);
        Assert.That(Context.Set<CommentMention>().Find(202), Is.Null);
    }

    [Test]
    public async Task REQ_FUN_XXX_DeleteByIdAsync_NonCascadingType_RemovesDirectly()
    {
        Context.Users.Add(new User { Id = 300, Name = "User", Email = "u@test.com", Slug = "user-300" });
        await Context.SaveChangesAsync();

        var userRepo = new GenericRepository<User>(Context);
        var result = await userRepo.DeleteByIdAsync(300);

        Assert.That(result, Is.True);
        Assert.That(Context.Users.Find(300), Is.Null);
    }

    #endregion

    #region SaveChangesAsync

    [Test]
    public async Task REQ_FUN_XXX_SaveChangesAsync_PersistsPendingChanges()
    {
        var project = new Project { Name = "Persist", Slug = "persist", OwnerId = 1 };
        await _projectRepo.AddAsync(project);
        await _projectRepo.SaveChangesAsync();

        var saved = Context.Projects.FirstOrDefault(p => p.Slug == "persist");
        Assert.That(saved, Is.Not.Null);
    }

    #endregion
}
