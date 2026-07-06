using System.Net;
using System.Text.Json;

namespace PromiseModelOnline.E2E.Tests;

/// <summary>E2E tests for permission boundary enforcement across users.</summary>
// Requirements: REQ_NF_009
[TestFixture]
public class PermissionBoundaryE2ETests : E2ETestBase
{
    private const string Owner = "pmo_test";
    private const string Project = "promise-model-online";

    [Test]
    [Description("REQ-NF-009 happy path: Owner can write to their own project")]
    public async Task Owner_CanWrite_Returns200()
    {
        // Arrange
        await LoginAsync();

        // Act
        var resp = await AuthPatchJsonAsync(
            $"/api/projects/{Owner}/{Project}/moments/1/status",
            JsonSerializer.Serialize(new { newStatus = "InProgress" }));

        // Assert
        Assert.That(resp.StatusCode, Is.EqualTo(HttpStatusCode.OK));
    }

    [Test]
    [Description("REQ-INT-002 misuse: Unauthenticated write returns 401")]
    public async Task Unauthenticated_CannotWrite_Returns401()
    {
        // Act
        var resp = await PatchJsonAsync(
            $"/api/projects/{Owner}/{Project}/moments/1/status",
            JsonSerializer.Serialize(new { newStatus = "InProgress" }), ajax: true);

        // Assert
        Assert.That(resp.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ-NF-009 misuse: Secondary user cannot write without proper permission")]
    public async Task SecondaryUser_WithoutEditPermission_CannotWrite()
    {
        // Arrange
        await LoginAsSecondUserAsync();

        // Check what permission level user2 has
        var permResp = await AuthGetAsync(
            $"/api/projects/{Owner}/{Project}/my-permission", ajax: true);
        var permBody = await permResp.Content.ReadAsStringAsync();

        // If they already have edit access (e.g., seed data), skip
        if (permBody.Contains("Edit") || permBody.Contains("Admin") || permBody.Contains("Owner"))
        {
            Assert.Inconclusive("Secondary user already has write access via seed data");
            return;
        }

        // Act
        var resp = await AuthPatchJsonAsync(
            $"/api/projects/{Owner}/{Project}/moments/1/status",
            JsonSerializer.Serialize(new { newStatus = "InProgress" }));

        // Assert
        Assert.That(resp.StatusCode, Is.EqualTo(HttpStatusCode.Forbidden));
    }
}
