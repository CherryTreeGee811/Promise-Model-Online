using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.Repositories.Implementations;
using PromiseModelOnline.Api.Tests.Fixtures;

namespace PromiseModelOnline.Api.Tests.Repositories;

[TestFixture]
public class PromiseRepositoryTests
{
    [Test]
    public async Task GetPromisesByProjectOrderedAsync_OrdersByDisplayOrderThenCreatedAt()
    {
        using var factory = new SqliteDbContextFactory();
        using var context = factory.CreateContext();

        var owner = new User { Id = 900, Email = "owner900@pmo.test", PasswordHash = "h", Name = "Owner900" };
        context.Users.Add(owner);
        context.Projects.Add(new Project { Id = 91, Name = "Project", OwnerId = 900 });
        context.Promises.AddRange(
            new Promise { Id = 1, ProjectId = 91, Statement = "B", StatusColor = "red", DisplayOrder = 1, CreatedAt = new DateTime(2026, 1, 2, 0, 0, 0, DateTimeKind.Utc) },
            new Promise { Id = 2, ProjectId = 91, Statement = "A-older", StatusColor = "red", DisplayOrder = 0, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Promise { Id = 3, ProjectId = 91, Statement = "A-newer", StatusColor = "red", DisplayOrder = 0, CreatedAt = new DateTime(2026, 1, 3, 0, 0, 0, DateTimeKind.Utc) });
        await context.SaveChangesAsync();

        var repository = new PromiseRepository(context);

        var result = await repository.GetPromisesByProjectOrderedAsync(91, 0, 10);

        Assert.That(result.Select(x => x.Id).ToArray(), Is.EqualTo(new[] { 2, 3, 1 }));
    }

    [Test]
    public async Task GetPromiseWithEpicsAsync_LoadsEpicsNavigation()
    {
        using var factory = new SqliteDbContextFactory();
        using var context = factory.CreateContext();

        var owner = new User { Id = 901, Email = "owner901@pmo.test", PasswordHash = "h", Name = "Owner901" };
        context.Users.Add(owner);
        context.Projects.Add(new Project { Id = 92, Name = "Project2", OwnerId = 901 });
        context.Promises.Add(new Promise { Id = 11, ProjectId = 92, Statement = "P11", StatusColor = "red" });
        context.Epics.Add(new Epic { Id = 12, ProductPromiseId = 11, Statement = "E12", StatusColor = "red" });
        await context.SaveChangesAsync();

        var repository = new PromiseRepository(context);

        var result = await repository.GetPromiseWithEpicsAsync(11);

        Assert.That(result, Is.Not.Null);
        Assert.That(result!.Epics, Has.Count.EqualTo(1));
    }
}
