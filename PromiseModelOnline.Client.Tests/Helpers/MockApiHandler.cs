using System.Text.RegularExpressions;
using System.Web;

namespace PromiseModelOnline.Client.Tests.Helpers;

/// <summary>Mock API handler for Playwright-based client tests.</summary>
/// <remarks>
///   Intercepts HTTP requests during Playwright tests and returns pre-configured JSON
///   responses to simulate the backend API, Auth server, and OIDC provider without
///   requiring a running server. Supports owner/non-owner sessions via cookie values.
/// </remarks>
public static partial class MockApiHandler
{
    private static readonly string WwwRoot;

    private static readonly Dictionary<string, MockResponse> StaticFileCache = [];

    /// <summary>Current session value set by the test via <see cref="SetSessionValue"/>.</summary>
    private static string? s_currentSession;

    /// <summary>Set the session value for the mock handler to use.</summary>
    public static void SetSessionValue(string? sessionValue) => s_currentSession = sessionValue;

    /// <summary>Get the session value from cookie headers or fallback to the static value.</summary>
    private static string? GetSessionValue(IRequest request)
    {
        if (s_currentSession is not null)
            return s_currentSession;

        var cookie = request.Headers.TryGetValue("cookie", out var c) ? c
            : request.Headers.TryGetValue("Cookie", out var c2) ? c2
            : "";

        if (cookie.Contains("owner-session") || cookie.Contains("__Host-pmo.session=owner-session") || cookie.Contains("pmo.session=owner-session"))
            return "owner-session";
        if (cookie.Contains("nonowner-session") || cookie.Contains("__Host-pmo.session=nonowner-session") || cookie.Contains("pmo.session=nonowner-session"))
            return "nonowner-session";
        if (cookie.Contains("__Host-pmo.session=") || cookie.Contains("pmo.session="))
            return "other-session";

        return null;
    }

    static MockApiHandler()
    {
        WwwRoot = Path.GetFullPath(Path.Combine(
            AppContext.BaseDirectory, "..", "..", "..", "..",
            "PromiseModelOnline.Client", "wwwroot"));
    }

    private static MockResponse? GetStaticFileResponse(string path)
    {
        if (StaticFileCache.TryGetValue(path, out var cached))
            return cached;

        var contentType = path.EndsWith(".css") ? "text/css"
            : path.EndsWith(".mjs") || path.EndsWith(".js") ? "text/javascript"
            : path.EndsWith(".html") ? "text/html"
            : path.EndsWith(".json") ? "application/json"
            : path.EndsWith(".svg") ? "image/svg+xml"
            : path.EndsWith(".png") ? "image/png"
            : path.EndsWith(".woff2") ? "font/woff2"
            : path.EndsWith(".woff") ? "font/woff"
            : null;

        if (contentType == null) return null;

        var filePath = WwwRoot + path;
        if (!File.Exists(filePath)) return null;

        var isBinary = contentType.StartsWith("font/") || contentType.StartsWith("image/");
        if (isBinary)
        {
            var bytes = File.ReadAllBytes(filePath);
            var binResponse = new MockResponse(200, contentType, "", CorsHeaders) { BodyBytes = bytes };
            StaticFileCache[path] = binResponse;
            return binResponse;
        }

        var text = File.ReadAllText(filePath);
        var result = new MockResponse(200, contentType, text, CorsHeaders);
        StaticFileCache[path] = result;
        return result;
    }

    /// <summary>Handle a Playwright route by returning a mock response or continuing to the server.</summary>
    /// <param name="route">The Playwright route to fulfill or continue.</param>
    public static async Task HandleRouteAsync(IRoute route)
    {
        var request = route.Request;
        var url = request.Url;
        var method = request.Method;
        var session = GetSessionValue(request);
        var isOwner = session == "owner-session";
        var isNonOwner = session == "nonowner-session";
        var ownerSession = session is not null;

        var uri = new Uri(url);
        var path = uri.AbsolutePath;
        var query = HttpUtility.ParseQueryString(uri.Query);

        try
        {
            var response = GetMockResponse(method, path, query, isOwner, isNonOwner, ownerSession, request);
            if (response == null)
                response = GetRegexMockResponse(method, path, isOwner);

            if (response == null && method == "GET" && uri.Host == "localhost"
                && !path.StartsWith("/api/") && !path.StartsWith("/hubs/")
                && !path.StartsWith("/templates/") && !path.StartsWith("/images/") && !path.StartsWith("/css/") && !path.StartsWith("/js/")
                && !path.StartsWith("/lib/") && !path.StartsWith("/dist/") && !path.StartsWith("/umami/")
                && path != "/health" && path != "/robots.txt" && path != "/sitemap.xml" && path != "/sw.mjs" && path != "/manifest.json" && path != "/favicon.ico"
                && !path.StartsWith("/login") && !path.StartsWith("/logout") && !path.StartsWith("/register")
                && !path.StartsWith("/signin-oidc") && !path.StartsWith("/signout-callback-oidc")
                && !path.StartsWith("/connect/") && !path.StartsWith("/.well-known/"))
            {
                response = Html(200, s_html);
            }

            if (response != null)
            {
                await FulfillAsync(route, response);
                return;
            }

            response = GetStaticFileResponse(path);
            if (response != null)
            {
                await FulfillAsync(route, response);
                return;
            }
        }
        catch { }

        await route.ContinueAsync();
    }

