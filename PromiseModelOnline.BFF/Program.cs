using System.Net.Http.Headers;
using System.Security.Cryptography.X509Certificates;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.AspNetCore.DataProtection;
using PromiseModelOnline.BFF;
using Yarp.ReverseProxy.Transforms;

// BFF (Backend for Frontend) entry point.
// Serves as a reverse proxy between the SPA and the API, handling OIDC
// authentication, session management, and token forwarding via YARP.

var builder = WebApplication.CreateBuilder(args);

var publicIssuer = builder.Configuration["AUTH_PUBLIC_ISSUER"]
    ?? throw new InvalidOperationException("AUTH_PUBLIC_ISSUER is required.");

var metadataAddress = builder.Configuration["AUTH_METADATA_ADDRESS"]
    ?? throw new InvalidOperationException("AUTH_METADATA_ADDRESS is required.");

var appBaseUrl = builder.Configuration["APP_BASE_URL"]
    ?? throw new InvalidOperationException("APP_BASE_URL is required.");

publicIssuer = publicIssuer.TrimEnd('/');
appBaseUrl = appBaseUrl.TrimEnd('/');

// Kestrel HTTPS configuration with optional certificate file.
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
            listenOptions.UseHttps();
        }
    });
});

builder.Services.AddHttpContextAccessor();

// Data protection key ring for horizontal scaling.
var dpKeysPath = builder.Configuration["DATA_PROTECTION_KEYS_PATH"]
    ?? Path.Combine(Directory.GetCurrentDirectory(), "dp-keys");

builder.Services.AddDataProtection()
    .PersistKeysToFileSystem(new DirectoryInfo(dpKeysPath))
    .SetApplicationName("PromiseModelOnline.BFF");

// YARP reverse proxy with access token injection and cookie stripping.
var proxyBuilder = builder.Services
    .AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"))
    .AddTransforms(builderContext =>
    {
        builderContext.AddRequestTransform(async transformContext =>
        {
            var token = await transformContext.HttpContext.GetTokenAsync("access_token");

            if (!string.IsNullOrWhiteSpace(token))
            {
                transformContext.ProxyRequest.Headers.Authorization =
                    new AuthenticationHeaderValue("Bearer", token);
            }

            transformContext.ProxyRequest.Headers.Remove("Cookie");
        });
    });

