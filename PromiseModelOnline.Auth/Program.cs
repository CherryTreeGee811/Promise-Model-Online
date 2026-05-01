using PromiseModelOnline.Auth.DAL;
using PromiseModelOnline.Auth.Extensions;
using Microsoft.OpenApi;
using System.Security.Cryptography.X509Certificates;
using Microsoft.EntityFrameworkCore;

var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(options =>
{
    options.AddPolicy(name: MyAllowSpecificOrigins, policy =>
    {
          policy.WithOrigins("https://localhost:8000", "https://promisemodelonline.api:8000")
                .WithMethods("POST")
                .AllowAnyHeader();
    });
});

// Configure Kestrel to use SSL with PEM files when available; otherwise fall back to HTTP
var certPath = Path.Combine(Directory.GetCurrentDirectory(), "cert.pem");
var keyPath = Path.Combine(Directory.GetCurrentDirectory(), "key.pem");
if (File.Exists(certPath) && File.Exists(keyPath))
{
    builder.WebHost.ConfigureKestrel(options =>
    {
        options.ListenAnyIP(8060, listenOptions =>
        {
            var cert = X509Certificate2.CreateFromPemFile(certPath, keyPath);
            listenOptions.UseHttps(cert);
        });
    });
}
else
{
    var urls = Environment.GetEnvironmentVariable("ASPNETCORE_URLS") ?? "http://+:8000";
    if (urls.Contains("https://")) urls = urls.Replace("https://", "http://");
    builder.WebHost.UseUrls(urls);
}


builder.Services.AddAuthScopes(builder.Configuration);

var app = builder.Build();

// apply migrations (if any) for the Auth database
app.ApplyMigrations();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Authorization Server");
        c.RoutePrefix = string.Empty;
    });

    await AuthorizationSeeder.SeedAsync(app.Services);
}

app.UseCors(MyAllowSpecificOrigins);
app.UseAuthorization();
app.MapControllers();
app.Run();