    private static async Task FulfillAsync(IRoute route, MockResponse response)
    {
        var opts = new RouteFulfillOptions
        {
            Status = response.Status,
            ContentType = response.ContentType,
            Body = response.Body,
            BodyBytes = response.BodyBytes,
        };
        if (response.Headers.Count > 0)
            opts.Headers = response.Headers;
        await route.FulfillAsync(opts);
    }

    private sealed record MockResponse(int Status, string ContentType, string Body, Dictionary<string, string> Headers)
    {
        public byte[]? BodyBytes { get; init; }
    }

    /// <summary>Base CORS headers required for credentialed fetches in WebKit.</summary>
    private static readonly Dictionary<string, string> CorsHeaders = new()
    {
        ["Access-Control-Allow-Origin"] = "https://localhost:9000",
        ["Access-Control-Allow-Credentials"] = "true",
    };

    private static MockResponse Json(int status, string body) => new(status, "application/json", body, CorsHeaders);
    private static MockResponse Html(int status, string body) => new(status, "text/html", body, CorsHeaders);

    private static MockResponse MetaRefresh(string url) =>
        Html(200, $"""<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url={url}"></head><body></body></html>""");
    private static MockResponse Redirect(string location) => new(302, "text/plain", "", new(CorsHeaders) { ["Location"] = location });

    private static bool HasGrantType(IRequest request, string grantType) =>
        request.PostData?.Contains($"grant_type={grantType}", StringComparison.Ordinal) == true;

    private static bool HasCodeVerifier(IRequest request) =>
        request.PostData?.Contains("code_verifier=", StringComparison.Ordinal) == true;

