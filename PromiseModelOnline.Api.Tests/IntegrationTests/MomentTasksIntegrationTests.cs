using System.Net;
using Microsoft.Extensions.DependencyInjection;
using PromiseModelOnline.Api.DAL;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.Enums;
using PMO.Core.Models;

namespace PromiseModelOnline.Api.Tests.IntegrationTests;

// Requirements: REQ_FUN_011 REQ_FUN_012 REQ_SYS_030 REQ_SEC_LOG_001
public class MomentTasksIntegrationTests : ApiIntegrationTestBase
{
    private int _flowId;
    private int _momentId;

    private async Task SeedHierarchyAsync()
    {
        using var scope = Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PromiseModelOnlineContext>();

        if (!db.Promises.Any())
        {
            var promiseSeq = await db.GetNextPromiseSequenceAsync(1);
            var promise = new Promise
            {
                Statement = "Root promise",
                ProjectId = 1,
                SequenceNumber = promiseSeq,
                DisplayOrder = 0,
                StatusColor = "red",
            };
            db.Promises.Add(promise);
            await db.SaveChangesAsync();

            var epicSeq = await db.GetNextEpicSequenceAsync(promise.Id);
            var epic = new Epic
            {
                Statement = "Root epic",
                ProductPromiseId = promise.Id,
                SequenceNumber = epicSeq,
                DisplayOrder = 0,
                StatusColor = "red",
            };
            db.Epics.Add(epic);
            await db.SaveChangesAsync();

            var journeySeq = await db.GetNextJourneySequenceAsync(epic.Id);
            var journey = new Journey
            {
                Statement = "Root journey",
                EpicId = epic.Id,
                SequenceNumber = journeySeq,
                DisplayOrder = 0,
                StatusColor = "red",
            };
            db.Journeys.Add(journey);
            await db.SaveChangesAsync();

            var flowSeq = await db.GetNextFlowSequenceAsync(journey.Id);
            var flow = new Flow
            {
                Statement = "Root flow",
                JourneyId = journey.Id,
                SequenceNumber = flowSeq,
                DisplayOrder = 0,
                StatusColor = "red",
            };
            db.Flows.Add(flow);
            await db.SaveChangesAsync();

            _flowId = flow.Id;
        }
        else
        {
            var promise = db.Promises.First();
            var epic = db.Epics.First();
            var journey = db.Journeys.First();
            var flow = db.Flows.First();
            _flowId = flow.Id;
        }

        var flowEntity = await db.Flows.FindAsync(_flowId);
        var seq = await db.GetNextMomentSequenceAsync(flowEntity!.Id);
        var moment = new Moment
        {
            Statement = "Task test moment",
            Description = null,
            FlowId = flowEntity.Id,
            Type = MomentType.Story,
            Status = MomentStatus.Todo,
            SequenceNumber = seq,
            DisplayOrder = 0,
            StatusColor = "red",
        };
        db.Moments.Add(moment);
        await db.SaveChangesAsync();
        _momentId = moment.Id;
    }

    [SetUp]
    public async Task TaskSetUp() => await SeedHierarchyAsync();

    private async Task<MomentTask> SeedTaskAsync(string name = "Test task")
    {
        using var scope = Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PromiseModelOnlineContext>();
        var moment = await db.Moments.FindAsync(_momentId);
        var task = new MomentTask
        {
            Name = name,
            Description = "Test description",
            MomentId = moment!.Id,
            IsCompleted = false,
            CreatedAt = DateTime.UtcNow,
        };
        db.Set<MomentTask>().Add(task);
        await db.SaveChangesAsync();
        return task;
    }

    [Test]
    [Description("REQ_FUN_011 happy path: Owner creates a moment task, returns 200 OK")]
    public async Task CreateTask_AsOwner_ReturnsOk()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await PostAsync($"/api/moments/{_momentId}/tasks",
            new { name = "New task", description = "Task description", isCompleted = false });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var task = await ReadJsonAsync<MomentTaskDto>(response);
        Assert.That(task, Is.Not.Null);
        Assert.That(task!.Name, Is.EqualTo("New task"));
        Assert.That(task.IsCompleted, Is.False);
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated POST returns 401")]
    public async Task CreateTask_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await PostAsync($"/api/moments/{_momentId}/tasks",
            new { name = "Evil", isCompleted = false });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Read-only scope cannot create task, returns 403")]
    public async Task CreateTask_ReadOnlyScope_Returns403()
    {
        // Arrange
        SetAuthHeader(ReadOnlyToken);
        // Act
        var response = await PostAsync($"/api/moments/{_momentId}/tasks",
            new { name = "NoWrite", isCompleted = false });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Forbidden));
    }

    [Test]
    [Description("REQ_SYS_030 sad path: Null request body returns 400")]
    public async Task CreateTask_NullBody_Returns400()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        var json = new StringContent("null", System.Text.Encoding.UTF8, "application/json");
        // Act
        var response = await Client.PostAsync($"/api/moments/{_momentId}/tasks", json);
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    [Description("REQ_FUN_011 sad path: Non-existent moment returns 403 (controller checks permission before existence)")]
    public async Task CreateTask_NonExistentMoment_Returns403()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await PostAsync($"/api/moments/999/tasks",
            new { name = "Bad moment", isCompleted = false });
        // Assert
        // Controller checks UserCanEditMomentAsync first; non-existent moment => Forbid
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Forbidden));
    }

    [Test]
    [Description("REQ_FUN_012 happy path: Owner toggles task completion, returns 200 OK")]
    public async Task UpdateCompletion_AsOwner_ReturnsOk()
    {
        // Arrange
        var seeded = await SeedTaskAsync("Toggle test");
        SetAuthHeader(OwnerToken);
        // Act
        var response = await PatchAsync($"/api/moments/{_momentId}/tasks/{seeded.Id}/completion",
            new { isCompleted = true });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var task = await ReadJsonAsync<MomentTaskDto>(response);
        Assert.That(task, Is.Not.Null);
        Assert.That(task!.IsCompleted, Is.True);
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated PATCH returns 401")]
    public async Task UpdateCompletion_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await PatchAsync($"/api/moments/{_momentId}/tasks/1/completion",
            new { isCompleted = true });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_FUN_012 sad path: Non-existent task returns 404")]
    public async Task UpdateCompletion_NonExistentTask_Returns404()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await PatchAsync($"/api/moments/{_momentId}/tasks/999/completion",
            new { isCompleted = true });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
    }
}
