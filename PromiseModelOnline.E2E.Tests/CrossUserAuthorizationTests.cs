using System.Net;

namespace PromiseModelOnline.E2E.Tests;

/// <summary>E2E tests for cross-user authorization boundary enforcement.</summary>
// Requirements: REQ_NF_009
public class CrossUserAuthorizationTests : E2ETestBase
{
    private const string TargetProject = "/api/projects/pmo_test/promise-model-online";

    [Test]
    public async Task REQ_NF_009_Anonymous_CannotAccess_Project()
    {
        // Act & Assert
        var response = await GetAsync(TargetProject, ajax: true);
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task REQ_NF_009_User1_CanRead_OwnProject()
    {
        // Arrange
        await LoginAsync();
        // Act
        var response = await AuthGetAsync(TargetProject, ajax: true);
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
    }

    [Test]
    public async Task REQ_NF_009_User2_CanAccess_ApiAuthenticated()
    {
        // Arrange
        await LoginAsSecondUserAsync();
        // Act
        var response = await AuthGetAsync("/api/projects", ajax: true);
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
    }

    [Test]
    public async Task REQ_NF_009_User2_CannotInvite_ToUser1Project()
    {
        // Arrange
        await LoginAsSecondUserAsync();
        // Act
        var invite = await AuthPostJsonAsync(
            $"{TargetProject}/permissions",
            """{"userEmail":"third@test.com","level":"View"}""", ajax: true);
        // 404: project not resolved for user2 (PRJ-001 skipped for testuser2)
        // 400/401/403: rejected by validation or authorization
        // Assert
        Assert.That((int)invite.StatusCode, Is.AnyOf(400, 401, 403, 404),
            "User2 must not invite to User1's project");
    }
}
