using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.Repositories.Implementations;
using PromiseModelOnline.Api.Tests.Fixtures;

namespace PromiseModelOnline.Api.Tests.Repositories;

[TestFixture]
public class EpicRepositoryTests
{
    [Test]
    public async Task GetEpicsByPromiseOrderedAsync_OrdersByDisplayOrderThenCreatedAt()
    {
        using var factory = new SqliteDbContextFactory();
        using var context = factory.CreateContext();

        var owner = new User { Id = 1001, Email = "o1001@pmo.test", PasswordHash = "h", Name = "Owner" };
        context.Users.Add(owner);
        context.Projects.Add(new Project { Id = 110, Name = "P", OwnerId = 1001 });
        context.Promises.Add(new Promise { Id = 111, Statement = "Promise", ProjectId = 110, StatusColor = "red" });
        context.Epics.AddRange(
            new Epic { Id = 1, ProductPromiseId = 111, Statement = "B", StatusColor = "red", DisplayOrder = 1, CreatedAt = new DateTime(2026, 1, 3, 0, 0, 0, DateTimeKind.Utc) },
            new Epic { Id = 2, ProductPromiseId = 111, Statement = "A-old", StatusColor = "red", DisplayOrder = 0, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Epic { Id = 3, ProductPromiseId = 111, Statement = "A-new", StatusColor = "red", DisplayOrder = 0, CreatedAt = new DateTime(2026, 1, 2, 0, 0, 0, DateTimeKind.Utc) });
        await context.SaveChangesAsync();

        var repository = new EpicRepository(context);
        var result = await repository.GetEpicsByPromiseOrderedAsync(111, 0, 10);

        Assert.That(result.Select(x => x.Id).ToArray(), Is.EqualTo(new[] { 2, 3, 1 }));
    }

    [Test]
    public async Task GetEpicWithJourneysAsync_LoadsJourneys()
    {
        using var factory = new SqliteDbContextFactory();
        using var context = factory.CreateContext();

        var owner = new User { Id = 1002, Email = "o1002@pmo.test", PasswordHash = "h", Name = "Owner" };
        context.Users.Add(owner);
        context.Projects.Add(new Project { Id = 120, Name = "P2", OwnerId = 1002 });
        context.Promises.Add(new Promise { Id = 121, Statement = "Promise2", ProjectId = 120, StatusColor = "red" });
        context.Epics.Add(new Epic { Id = 122, ProductPromiseId = 121, Statement = "Epic2", StatusColor = "red" });
        context.Journeys.Add(new Journey { Id = 123, EpicId = 122, Statement = "Journey", StatusColor = "red" });
        await context.SaveChangesAsync();

        var repository = new EpicRepository(context);
        var result = await repository.GetEpicWithJourneysAsync(122);

        Assert.That(result, Is.Not.Null);
        Assert.That(result!.Journeys, Has.Count.EqualTo(1));
    }
}
