using Microsoft.EntityFrameworkCore;
using NUnit.Framework;
using PromiseModelOnline.Api.DAL;

namespace PromiseModelOnline.Api.Tests.Infrastructure;

public abstract class RepositoryTestBase
{
    protected PromiseModelOnlineContext Context { get; private set; } = null!;

    [SetUp]
    public void BaseSetUp()
    {
        var options = new DbContextOptionsBuilder<PromiseModelOnlineContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        Context = new PromiseModelOnlineContext(options);
    }

    [TearDown]
    public void BaseTearDown()
    {
        Context.Dispose();
    }
}
