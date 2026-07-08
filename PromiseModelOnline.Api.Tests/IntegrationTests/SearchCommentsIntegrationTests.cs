using System.Net;
using Microsoft.Extensions.DependencyInjection;
using PromiseModelOnline.Api.DAL;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.Enums;

namespace PromiseModelOnline.Api.Tests.IntegrationTests;

// Requirements: REQ_FUN_008 REQ_SEC_LOG_001
public class SearchCommentsIntegrationTests : ApiIntegrationTestBase
{
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

            var momentSeq = await db.GetNextMomentSequenceAsync(flow.Id);
            var moment = new Moment
            {
                Statement = "Test moment",
                FlowId = flow.Id,
                Type = MomentType.Story,
                Status = MomentStatus.Todo,
                SequenceNumber = momentSeq,
                DisplayOrder = 0,
                StatusColor = "red",
            };
            db.Moments.Add(moment);
            await db.SaveChangesAsync();

            _momentId = moment.Id;
        }
        else
        {
            var moment = db.Moments.First();
            _momentId = moment.Id;
        }
    }

    [SetUp]
    public async Task SearchCommentSetUp() => await SeedHierarchyAsync();

    [Test]
    [Description("REQ_FUN_008 happy path: Owner gets entity map for a valid parent, returns 200 OK with entities")]
    public async Task GetEntityMap_AsOwner_ReturnsOk()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await GetAsync($"/api/comments/entity-map?parentType=Moment&parentId={_momentId}");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var map = await ReadJsonAsync<List<object>>(response);
        Assert.That(map, Is.Not.Null);
        Assert.That(map, Is.Not.Empty);
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated GET entity-map returns 401")]
    public async Task GetEntityMap_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await GetAsync($"/api/comments/entity-map?parentType=Moment&parentId={_momentId}");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_FUN_008 happy path: Missing parameters returns empty list")]
    public async Task GetEntityMap_EmptyParams_ReturnsEmptyList()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await GetAsync("/api/comments/entity-map");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var map = await ReadJsonAsync<List<object>>(response);
        Assert.That(map, Is.Not.Null);
        Assert.That(map!, Is.Empty);
    }

    [Test]
    [Description("REQ_FUN_008 sad path: Non-existent entity returns BadRequest")]
    public async Task GetEntityMap_InvalidEntity_ReturnsBadRequest()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await GetAsync("/api/comments/entity-map?parentType=Moment&parentId=999");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }
}
