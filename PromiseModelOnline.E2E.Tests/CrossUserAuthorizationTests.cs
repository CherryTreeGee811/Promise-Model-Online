using System.Net;

namespace PromiseModelOnline.E2E.Tests;

/// <summary>
/// Verifies cross-tenant authorization boundaries.
/// User A must not read, write, or delete User B's projects.
/// Permission levels (View, Comment, Write) are enforced correctly.
/// Anonymous users cannot access any project they're not invited to.
/// </summary>
public class CrossUserAuthorizationTests : E2ETestBase
{
    // ── Anonymous rejection ───────────────────────────────────

    [Test]
    public async Task Anonymous_CannotAccess_Project()
    {
        var response = await GetAsync("/api/projects/pmo_test/seeded-project", ajax: true);
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task Anonymous_CannotAccess_ProjectMoments()
    {
        var response = await GetAsync("/api/projects/pmo_test/seeded-project/moments?strideId=10", ajax: true);
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task Anonymous_CannotAccess_ProjectStrides()
    {
        var response = await GetAsync("/api/projects/pmo_test/seeded-project/strides", ajax: true);
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    // ── Cross-user read enforcement ───────────────────────────

    [Test]
    public async Task User2_CannotRead_User1Project()
    {
        await LoginAsSecondUserAsync();
        var response = await AuthGetAsync("/api/projects/pmo_test/seeded-project", ajax: true);
        Assert.That((int)response.StatusCode, Is.AnyOf(403, 404),
            "User2 must not read User1's project");
    }

    [Test]
    public async Task User2_CannotRead_User1Moments()
    {
        await LoginAsSecondUserAsync();
        var response = await AuthGetAsync(
            "/api/projects/pmo_test/seeded-project/moments?strideId=10", ajax: true);
        Assert.That((int)response.StatusCode, Is.AnyOf(403, 404),
            "User2 must not read User1's moments");
    }

    // ── Cross-user write enforcement ──────────────────────────

    [Test]
    public async Task User2_CannotDelete_User1Project()
    {
        await LoginAsSecondUserAsync();
        var response = await AuthDeleteAsync("/api/projects/pmo_test/seeded-project", ajax: true);
        Assert.That((int)response.StatusCode, Is.AnyOf(401, 403, 404),
            "User2 must not delete User1's project");
    }

    [Test]
    public async Task User2_CannotUpdate_User1Project()
    {
        await LoginAsSecondUserAsync();
        var response = await AuthPatchJsonAsync(
            "/api/projects/pmo_test/seeded-project/details",
            """{"name":"Hacked"}""");
        Assert.That((int)response.StatusCode, Is.AnyOf(401, 403, 404),
            "User2 must not update User1's project");
    }

    [Test]
    public async Task User2_CannotWrite_ToUser1Project()
    {
        await LoginAsSecondUserAsync();
        var response = await AuthPostJsonAsync(
            "/api/projects/pmo_test/seeded-project/promises/create",
            """{"statement":"evil"}""", ajax: true);
        Assert.That((int)response.StatusCode, Is.AnyOf(401, 403, 404),
            "User2 must not write to User1's project");
    }

    // ── Permission level enforcement ──────────────────────────

    [Test]
    public async Task User2_CannotAccess_User1Permissions()
    {
        await LoginAsSecondUserAsync();
        var response = await AuthGetAsync(
            "/api/projects/pmo_test/seeded-project/permissions", ajax: true);
        Assert.That((int)response.StatusCode, Is.AnyOf(403, 404),
            "User2 must not see User1's permission list");
    }

    [Test]
    public async Task User2_CannotInvite_ToUser1Project()
    {
        await LoginAsSecondUserAsync();
        var response = await AuthPostJsonAsync(
            "/api/projects/pmo_test/seeded-project/permissions",
            """{"email":"evil@evil.com","level":"Edit"}""", ajax: true);
        Assert.That((int)response.StatusCode, Is.AnyOf(401, 403, 404),
            "User2 must not invite to User1's project");
    }

    // ── Self-access works ─────────────────────────────────────

    [Test]
    public async Task User1_CanRead_OwnProject()
    {
        await LoginAsync();
        var response = await AuthGetAsync("/api/projects/pmo_test/seeded-project", ajax: true);
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
    }

    [Test]
    public async Task User1_CanRead_OwnPermissions()
    {
        await LoginAsync();
        var response = await AuthGetAsync(
            "/api/projects/pmo_test/seeded-project/permissions", ajax: true);
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
    }
}
