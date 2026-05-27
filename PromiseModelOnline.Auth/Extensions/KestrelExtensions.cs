using System.Security.Cryptography.X509Certificates;

namespace PromiseModelOnline.Auth.Extensions
{
    public static class KestrelExtensions
    {
        public static void ConfigureHttps(this WebApplicationBuilder builder)
        {
            var certPath = Path.Combine(Directory.GetCurrentDirectory(), "cert.pem");
            var keyPath  = Path.Combine(Directory.GetCurrentDirectory(), "key.pem");

            if (File.Exists(certPath) && File.Exists(keyPath))
            {
                builder.WebHost.ConfigureKestrel(options =>
                {
                    options.ListenAnyIP(8060, listen =>
                    {
                        var cert = X509Certificate2.CreateFromPemFile(certPath, keyPath);
                        listen.UseHttps(cert);
                    });
                });
            }
            else
            {
                var urls = Environment.GetEnvironmentVariable("ASPNETCORE_URLS") ?? "http://+:8060";
                builder.WebHost.UseUrls(urls.Replace("https://", "http://"));
            }
        }
    }
}