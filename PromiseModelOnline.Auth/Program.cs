<<<<<<< HEAD
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.DataProtection;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using PromiseModelOnline.Auth.Common;
using PromiseModelOnline.Auth.DAL;
using PromiseModelOnline.Auth.Extensions;
using PromiseModelOnline.Auth.Middleware;
using PromiseModelOnline.Auth.Services;
||||||| 1bedf4f
using Microsoft.OpenApi;
using System.Security.Cryptography.X509Certificates;
=======
using PromiseModelOnline.Auth.DAL;
using PromiseModelOnline.Auth.Extensions;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Security.Cryptography.X509Certificates;
using Microsoft.EntityFrameworkCore;
using System.Text;
using Microsoft.OpenApi;
>>>>>>> 3d9d1e58bc450b19abee31d15bed7ffeb3de730e

<<<<<<< HEAD
||||||| 1bedf4f
var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";
=======
var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";

>>>>>>> 3d9d1e58bc450b19abee31d15bed7ffeb3de730e
var builder = WebApplication.CreateBuilder(args);
<<<<<<< HEAD

// ---------- Auth/public URL config -------------------------------------
var appBaseUrl = builder.Configuration["APP_BASE_URL"]
    ?? throw new InvalidOperationException("APP_BASE_URL is required.");

var publicIssuer = builder.Configuration["AUTH_PUBLIC_ISSUER"]
    ?? builder.Configuration["AUTH_AUTHORITY"]
    ?? appBaseUrl;

AppUrls.BaseUrl = appBaseUrl.TrimEnd('/');
AppUrls.PublicIssuer = publicIssuer.TrimEnd('/');


// ---------- CORS -------------------------------------------------------
builder.Services.AddCors(options =>
{
    options.AddPolicy("SPA", policy =>
    {
        policy.WithOrigins(
                AppUrls.BaseUrl,
                "https://promisemodelonline.bff:8010")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});
||||||| 1bedf4f
var AllowedHeaders = new[] { "Content-Type", "Accept", "Accept-Language", "Authorization" };

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

// Configure Kestrel to use SSL with PEM files
builder.WebHost.ConfigureKestrel(options =>
{
    options.ListenAnyIP(8060, listenOptions =>
    {
        var cert = X509Certificate2.CreateFromPemFile("cert.pem", "key.pem");
        listenOptions.UseHttps(cert);
    });
});
=======
>>>>>>> 3d9d1e58bc450b19abee31d15bed7ffeb3de730e

<<<<<<< HEAD
// ---------- Database ---------------------------------------------------
var connectionString = builder.Configuration
    .GetConnectionString("MSSQL")?
    .ResolveSecrets();

if (string.IsNullOrWhiteSpace(connectionString))
||||||| 1bedf4f
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
=======
builder.Services.AddControllers();
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

    // Use the new overload that takes a document parameter
    c.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        [new OpenApiSecuritySchemeReference("Bearer", document)] = []
    });
});
builder.Services.AddCors(options =>
>>>>>>> 3d9d1e58bc450b19abee31d15bed7ffeb3de730e
{
<<<<<<< HEAD
    throw new InvalidOperationException("ConnectionStrings:MSSQL is required.");
}

builder.Services.AddDbContext<AuthorizationDbContext>(options =>
    options.UseSqlServer(connectionString));

// ---------- Identity ---------------------------------------------------
builder.Services
    .AddIdentity<IdentityUser, IdentityRole>()
    .AddEntityFrameworkStores<AuthorizationDbContext>()
    .AddDefaultTokenProviders()
    .AddSignInManager();

builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.Name = "pmo.auth";
    options.Cookie.HttpOnly = true;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    options.Cookie.SameSite = SameSiteMode.Lax;
    options.Cookie.Path = "/";

    options.LoginPath = "/account/login";
    options.LogoutPath = "/connect/logout";
    options.AccessDeniedPath = "/account/access-denied";
||||||| 1bedf4f
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Promise Model Online Auth", Version = "v1" });
=======
        options.AddPolicy(name: MyAllowSpecificOrigins, policy =>
        {
        policy.WithOrigins(
            "https://localhost:9000",
            "https://promisemodelonlineclient:9000")
                .WithMethods("POST")
        .AllowAnyHeader()
        .AllowCredentials();
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
    var urls = Environment.GetEnvironmentVariable("ASPNETCORE_URLS") ?? "http://+:8060";
    if (urls.Contains("https://")) urls = urls.Replace("https://", "http://");
    builder.WebHost.UseUrls(urls);
}

builder.Services.AddAuthScopes(builder.Configuration);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.MapInboundClaims = false;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["JwtSettings:Issuer"],
        ValidAudience = builder.Configuration["JwtSettings:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(builder.Configuration["JwtSettings:Key"]!))
    };

    options.Events = new JwtBearerEvents
    {
        OnAuthenticationFailed = context =>
        {
            var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
            logger.LogError(context.Exception, "JWT Authentication Failed: {Message}", context.Exception.Message);
            return Task.CompletedTask;
        }
    };
>>>>>>> 3d9d1e58bc450b19abee31d15bed7ffeb3de730e
});

// ---------- OpenIddict -------------------------------------------------
builder.Services.AddOpenIddictServerConfig(
    builder.Configuration,
    builder.Environment);