    /// <summary>Match a request against known static routes and return the appropriate mock response.</summary>
    /// <param name="method">HTTP method.</param>
    /// <param name="path">Request path.</param>
    /// <param name="query">Parsed query parameters.</param>
    /// <param name="isOwner">Whether the session cookie identifies a project owner.</param>
    /// <param name="isNonOwner">Whether the session cookie identifies a non-owner.</param>
    /// <param name="ownerSession">Whether any authenticated session exists.</param>
    /// <param name="request">The original Playwright request for body inspection.</param>
    /// <returns>A mock response, or <c>null</c> to continue to regex matching.</returns>
    private static MockResponse? GetMockResponse(
        string method, string path,
        System.Collections.Specialized.NameValueCollection query,
        bool isOwner, bool isNonOwner, bool ownerSession,
        IRequest request)
    {
        return (method, path) switch
        {
            ("GET", "/health") => Json(200, """{"status":"healthy"}"""),
            ("GET", "/manifest.json") => GetStaticFileResponse(path) ?? Html(200, s_html),

            ("GET", "/login") or ("GET", "/register") => Html(200, s_html),
            ("GET", "/change-password") => Html(200, s_html),
            ("GET", "/signin-oidc") or ("GET", "/signout-callback-oidc") => Html(200, s_html),

            // OIDC Discovery
            ("GET", "/.well-known/openid-configuration") => Json(200, """{"issuer":"https://localhost:9000","authorization_endpoint":"https://localhost:9000/connect/authorize","token_endpoint":"https://localhost:9000/connect/token","end_session_endpoint":"https://localhost:9000/connect/logout","introspection_endpoint":"https://localhost:9000/connect/introspect","revocation_endpoint":"https://localhost:9000/connect/revoke","jwks_uri":"https://localhost:9000/.well-known/jwks","scopes_supported":["openid","profile","email","offline_access","projects.read","projects.write"],"response_types_supported":["code"],"response_modes_supported":["query","fragment","form_post"],"grant_types_supported":["authorization_code","refresh_token"],"subject_types_supported":["public"],"id_token_signing_alg_values_supported":["RS256"],"token_endpoint_auth_methods_supported":["none"],"claims_supported":["sub","name","email","email_verified"],"code_challenge_methods_supported":["S256"],"require_pkce":true}"""),

            // OIDC Authorization endpoint — redirects to login page if unauthenticated
            ("GET", "/connect/authorize") => MetaRefresh("/account/login?returnUrl=%2F"),

            // OIDC End Session endpoint
            ("GET", "/connect/logout") => MetaRefresh("/"),

            // Auth server pages (served by the Auth service in production)
            ("GET", "/account/login") or ("GET", "/account/register") => Html(200, s_html),

            ("GET", "/api/users/me") when isOwner => Json(200, """{"id":"owner-user-id","name":"Test Owner","email":"owner@example.com","userId":1}"""),
            ("GET", "/api/users/me") when isNonOwner => Json(200, """{"id":"nonowner-user-id","name":"Test NonOwner","email":"nonowner@example.com","userId":2}"""),
            ("GET", "/api/users/me") when ownerSession => Json(200, """{"id":"unknown-user-id","name":"Test User","email":"user@example.com","userId":1}"""),
            ("GET", "/api/users/me") => Json(401, """{"status":401,"message":"Unauthenticated"}"""),

            ("GET", "/api/users/me/export") when isOwner => Json(200, """{"exportedAt":"2026-06-09T00:00:00Z","schemaVersion":"1.0","account":{"id":1,"name":"Test Owner","email":"owner@example.com","slug":"pmo_test","createdAt":"2026-05-01T00:00:00Z"},"projects":[{"id":1,"name":"Test Project","slug":"seeded-project","description":"A seeded test project","createdAt":"2026-05-01T00:00:00Z"}],"comments":[],"reactions":[],"notifications":[],"permissions":[],"momentAssignments":[]}"""),
            ("GET", "/api/users/me/export") when isNonOwner => Json(200, """{"exportedAt":"2026-06-09T00:00:00Z","schemaVersion":"1.0","account":{"id":2,"name":"Test NonOwner","email":"nonowner@example.com","slug":"other_user","createdAt":"2026-05-01T00:00:00Z"},"projects":[],"comments":[],"reactions":[],"notifications":[],"permissions":[],"momentAssignments":[]}"""),
            ("GET", "/api/users/me/export") when ownerSession => Json(200, """{"exportedAt":"2026-06-09T00:00:00Z","schemaVersion":"1.0","account":{"id":1,"name":"Test User","email":"user@example.com","slug":"pmo_test","createdAt":"2026-05-01T00:00:00Z"},"projects":[],"comments":[],"reactions":[],"notifications":[],"permissions":[],"momentAssignments":[]}"""),

            ("DELETE", "/api/users/me") when ownerSession => Json(204, ""),

            ("GET", "/api/projects") when isOwner => Json(200, """[{"id":1,"name":"Test Project","slug":"seeded-project","ownerSlug":"pmo_test","description":"A seeded test project","ownerId":1,"createdAt":"2026-05-01T00:00:00Z"}]"""),
            ("GET", "/api/projects") when isNonOwner => Json(200, """[{"id":1,"name":"Test Project","slug":"seeded-project","ownerSlug":"other_user","description":"A seeded test project","ownerId":2,"createdAt":"2026-05-01T00:00:00Z"}]"""),

            ("GET", "/api/notifications") when isOwner => Json(200, """[{"id":1,"message":"You were mentioned in a comment","type":"Mention","isRead":false,"createdAt":"2026-06-02T12:00:00Z","link":null},{"id":2,"message":"You have a new task assigned","type":"Assignment","isRead":false,"createdAt":"2026-06-02T10:00:00Z","link":null}]"""),
            ("GET", "/api/notifications") when isNonOwner => Json(200, "[]"),

            ("GET", "/api/pending-invitations") when isOwner => Json(200, """[{"permissionId":1,"projectName":"Test Project","invitedBy":"owner@example.com","level":"Edit","createdAt":"2026-06-01T00:00:00Z"}]"""),
            ("GET", "/api/permissions/pending") when isOwner => Json(200, """[{"permissionId":1,"projectName":"Test Project","invitedBy":"owner@example.com","level":"Edit","createdAt":"2026-06-01T00:00:00Z"}]"""),

            ("GET", "/api/project-permissions") when isOwner => Json(200, """[{"id":1,"userId":1,"email":"owner@example.com","userName":"Test Owner","level":"Owner","status":"Active"},{"id":2,"userId":2,"email":"nonowner@example.com","userName":"Test NonOwner","level":"Edit","status":"Active"}]"""),
            ("GET", "/api/project-permissions") when isNonOwner => Json(200, """[{"id":2,"userId":2,"email":"nonowner@example.com","userName":"Test NonOwner","level":"Edit","status":"Active"}]"""),

            ("GET", "/api/projects/pmo_test/seeded-project/graph") when isOwner => Json(200, s_graphData),

            ("GET", "/api/strides") when isOwner => Json(200, """[{"id":10,"name":"Stride One","iterationId":1,"startDate":"2026-05-01T00:00:00Z","endDate":"2026-05-07T00:00:00Z","durationDays":7,"isActive":true,"status":"Planned","displayOrder":1,"createdAt":"2026-05-01T00:00:00Z"},{"id":20,"name":"Stride Two","iterationId":1,"startDate":"2026-05-08T00:00:00Z","endDate":"2026-05-15T00:00:00Z","durationDays":8,"isActive":true,"status":"InProgress","displayOrder":2,"createdAt":"2026-05-01T00:00:00Z"}]"""),
            ("GET", "/api/strides") when isNonOwner => Json(200, """[{"id":10,"name":"Stride One","iterationId":1,"startDate":"2026-05-01T00:00:00Z","endDate":"2026-05-07T00:00:00Z","durationDays":7,"isActive":true,"status":"Planned","displayOrder":1,"createdAt":"2026-05-01T00:00:00Z"}]"""),

            ("GET", "/api/moments") when query["strideId"] == "10" && isOwner => Json(200, s_momentsByStride10),
            ("GET", "/api/moments") when query["strideId"] == "10" && isNonOwner => Json(200, s_momentsByStride10NonOwner),
            ("GET", "/api/moments") when query["strideId"] == "20" => Json(200, s_momentsByStride20),

            ("GET", "/api/backlog-moments") => Json(200, "[]"),

            ("GET", "/api/users/search") => Json(200, """[{"userId":1,"email":"owner@example.com","name":"Test Owner","userName":"pmo_test"}]"""),
            ("GET", "/api/moments/assigned-to-me") when isOwner => Json(200, """[{"id":100,"sequenceNumber":100,"statement":"My Task","type":"Story","status":"Todo","effortEstimate":"M","ownerId":1,"assignedStrideId":10,"displayOrder":1,"ownerSlug":"pmo_test","projectSlug":"seeded-project","createdAt":"2026-05-01T00:00:00Z"}]"""),
            ("GET", "/api/moments/assigned-to-me") when isNonOwner => Json(200, "[]"),

            ("GET", "/api/moments/100") => Json(200, s_moment100),
            ("GET", "/api/moments-initial") => Json(200, s_momentsInitial),

            ("GET", "/api/comments") when request.Url.Contains("parentId=100") => Json(200, s_commentsMoment100),
            ("GET", "/api/comments") => Json(200, "[]"),

            ("GET", "/api/epics/1") => Json(200, """{"id":1,"statement":"Epic One","promiseId":1,"displayOrder":1}"""),
            ("GET", "/api/epics/by-promise/1") => Json(200, """[{"id":1,"statement":"Epic One","promiseId":1,"displayOrder":1}]"""),
            ("GET", "/api/promises/1") => Json(200, """{"id":1,"statement":"Project Promise One","projectId":1,"displayOrder":1}"""),
            ("GET", "/api/project-promises") => Json(200, """[{"id":1,"statement":"Project Promise One","projectId":1,"displayOrder":1}]"""),
            ("GET", "/api/journeys/by-epic/1") => Json(200, """[{"id":1,"name":"Journey One","epicId":1,"displayOrder":1}]"""),
            ("GET", "/api/journeys/by-epic/10") => Json(200, "[]"),
            ("GET", "/api/flows/1") => Json(200, """{"id":1,"name":"Flow One","journeyId":1,"displayOrder":1}"""),

            ("GET", "/api/iterations") => Json(200, """[{"id":1,"name":"Sprint 1","projectId":1,"displayOrder":1,"startDate":"2026-06-01","endDate":"2026-06-14"}]"""),
            ("GET", "/api/audit-events") => Json(200, """[{"id":1,"action":"Project created","userId":1,"userName":"Test Owner","timestamp":"2026-05-01T00:00:00Z"}]"""),
            ("GET", "/api/project-export") => Json(200, """{"schemaVersion":"1.0","project":{"name":"Test Project"}}"""),
            ("GET", "/api/project-members") => Json(200, """[{"userId":1,"email":"owner@example.com","name":"Test Owner"}]"""),
            ("GET", "/api/reactions") => Json(200, "[]"),
            ("GET", "/api/comments/entity-map") => Json(200, "[]"),

            // OAuth 2.1 Token endpoint — reject deprecated grant types
            ("POST", "/connect/token") when HasGrantType(request, "password") => Json(400, """{"error":"unsupported_grant_type","error_description":"OAuth 2.1 does not allow the password grant"}"""),
            ("POST", "/connect/token") when HasGrantType(request, "implicit") => Json(400, """{"error":"unsupported_grant_type","error_description":"OAuth 2.1 does not allow the implicit grant"}"""),
            ("POST", "/connect/token") when HasGrantType(request, "client_credentials") => Json(400, """{"error":"unsupported_grant_type","error_description":"OAuth 2.1 requires PKCE for public clients"}"""),
            ("POST", "/connect/token") when !HasCodeVerifier(request) => Json(400, """{"error":"invalid_request","error_description":"PKCE code_verifier is required"}"""),
            ("POST", "/connect/token") => Json(400, """{"error":"unsupported_grant_type"}"""),

            // POST mutations
            ("POST", "/api/projects/create") when isOwner => Json(200, """{"id":2,"name":"My New Project","slug":"my-new-project","ownerSlug":"pmo_test","description":null,"ownerId":1,"createdAt":"2026-06-03T00:00:00Z"}"""),
            ("POST", "/api/projects/import") when isOwner => Json(201, """{"projectId":123,"warnings":[],"ownerSlug":"pmo_test","slug":"seeded-project"}"""),
            ("POST", "/api/comments") => Json(200, """{"id":2,"text":"New comment","createdAt":"2026-05-20T00:00:00Z","userName":"Test Owner","mentionedUsers":[],"parentCommentId":null,"replies":[]}"""),
            ("POST", "/api/projects/pmo_test/seeded-project/permissions") when isOwner => Json(200, """{"id":5,"userName":"newuser@example.com","level":"Edit","status":"Pending"}"""),
            ("POST", "/api/projects/pmo_test/seeded-project/promises/create") when isOwner => Json(200, """{"id":10,"statement":"As a user, manage projects efficiently","description":null,"projectId":2,"displayOrder":0,"createdAt":"2026-06-03T00:00:00Z"}"""),
            ("POST", "/hubs/notifications/negotiate") => Json(200, """{"negotiateVersion":1,"connectionId":"test","availableTransports":[]}"""),
            ("POST", "/hubs/notifications") => Json(204, ""),
            ("POST", "/api/deadline-notification-runs") => Json(204, ""),

            // PATCH mutations
            ("PATCH", "/api/users/me") when ownerSession => HandleChangePassword(request),
            ("PATCH", "/api/notifications") => Json(200, ""),
            ("PATCH", "/api/permissions/1") when isOwner => Json(200, """{"id":1,"userId":2,"userName":"other_user","projectId":1,"level":"Edit","status":"Active"}"""),

            // DELETE mutations
            ("DELETE", "/api/projects/pmo_test/seeded-project") => Json(204, ""),
            ("DELETE", "/hubs/notifications") => Json(204, ""),

            _ => null
        };
    }

