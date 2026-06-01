using System.Net.Http.Headers;
using System.Security.Cryptography.X509Certificates;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Yarp.ReverseProxy.Transforms;

var builder = WebApplication.CreateBuilder(args);

// ============================
// Configuration
// ============================

var publicIssuer = builder.Configuration["AUTH_PUBLIC_ISSUER"]
    ?? throw new InvalidOperationException("AUTH_PUBLIC_ISSUER is required.");

var metadataAddress = builder.Configuration["AUTH_METADATA_ADDRESS"]
    ?? throw new InvalidOperationException("AUTH_METADATA_ADDRESS is required.");

var appBaseUrl = builder.Configuration["APP_BASE_URL"]
    ?? throw new InvalidOperationException("APP_BASE_URL is required.");

publicIssuer = publicIssuer.TrimEnd('/');
appBaseUrl = appBaseUrl.TrimEnd('/');

// ============================
// HTTPS / Kestrel
// ============================

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

// ============================
// Reverse proxy setup
// ============================

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

// ============================
// Authentication: BFF cookie + OIDC
// ============================

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
                if (IsAjax(context.Request))
                {
                    context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    return Task.CompletedTask;
                }

                context.Response.Redirect(context.RedirectUri);
                return Task.CompletedTask;
            },

            OnRedirectToAccessDenied = context =>
            {
                if (IsAjax(context.Request))
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
            options.BackchannelHttpHandler = new HttpClientHandler
            {
                ServerCertificateCustomValidationCallback =
                    HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
            };

            options.RequireHttpsMetadata = false;
        }
    });

// ============================
// Development TLS override for YARP
// ============================

if (builder.Environment.IsDevelopment())
{
    Console.WriteLine("Dev mode: enabling insecure HTTPS handlers for local Docker testing.");

    proxyBuilder.ConfigureHttpClient((context, handler) =>
    {
        handler.SslOptions.RemoteCertificateValidationCallback =
            (_, _, _, _) => true;
    });
}

builder.Services.AddAuthorization();

var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/health", () => Results.Ok(new { status = "healthy" }));

// ============================
// Auth endpoints
// ============================

app.MapGet("/login", async (HttpContext ctx) =>
{
    var returnUrl = ctx.Request.Query["returnUrl"].ToString();

    if (!IsSafeLocalReturnUrl(returnUrl))
    {
        returnUrl = "/";
    }

    await ctx.ChallengeAsync("oidc", new AuthenticationProperties
    {
        RedirectUri = returnUrl
    });
});

app.MapPost("/logout", () =>
{
    return Results.SignOut(
        new AuthenticationProperties
        {
            RedirectUri = "/"
        },
        authenticationSchemes: new[] { "cookie", "oidc" });
});

app.UseWebSockets();

// ============================
// Authenticated BFF reverse proxy
// ============================

app.MapReverseProxy(proxyPipeline =>
{
    proxyPipeline.Use(async (context, next) =>
    {
        var authenticateResult = await context.AuthenticateAsync("cookie");

        if (!authenticateResult.Succeeded)
        {
            if (IsAjax(context.Request))
            {
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

app.Run();

static bool IsAjax(HttpRequest request)
{
    return request.Headers["X-Requested-With"] == "XMLHttpRequest"
        || request.Headers.Accept.Any(value =>
            value?.Contains("application/json", StringComparison.OrdinalIgnoreCase) == true);
}

static bool IsSafeLocalReturnUrl(string? returnUrl)
{
    if (string.IsNullOrWhiteSpace(returnUrl))
    {
        return false;
    }

    if (!returnUrl.StartsWith("/", StringComparison.Ordinal))
    {
        return false;
    }

    if (returnUrl.StartsWith("//", StringComparison.Ordinal))
    {
        return false;
    }

    if (returnUrl.StartsWith("/\\", StringComparison.Ordinal))
    {
        return false;
    }

    return true;
}