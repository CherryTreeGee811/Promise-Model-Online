using System.Security.Cryptography.X509Certificates;

namespace PromiseModelOnline.Auth.Extensions
{
    /// <summary>Extension methods for configuring Kestrel HTTPS with certificate files.</summary>
    public static class KestrelExtensions
    {
        /// <summary>Configure Kestrel to listen on port 8060 with HTTPS using <c>cert.pem</c>/<c>key.pem</c>, or fall back to HTTP.</summary>
        /// <param name="builder">The web application builder to configure.</param>
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