    private static MockResponse HandleChangePassword(IRequest request)
    {
        var body = request.PostData ?? "";
        if (body.Contains("\"currentPassword\":\"wrong\""))
            return Json(400, """{"message":"Current password is incorrect."}""");
        return Json(204, "");
    }

    [GeneratedRegex(@"^/api/projects/pmo_test/seeded-project/moments/\d+/status$")]
    private static partial Regex MomomentStatusRegex();

    [GeneratedRegex(@"^/api/projects/pmo_test/seeded-project/moments/\d+/estimate$")]
    private static partial Regex MomomentEstimateRegex();

    [GeneratedRegex(@"^/api/projects/pmo_test/seeded-project/moments/\d+/owner$")]
    private static partial Regex MomomentOwnerRegex();

    [GeneratedRegex(@"^/api/projects/pmo_test/seeded-project/moments/\d+/type$")]
    private static partial Regex MomomentTypeRegex();

    [GeneratedRegex(@"^/api/projects/pmo_test/seeded-project/moments/100/stride-assignment$")]
    private static partial Regex MomomentStrideAssignRegex();

    [GeneratedRegex(@"^/api/projects/pmo_test/seeded-project/strides/\d+/progress$")]
    private static partial Regex StrideProgressRegex();

    [GeneratedRegex(@"^/api/notifications/\d+$")]
    private static partial Regex NotificationByIdRegex();

