using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.Tests.Fixtures;

internal sealed class SqliteDbContextFactory : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly DbContextOptions<ApplicationDbContext> _options;

    public SqliteDbContextFactory()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();

        _options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlite(_connection)
            .Options;

        using var context = CreateContext();
        context.Database.EnsureCreated();
    }

    public ApplicationDbContext CreateContext()
    {
        return new ApplicationDbContext(_options);
    }

    public void Dispose()
    {
        _connection.Dispose();
    }
}
