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

var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";
var builder = WebApplication.CreateBuilder(args);

var config = builder.Configuration;

// CORS policy for the SPA client origin.
builder.Services.AddCors(options =>
{
    options.AddPolicy(name: MyAllowSpecificOrigins,
        policy =>
        {
            policy
            .WithOrigins(
                builder.Configuration["APP_BASE_URL"] ?? "https://localhost:9000",
                "https://promisemodelonlineclient:9000")
            .WithMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
            .AllowAnyHeader()
            .WithExposedHeaders("X-Total-Count")
            .AllowCredentials();
        });
});

// Kestrel HTTPS with certificate file (cert.pem / key.pem) or fallback to HTTP.
var configuredUrl = builder.Configuration["Kestrel:Endpoints:Http:Url"];
#pragma warning disable S1075 // Hardcoded URI default fallback
var defaultHttpUrl = configuredUrl ?? "http://+:8000";
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
var issuer = config["JwtSettings:Issuer"]!;
var audience = config["JwtSettings:Audience"]!;
var metadataAddress = config["JwtSettings:MetadataAddress"] ?? $"{issuer}/.well-known/openid-configuration";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.Authority = issuer;
        o.MetadataAddress = metadataAddress;
        o.Audience = audience;
        o.TokenValidationParameters.ValidAudience = audience;
        o.TokenValidationParameters.ValidIssuer = issuer;
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
        var registrationKey = app.Configuration["Auth:RegistrationKey"];

        if (!string.IsNullOrEmpty(registrationKey))
        {
            var escapedKey = registrationKey.Replace("'", "\\'");
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
