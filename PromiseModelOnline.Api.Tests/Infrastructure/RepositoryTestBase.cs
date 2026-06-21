using Microsoft.EntityFrameworkCore;
using NUnit.Framework;
using PromiseModelOnline.Api.DAL;

namespace PromiseModelOnline.Api.Tests.Infrastructure;

/// <summary>Base class for repository unit tests providing an in-memory database context.</summary>
/// <remarks>
///   Creates a fresh <see cref="PromiseModelOnlineContext"/> backed by an in-memory database
///   with a unique GUID name per test run, ensuring test isolation.
/// </remarks>
public abstract class RepositoryTestBase
{
    /// <summary>The in-memory database context for the current test.</summary>
    protected PromiseModelOnlineContext Context { get; private set; } = null!;

    /// <summary>Create a new in-memory database context before each test.</summary>
    [SetUp]
    public void BaseSetUp()
    {
        var options = new DbContextOptionsBuilder<PromiseModelOnlineContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        Context = new PromiseModelOnlineContext(options);
    }

    /// <summary>Dispose the database context after each test.</summary>
    [TearDown]
    public void BaseTearDown()
    {
        Context.Dispose();
    }
}
