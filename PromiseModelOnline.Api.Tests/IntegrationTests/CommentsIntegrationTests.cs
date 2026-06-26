using System.Net;
using Microsoft.Extensions.DependencyInjection;
using PromiseModelOnline.Api.DAL;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.Enums;

namespace PromiseModelOnline.Api.Tests.IntegrationTests;

// Requirements: REQ_FUN_008 REQ_FUN_011 REQ_SEC_LOG_001 REQ_SYS_030
public class CommentsIntegrationTests : ApiIntegrationTestBase
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
    public async Task CommentSetUp() => await SeedHierarchyAsync();

    [Test]
    [Description("REQ_FUN_008 happy path: Owner retrieves comments for a valid parent, returns 200 OK with empty list")]
    public async Task GetComments_AsOwner_ReturnsEmptyList()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await GetAsync($"/api/comments?type=Moment&parentId={_momentId}");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var comments = await ReadJsonAsync<List<CommentDto>>(response);
        Assert.That(comments, Is.Not.Null);
        Assert.That(comments!, Is.Empty);
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated GET comments returns 401")]
    public async Task GetComments_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await GetAsync($"/api/comments?type=Moment&parentId={_momentId}");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_FUN_008 happy path: Owner creates a comment with valid data, returns 201 Created")]
    public async Task CreateComment_AsOwner_ReturnsCreated()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await PostAsync("/api/comments",
            new { text = "Test comment", parentType = "Moment", parentId = _momentId });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Created));
        var comment = await ReadJsonAsync<CommentDto>(response);
        Assert.That(comment, Is.Not.Null);
        Assert.That(comment!.Text, Is.EqualTo("Test comment"));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated POST comment returns 401")]
    public async Task CreateComment_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await PostAsync("/api/comments",
            new { text = "Evil", parentType = "Moment", parentId = _momentId });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_SYS_030 sad path: Null request body returns 400")]
    public async Task CreateComment_NullBody_Returns400()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        var json = new StringContent("null", System.Text.Encoding.UTF8, "application/json");
        // Act
        var response = await Client.PostAsync("/api/comments", json);
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Read-only scope cannot create comment, returns 403")]
    public async Task CreateComment_ReadOnlyScope_Returns403()
    {
        // Arrange
        SetAuthHeader(ReadOnlyToken);
        // Act
        var response = await PostAsync("/api/comments",
            new { text = "NoWrite", parentType = "Moment", parentId = _momentId });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Forbidden));
    }

    [Test]
    [Description("REQ_FUN_008 happy path: Owner searches for users returns empty list (no matching users)")]
    public async Task SearchUsers_AsOwner_ReturnsEmptyList()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await GetAsync($"/api/comments/search-users?parentType=Moment&parentId={_momentId}&search=zzz_unknown");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var users = await ReadJsonAsync<List<object>>(response);
        Assert.That(users, Is.Not.Null);
        Assert.That(users!, Is.Empty);
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated user search returns 401")]
    public async Task SearchUsers_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await GetAsync($"/api/comments/search-users?parentType=Moment&parentId={_momentId}&search=test");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_FUN_008 happy path: Owner searches entity hierarchy returns empty list (no matches)")]
    public async Task SearchPromises_AsOwner_ReturnsEmptyList()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await GetAsync($"/api/comments/search-promises?parentType=Moment&parentId={_momentId}&search=zzz_unknown");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var results = await ReadJsonAsync<List<StackSearchResult>>(response);
        Assert.That(results, Is.Not.Null);
        Assert.That(results!, Is.Empty);
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated promise search returns 401")]
    public async Task SearchPromises_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await GetAsync($"/api/comments/search-promises?parentType=Moment&parentId={_momentId}&search=test");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }
}
