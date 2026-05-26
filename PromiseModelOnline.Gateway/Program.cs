using Yarp.ReverseProxy;
using System.Security.Cryptography.X509Certificates;

var builder = WebApplication.CreateBuilder(args);

var certPath = Path.Combine(Directory.GetCurrentDirectory(), "cert.pem");
var keyPath = Path.Combine(Directory.GetCurrentDirectory(), "key.pem");

builder.WebHost.ConfigureKestrel(options =>
{
    options.ListenAnyIP(8010, listenOptions =>
    {
        if (File.Exists(certPath) && File.Exists(keyPath))
        {
            var cert = X509Certificate2.CreateFromPemFile(certPath, keyPath);
            listenOptions.UseHttps(cert);
        }
        else
        {
            // fallback (shouldn't happen in container)
            listenOptions.UseHttps();
        }
    });
});

// ✅ DEV ONLY: allow self-signed certs
if (builder.Environment.IsDevelopment())
{
    Console.WriteLine("⚠️ Dev mode: skipping HTTPS certificate validation");

    builder.Services.AddHttpClient("yarp")
        .ConfigurePrimaryHttpMessageHandler(() =>
        {
            return new HttpClientHandler
            {
                ServerCertificateCustomValidationCallback =
                    HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
            };
        });
}

// ✅ Add YARP
builder.Services
    .AddReverseProxy()
    .ConfigureHttpClient((context, handler) =>
    {
        if (builder.Environment.IsDevelopment())
        {
            Console.WriteLine("⚠️ Dev mode: skipping HTTPS certificate validation");

            handler.SslOptions.RemoteCertificateValidationCallback =
                (sender, cert, chain, errors) => true;
        }
    })
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));;

var app = builder.Build();

app.MapReverseProxy();

app.Run();