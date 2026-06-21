using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using NUnit.Framework;
using PromiseModelOnline.Api.DAL;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.Tests.Infrastructure;

namespace PromiseModelOnline.Api.Tests;

[TestFixture]
/// <summary>Unit tests for <see cref="StrideRepository"/> covering stride queries.</summary>
// Requirements: REQ_FUN_024
public class StrideRepositoryUnitTests : RepositoryTestBase
{
    private StrideRepository _repo = null!;

    [SetUp]
    public void SetUp() => _repo = new StrideRepository(Context);

    [Test]
    public async Task REQ_FUN_024_GetStridesByIterationAsync_ReturnsMatchingStrides()
    {
        // Arrange
        var strides = new List<Stride>
            {
                new Stride { Id = 1, Name = "Sprint 1", IterationId = 10 },
                new Stride { Id = 2, Name = "Sprint 2", IterationId = 10 },
                new Stride { Id = 3, Name = "Sprint 3", IterationId = 20 }
            };
        Context.Strides.AddRange(strides);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repo.GetStridesByIterationAsync(10);
        var list = result.ToList();

        // Assert
        Assert.That(list.Count, Is.EqualTo(2));
        Assert.That(list.All(s => s.IterationId == 10), Is.True);
        Assert.That(list.Select(s => s.Id), Is.EquivalentTo(new[] { 1, 2 }));
    }

    [Test]
    public async Task REQ_FUN_024_GetStridesByIterationAsync_NoMatch_ReturnsEmpty()
    {
        // Arrange
        Context.Strides.Add(new Stride { Id = 1, IterationId = 99 });
        await Context.SaveChangesAsync();

        // Act
        var result = await _repo.GetStridesByIterationAsync(100);
        // Assert
        Assert.That(result, Is.Empty);
    }

    [Test]
    public async Task REQ_FUN_024_GetStridesEndingOnAsync_ReturnsStridesWithMatchingEndDate()
    {
        // Arrange
        var targetDate = new DateTime(2026, 6, 1, 15, 30, 0); // time part should be ignored
        var strides = new List<Stride>
            {
                new Stride { Id = 1, Name = "Ends on target", EndDate = targetDate },
                new Stride { Id = 2, Name = "Ends earlier", EndDate = new DateTime(2026, 5, 31) },
                new Stride { Id = 3, Name = "Ends later", EndDate = new DateTime(2026, 6, 2) }
            };
        Context.Strides.AddRange(strides);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repo.GetStridesEndingOnAsync(targetDate);
        var list = result.ToList();

        // Assert
        Assert.That(list.Count, Is.EqualTo(1));
        Assert.That(list[0].Id, Is.EqualTo(1));
    }

    [Test]
    public async Task REQ_FUN_024_GetStridesEndingOnAsync_NoMatch_ReturnsEmpty()
    {
        // Arrange
        Context.Strides.Add(new Stride { Id = 1, EndDate = new DateTime(2026, 6, 5) });
        await Context.SaveChangesAsync();

        // Act
        var result = await _repo.GetStridesEndingOnAsync(new DateTime(2026, 6, 1));
        // Assert
        Assert.That(result, Is.Empty);
    }

    // Optional inherited generic method tests
    [Test]
    public async Task REQ_FUN_024_GetByIdAsync_ReturnsEntity()
    {
        // Arrange
        var stride = new Stride { Id = 5, Name = "Stride 5", IterationId = 1 };
        Context.Strides.Add(stride);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repo.GetByIdAsync(5);
        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result!.Id, Is.EqualTo(5));
    }

    [Test]
    public async Task REQ_FUN_024_AddAsync_PersistsEntity()
    {
        // Arrange
        var stride = new Stride { Name = "New Stride", IterationId = 2, StartDate = DateTime.UtcNow, EndDate = DateTime.UtcNow.AddDays(14) };
        // Act
        await _repo.AddAsync(stride);
        await Context.SaveChangesAsync();

        // Assert
        var saved = Context.Strides.FirstOrDefault(s => s.Name == "New Stride");
        Assert.That(saved, Is.Not.Null);
        Assert.That(saved!.IterationId, Is.EqualTo(2));
    }
}
