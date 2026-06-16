using Microsoft.OpenApi;
using PromiseModelOnline.Api.Extensions;
using System.Text.Json.Serialization;
using System.Security.Cryptography.X509Certificates;
using System.IO;
using Microsoft.EntityFrameworkCore;
using PromiseModelOnline.Api.DAL;
using PromiseModelOnline.Api.DAL.Interfaces;
using PromiseModelOnline.Api.Filters;
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
                "https://localhost:9000",
                "https://promisemodelonlineclient:9000")
            .WithMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
            .AllowAnyHeader()
            .WithExposedHeaders("X-Total-Count")
            .AllowCredentials();
        });
});

// Kestrel HTTPS with certificate file (cert.pem / key.pem) or fallback to HTTP.
const string DefaultHttpUrl = "http://+:8000";
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
    var urls = Environment.GetEnvironmentVariable("ASPNETCORE_URLS") ?? DefaultHttpUrl;
    if (urls.Contains("https://")) urls = urls.Replace("https://", "http://");
    builder.WebHost.UseUrls(urls);
}

// JWT Bearer authentication with token validation and SignalR token support.
var issuer = config["JwtSettings:Issuer"]!;
var audience = config["JwtSettings:Audience"]!;

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.Authority = issuer;
        o.Audience = audience;
        o.TokenValidationParameters.ValidateAudience = false;
        o.TokenValidationParameters.ValidIssuer = issuer;

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
            }
        };

        if (builder.Environment.IsDevelopment())
        {
#pragma warning disable S4830 // Development-only self-signed cert
            o.BackchannelHttpHandler = new HttpClientHandler
            {
                ServerCertificateCustomValidationCallback =
                    HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
            };
#pragma warning restore S4830
            o.RequireHttpsMetadata = false;
        }
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
builder.Services.AddPromiseModelOnlineScopes(builder.Configuration);
builder.Services.AddControllers(options =>
    {
        options.Filters.Add<AuditLoggingActionFilter>();
    })
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>{
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

// Forwarded headers (behind nginx reverse proxy) and global exception handler.
if (!app.Environment.IsEnvironment("Testing"))
{
    app.UseForwardedHeaders(new ForwardedHeadersOptions
    {
        ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
    });

    app.UseExceptionHandler(exceptionHandlerApp =>
    {
        exceptionHandlerApp.Run(async context =>
        {
            var exception = context.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerFeature>()?.Error;
            if (exception != null)
            {
                var logger = context.RequestServices.GetRequiredService<ILoggerFactory>()
                    .CreateLogger("GlobalExceptionHandler");
                logger.LogError(exception, "Unhandled exception processing {Method} {Path}",
                    context.Request.Method, context.Request.Path);

                context.Response.StatusCode = StatusCodes.Status500InternalServerError;
                context.Response.ContentType = "application/problem+json";
                await context.Response.WriteAsync(
                    """{"type":"https://tools.ietf.org/html/rfc7231#section-6.6.1","title":"Internal Server Error","status":500}""");
            }
        });
    });
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

if (!app.Environment.IsEnvironment("Testing"))
    app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHub<NotificationHub>("/hubs/notifications");

app.Run();

public partial class Program { }
