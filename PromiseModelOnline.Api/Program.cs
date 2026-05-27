using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PromiseModelOnline.Api.DAL;
using PromiseModelOnline.Api.Extensions;
using System.Security.Cryptography.X509Certificates;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using PromiseModelOnline.Api.Hubs;
using PromiseModelOnline.Api.Common;
using OpenIddict.Validation.AspNetCore;
using OpenIddict.Validation;


var builder = WebApplication.CreateBuilder(args);

AppUrls.BaseUrl = builder.Configuration["APP_BASE_URL"] ?? "";

// ---------- CORS -------------------------------------------------------
builder.Services.AddCors(options =>
{
    options.AddPolicy("SPA", policy =>
    {
        policy.WithOrigins(AppUrls.BaseUrl)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// ---------- Database & scoped services ---------------------------------
var connectionString = builder.Configuration.GetConnectionString("MSSQL");

if (!string.IsNullOrEmpty(connectionString) && connectionString.Contains("Password_FILE="))
{
    var parts = connectionString
        .Split(';', StringSplitOptions.RemoveEmptyEntries)
        .ToList();

    for (int i = 0; i < parts.Count; i++)
    {
        if (parts[i].StartsWith("Password_FILE=", StringComparison.OrdinalIgnoreCase))
        {
            var filePath = parts[i].Substring("Password_FILE=".Length);

            if (File.Exists(filePath))
            {
                var password = File.ReadAllText(filePath).Trim();
                parts[i] = $"Password={password}";
            }
        }
    }

    connectionString = string.Join(';', parts);
    builder.Configuration["ConnectionStrings:MSSQL"] = connectionString;
}

builder.Services.AddDbContext<PromiseModelOnlineContext>(options =>
    options.UseSqlServer(connectionString));
    
builder.Services.AddPromiseModelOnlineScopes(builder.Configuration);

// ---------- Authentication (OpenIddict JWT validation) -----------------

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme =
        OpenIddictValidationAspNetCoreDefaults.AuthenticationScheme;

    options.DefaultChallengeScheme =
        OpenIddictValidationAspNetCoreDefaults.AuthenticationScheme;
});

builder.Services.AddOpenIddict()
    .AddValidation(options =>
    {
        options.SetIssuer(AppUrls.BaseUrl);

        options.UseAspNetCore();

        options.AddAudiences("promisemodelonline.api");
    });

// ---------- Authorization (SCOPE POLICIES) -----------------------------
builder.Services.AddAuthorization(options =>
{
    // ✅ READ access
    options.AddPolicy("Projects.Read", policy =>
    {
        policy.RequireAuthenticatedUser();
        policy.RequireClaim("scope", "projects.read");
    });

    // ✅ WRITE access
    options.AddPolicy("Projects.Write", policy =>
    {
        policy.RequireAuthenticatedUser();
        policy.RequireClaim("scope", "projects.write");
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

// ---------- Development Seed ------------------------------------------
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
        context.Response.Headers["Strict-Transport-Security"] =
            "max-age=31536000; includeSubDomains";

    await next();
});

// ---------- Middleware pipeline ---------------------------------------
app.UseCors("SPA");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<NotificationHub>("/hubs/notifications");

app.Run();