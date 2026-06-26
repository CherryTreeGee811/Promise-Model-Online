using System.Net.Http.Headers;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using PromiseModelOnline.Api.DAL;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Models;
using System.Text.Json;

namespace PromiseModelOnline.Api.Tests.IntegrationTests;

public abstract class ApiIntegrationTestBase
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        Converters = { new JsonStringEnumConverter() }
    };

    private static readonly RsaSecurityKey TestSigningKey = new(RSA.Create(2048));
    private static readonly string TestIssuer = $"https://test-auth-{Guid.NewGuid():N}/";

    protected WebApplicationFactory<Program> Factory = null!;
    protected HttpClient Client { get; private set; } = null!;
    protected int TestUserId => 1;
    protected string TestUserEmail => "owner@example.com";
    protected int NonOwnerUserId => 2;
    protected string NonOwnerEmail => "nonowner@example.com";

    [SetUp]
    public async Task BaseSetUp()
    {
        var dbName = $"TestDb_{Guid.NewGuid():N}";

        Factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.UseSetting("Environment", "Testing");
                builder.UseSetting("JwtSettings:Issuer", TestIssuer);
                builder.UseSetting("JwtSettings:Audience", "test-api");

                builder.ConfigureServices(services =>
                {
                    // Remove all existing DbContext registrations and
                    // any EF Core provider-specific internal services.
                    var remove = services
                        .Where(s =>
                        {
                            var t = s.ServiceType;
                            var name = t.FullName ?? t.Name;
                            return name.Contains("PromiseModelOnlineContext")
                                || name.Contains("DbContextOptions")
                                || name.Contains("DbContextPool")
                                || name.Contains("Microsoft.EntityFrameworkCore.SqlServer")
                                || (t.Assembly.FullName?.Contains("EntityFramework") == true
                                    && name.Contains("Relational"));
                        })
                        .ToList();
                    foreach (var d in remove) services.Remove(d);

                    // Register with InMemory database
                    services.AddDbContext<PromiseModelOnlineContext>(options =>
                        options.UseInMemoryDatabase(dbName));
                    services.AddScoped<IPromiseModelOnlineContext>(sp =>
                        sp.GetRequiredService<PromiseModelOnlineContext>());

                    // Configure JWT validation to use our test signing key.
                    services.Configure<Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerOptions>(
                        "Bearer", options =>
                    {
                        options.Authority = null!;
                        options.MetadataAddress = null!;
                        options.RequireHttpsMetadata = false;
                        options.BackchannelHttpHandler = null!;
                        options.TokenValidationParameters = new TokenValidationParameters
                        {
                            ValidateIssuer = true,
                            ValidIssuer = TestIssuer,
                            ValidateAudience = false,
                            ValidateLifetime = true,
                            ValidateIssuerSigningKey = true,
                            IssuerSigningKey = TestSigningKey,
                            ClockSkew = TimeSpan.Zero
                        };
                    });
                });
            });

        // Ensure database exists before any hosted services query it
        using (var scope = Factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PromiseModelOnlineContext>();
            db.Database.EnsureCreated();
        }

        Client = Factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false
        });

        await SeedTestDataAsync();
    }

    [TearDown]
    public async Task BaseTearDown()
    {
        Client.Dispose();
        await Factory.DisposeAsync();
    }

    protected async Task SeedTestDataAsync()
    {
        using var scope = Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PromiseModelOnlineContext>();

        if (!db.Users.Any())
        {
            db.Users.Add(new User { Id = TestUserId, Email = TestUserEmail, Name = "Test Owner", Slug = "pmo_test" });
            db.Users.Add(new User { Id = NonOwnerUserId, Email = NonOwnerEmail, Name = "Test NonOwner", Slug = "pmo_test2" });
            await db.SaveChangesAsync();
        }

        if (!db.Projects.Any())
        {
            db.Projects.Add(new Project { Id = 1, Name = "Test Project", Slug = "seeded-project", OwnerId = TestUserId, Description = "A seeded test project", CreatedAt = DateTime.UtcNow });
            await db.SaveChangesAsync();
        }
    }

    protected string GenerateToken(int userId, string email, string name, string slug, params string[] scopes)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId.ToString()),
            new(ClaimTypes.Email, email),
            new("name", name),
            new("slug", slug)
        };

        foreach (var scope in scopes)
            claims.Add(new("scope", scope));

        var descriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Issuer = TestIssuer,
            Expires = DateTime.UtcNow.AddHours(1),
            SigningCredentials = new SigningCredentials(TestSigningKey, SecurityAlgorithms.RsaSha256)
        };

        return new JsonWebTokenHandler().CreateToken(descriptor);
    }

    protected string OwnerToken => GenerateToken(TestUserId, TestUserEmail, "Test Owner", "pmo_test", "projects.read", "projects.write");
    protected string ReadOnlyToken => GenerateToken(TestUserId, TestUserEmail, "Test Owner", "pmo_test", "projects.read");
    protected string NonOwnerToken => GenerateToken(NonOwnerUserId, NonOwnerEmail, "Test NonOwner", "pmo_test2", "projects.read", "projects.write");
    protected string NoScopeToken => GenerateToken(TestUserId, TestUserEmail, "Test Owner", "pmo_test");

    protected void SetAuthHeader(string token) => Client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

    protected async Task<HttpResponseMessage> GetAsync(string path) => await Client.GetAsync(path);

    protected async Task<HttpResponseMessage> PostAsync(string path, object body)
    {
        var json = JsonSerializer.Serialize(body, JsonOptions);
        return await Client.PostAsync(path, new StringContent(json, System.Text.Encoding.UTF8, "application/json"));
    }

    protected async Task<HttpResponseMessage> PatchAsync(string path, object body)
    {
        var json = JsonSerializer.Serialize(body, JsonOptions);
        return await Client.PatchAsync(path, new StringContent(json, System.Text.Encoding.UTF8, "application/json"));
    }

    protected async Task<HttpResponseMessage> PutAsync(string path, object body)
    {
        var json = JsonSerializer.Serialize(body, JsonOptions);
        return await Client.PutAsync(path, new StringContent(json, System.Text.Encoding.UTF8, "application/json"));
    }

    protected async Task<T?> ReadJsonAsync<T>(HttpResponseMessage response)
    {
        var body = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<T>(body, JsonOptions);
    }
}