    [GeneratedRegex(@"^/api/projects/[^/]+/[^/]+/permissions/\d+$")]
    private static partial Regex ProjectPermissionRegex();

    private static MockResponse? GetRegexMockResponse(string method, string path, bool isOwner)
    {
        // Burndown endpoint: /api/projects/{owner}/{project}/iterations/{id}/burndown
        var burndownMatch = Regex.Match(path, @"^/api/projects/[^/]+/[^/]+/iterations/\d+/burndown$");
        if (burndownMatch.Success)
            return Json(200, """[{"date":"2026-06-01","remainingEffort":12,"idealRemaining":12},{"date":"2026-06-02","remainingEffort":10,"idealRemaining":10},{"date":"2026-06-03","remainingEffort":8,"idealRemaining":8},{"date":"2026-06-04","remainingEffort":5,"idealRemaining":6},{"date":"2026-06-05","remainingEffort":3,"idealRemaining":4},{"date":"2026-06-06","remainingEffort":0,"idealRemaining":2}]""");

        if (path.StartsWith("/api/projects/"))
        {
            // Only long-form project-scoped paths reach here
            var rel = path[14..]; // strip "/api/projects/"
            var slash = rel.IndexOf('/'); slash = slash < 0 ? rel.Length : slash;
            var secondSlash = rel.IndexOf('/', slash + 1);
            var resource = secondSlash < 0 ? "" : rel[(secondSlash + 1)..];
            var extraPath = resource.Contains('/') ? resource[(resource.IndexOf('/') + 1)..] : "";
            resource = resource.Contains('/') ? resource[..resource.IndexOf('/')] : resource;

            if (method == "GET")
            {
                if (string.IsNullOrEmpty(resource))
                    return Json(200, """{"id":1,"name":"Test Project","slug":"seeded-project","ownerSlug":"pmo_test","description":"A seeded test project"}""");
                if (path.EndsWith("/strides"))
                    return isOwner
                        ? Json(200, """[{"id":10,"name":"Stride One","iterationId":1,"startDate":"2026-05-01T00:00:00Z","endDate":"2026-05-07T00:00:00Z","durationDays":7,"isActive":true,"status":"Planned","displayOrder":1,"createdAt":"2026-05-01T00:00:00Z"},{"id":20,"name":"Stride Two","iterationId":1,"startDate":"2026-05-08T00:00:00Z","endDate":"2026-05-15T00:00:00Z","durationDays":8,"isActive":true,"status":"InProgress","displayOrder":2,"createdAt":"2026-05-01T00:00:00Z"}]""")
                        : Json(200, """[{"id":10,"name":"Stride One","iterationId":1,"startDate":"2026-05-01T00:00:00Z","endDate":"2026-05-07T00:00:00Z","durationDays":7,"isActive":true,"status":"Planned","displayOrder":1,"createdAt":"2026-05-01T00:00:00Z"}]""");
                if (path.EndsWith("/iterations"))
                    return Json(200, """[{"id":1,"name":"Sprint 1","projectId":1,"displayOrder":1,"startDate":"2026-06-01","endDate":"2026-06-14"}]""");
                if (path.EndsWith("/my-permission"))
                    return Json(200, "\"Owner\"");
                if (path.EndsWith("/details"))
                    return Json(200, """{"id":1,"name":"Test Project","slug":"seeded-project","ownerSlug":"pmo_test","description":"A seeded test project"}""");
                if (path.EndsWith("/permissions") && resource == "permissions")
                    return isOwner
                        ? Json(200, """[{"id":1,"userId":1,"userName":"Test Owner","email":"owner@example.com","level":"Owner","status":"Active"},{"id":2,"userId":2,"userName":"Test NonOwner","email":"nonowner@example.com","level":"Edit","status":"Active"},{"id":5,"userId":null,"userName":"newuser@example.com","level":"Edit","status":"Pending"}]""")
                        : Json(200, """[{"id":2,"userId":2,"userName":"Test NonOwner","email":"nonowner@example.com","level":"Edit","status":"Active"}]""");
                if (path.EndsWith("/promises") && resource == "promises")
                    return Json(200, """[{"id":1,"statement":"Project Promise One","projectId":1,"displayOrder":1}]""");
                if (path.EndsWith("/members") && resource == "members")
                    return Json(200, """[{"userId":1,"email":"owner@example.com","name":"Test Owner"}]""");
                if (path.EndsWith("/export") && resource == "export")
                    return Json(200, """{"schemaVersion":"1.0","project":{"name":"Test Project"}}""");
                if (resource == "audit-events")
                    return Json(200, """[{"id":1,"action":"Project created","userId":1,"userName":"Test Owner","timestamp":"2026-05-01T00:00:00Z"}]""");

                // Entity detail: /api/projects/{owner}/{project}/{type}/{numericId}
                if (resource == "promises" && !string.IsNullOrEmpty(extraPath) && !extraPath.StartsWith("by-id/"))
                    return Json(200, """{"id":1,"statement":"Project Promise One","projectId":1,"displayOrder":1}""");
                if (resource == "epics" && !string.IsNullOrEmpty(extraPath) && !extraPath.StartsWith("by-id/"))
                    return Json(200, """{"id":1,"statement":"Epic One","promiseId":1,"displayOrder":1}""");
                if (resource == "journeys" && !string.IsNullOrEmpty(extraPath) && !extraPath.StartsWith("by-id/"))
                    return Json(200, """{"id":1,"name":"Journey One","epicId":1,"displayOrder":1}""");
                if (resource == "flows" && !string.IsNullOrEmpty(extraPath) && !extraPath.StartsWith("by-id/"))
                    return Json(200, """{"id":1,"name":"Flow One","journeyId":1,"displayOrder":1}""");
                if (resource == "moments" && !string.IsNullOrEmpty(extraPath) && !extraPath.StartsWith("by-id/"))
                    return Json(200, """{"id":100,"sequenceNumber":100,"statement":"Moment 100","flowId":2,"type":"Story","status":"Todo","effortEstimate":"S","ownerId":1,"assignedStrideId":10,"displayOrder":1,"createdAt":"2026-05-01T00:00:00Z"}""");

                // by-id: /api/projects/{owner}/{project}/{type}/by-id/{id}
                if (extraPath.StartsWith("by-id/"))
                    return Json(200, """{"id":1,"statement":"Project Promise One","projectId":1,"displayOrder":1}""");

                // Query-based list endpoints (no specific ID in path)
                if (resource == "epics" && string.IsNullOrEmpty(extraPath))
                    return Json(200, """[{"id":1,"statement":"Epic One","promiseId":1,"displayOrder":1}]""");
                if (resource == "journeys" && string.IsNullOrEmpty(extraPath))
                    return Json(200, """[{"id":1,"name":"Journey One","epicId":1,"displayOrder":1}]""");
                if (resource == "flows" && string.IsNullOrEmpty(extraPath))
                    return Json(200, """[{"id":1,"name":"Flow One","journeyId":1,"displayOrder":1}]""");
                if (resource == "moments" && string.IsNullOrEmpty(extraPath))
                    return Json(200, """[{"id":100,"sequenceNumber":100,"statement":"Moment 100","flowId":2,"type":"Story","status":"Todo","effortEstimate":"S","ownerId":1,"assignedStrideId":10,"displayOrder":1}]""");
                if (resource == "promises" && string.IsNullOrEmpty(extraPath))
                    return Json(200, """[{"id":1,"statement":"Project Promise One","projectId":1,"displayOrder":1}]""");
                if (resource == "graph")
                    return Json(200, s_graphData);
            }
            if (method == "PATCH" && path.EndsWith("/details"))
                return Json(200, """{"id":1,"name":"Test Project","slug":"seeded-project","ownerSlug":"pmo_test","description":"A seeded test project"}""");

            return null;
        }

        if (method == "PATCH")
        {
            if (MomomentStatusRegex().IsMatch(path))
                return Json(200, """{"id":100,"sequenceNumber":100,"statement":"Moment 100 statement","type":"Story","status":"InProgress","effortEstimate":"M","ownerId":1,"assignedStrideId":10}""");
            if (MomomentEstimateRegex().IsMatch(path))
                return Json(200, """{"id":100,"sequenceNumber":100,"statement":"Moment 100 statement","type":"Story","status":"Todo","effortEstimate":"M","ownerId":1,"assignedStrideId":10}""");
            if (MomomentOwnerRegex().IsMatch(path))
                return Json(200, """{"id":100,"sequenceNumber":100,"statement":"Moment 100 statement","type":"Job","status":"Todo","effortEstimate":"M","ownerId":1,"assignedStrideId":10}""");
            if (MomomentTypeRegex().IsMatch(path))
                return Json(200, """{"id":101,"statement":"Moment 101","type":"Job","status":"Todo","effortEstimate":"M","ownerId":1,"assignedStrideId":10}""");
            if (MomomentStrideAssignRegex().IsMatch(path))
                return Json(200, """[{"id":100,"sequenceNumber":100,"statement":"Moment 100","flowId":2,"type":"Story","status":"Todo","effortEstimate":"S","ownerId":1,"assignedStrideId":20,"displayOrder":0,"createdAt":"2026-05-08T00:00:00Z","updatedAt":null,"completedAt":null,"isZombie":false,"originalStrideId":null,"statusColor":"red"},{"id":101,"sequenceNumber":101,"statement":"Moment 101","flowId":1,"type":"Job","status":"Todo","effortEstimate":"M","ownerId":1,"assignedStrideId":10,"displayOrder":1,"createdAt":"2026-05-08T00:00:00Z","updatedAt":null,"completedAt":null,"isZombie":false,"originalStrideId":null,"statusColor":"red"}]""");
            if (NotificationByIdRegex().IsMatch(path))
                return Json(200, "");
        }

        if (method == "POST")
        {
            if (StrideProgressRegex().IsMatch(path))
                return Json(204, "");
        }

        if (method == "DELETE")
        {
            if (ProjectPermissionRegex().IsMatch(path) && isOwner)
                return Json(204, "");
        }

        return null;
    }