// Authentication: BFF session cookie + OIDC code flow with PKCE.
builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultScheme = "cookie";
        options.DefaultChallengeScheme = "oidc";
    })
    .AddCookie("cookie", options =>
    {
        options.Cookie.Name = "__Host-pmo.session";
        options.Cookie.HttpOnly = true;
        options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Cookie.Path = "/";

        options.SlidingExpiration = true;
        options.ExpireTimeSpan = TimeSpan.FromHours(8);

        options.Events = new CookieAuthenticationEvents
        {
            OnRedirectToLogin = context =>
            {
                if (BffHelpers.IsAjax(context.Request))
                {
                    context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    return Task.CompletedTask;
                }

                context.Response.Redirect(context.RedirectUri);
                return Task.CompletedTask;
            },

            OnRedirectToAccessDenied = context =>
            {
                if (BffHelpers.IsAjax(context.Request))
                {
                    context.Response.StatusCode = StatusCodes.Status403Forbidden;
                    return Task.CompletedTask;
                }

                context.Response.Redirect(context.RedirectUri);
                return Task.CompletedTask;
            }
        };
    })
    .AddOpenIdConnect("oidc", options =>
    {
        options.Authority = publicIssuer;
        options.MetadataAddress = metadataAddress;

        options.ClientId = "pmo-spa";
        options.ResponseType = "code";
        options.UsePkce = true;
        options.SaveTokens = true;
        options.SignInScheme = "cookie";

        options.CallbackPath = "/signin-oidc";
        options.SignedOutCallbackPath = "/signout-callback-oidc";

        options.Scope.Clear();
        options.Scope.Add("openid");
        options.Scope.Add("profile");
        options.Scope.Add("email");
        options.Scope.Add("offline_access");
        options.Scope.Add("projects.read");
        options.Scope.Add("projects.write");

        options.GetClaimsFromUserInfoEndpoint = false;
        options.MapInboundClaims = false;

        options.TokenValidationParameters.NameClaimType = "name";
        options.TokenValidationParameters.RoleClaimType = "role";

        options.ClaimActions.MapUniqueJsonKey("sub", "sub");
        options.ClaimActions.MapUniqueJsonKey("name", "name");
        options.ClaimActions.MapUniqueJsonKey("email", "email");
        options.ClaimActions.MapUniqueJsonKey("role", "role");

        options.Events = new OpenIdConnectEvents
        {
            OnRedirectToIdentityProvider = context =>
            {
                context.ProtocolMessage.RedirectUri = $"{appBaseUrl}/signin-oidc";
                context.ProtocolMessage.IssuerAddress = $"{appBaseUrl}/connect/authorize";
                return Task.CompletedTask;
            },

            OnRedirectToIdentityProviderForSignOut = context =>
            {
                context.ProtocolMessage.PostLogoutRedirectUri = appBaseUrl;
                context.ProtocolMessage.IssuerAddress = $"{appBaseUrl}/connect/logout";
                return Task.CompletedTask;
            },

            OnTokenResponseReceived = context =>
            {
                var logger = context.HttpContext.RequestServices
                    .GetRequiredService<ILoggerFactory>()
                    .CreateLogger("OpenIdConnect");
                logger.LogInformation("OIDC token response received for client {ClientId}",
                    context.ProtocolMessage?.ClientId ?? "unknown");
                return Task.CompletedTask;
            },

            OnAuthenticationFailed = context =>
            {
                var logger = context.HttpContext.RequestServices
                    .GetRequiredService<ILoggerFactory>()
                    .CreateLogger("OpenIdConnect");

                logger.LogError(context.Exception, "OIDC authentication failed.");

                context.Response.Redirect("/login?error=oidc");
                context.HandleResponse();

                return Task.CompletedTask;
            }
        };

        if (builder.Environment.IsDevelopment())
        {
#pragma warning disable S4830 // Development-only self-signed cert
            options.BackchannelHttpHandler = new HttpClientHandler
            {
                ServerCertificateCustomValidationCallback =
                    HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
            };
#pragma warning restore S4830

            options.RequireHttpsMetadata = false;
        }
    });

// Development mode: allow self-signed certificates for reverse proxy targets.
if (builder.Environment.IsDevelopment())
{
    Console.WriteLine("Dev mode: enabling insecure HTTPS handlers for local Docker testing.");

#pragma warning disable S4830 // Development-only self-signed cert
    proxyBuilder.ConfigureHttpClient((context, handler) =>
    {
        handler.SslOptions.RemoteCertificateValidationCallback =
            (_, _, _, _) => true;
    });
#pragma warning restore S4830
}

builder.Services.AddAuthorization();

var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();

// BFF-specific endpoints: health, login, logout.
app.MapBffEndpoints();

app.UseWebSockets();

// Reverse proxy with authentication enforcement.
// Authenticated requests are proxied to the API; unauthenticated AJAX requests
// receive 401; unauthenticated page requests trigger an OIDC challenge.
app.MapReverseProxy(proxyPipeline =>
{
    proxyPipeline.Use(async (context, next) =>
    {
        var authenticateResult = await context.AuthenticateAsync("cookie");

        if (!authenticateResult.Succeeded)
            {
                if (BffHelpers.IsAjax(context.Request))
                {
                    var log = context.RequestServices.GetRequiredService<ILoggerFactory>()
                        .CreateLogger("BFFProxy");
                    log.LogWarning("Proxy: unauthenticated AJAX request to {Method} {Path} returned 401",
                        context.Request.Method, context.Request.Path);
                    context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    return;
                }

            var returnUrl = context.Request.PathBase + context.Request.Path + context.Request.QueryString;

            await context.ChallengeAsync("oidc", new AuthenticationProperties
            {
                RedirectUri = returnUrl
            });

            return;
        }

        context.User = authenticateResult.Principal!;

        await next();
    });
});

await app.RunAsync();

public partial class Program
{
    protected Program() { }
}
