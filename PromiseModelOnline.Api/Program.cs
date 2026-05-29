using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PromiseModelOnline.Api.Common;
using PromiseModelOnline.Api.DAL;
using PromiseModelOnline.Api.Extensions;
using PromiseModelOnline.Api.Hubs;
using System.Security.Claims;
using System.Security.Cryptography.X509Certificates;

var builder = WebApplication.CreateBuilder(args);

// ---------- Auth/public URL config -------------------------------------
var publicIssuer = builder.Configuration["AUTH_PUBLIC_ISSUER"]
    ?? throw new InvalidOperationException("AUTH_PUBLIC_ISSUER is required.");

var metadataAddress = builder.Configuration["AUTH_METADATA_ADDRESS"]
    ?? throw new InvalidOperationException("AUTH_METADATA_ADDRESS is required.");

AppUrls.PublicIssuer = publicIssuer.TrimEnd('/');
AppUrls.AuthMetaData = metadataAddress;

// ---------- Database & scoped services ---------------------------------
var connectionString = builder.Configuration.GetConnectionString("MSSQL");

if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException("ConnectionStrings:MSSQL is required.");
}

connectionString = ResolvePasswordFile(connectionString);
builder.Configuration["ConnectionStrings:MSSQL"] = connectionString;

builder.Services.AddDbContext<PromiseModelOnlineContext>(options =>
    options.UseSqlServer(connectionString));

builder.Services.AddPromiseModelOnlineScopes(builder.Configuration);

// ---------- Authentication: JWT resource-server validation --------------
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // Public issuer expected inside the token.
        options.Authority = AppUrls.PublicIssuer;

        // Internal Docker-reachable metadata URL.
        options.MetadataAddress = AppUrls.AuthMetaData;

        options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = AppUrls.PublicIssuer,

            ValidateAudience = true,
            ValidAudience = "promisemodelonline.api",

            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,

            NameClaimType = "name",
            RoleClaimType = "role"
        };

        if (builder.Environment.IsDevelopment())
        {
            options.BackchannelHttpHandler = new HttpClientHandler
            {
                ServerCertificateCustomValidationCallback =
                    HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
            };
        }

        options.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = context =>
            {
                var logger = context.HttpContext.RequestServices
                    .GetRequiredService<ILoggerFactory>()
                    .CreateLogger("JwtBearer");

                logger.LogError(context.Exception, "JWT authentication failed.");

                return Task.CompletedTask;
            },

            OnChallenge = context =>
            {
                var logger = context.HttpContext.RequestServices
                    .GetRequiredService<ILoggerFactory>()
                    .CreateLogger("JwtBearer");

                logger.LogWarning(
                    "JWT challenge. Error: {Error}. Description: {Description}",
                    context.Error,
                    context.ErrorDescription);

                return Task.CompletedTask;
            }
        };
    });

// ---------- Authorization: scope policies -------------------------------
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("Projects.Read", policy =>
    {
        policy.RequireAuthenticatedUser();
        policy.RequireAssertion(context =>
            HasScope(context.User, "projects.read"));
    });

    options.AddPolicy("Projects.Write", policy =>
    {
        policy.RequireAuthenticatedUser();
        policy.RequireAssertion(context =>
            HasScope(context.User, "projects.write"));
    });
});

// ---------- HTTPS / Kestrel --------------------------------------------
var certPath = Path.Combine(Directory.GetCurrentDirectory(), "cert.pem");
var keyPath = Path.Combine(Directory.GetCurrentDirectory(), "key.pem");

if (File.Exists(certPath) && File.Exists(keyPath))
{
    builder.WebHost.ConfigureKestrel(options =>
    {
        options.ListenAnyIP(8000, listenOptions =>
        {
            var cert = X509Certificate2.CreateFromPemFile(certPath, keyPath);
            listenOptions.UseHttps(cert);
        });
    });
}
else
{
    var urls = Environment.GetEnvironmentVariable("ASPNETCORE_URLS") ?? "http://+:8000";
    builder.WebHost.UseUrls(urls);
}

// ---------- MVC & background services ----------------------------------
builder.Services.AddControllers();
builder.Services.AddSignalR();
builder.Services.AddHostedService<StrideAutomationService>();

var app = builder.Build();

app.ApplyMigrations();

// ---------- Development Seed -------------------------------------------
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();

    var db = scope.ServiceProvider.GetRequiredService<PromiseModelOnlineContext>();
    var env = scope.ServiceProvider.GetRequiredService<IWebHostEnvironment>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

    await PromiseHierarchySeeder.SeedAsync(db, env.ContentRootPath, logger);
}

// ---------- Security headers -------------------------------------------
app.Use(async (context, next) =>
{
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["X-Frame-Options"] = "DENY";

    if (context.Request.IsHttps)
    {
        context.Response.Headers["Strict-Transport-Security"] =
            "max-age=31536000; includeSubDomains";
    }

    await next();
});

// ---------- Middleware pipeline ----------------------------------------
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<NotificationHub>("/hubs/notifications");

app.Run();

static string ResolvePasswordFile(string connectionString)
{
    if (!connectionString.Contains("Password_FILE=", StringComparison.OrdinalIgnoreCase))
    {
        return connectionString;
    }

    var parts = connectionString
        .Split(';', StringSplitOptions.RemoveEmptyEntries)
        .ToList();

    for (var i = 0; i < parts.Count; i++)
    {
        if (!parts[i].StartsWith("Password_FILE=", StringComparison.OrdinalIgnoreCase))
        {
            continue;
        }

        var filePath = parts[i]["Password_FILE=".Length..];

        if (!File.Exists(filePath))
        {
            throw new FileNotFoundException(
                $"The configured password file does not exist: {filePath}",
                filePath);
        }

        var password = File.ReadAllText(filePath).Trim();
        parts[i] = $"Password={password}";
    }

    return string.Join(';', parts);
}

static bool HasScope(ClaimsPrincipal user, string requiredScope)
{
    return user.FindAll("scope")
            .SelectMany(claim => claim.Value.Split(' ', StringSplitOptions.RemoveEmptyEntries))
            .Contains(requiredScope, StringComparer.Ordinal)
        || user.FindAll("scp")
            .SelectMany(claim => claim.Value.Split(' ', StringSplitOptions.RemoveEmptyEntries))
            .Contains(requiredScope, StringComparer.Ordinal);
}