    private static readonly string s_html = """
<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#1a252f"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes"><title id="page-title">Promise Model Online</title><link rel="manifest" href="/manifest.json"><link rel="apple-touch-icon" href="/images/PromiseModelOnline_Logo_180x180.png"><link rel="icon" href="/images/icon.svg" type="image/svg+xml"><link rel="stylesheet" href="/lib/css/bootstrap.min.css"><link rel="stylesheet" href="/lib/css/bootstrap-icons.min.css"><link rel="stylesheet" href="/css/site.css"></head><body><nav class="navbar navbar-dark bg-dark navbar-expand-md" aria-label="Main navigation"><div class="container px-2"><ul id="main-menu" class="navbar-nav ms-auto align-items-md-center"></ul><button class="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#main-nav" aria-controls="main-nav" aria-expanded="false" aria-label="Toggle navigation"><span class="navbar-toggler-icon"></span></button><div class="collapse navbar-collapse" id="main-nav"></div></div></nav><div class="container" id="main-container"><main role="main" id="main-content" tabindex="-1"><div id="content"></div></main></div><script src="/lib/js/d3.min.js" defer></script><script src="/lib/js/bootstrap.bundle.min.js" defer></script><script src="/lib/js/signalr.min.js" defer></script><script src="/lib/js/popper.min.js" defer></script><script src="/lib/js/tippy-bundle.umd.min.js" defer></script><script src="/dist/js/main.js" type="module"></script><footer class="footer" role="contentinfo"><div>&copy; 2026 - Promise Model Online &nbsp;|&nbsp; <a href="/privacy">Privacy Policy</a> &nbsp;|&nbsp; <a href="/tos">Terms of Service</a></div></footer></body></html>
""";

