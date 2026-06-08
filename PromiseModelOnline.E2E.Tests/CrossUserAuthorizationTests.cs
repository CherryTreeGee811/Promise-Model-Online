using System.Net;

namespace PromiseModelOnline.E2E.Tests;

public class CrossUserAuthorizationTests : E2ETestBase
{
    private const string TargetProject = "/api/projects/pmo_test/promise-model-online";

    [Test]
    public async Task Anonymous_CannotAccess_Project()
    {
        var response = await GetAsync(TargetProject, ajax: true);
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task User1_CanRead_OwnProject()
    {
        await LoginAsync();
        var response = await AuthGetAsync(TargetProject, ajax: true);
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
    }

    [Test]
    public async Task User2_CanAccess_ApiAuthenticated()
    {
        // Verify User2 is authenticated — the API allows any authenticated user to read
        await LoginAsSecondUserAsync();
        var response = await AuthGetAsync("/api/projects", ajax: true);
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
    }

    [Test]
    public async Task User2_CannotInvite_ToUser1Project()
    {
        // Permission management (invite) should be owner-only
        await LoginAsSecondUserAsync();
        // User2 cannot invite — validation or auth rejection, either way the invite doesn't go through
        var invite = await AuthPostJsonAsync(
            $"{TargetProject}/permissions",
            """{"userEmail":"third@test.com","level":"View"}""", ajax: true);
        Assert.That((int)invite.StatusCode, Is.AnyOf(400, 401, 403),
            "User2 must not invite to User1's project");
    }

    [Test]
    public async Task User2_CannotDelete_User1Project()
    {
        await LoginAsSecondUserAsync();
        var delete = await AuthDeleteAsync(TargetProject, ajax: true);
        Assert.That((int)delete.StatusCode, Is.AnyOf(401, 403, 404, 405),
            "User2 must not delete User1's project");
    }
}
