using System.Net;
using Microsoft.Extensions.DependencyInjection;
using PromiseModelOnline.Api.DAL;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.Tests.IntegrationTests;

// Requirements: REQ_SYS_004 REQ_FUN_010 REQ_SEC_LOG_001
public class ProjectGraphIntegrationTests : ApiIntegrationTestBase
{
    private const string Owner = "pmo_test";
    private const string Project = "seeded-project";

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
        }
    }

    [SetUp]
    public async Task GraphSetUp() => await SeedHierarchyAsync();

    [Test]
    [Description("REQ_SYS_004 REQ_FUN_010 happy path: GetGraph returns full project hierarchy")]
    public async Task GetGraph_AsOwner_ReturnsOk()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/graph");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var graph = await ReadJsonAsync<ProjectGraphDto>(response);
        Assert.That(graph, Is.Not.Null);
        Assert.That(graph!.Slug, Is.EqualTo(Project));
        Assert.That(graph.Promises, Is.Not.Null);
        Assert.That(graph.Promises.Count, Is.GreaterThanOrEqualTo(1));
        Assert.That(graph.Promises[0].Statement, Is.EqualTo("Root promise"));
        Assert.That(graph.Promises[0].Epics, Is.Not.Null);
        Assert.That(graph.Promises[0].Epics.Count, Is.GreaterThanOrEqualTo(1));
        Assert.That(graph.Promises[0].Epics[0].Statement, Is.EqualTo("Root epic"));
        Assert.That(graph.Promises[0].Epics[0].Journeys, Is.Not.Null);
        Assert.That(graph.Promises[0].Epics[0].Journeys.Count, Is.GreaterThanOrEqualTo(1));
        Assert.That(graph.Promises[0].Epics[0].Journeys[0].Statement, Is.EqualTo("Root journey"));
        Assert.That(graph.Promises[0].Epics[0].Journeys[0].Flows, Is.Not.Null);
        Assert.That(graph.Promises[0].Epics[0].Journeys[0].Flows.Count, Is.GreaterThanOrEqualTo(1));
        Assert.That(graph.Promises[0].Epics[0].Journeys[0].Flows[0].Statement, Is.EqualTo("Root flow"));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated GetGraph returns 401")]
    public async Task GetGraph_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/graph");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_FUN_010 sad path: Non-existent project returns 404")]
    public async Task GetGraph_NonExistentProject_Returns404()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/nonexistent/graph");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
    }
}
