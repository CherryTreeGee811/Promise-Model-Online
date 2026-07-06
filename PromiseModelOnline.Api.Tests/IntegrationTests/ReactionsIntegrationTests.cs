using System.Net;
using Microsoft.Extensions.DependencyInjection;
using PromiseModelOnline.Api.DAL;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.Enums;

namespace PromiseModelOnline.Api.Tests.IntegrationTests;

// Requirements: REQ_FUN_009 REQ_SEC_LOG_001 REQ_SYS_030
public class ReactionsIntegrationTests : ApiIntegrationTestBase
{
    private const string Owner = "pmo_test";
    private const string Project = "seeded-project";
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
    public async Task ReactionSetUp() => await SeedHierarchyAsync();

    [Test]
    [Description("REQ_FUN_009 happy path: Owner retrieves reactions for a valid item, returns 200 OK with empty list")]
    public async Task GetReactions_AsOwner_ReturnsEmptyList()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await GetAsync($"/api/reactions?type=Moment&itemId={_momentId}");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var reactions = await ReadJsonAsync<List<ReactionDto>>(response);
        Assert.That(reactions, Is.Not.Null);
        Assert.That(reactions!, Is.Empty);
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated GET reactions returns 401")]
    public async Task GetReactions_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await GetAsync($"/api/reactions?type=Moment&itemId={_momentId}");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_FUN_009 happy path: Owner creates a reaction with valid data, returns 201 Created")]
    public async Task CreateReaction_AsOwner_ReturnsCreated()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await PostAsync("/api/reactions",
            new { emote = "thumbsup", stackItemType = "Moment", stackItemId = _momentId });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Created));
        var reaction = await ReadJsonAsync<ReactionDto>(response);
        Assert.That(reaction, Is.Not.Null);
        Assert.That(reaction!.Emote, Is.EqualTo("thumbsup"));
        Assert.That(reaction.StackItemType, Is.EqualTo("Moment"));
        Assert.That(reaction.StackItemId, Is.EqualTo(_momentId));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated POST reaction returns 401")]
    public async Task CreateReaction_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await PostAsync("/api/reactions",
            new { emote = "thumbsup", stackItemType = "Moment", stackItemId = _momentId });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_SYS_030 sad path: Null request body returns 400")]
    public async Task CreateReaction_NullBody_Returns400()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        var json = new StringContent("null", System.Text.Encoding.UTF8, "application/json");
        // Act
        var response = await Client.PostAsync("/api/reactions", json);
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Read-only scope cannot create reaction, returns 403")]
    public async Task CreateReaction_ReadOnlyScope_Returns403()
    {
        // Arrange
        SetAuthHeader(ReadOnlyToken);
        // Act
        var response = await PostAsync("/api/reactions",
            new { emote = "thumbsup", stackItemType = "Moment", stackItemId = _momentId });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Forbidden));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated PATCH reaction returns 401")]
    public async Task UpdateReaction_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await PatchAsync("/api/reactions/1",
            new { emote = "heart" });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_SYS_030 sad path: Null body on update returns 400")]
    public async Task UpdateReaction_NullBody_Returns400()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        var json = new StringContent("null", System.Text.Encoding.UTF8, "application/json");
        // Act
        var response = await Client.PatchAsync("/api/reactions/1", json);
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated DELETE reaction returns 401")]
    public async Task DeleteReaction_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await Client.DeleteAsync("/api/reactions/1");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_FUN_009 sad path: Delete non-existent reaction returns 404")]
    public async Task DeleteReaction_NonExistent_ReturnsNotFound()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await Client.DeleteAsync("/api/reactions/999");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
    }
}
