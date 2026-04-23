using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.Repositories.Implementations;
using PromiseModelOnline.Api.Tests.Fixtures;

namespace PromiseModelOnline.Api.Tests.Repositories;

[TestFixture]
public class FlowRepositoryTests
{
    [Test]
    public async Task GetFlowWithMomentsAsync_LoadsMoments()
    {
        using var factory = new SqliteDbContextFactory();
        using var context = factory.CreateContext();

        var owner = new User { Id = 3001, Email = "o3001@pmo.test", PasswordHash = "h", Name = "Owner" };
        context.Users.Add(owner);
        context.Projects.Add(new Project { Id = 310, Name = "Proj", OwnerId = 3001 });
        context.Promises.Add(new Promise { Id = 311, Statement = "Promise", ProjectId = 310, StatusColor = "red" });
        context.Epics.Add(new Epic { Id = 312, ProductPromiseId = 311, Statement = "Epic", StatusColor = "red" });
        context.Journeys.Add(new Journey { Id = 313, EpicId = 312, Statement = "Journey", StatusColor = "red" });
        context.Flows.Add(new Flow { Id = 314, JourneyId = 313, Statement = "Flow", StatusColor = "red" });
        context.Moments.Add(new Moment { Id = 315, FlowId = 314, Statement = "Moment" });
        await context.SaveChangesAsync();

        var repository = new FlowRepository(context);
        var result = await repository.GetFlowWithMomentsAsync(314);

        Assert.That(result, Is.Not.Null);
        Assert.That(result!.Moments, Has.Count.EqualTo(1));
    }
}
