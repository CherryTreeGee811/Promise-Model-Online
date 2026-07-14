using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Logging;
using PromiseModelOnline.Api.BusinessLogic.Interfaces;

namespace PromiseModelOnline.Api.Services;

/// <summary>Looks up users in the auth system's Identity database (PromiseModelOnlineAuth) via ADO.NET.</summary>
/// <remarks>
///   The auth database is a separate physical database on the same SQL Server instance.
///   This service uses its own connection string (with pmo_auth credentials) to query
///   <c>AspNetUsers</c> independently of the main app's DbContext.
/// </remarks>
public class AuthUserLookupService(
    string connectionString,
    ILogger<AuthUserLookupService> logger) : IAuthUserLookupService
{
    private readonly string _connectionString = connectionString;
    private readonly ILogger<AuthUserLookupService> _logger = logger;

    /// <summary>Search the auth DB by normalized UserName or Email (exact match).</summary>
    public async Task<AuthUserInfo?> FindByUsernameOrEmailAsync(string searchTerm)
    {
        if (string.IsNullOrWhiteSpace(searchTerm))
            return null;

        if (string.IsNullOrEmpty(_connectionString))
        {
            _logger.LogWarning("AuthDB connection string not configured; skipping auth user lookup");
            return null;
        }

        var normalized = searchTerm.ToUpperInvariant();

        try
        {
            await using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            const string sql = """
                SELECT TOP 1 [UserName], [Email]
                FROM [dbo].[AspNetUsers]
                WHERE [NormalizedUserName] = @normalized OR [NormalizedEmail] = @normalized
                """;

            await using var command = new SqlCommand(sql, connection);
            command.Parameters.AddWithValue("@normalized", normalized);

            await using var reader = await command.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                return new AuthUserInfo
                {
                    UserName = reader.GetString(reader.GetOrdinal("UserName")),
                    Email = reader.GetString(reader.GetOrdinal("Email"))
                };
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Auth user lookup failed for '{SearchTerm}'", searchTerm);
        }

        return null;
    }
}
