using System.Text.RegularExpressions;
using System.Web;

namespace PromiseModelOnline.Client.Tests.Helpers;

public static partial class MockApiHandler
{
    public static async Task HandleRouteAsync(IRoute route)
    {
        var request = route.Request;
        var url = request.Url;
        var method = request.Method;
        var cookie = request.Headers.TryGetValue("cookie", out var c) ? c : "";
        var isOwner = cookie.Contains("__Host-pmo.session=owner-session");
        var isNonOwner = cookie.Contains("__Host-pmo.session=nonowner-session");
        var ownerSession = isOwner || isNonOwner || cookie.Contains("__Host-pmo.session=");


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
                && !path.StartsWith("/umami/") && path != "/health" && path != "/robots.txt" && path != "/sitemap.xml"
                && !path.StartsWith("/login") && !path.StartsWith("/logout") && !path.StartsWith("/register")
                && !path.StartsWith("/signin-oidc") && !path.StartsWith("/signout-callback-oidc")
                && !path.StartsWith("/connect/") && !path.StartsWith("/.well-known/")
                && !path.StartsWith("/account/register") && !path.StartsWith("/account/login")
                && !path.StartsWith("/change-password"))
            {
                // SPA routes — return SPA shell so the client-side router handles them
                response = Html(200, s_html);
            }

            if (response != null)
            {
                await route.FulfillAsync(new RouteFulfillOptions
                {
                    Status = response.Value.Status,
                    ContentType = response.Value.ContentType,
                    Body = response.Value.Body
                });
                return;
            }
        }
        catch { }

        await route.ContinueAsync();
    }

    private static (int Status, string ContentType, string Body)? GetMockResponse(
        string method, string path,
        System.Collections.Specialized.NameValueCollection query,
        bool isOwner, bool isNonOwner, bool ownerSession,
        IRequest request)
    {
        return (method, path) switch
        {
            ("GET", "/health") => Json(200, """{"status":"healthy"}"""),

            ("GET", "/login") or ("GET", "/register") or ("GET", "/account/register") => Html(200, s_html),
            ("GET", "/change-password") => Html(200, s_html),
            ("GET", "/signin-oidc") or ("GET", "/signout-callback-oidc") => Html(200, s_html),

            ("GET", "/api/users/me") when isOwner => Json(200, """{"id":"owner-user-id","name":"Test Owner","email":"owner@example.com","userId":1}"""),
            ("GET", "/api/users/me") when isNonOwner => Json(200, """{"id":"nonowner-user-id","name":"Test NonOwner","email":"nonowner@example.com","userId":2}"""),
            ("GET", "/api/users/me") when ownerSession => Json(200, """{"id":"unknown-user-id","name":"Test User","email":"user@example.com","userId":1}"""),

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

    private static (int Status, string ContentType, string Body) HandleChangePassword(IRequest request)
    {
        var body = request.PostData ?? "";
        if (body.Contains("\"currentPassword\":\"wrong\""))
            return (400, "application/json", """{"message":"Current password is incorrect."}""");
        return (204, "application/json", "");
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

    private static (int Status, string ContentType, string Body)? GetRegexMockResponse(string method, string path, bool isOwner)
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

    private static (int Status, string ContentType, string Body) Json(int status, string body)
        => (status, "application/json", body);

    private static (int Status, string ContentType, string Body) Html(int status, string body)
        => (status, "text/html", body);

    private static readonly string s_html = """
<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/css/site.css"></head><body><div id="content"></div><div id="main-menu"></div><script src="/js/router.mjs" type="module"></script></body></html>
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