// Identity already configures the application cookie scheme.
// This explicit config is acceptable, but not strictly required.
var googleClientId = builder.Configuration["Authentication:Google:ClientId"];
if (!string.IsNullOrWhiteSpace(googleClientId))
{
    var googleClientSecret = builder.Configuration["Authentication:Google:ClientSecret"];
    if (string.IsNullOrEmpty(googleClientSecret))
    {
        var secretFile = builder.Configuration["Authentication:Google:ClientSecret_FILE"];
        if (!string.IsNullOrWhiteSpace(secretFile) && File.Exists(secretFile))
            googleClientSecret = File.ReadAllText(secretFile).Trim();
    }

    if (string.IsNullOrWhiteSpace(googleClientSecret))
        throw new InvalidOperationException("Authentication:Google:ClientSecret is required.");

    builder.Services.AddAuthentication()
        .AddGoogle(googleOptions =>
        {
            googleOptions.ClientId = googleClientId;
            googleOptions.ClientSecret = googleClientSecret;

            googleOptions.CallbackPath = "/signin-google";

            googleOptions.SaveTokens = false;
            googleOptions.UsePkce = true;

            googleOptions.Scope.Clear();
            googleOptions.Scope.Add("openid");
            googleOptions.Scope.Add("profile");
            googleOptions.Scope.Add("email");

            googleOptions.ClaimActions.MapJsonKey(ClaimTypes.NameIdentifier, "id");
            googleOptions.ClaimActions.MapJsonKey(ClaimTypes.Name, "name");
            googleOptions.ClaimActions.MapJsonKey(ClaimTypes.Email, "email");
        });
}

builder.Services.AddAuthorization();

// ---------- Data Protection (shared key ring for horizontal scaling) ---
var dpKeysPath = builder.Configuration["DATA_PROTECTION_KEYS_PATH"]
    ?? Path.Combine(Directory.GetCurrentDirectory(), "dp-keys");

builder.Services.AddDataProtection()
    .PersistKeysToFileSystem(new DirectoryInfo(dpKeysPath))
    .SetApplicationName("PromiseModelOnline.Auth");

// ---------- Caching --------------------------------------------------
builder.Services.AddMemoryCache();

// ---------- Email ----------------------------------------------------
builder.Services.AddSingleton<IEmailService, EmailService>();

// ---------- Rate limiting ----------------------------------------------
// Custom middleware instead of AddRateLimiter/UseRateLimiter because
// OpenIddict's internal token endpoint handler processes requests before
// the built-in rate limiter middleware can intercept them. The custom
// middleware runs at the top of the pipeline and uses FixedWindowRateLimiter
// instances directly.
// (No services registration needed; the middleware creates limiter instances
//  at construction time.)

// ---------- HTTPS / MVC ------------------------------------------------
builder.ConfigureHttps();
builder.Services.AddControllersWithViews();

var app = builder.Build();

<<<<<<< HEAD
||||||| 1bedf4f
app.UseCors(MyAllowSpecificOrigins);
=======
// apply migrations (if any) for the Auth database
>>>>>>> 3d9d1e58bc450b19abee31d15bed7ffeb3de730e
app.ApplyMigrations();

if (app.Environment.IsDevelopment())
{
<<<<<<< HEAD
    using var scope = app.Services.CreateScope();

    await OpenIddictSeeder.SeedAsync(scope.ServiceProvider);
    await AuthorizationSeeder.SeedAsync(scope.ServiceProvider);
||||||| 1bedf4f
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Promise Model Online Auth v1");
        c.RoutePrefix = string.Empty;
    });
=======
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Authorization Server");
        c.RoutePrefix = string.Empty;
        var registrationKey = app.Configuration["Auth:RegistrationKey"];

        if (!string.IsNullOrEmpty(registrationKey))
        {
            // Escape single quotes so the JavaScript string is valid
            var escapedKey = registrationKey.Replace("'", "\\'");
            c.UseRequestInterceptor($"(req) => {{ req.headers['X-Registration-Key'] = '{escapedKey}'; return req; }}");
        }
    });

    await AuthorizationSeeder.SeedAsync(app.Services);
>>>>>>> 3d9d1e58bc450b19abee31d15bed7ffeb3de730e
}

<<<<<<< HEAD
// ---------- Forwarded headers ------------------------------------------
var forwardedOptions = new ForwardedHeadersOptions
{
    ForwardedHeaders =
        ForwardedHeaders.XForwardedFor |
        ForwardedHeaders.XForwardedProto |
        ForwardedHeaders.XForwardedHost
};

// Safe only while Auth is not directly exposed publicly.
forwardedOptions.KnownIPNetworks.Clear();
forwardedOptions.KnownProxies.Clear();

app.UseForwardedHeaders(forwardedOptions);

// This middleware is probably redundant if UseForwardedHeaders is correctly configured,
// but keeping it is okay during local debugging.
app.UseMiddleware<ForwardedHeadersFixMiddleware>();
app.UseMiddleware<SecurityHeadersMiddleware>();

app.UseStaticFiles();

app.UseCors("SPA");

||||||| 1bedf4f
app.UseHttpsRedirection();
=======
app.UseCors(MyAllowSpecificOrigins);
>>>>>>> 3d9d1e58bc450b19abee31d15bed7ffeb3de730e
app.UseAuthentication();
app.UseAuthorization();
<<<<<<< HEAD

app.MapDefaultControllerRoute();

||||||| 1bedf4f
app.MapControllers();

=======
app.MapControllers();
>>>>>>> 3d9d1e58bc450b19abee31d15bed7ffeb3de730e
app.Run();