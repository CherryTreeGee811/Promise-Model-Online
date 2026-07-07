using System.Net;
using Microsoft.Extensions.DependencyInjection;
using PromiseModelOnline.Api.DAL;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.Enums;

namespace PromiseModelOnline.Api.Tests.IntegrationTests;

// Requirements: REQ_FUN_023 REQ_FUN_024 REQ_SYS_017 REQ_SEC_LOG_001
public class ProjectIterationsIntegrationTests : ApiIntegrationTestBase
{
    private const string Owner = "pmo_test";
    private const string Project = "seeded-project";
    private int _flowId;

    private async Task<Moment> SeedHierarchyAsync()
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

            var momentSeq = await db.GetNextMomentSequenceAsync(flow.Id);
            var moment = new Moment
            {
                Statement = "Root moment",
                Description = null,
                FlowId = flow.Id,
                Type = MomentType.Story,
                Status = MomentStatus.Todo,
                SequenceNumber = momentSeq,
                DisplayOrder = 0,
                StatusColor = "red",
            };
            db.Moments.Add(moment);
            await db.SaveChangesAsync();
            return moment;
        }
        else
        {
            var flow = db.Flows.First();
            _flowId = flow.Id;
            var moment = db.Moments.First(m => m.FlowId == _flowId);
            return moment;
        }
    }

    [SetUp]
    public async Task IterationSetUp() => await SeedHierarchyAsync();

    private async Task<Iteration> SeedIterationAsync(string name = "Sprint 1")
    {
        using var scope = Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PromiseModelOnlineContext>();
        var iteration = new Iteration
        {
            Name = name,
            ProjectId = 1,
        };
        db.Iterations.Add(iteration);
        await db.SaveChangesAsync();
        return iteration;
    }

    [Test]
    [Description("REQ_FUN_023 happy path: GetAll returns empty list when no iterations exist")]
    public async Task GetAllIterations_Empty_ReturnsOk()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/iterations");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var iterations = await ReadJsonAsync<List<IterationDto>>(response);
        Assert.That(iterations, Is.Not.Null);
        Assert.That(iterations, Is.Empty);
    }

    [Test]
    [Description("REQ_FUN_023 happy path: GetAll returns created iteration")]
    public async Task GetAllIterations_AfterCreate_ReturnsIteration()
    {
        // Arrange
        await SeedIterationAsync("Sprint 1");
        SetAuthHeader(OwnerToken);
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/iterations");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var iterations = await ReadJsonAsync<List<IterationDto>>(response);
        Assert.That(iterations, Is.Not.Null);
        Assert.That(iterations!.Count, Is.EqualTo(1));
        Assert.That(iterations[0].Name, Is.EqualTo("Sprint 1"));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated GetAll returns 401")]
    public async Task GetAllIterations_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/iterations");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_FUN_024 happy path: Create iteration returns 201 Created with DTO")]
    public async Task CreateIteration_AsOwner_ReturnsCreated()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await PostAsync($"/api/projects/{Owner}/{Project}/iterations",
            new { name = "Sprint 1" });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Created));
        var iteration = await ReadJsonAsync<IterationDto>(response);
        Assert.That(iteration, Is.Not.Null);
        Assert.That(iteration!.Name, Is.EqualTo("Sprint 1"));
        Assert.That(iteration.ProjectId, Is.EqualTo(1));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated Create returns 401")]
    public async Task CreateIteration_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await PostAsync($"/api/projects/{Owner}/{Project}/iterations",
            new { name = "Evil" });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Read-only scope cannot create iteration, returns 403")]
    public async Task CreateIteration_ReadOnlyScope_Returns403()
    {
        // Arrange
        SetAuthHeader(ReadOnlyToken);
        // Act
        var response = await PostAsync($"/api/projects/{Owner}/{Project}/iterations",
            new { name = "NoWrite" });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Forbidden));
    }

    [Test]
    [Description("REQ_SYS_017 sad path: Null request body on Create returns 400")]
    public async Task CreateIteration_NullBody_Returns400()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        var json = new StringContent("null", System.Text.Encoding.UTF8, "application/json");
        // Act
        var response = await Client.PostAsync($"/api/projects/{Owner}/{Project}/iterations", json);
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    [Description("REQ_FUN_023 happy path: GetBurndown returns OK with burndown data")]
    public async Task GetBurndown_AsOwner_ReturnsOk()
    {
        // Arrange
        var iteration = await SeedIterationAsync("Sprint 1");
        SetAuthHeader(OwnerToken);
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/iterations/{iteration.Id}/burndown");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var points = await ReadJsonAsync<List<BurndownPointDto>>(response);
        Assert.That(points, Is.Not.Null);
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated GetBurndown returns 401")]
    public async Task GetBurndown_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/iterations/1/burndown");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_FUN_023 sad path: Non-existent iteration returns 404")]
    public async Task GetBurndown_NonExistentIteration_Returns404()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/iterations/999/burndown");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
    }
}
