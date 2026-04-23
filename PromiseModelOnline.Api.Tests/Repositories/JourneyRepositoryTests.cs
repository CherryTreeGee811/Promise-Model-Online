using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.Repositories.Implementations;
using PromiseModelOnline.Api.Tests.Fixtures;

namespace PromiseModelOnline.Api.Tests.Repositories;

[TestFixture]
public class JourneyRepositoryTests
{
    [Test]
    public async Task GetJourneyWithFlowsAsync_LoadsFlows()
    {
        using var factory = new SqliteDbContextFactory();
        using var context = factory.CreateContext();

        var owner = new User { Id = 2001, Email = "o2001@pmo.test", PasswordHash = "h", Name = "Owner" };
        context.Users.Add(owner);
        context.Projects.Add(new Project { Id = 210, Name = "Proj", OwnerId = 2001 });
        context.Promises.Add(new Promise { Id = 211, Statement = "Promise", ProjectId = 210, StatusColor = "red" });
        context.Epics.Add(new Epic { Id = 212, ProductPromiseId = 211, Statement = "Epic", StatusColor = "red" });
        context.Journeys.Add(new Journey { Id = 213, EpicId = 212, Statement = "Journey", StatusColor = "red" });
        context.Flows.Add(new Flow { Id = 214, JourneyId = 213, Statement = "Flow", StatusColor = "red" });
        await context.SaveChangesAsync();

        var repository = new JourneyRepository(context);
        var result = await repository.GetJourneyWithFlowsAsync(213);

        Assert.That(result, Is.Not.Null);
        Assert.That(result!.Flows, Has.Count.EqualTo(1));
    }
}
