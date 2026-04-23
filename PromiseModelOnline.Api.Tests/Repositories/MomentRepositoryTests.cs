using PromiseModelOnline.Api.Enums;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.Repositories.Implementations;
using PromiseModelOnline.Api.Tests.Fixtures;

namespace PromiseModelOnline.Api.Tests.Repositories;

[TestFixture]
public class MomentRepositoryTests
{
    [Test]
    public async Task GetMomentsByStatusAsync_FiltersByStatus()
    {
        using var factory = new SqliteDbContextFactory();
        using var context = factory.CreateContext();

        var owner = new User { Id = 4001, Email = "o4001@pmo.test", PasswordHash = "h", Name = "Owner" };
        context.Users.Add(owner);
        context.Projects.Add(new Project { Id = 410, Name = "Proj", OwnerId = 4001 });
        context.Promises.Add(new Promise { Id = 411, Statement = "Promise", ProjectId = 410, StatusColor = "red" });
        context.Epics.Add(new Epic { Id = 412, ProductPromiseId = 411, Statement = "Epic", StatusColor = "red" });
        context.Journeys.Add(new Journey { Id = 413, EpicId = 412, Statement = "Journey", StatusColor = "red" });
        context.Flows.Add(new Flow { Id = 414, JourneyId = 413, Statement = "Flow", StatusColor = "red" });
        context.Moments.AddRange(
            new Moment { Id = 1, FlowId = 414, Statement = "Done", Status = MomentStatus.Done },
            new Moment { Id = 2, FlowId = 414, Statement = "Todo", Status = MomentStatus.Todo });
        await context.SaveChangesAsync();

        var repository = new MomentRepository(context);
        var result = await repository.GetMomentsByStatusAsync(MomentStatus.Done, 0, 10);

        Assert.That(result, Has.Count.EqualTo(1));
        Assert.That(result[0].Status, Is.EqualTo(MomentStatus.Done));
    }

    [Test]
    public async Task GetMomentsByFlowOrderedAsync_OrdersByDisplayOrderThenCreatedAt()
    {
        using var factory = new SqliteDbContextFactory();
        using var context = factory.CreateContext();

        var owner = new User { Id = 4002, Email = "o4002@pmo.test", PasswordHash = "h", Name = "Owner" };
        context.Users.Add(owner);
        context.Projects.Add(new Project { Id = 420, Name = "Proj", OwnerId = 4002 });
        context.Promises.Add(new Promise { Id = 421, Statement = "Promise", ProjectId = 420, StatusColor = "red" });
        context.Epics.Add(new Epic { Id = 422, ProductPromiseId = 421, Statement = "Epic", StatusColor = "red" });
        context.Journeys.Add(new Journey { Id = 423, EpicId = 422, Statement = "Journey", StatusColor = "red" });
        context.Flows.Add(new Flow { Id = 424, JourneyId = 423, Statement = "Flow", StatusColor = "red" });
        context.Moments.AddRange(
            new Moment { Id = 11, FlowId = 424, Statement = "B", DisplayOrder = 1, CreatedAt = new DateTime(2026, 1, 2, 0, 0, 0, DateTimeKind.Utc) },
            new Moment { Id = 12, FlowId = 424, Statement = "A-old", DisplayOrder = 0, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Moment { Id = 13, FlowId = 424, Statement = "A-new", DisplayOrder = 0, CreatedAt = new DateTime(2026, 1, 3, 0, 0, 0, DateTimeKind.Utc) });
        await context.SaveChangesAsync();

        var repository = new MomentRepository(context);
        var result = await repository.GetMomentsByFlowOrderedAsync(424, 0, 10);

        Assert.That(result.Select(x => x.Id).ToArray(), Is.EqualTo(new[] { 12, 13, 11 }));
    }
}
