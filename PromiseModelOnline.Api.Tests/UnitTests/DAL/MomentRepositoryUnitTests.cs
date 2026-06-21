using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using NUnit.Framework;
using PromiseModelOnline.Api.DAL;
using PromiseModelOnline.Api.Enums;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.Tests.Infrastructure;

namespace PromiseModelOnline.Api.Tests;

[TestFixture]
/// <summary>Unit tests for <see cref="MomentRepository"/> covering moment queries and filtering.</summary>
// Requirements: REQ_FUN_008
public class MomentRepositoryUnitTests : RepositoryTestBase
{
    private MomentRepository _repo = null!;

    [SetUp]
    public void SetUp()
    {
        _repo = new MomentRepository(Context);
    }

    private async Task SeedAsync()
    {
        var project = new Project { Id = 1, Name = "Test Project" };
        var promise = new Promise { Id = 1, Statement = "P1", ProjectId = 1, Project = project };
        var epic = new Epic { Id = 1, Statement = "E1", ProductPromiseId = 1, ProductPromise = promise };
        var journey = new Journey { Id = 1, Statement = "J1", EpicId = 1, Epic = epic };
        var flow1 = new Flow { Id = 1, Statement = "F1", JourneyId = 1, Journey = journey };
        var flow2 = new Flow { Id = 2, Statement = "F2", JourneyId = 1, Journey = journey };
        var iteration = new Iteration { Id = 100, ProjectId = 1, Name = "Iter1" };
        var stride1 = new Stride { Id = 10, IterationId = 100, Iteration = iteration };
        var stride2 = new Stride { Id = 20, IterationId = 100, Iteration = iteration };

        Context.Projects.Add(project);
        Context.Promises.Add(promise);
        Context.Epics.Add(epic);
        Context.Journeys.Add(journey);
        Context.Flows.AddRange(flow1, flow2);
        Context.Iterations.Add(iteration);
        Context.Strides.AddRange(stride1, stride2);

        var moment1 = new Moment { Id = 1, Statement = "M1", FlowId = 1, Flow = flow1, AssignedStrideId = 10, Status = MomentStatus.Todo };
        var moment2 = new Moment { Id = 2, Statement = "M2", FlowId = 1, Flow = flow1, AssignedStrideId = 10, Status = MomentStatus.Done, CompletedAt = DateTime.UtcNow };
        var moment3 = new Moment { Id = 3, Statement = "M3", FlowId = 1, Flow = flow1, AssignedStrideId = 20, Status = MomentStatus.InProgress };
        var moment4 = new Moment { Id = 4, Statement = "M4", FlowId = 1, Flow = flow1, AssignedStrideId = null, Status = MomentStatus.Todo };
        var moment5 = new Moment { Id = 5, Statement = "M5", FlowId = 2, Flow = flow2, AssignedStrideId = 10, OwnerId = 50, Status = MomentStatus.Todo };

        Context.Moments.AddRange(moment1, moment2, moment3, moment4, moment5);
        await Context.SaveChangesAsync();
    }

    [Test]
    public async Task REQ_FUN_008_GetMomentsByFlowAsync_ReturnsMatchingMoments()
    {
        // Arrange
        await SeedAsync();
        // Act
        var result = await _repo.GetMomentsByFlowAsync(1);
        var list = result.ToList();
        // Assert
        Assert.That(list.Count, Is.EqualTo(4));
        Assert.That(list.All(m => m.FlowId == 1), Is.True);
    }

    [Test]
    public async Task REQ_FUN_008_GetMomentsByStrideAsync_ReturnsMatchingMoments()
    {
        // Arrange
        await SeedAsync();
        // Act
        var result = await _repo.GetMomentsByStrideAsync(10);
        var list = result.ToList();
        // Assert
        Assert.That(list.Count, Is.EqualTo(3));
        Assert.That(list.Select(m => m.Id), Is.EquivalentTo(new[] { 1, 2, 5 }));
    }

    [Test]
    public async Task REQ_FUN_008_GetMomentsByIterationAsync_AssignedOnly_ReturnsMomentsInStridesOfIteration()
    {
        // Arrange
        await SeedAsync();
        // Act
        var result = await _repo.GetMomentsByIterationAsync(100, unassignedOnly: false);
        var list = result.ToList();
        // Assert
        // moments with AssignedStrideId 10 or 20: 1,2,3
        Assert.That(list.Count, Is.EqualTo(4));
        Assert.That(list.Select(m => m.Id), Is.EquivalentTo(new[] { 1, 2, 3, 5 }));
    }

    [Test]
    public async Task REQ_FUN_008_GetMomentsByIterationAsync_UnassignedOnly_ReturnsUnassignedMoments()
    {
        // Arrange
        await SeedAsync();
        // Act
        var result = await _repo.GetMomentsByIterationAsync(100, unassignedOnly: true);
        var list = result.ToList();
        // Assert
        Assert.That(list.Count, Is.GreaterThanOrEqualTo(1));
        Assert.That(list.All(m => m.AssignedStrideId == null), Is.True);
    }

    [Test]
    public async Task REQ_FUN_008_GetMomentsByOwnerIdAsync_ReturnsMatchingMoments()
    {
        // Arrange
        await SeedAsync();
        // Act
        var result = await _repo.GetMomentsByOwnerIdAsync(50);
        var list = result.ToList();
        // Assert
        Assert.That(list.Count, Is.EqualTo(1));
        Assert.That(list[0].Id, Is.EqualTo(5));
    }

    [Test]
    public async Task REQ_FUN_008_GetMomentsByPromiseIdAsync_ReturnsAllDescendantMoments()
    {
        // Arrange
        await SeedAsync();
        // Act
        var result = await _repo.GetMomentsByPromiseIdAsync(1);
        var list = result.ToList();
        // Assert
        Assert.That(list.Count, Is.EqualTo(5));
    }

    [Test]
    public async Task REQ_FUN_008_GetProjectIdForMomentAsync_ReturnsProjectId()
    {
        // Arrange
        await SeedAsync();
        // Act
        var projectId = await _repo.GetProjectIdForMomentAsync(1);
        // Assert
        Assert.That(projectId, Is.EqualTo(1));
    }

    [Test]
    public async Task REQ_FUN_008_GetProjectIdForMomentAsync_NonexistentMoment_ReturnsZero()
    {
        // Act
        var result = await _repo.GetProjectIdForMomentAsync(999);
        // Assert
        Assert.That(result, Is.EqualTo(0));
    }

    [Test]
    public async Task REQ_FUN_008_GetUnfinishedMomentsByStrideAsync_ReturnsNonDoneMoments()
    {
        // Arrange
        await SeedAsync();
        // Act
        var result = await _repo.GetUnfinishedMomentsByStrideAsync(10);
        var list = result.ToList();
        // Assert
        Assert.That(list.Count, Is.EqualTo(2));
        Assert.That(list.Select(m => m.Id), Is.EquivalentTo(new[] { 1, 5 }));
    }
}