    private const string s_momentsByStride10 =
        """[{"id":101,"sequenceNumber":101,"statement":"Moment 101","flowId":1,"type":"Story","status":"Todo","effortEstimate":"M","ownerId":1,"assignedStrideId":10,"displayOrder":1,"createdAt":"2026-05-01T00:00:00Z","updatedAt":null,"completedAt":null,"isZombie":false,"originalStrideId":null,"statusColor":"red"}]""";

    private const string s_momentsByStride10NonOwner =
        """[{"id":101,"sequenceNumber":101,"statement":"Moment 101","flowId":1,"type":"Story","status":"Todo","effortEstimate":"M","ownerId":2,"assignedStrideId":10,"displayOrder":1,"createdAt":"2026-05-01T00:00:00Z","updatedAt":null,"completedAt":null,"isZombie":false,"originalStrideId":null,"statusColor":"red"}]""";

    private const string s_momentsByStride20 =
        """[{"id":100,"sequenceNumber":100,"statement":"Moment 100","flowId":2,"type":"Job","status":"Todo","effortEstimate":"S","ownerId":1,"assignedStrideId":20,"displayOrder":1,"createdAt":"2026-05-08T00:00:00Z","updatedAt":null,"completedAt":null,"isZombie":false,"originalStrideId":null,"statusColor":"red"}]""";

