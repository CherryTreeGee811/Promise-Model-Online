using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Primitives;
using Microsoft.AspNetCore.Http;

namespace PromiseModelOnline.Auth.Middleware;

public sealed class TokenCookieMiddleware
{
    private const string CookieName = "__Secure-refresh";
    private const string TokenPath = "/connect/token";
    private static readonly TimeSpan CookieMaxAge = TimeSpan.FromDays(7);

    private static readonly string[] ClearOnPaths =
    {
        "/connect/logout",
        "/connect/revoke"
    };

    private readonly RequestDelegate _next;

    public TokenCookieMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path;

        // 1. Handle Logout/Revocation
        if (ClearOnPaths.Any(p => path.StartsWithSegments(p)))
        {
            context.Response.OnStarting(() =>
            {
                DeleteRefreshCookie(context);
                return Task.CompletedTask;
            });
            await _next(context);
            return;
        }

        // 2. Only process POST /connect/token
        if (!path.Equals(TokenPath, StringComparison.OrdinalIgnoreCase) || !HttpMethods.IsPost(context.Request.Method))
        {
            await _next(context);
            return;
        }

        if (!context.Request.HasFormContentType)
        {
            await _next(context);
            return;
        }

        // 3. Read form and intercept logic
        var form = await context.Request.ReadFormAsync();
        
        // Debugging: Log if the browser sent the cookie
        var hasCookie = context.Request.Cookies.TryGetValue(CookieName, out var cookieValue);
        Console.WriteLine($"[AUTH-DEBUG] Request to {path}. Cookie '{CookieName}' present: {hasCookie}.");

        if (form["grant_type"] == "refresh_token")
        {
            if (string.IsNullOrEmpty(cookieValue))
            {
                Console.WriteLine("[AUTH-DEBUG] REJECTED: Refresh token cookie missing.");
                context.Response.StatusCode = StatusCodes.Status400BadRequest;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync("""{"error":"invalid_grant","error_description":"Refresh token missing."}""");
                return;
            }

            var fields = form.ToDictionary(kv => kv.Key, kv => kv.Value);
            fields["refresh_token"] = new StringValues(cookieValue);
            context.Request.Form = new FormCollection(fields);
        }

        await BufferAndTransformResponse(context);
    }

    private async Task BufferAndTransformResponse(HttpContext context)
    {
        var originalBody = context.Response.Body;
        await using var buffer = new MemoryStream();
        context.Response.Body = buffer;

        await _next(context);

        buffer.Position = 0;
        var body = await new StreamReader(buffer, Encoding.UTF8).ReadToEndAsync();

        if (context.Response.StatusCode == StatusCodes.Status200OK && 
            context.Response.ContentType?.Contains("application/json") == true)
        {
            body = StripRefreshTokenAndSetCookie(context, body);
        }
        else if (context.Response.StatusCode >= 400)
        {
            DeleteRefreshCookie(context);
        }

        var bytes = Encoding.UTF8.GetBytes(body);
        context.Response.Body = originalBody;
        context.Response.ContentLength = bytes.Length;
        await originalBody.WriteAsync(bytes);
    }

    private static string StripRefreshTokenAndSetCookie(HttpContext context, string body)
    {
        try
        {
            using var doc = JsonDocument.Parse(body);
            if (!doc.RootElement.TryGetProperty("refresh_token", out var rtElement))
            {
                Console.WriteLine("[AUTH-DEBUG] No refresh_token in token response.");
                return body;
            }

            var refreshToken = rtElement.GetString();
            if (string.IsNullOrEmpty(refreshToken))
            {
                Console.WriteLine("[AUTH-DEBUG] refresh_token was empty.");
                return body;
            }

            Console.WriteLine("[AUTH-DEBUG] refresh_token received; setting __Secure-refresh cookie.");

            context.Response.Cookies.Append(CookieName, refreshToken, BuildCookieOptions());

            var dict = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(body)!;
            dict.Remove("refresh_token");
            return JsonSerializer.Serialize(dict);
        }
        catch { return body; }
    }

    private static void DeleteRefreshCookie(HttpContext context) =>
        context.Response.Cookies.Append(CookieName, string.Empty, new CookieOptions
        {
            HttpOnly = true, Secure = true, SameSite = SameSiteMode.Lax, Path = TokenPath, MaxAge = TimeSpan.Zero
        });

    private static CookieOptions BuildCookieOptions() => new()
    {
        HttpOnly = true,
        Secure = true,
        SameSite = SameSiteMode.Lax, // Matches same-site flow and avoids cross-site restrictions
        Path = TokenPath,
        MaxAge = CookieMaxAge,
        IsEssential = true
    };
}