using Microsoft.OpenApi;
using System.Security.Cryptography.X509Certificates;
using Microsoft.EntityFrameworkCore;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.Services;

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
            .WithMethods("GET", "POST", "OPTIONS")
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

builder.Services.AddControllers();
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