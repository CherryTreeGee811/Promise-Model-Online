using Microsoft.OpenApi;
using System.Security.Cryptography.X509Certificates;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.Services;
using PromiseModelOnline.Api.Repositories.Interfaces;
using PromiseModelOnline.Api.Repositories.Implementations;
using PromiseModelOnline.Api.Services.Interfaces;
using PromiseModelOnline.Api.Services.Implementations;

var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";
var builder = WebApplication.CreateBuilder(args);
var AllowedHeaders = new[] { "Content-Type", "Accept", "Accept-Language", "Authorization" };

var connectionString = builder.Configuration.GetConnectionString("MSSQL")
                       ?? throw new InvalidOperationException("Connection string not found.");

builder.Services.AddCors(options =>
{
    options.AddPolicy(name: MyAllowSpecificOrigins,
        policy =>
        {
            policy
            .AllowAnyOrigin()
            .WithMethods("GET", "POST", "OPTIONS", "PUT", "DELETE")
            .WithHeaders(AllowedHeaders);
        });
});

builder.Services.AddDbContext<ApplicationDbContext>(options => options.UseSqlServer(connectionString));

// Configure Kestrel to use SSL with PEM files
builder.WebHost.ConfigureKestrel(options =>
{
    options.ListenAnyIP(8000, listenOptions =>
    {
        var cert = X509Certificate2.CreateFromPemFile("cert.pem", "key.pem");
        listenOptions.UseHttps(cert);
    });
});

// Configure JSON serialization to avoid circular reference issues
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
        options.JsonSerializerOptions.WriteIndented = true;
    });

// Register repositories
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<IProjectRepository, ProjectRepository>();
builder.Services.AddScoped<IPromiseRepository, PromiseRepository>();
builder.Services.AddScoped<IEpicRepository, EpicRepository>();
builder.Services.AddScoped<IJourneyRepository, JourneyRepository>();
builder.Services.AddScoped<IFlowRepository, FlowRepository>();
builder.Services.AddScoped<IMomentRepository, MomentRepository>();

// Register services
builder.Services.AddScoped<IProjectService, ProjectService>();
builder.Services.AddScoped<IPromiseService, PromiseService>();
builder.Services.AddScoped<IEpicService, EpicService>();
builder.Services.AddScoped<IJourneyService, JourneyService>();
builder.Services.AddScoped<IFlowService, FlowService>();
builder.Services.AddScoped<IMomentService, MomentService>();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Promise Model Online API", Version = "v1" });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("PromiseHierarchySeeder");

    logger.LogInformation("Applying database migrations...");
    await db.Database.MigrateAsync();
    logger.LogInformation("Running Promise hierarchy seed...");
    await PromiseHierarchySeeder.SeedAsync(db, app.Environment.ContentRootPath, logger);
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