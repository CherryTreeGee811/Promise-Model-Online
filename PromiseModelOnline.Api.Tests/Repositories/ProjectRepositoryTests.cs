using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.Repositories.Implementations;
using PromiseModelOnline.Api.Tests.Fixtures;

namespace PromiseModelOnline.Api.Tests.Repositories;

[TestFixture]
public class ProjectRepositoryTests
{
    [Test]
    public async Task GetProjectsByOwnerAsync_ReturnsOnlyMatchingOwner_WithPaging()
    {
        using var factory = new SqliteDbContextFactory();
        using var context = factory.CreateContext();

        var owner1 = new User { Id = 100, Email = "owner1@pmo.test", PasswordHash = "h", Name = "Owner1" };
        var owner2 = new User { Id = 200, Email = "owner2@pmo.test", PasswordHash = "h", Name = "Owner2" };

        context.Users.AddRange(owner1, owner2);
        context.Projects.AddRange(
            new Project { Id = 1, Name = "A", OwnerId = 100 },
            new Project { Id = 2, Name = "B", OwnerId = 100 },
            new Project { Id = 3, Name = "C", OwnerId = 200 });
        await context.SaveChangesAsync();

        var repository = new ProjectRepository(context);

        var result = await repository.GetProjectsByOwnerAsync(100, 0, 1);

        Assert.That(result, Has.Count.EqualTo(1));
        Assert.That(result[0].OwnerId, Is.EqualTo(100));
    }

    [Test]
    public async Task GetProjectWithPromisesAsync_LoadsProductPromises()
    {
        using var factory = new SqliteDbContextFactory();
        using var context = factory.CreateContext();

        var owner = new User { Id = 500, Email = "owner@pmo.test", PasswordHash = "h", Name = "Owner" };
        context.Users.Add(owner);
        context.Projects.Add(new Project { Id = 10, Name = "Main", OwnerId = 500 });
        context.Promises.Add(new Promise { Id = 20, Statement = "P1", ProjectId = 10, StatusColor = "red" });
        await context.SaveChangesAsync();

        var repository = new ProjectRepository(context);

        var result = await repository.GetProjectWithPromisesAsync(10);

        Assert.That(result, Is.Not.Null);
        Assert.That(result!.ProductPromises, Has.Count.EqualTo(1));
    }
}