    private const string s_momentsInitial =
        """[{"id":100,"sequenceNumber":100,"statement":"Moment 100","assignedStrideId":10,"ownerId":1,"effortEstimate":"S"},{"id":101,"sequenceNumber":101,"statement":"Moment 101","assignedStrideId":10,"ownerId":1,"effortEstimate":"M"},{"id":102,"sequenceNumber":102,"statement":"Moment 102","assignedStrideId":null,"ownerId":null,"effortEstimate":null}]""";

    private const string s_moment100 =
        """{"id":100,"sequenceNumber":100,"statement":"Moment 100","flowId":2,"type":"Story","status":"Todo","effortEstimate":"S","ownerId":1,"assignedStrideId":10,"displayOrder":1,"createdAt":"2026-05-01T00:00:00Z"}""";

    private const string s_graphData =
        """{"id":1,"name":"Test Project","slug":"seeded-project","description":"A seeded test project","ownerId":1,"ownerSlug":"pmo_test","createdAt":"2026-05-01T00:00:00Z","promises":[{"id":1,"type":"Promise","statement":"Project Promise One","description":"A seeded promise","projectId":1,"ownerId":1,"sequenceNumber":1,"displayOrder":1,"statusColor":"green","createdAt":"2026-05-01T00:00:00Z","epics":[{"id":1,"type":"Epic","statement":"Epic One","description":null,"productPromiseId":1,"ownerId":1,"sequenceNumber":1,"displayOrder":1,"statusColor":"green","createdAt":"2026-05-01T00:00:00Z","journeys":[{"id":1,"type":"Journey","statement":"Journey One","description":null,"epicId":1,"ownerId":1,"sequenceNumber":1,"displayOrder":1,"statusColor":"green","createdAt":"2026-05-01T00:00:00Z","flows":[{"id":1,"type":"Flow","statement":"Flow One","description":null,"journeyId":1,"ownerId":1,"sequenceNumber":1,"displayOrder":1,"statusColor":"green","createdAt":"2026-05-01T00:00:00Z","moments":[{"id":100,"type":"Story","statement":"Moment 100","description":null,"flowId":1,"ownerId":1,"sequenceNumber":100,"displayOrder":1,"statusColor":"red","effortEstimate":"S","assignedStrideId":10,"createdAt":"2026-05-01T00:00:00Z","isZombie":false,"tasks":[]},{"id":101,"type":"Job","statement":"Moment 101","description":null,"flowId":1,"ownerId":1,"sequenceNumber":101,"displayOrder":2,"statusColor":"green","effortEstimate":"M","assignedStrideId":10,"createdAt":"2026-05-01T00:00:00Z","isZombie":false,"tasks":[]}]}]}]}]}]}""";

    private const string s_commentsMoment100 =
        """[{"id":1,"text":"Existing comment","userName":"Test Owner","authorId":1,"createdAt":"2026-06-01T00:00:00Z"}]""";
}
