using Microsoft.OpenApi;
using PromiseModelOnline.Api.Extensions;
using System.Security.Cryptography.X509Certificates;
using Microsoft.EntityFrameworkCore;
using PromiseModelOnline.Api.DAL;
using PromiseModelOnline.Api.DAL.Interfaces;

var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";
var builder = WebApplication.CreateBuilder(args);
var AllowedHeaders = new[] { "Content-Type", "Accept", "Accept-Language", "Authorization" };

builder.Services.AddCors(options =>
{
    options.AddPolicy(name: MyAllowSpecificOrigins,
        policy =>
        {
            policy
            .AllowAnyOrigin()
            .WithMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
            .WithHeaders(AllowedHeaders);
        });
});

// Configure Kestrel to use SSL with PEM files
builder.WebHost.ConfigureKestrel(options =>
{
    options.ListenAnyIP(8000, listenOptions =>
    {
        var cert = X509Certificate2.CreateFromPemFile("cert.pem", "key.pem");
        listenOptions.UseHttps(cert);
    });
});

builder.Services.AddPromiseModelOnlineScopes(builder.Configuration);
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Promise Model Online API", Version = "v1" });
});

var app = builder.Build();
app.ApplyMigrations();

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<PromiseModelOnlineContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("PromiseHierarchySeeder");

    logger.LogInformation("Running Promise hierarchy seed...");
    await PromiseHierarchySeeder.SeedAsync(dbContext, app.Environment.ContentRootPath, logger);
    logger.LogInformation("Migration and seed startup step complete.");
}

app.UseCors(MyAllowSpecificOrigins);

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Promise Model Online API v1");
        c.RoutePrefix = string.Empty;
    });
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();