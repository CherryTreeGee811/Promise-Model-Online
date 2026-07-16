using Microsoft.OpenApi;
using PromiseModelOnline.Api.Extensions;
using System.Text.Json.Serialization;
using System.Security.Cryptography.X509Certificates;
using System.IO;
using Microsoft.EntityFrameworkCore;
using PromiseModelOnline.Api.DAL;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Filters;
using PromiseModelOnline.Api.Middleware;
using PromiseModelOnline.Api.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Protocols;
using PromiseModelOnline.Api.Auth;
using PromiseModelOnline.Api.Hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.HttpOverrides;
using PromiseModelOnline.Api.Configuration;
using Serilog;

var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";
var builder = WebApplication.CreateBuilder(args);

Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .CreateLogger();

builder.Host.UseSerilog();

var config = builder.Configuration;

// Register strongly-typed options with startup validation.
builder.Services.AddOptions<JwtSettings>()
    .Bind(config.GetSection(JwtSettings.SectionName))
    .ValidateDataAnnotations()
    .ValidateOnStart();

builder.Services.AddOptions<CorsSettings>()
    .Bind(config.GetSection(CorsSettings.SectionName))
    .ValidateDataAnnotations()
    .ValidateOnStart();

builder.Services.AddOptions<AuthSettings>()
    .Bind(config.GetSection(AuthSettings.SectionName))
    .ValidateOnStart();

var jwtSettings = config.GetSection(JwtSettings.SectionName).Get<JwtSettings>()
    ?? throw new InvalidOperationException("JwtSettings configuration is required.");
var corsSettings = config.GetSection(CorsSettings.SectionName).Get<CorsSettings>()
    ?? new CorsSettings { AllowedOrigins = config["APP_BASE_URL"] ?? "https://localhost:9000" };
if (string.IsNullOrEmpty(corsSettings.AllowedOrigins))
    corsSettings.AllowedOrigins = config["APP_BASE_URL"] ?? "https://localhost:9000";
var authSettings = config.GetSection(AuthSettings.SectionName).Get<AuthSettings>()
    ?? new AuthSettings();

// CORS policy for the SPA client origin.
builder.Services.AddCors(options =>
{
    options.AddPolicy(name: MyAllowSpecificOrigins,
        policy =>
        {
            policy
            .WithOrigins(
                corsSettings.AllowedOrigins,
                "https://promisemodelonlineclient:9000")
            .WithMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
            .AllowAnyHeader()
            .WithExposedHeaders("X-Total-Count")
            .AllowCredentials();
        });
});

// Kestrel HTTPS with certificate file (cert.pem / key.pem) or fallback to HTTP.
var kestrelUrl = config["Kestrel:Endpoints:Http:Url"];
#pragma warning disable S1075 // Hardcoded URI default fallback
#pragma warning disable S5332 // HTTP used only for container-internal traffic behind nginx TLS termination; external traffic always uses HTTPS
var defaultHttpUrl = kestrelUrl ?? "http://+:8000";
#pragma warning restore S5332
#pragma warning restore S1075
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
    var urls = Environment.GetEnvironmentVariable("ASPNETCORE_URLS") ?? defaultHttpUrl;
    if (urls.Contains("https://")) urls = urls.Replace("https://", "http://");
    builder.WebHost.UseUrls(urls);
}

// JWT Bearer authentication with token validation and SignalR token support.
var metadataAddress = string.IsNullOrEmpty(jwtSettings.MetadataAddress)
    ? $"{jwtSettings.Issuer}/.well-known/openid-configuration"
    : jwtSettings.MetadataAddress;

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.Authority = jwtSettings.Issuer;
        o.MetadataAddress = metadataAddress;
        o.Audience = jwtSettings.Audience;
        o.TokenValidationParameters.ValidAudience = jwtSettings.Audience;
        o.TokenValidationParameters.ValidIssuer = jwtSettings.Issuer;
        o.TokenValidationParameters.TokenDecryptionKeyResolver = (token, securityToken, kid, parameters) =>
            parameters.IssuerSigningKeys;

        o.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            },

            OnAuthenticationFailed = context =>
            {
                var logger = context.HttpContext.RequestServices
                    .GetRequiredService<ILogger<JwtBearerHandler>>();
                logger.LogError(context.Exception,
                    "JWT bearer authentication failed for {Path}",
                    context.HttpContext.Request.Path);
                return Task.CompletedTask;
            }
        };

#pragma warning disable S4830 // Self-signed cert OK for Docker-internal backchannel
        o.BackchannelHttpHandler = new HttpClientHandler
        {
            ServerCertificateCustomValidationCallback =
                HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
        };
#pragma warning restore S4830

        if (builder.Environment.IsDevelopment())
            o.RequireHttpsMetadata = false;
    });

// Scope claims transformer and authorization policies for projects.read / projects.write.
builder.Services.AddTransient<IClaimsTransformation, ScopeClaimsTransformer>();
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("projects.read", policy =>
        policy.RequireClaim("scope", "projects.read"));
    options.AddPolicy("projects.write", policy =>
        policy.RequireClaim("scope", "projects.write"));
});

// SignalR, DI registration, MVC controllers, and Swagger.
builder.Services.AddSignalR();
builder.Services.AddSingleton<IHtmlInputSanitizer, HtmlInputSanitizer>();
builder.Services.AddPromiseModelOnlineScopes(builder.Configuration);
builder.Services.AddControllers(options =>
    {
        options.Filters.Add<AuditLoggingActionFilter>();
        options.Filters.Add<StandardErrorEnvelopeFilter>();
        options.Filters.Add<InputSanitizationFilter>();
    })
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Description = "Enter your JWT token",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });

    c.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        [new OpenApiSecuritySchemeReference("Bearer", document)] = []
    });
});

var app = builder.Build();

// Apply migrations and seed development data.
if (!app.Environment.IsEnvironment("Testing"))
{
    app.ApplyMigrations();

    if (app.Environment.IsDevelopment())
    {
        using (var scope = app.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<PromiseModelOnlineContext>();
            var logger = scope.ServiceProvider
                .GetRequiredService<ILoggerFactory>()
                .CreateLogger("PromiseHierarchySeeder");

            logger.LogInformation("Running Promise hierarchy seed...");

            await PromiseHierarchySeeder.SeedAsync(
                dbContext,
                app.Environment.ContentRootPath,
                logger);

            logger.LogInformation("Migration and seed startup step complete.");
        }
    }
}

// Forwarded headers (behind nginx reverse proxy), global exception handler.
if (!app.Environment.IsEnvironment("Testing"))
{
    app.UseForwardedHeaders(new ForwardedHeadersOptions
    {
        ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
    });

    app.UseMiddleware<GlobalExceptionMiddleware>();
}

// CORS, Swagger UI, authentication, authorization, and endpoint mapping.
app.UseCors(MyAllowSpecificOrigins);

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Api Server");
        c.RoutePrefix = string.Empty;

        if (!string.IsNullOrEmpty(authSettings.RegistrationKey))
        {
            var escapedKey = authSettings.RegistrationKey.Replace("'", "\\'");
            c.UseRequestInterceptor($"(req) => {{ req.headers['X-Registration-Key'] = '{escapedKey}'; return req; }}");
        }
    });
}

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHub<NotificationHub>("/hubs/notifications");

await app.RunAsync();

/// <summary>Entry point for the Resource API server application.</summary>
public partial class Program
{
    /// <summary>Prevents instantiation of the <see cref="Program"/> class.</summary>
    protected Program() { }
}
