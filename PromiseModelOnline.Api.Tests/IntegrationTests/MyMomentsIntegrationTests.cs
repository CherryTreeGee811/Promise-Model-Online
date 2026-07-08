using System.Net;
using Microsoft.Extensions.DependencyInjection;
using PromiseModelOnline.Api.DAL;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.Enums;

namespace PromiseModelOnline.Api.Tests.IntegrationTests;

// Requirements: REQ_FUN_020 REQ_SEC_LOG_001
public class MyMomentsIntegrationTests : ApiIntegrationTestBase
{
    private const string Owner = "pmo_test";
    private const string Project = "seeded-project";
    private int _flowId;

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
    }

    [SetUp]
    public async Task MyMomentsSetUp() => await SeedHierarchyAsync();

    [Test]
    [Description("REQ_FUN_020 happy path: Owner with no assigned moments returns empty list")]
    public async Task GetMyAssignedMoments_ReturnsEmptyList()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await GetAsync("/api/moments/assigned-to-me");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var moments = await ReadJsonAsync<List<MomentDto>>(response);
        Assert.That(moments, Is.Not.Null);
        Assert.That(moments!, Is.Empty);
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated GET returns 401")]
    public async Task GetMyAssignedMoments_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await GetAsync("/api/moments/assigned-to-me");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_FUN_020 happy path: Owner retrieves assigned moments when OwnerId matches")]
    public async Task GetMyAssignedMoments_ReturnsMoments()
    {
        // Arrange
        using (var scope = Factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PromiseModelOnlineContext>();
            var flow = await db.Flows.FindAsync(_flowId);
            var seq = await db.GetNextMomentSequenceAsync(flow!.Id);
            var moment = new Moment
            {
                Statement = "Assigned to me",
                Description = null,
                FlowId = flow.Id,
                Type = MomentType.Story,
                Status = MomentStatus.Todo,
                SequenceNumber = seq,
                DisplayOrder = 0,
                StatusColor = "red",
                OwnerId = TestUserId,
            };
            db.Moments.Add(moment);
            await db.SaveChangesAsync();
        }
        SetAuthHeader(OwnerToken);
        // Act
        var response = await GetAsync("/api/moments/assigned-to-me");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var moments = await ReadJsonAsync<List<MomentDto>>(response);
        Assert.That(moments, Is.Not.Null);
        Assert.That(moments!.Count, Is.GreaterThanOrEqualTo(1));
        var assigned = moments.FirstOrDefault(m => m.Statement == "Assigned to me");
        Assert.That(assigned, Is.Not.Null);
    }
}
