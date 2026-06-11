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

            ("GET", "/api/projects") when isOwner => Json(200, """[{"id":1,"name":"Test Project","slug":"seeded-project","ownerSlug":"pmo_test","description":"A seeded test project","ownerId":1,"createdAt":"2026-05-01T00:00:00Z"}]"""),
            ("GET", "/api/projects") when isNonOwner => Json(200, """[{"id":1,"name":"Test Project","slug":"seeded-project","ownerSlug":"other_user","description":"A seeded test project","ownerId":2,"createdAt":"2026-05-01T00:00:00Z"}]"""),

            ("GET", "/api/notifications") when isOwner => Json(200, """[{"id":1,"message":"You were mentioned in a comment","type":"Mention","isRead":false,"createdAt":"2026-06-02T12:00:00Z","link":null},{"id":2,"message":"You have a new task assigned","type":"Assignment","isRead":false,"createdAt":"2026-06-02T10:00:00Z","link":null}]"""),
            ("GET", "/api/notifications") when isNonOwner => Json(200, "[]"),

            ("GET", "/api/pending-invitations") when isOwner => Json(200, """[{"permissionId":1,"projectName":"Test Project","invitedBy":"owner@example.com","level":"Edit","createdAt":"2026-06-01T00:00:00Z"}]"""),
            ("GET", "/api/permissions/pending") when isOwner => Json(200, """[{"permissionId":1,"projectName":"Test Project","invitedBy":"owner@example.com","level":"Edit","createdAt":"2026-06-01T00:00:00Z"}]"""),

            ("GET", "/api/project-permissions") when isOwner => Json(200, """[{"id":1,"userId":1,"email":"owner@example.com","userName":"Test Owner","level":"Owner","status":"Active"},{"id":2,"userId":2,"email":"nonowner@example.com","userName":"Test NonOwner","level":"Edit","status":"Active"}]"""),
            ("GET", "/api/project-permissions") when isNonOwner => Json(200, """[{"id":2,"userId":2,"email":"nonowner@example.com","userName":"Test NonOwner","level":"Edit","status":"Active"}]"""),

            ("GET", "/api/strides") when isOwner => Json(200, """[{"id":10,"name":"Stride One","iterationId":1,"startDate":"2026-05-01T00:00:00Z","endDate":"2026-05-07T00:00:00Z","durationDays":7,"isActive":true,"status":"Planned","displayOrder":1,"createdAt":"2026-05-01T00:00:00Z"},{"id":20,"name":"Stride Two","iterationId":1,"startDate":"2026-05-08T00:00:00Z","endDate":"2026-05-15T00:00:00Z","durationDays":8,"isActive":true,"status":"InProgress","displayOrder":2,"createdAt":"2026-05-01T00:00:00Z"}]"""),
            ("GET", "/api/strides") when isNonOwner => Json(200, """[{"id":10,"name":"Stride One","iterationId":1,"startDate":"2026-05-01T00:00:00Z","endDate":"2026-05-07T00:00:00Z","durationDays":7,"isActive":true,"status":"Planned","displayOrder":1,"createdAt":"2026-05-01T00:00:00Z"}]"""),

            ("GET", "/api/moments") when query["strideId"] == "10" && isOwner => Json(200, s_momentsByStride10),
            ("GET", "/api/moments") when query["strideId"] == "10" && isNonOwner => Json(200, s_momentsByStride10NonOwner),
            ("GET", "/api/moments") when query["strideId"] == "20" => Json(200, s_momentsByStride20),

            ("GET", "/api/backlog-moments") => Json(200, "[]"),

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
            ("GET", "/api/hubs/negotiate") => Json(200, """{"url":"","accessToken":"mock-token"}"""),
            ("GET", "/hubs/notifications") => Json(200, "{}"),
            ("GET", "/api/reactions") => Json(200, "[]"),
            ("GET", "/api/comments/entity-map") => Json(200, "[]"),

            // POST mutations
            ("POST", "/api/projects/create") when isOwner => Json(200, """{"id":2,"name":"My New Project","slug":"my-new-project","ownerSlug":"pmo_test","description":null,"ownerId":1,"createdAt":"2026-06-03T00:00:00Z"}"""),
            ("POST", "/api/projects/import") when isOwner => Json(201, """{"projectId":123,"warnings":[],"ownerSlug":"pmo_test","slug":"seeded-project"}"""),
            ("POST", "/api/comments") => Json(200, """{"id":2,"text":"New comment","createdAt":"2026-05-20T00:00:00Z","userName":"Test Owner","mentionedUsers":[],"parentCommentId":null,"replies":[]}"""),
            ("POST", "/api/projects/pmo_test/seeded-project/permissions") when isOwner => Json(200, """{"id":5,"userName":"newuser@example.com","level":"Edit","status":"Pending"}"""),
            ("POST", "/api/projects/pmo_test/seeded-project/promises/create") when isOwner => Json(200, """{"id":10,"statement":"As a user, manage projects efficiently","description":null,"projectId":2,"displayOrder":0,"createdAt":"2026-06-03T00:00:00Z"}"""),
            ("POST", "/hubs/notifications/negotiate") => Json(200, """{"connectionId":"test-connection-id","availableTransports":[{"transport":"LongPolling","transferFormats":["Text"]}]}"""),
            ("POST", "/hubs/notifications") => Json(200, "{}"),
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
                        ? Json(200, """[{"id":1,"userId":1,"userName":"Test Owner","email":"owner@example.com","level":"Owner","status":"Active"},{"id":2,"userId":2,"userName":"Test NonOwner","email":"nonowner@example.com","level":"Edit","status":"Active"}]""")
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
<!DOCTYPE html><html><body><div id="root"></div><script src="/js/router.mjs" type="module"></script></body></html>
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

    private const string s_commentsMoment100 =
        """[{"id":1,"text":"Existing comment","userName":"Test Owner","authorId":1,"createdAt":"2026-06-01T00:00:00Z"}]""";
}
