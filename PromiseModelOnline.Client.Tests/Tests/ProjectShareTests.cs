using PromiseModelOnline.Client.Tests.Helpers;

namespace PromiseModelOnline.Client.Tests.Tests;

/// <summary>Playwright tests for sharing projects with other users.</summary>
// Requirements: REQ_FUN_013 REQ_FUN_015
public class ProjectShareTests : PlaywrightTestBase
{
    [Test]
    public async Task REQ_FUN_013_SharePage_LoadsPermissionsTable()
    {
        // Arrange
        await NavigateAsUser("/pmo_test/seeded-project/share");

        // Act
        await Page.Locator("table.promisemodel-table tbody tr").First.WaitForAsync(new() { Timeout = 1000 });

        var rows = await Page.Locator("table.promisemodel-table tbody tr").AllAsync();

        // Assert
        Assert.That(rows.Count, Is.GreaterThanOrEqualTo(1));
        Assert.That(await rows[0].TextContentAsync(), Does.Contain("Test Owner"));
    }

    [Test]
    public async Task REQ_FUN_013_SharePage_ShowsInviteForm()
    {
        // Arrange
        await NavigateAsUser("/pmo_test/seeded-project/share");

        // Act
        await WaitForSelectorAsync("#invite-btn-top", 1);
        await Page.Locator("#invite-btn-top").ClickAsync();

        await WaitForSelectorAsync("#invite-modal", 1);

        // Assert
        Assert.That(await IsVisibleAsync("#invite-email"), Is.True);
        Assert.That(await IsVisibleAsync("#invite-level"), Is.True);
        Assert.That(await IsVisibleAsync("#invite-modal-form button[type='submit']"), Is.True);
    }

    [Test]
    public async Task REQ_FUN_013_SharePage_ShowsRevokeButtonForPermissions()
    {
        // Arrange
        await NavigateAsUser("/pmo_test/seeded-project/share");

        // Act
        await Page.Locator("table.promisemodel-table tbody tr").First.WaitForAsync(new() { Timeout = 1000 });

        var revokeCount = await Page.Locator(".revoke-btn").CountAsync();

        // Assert
        Assert.That(revokeCount, Is.GreaterThanOrEqualTo(1));
    }

    [Test]
    public async Task REQ_FUN_013_SharePage_SendInvite_ShowsNewRow()
    {
        // Arrange
        await NavigateAsUser("/pmo_test/seeded-project/share");

        // Act
        await Page.Locator("#invite-btn-top").ClickAsync();
        await WaitForSelectorAsync("#invite-modal", 1);

        var emailInput = await WaitForSelectorAsync("#invite-email", 1);
        await emailInput.FillAsync("newuser@example.com");

        var levelSelect = await WaitForSelectorAsync("#invite-level", 1);
        await levelSelect.SelectOptionAsync(new SelectOptionValue { Value = "Edit" });

        await Page.Locator("#invite-modal-form button[type='submit']").ClickAsync();

        var found = await WaitUntilAsync(async () =>
        {
            var count = await Page.Locator("table.promisemodel-table tbody tr").CountAsync();
            return count >= 3;
        }, 1);

        // Assert
        Assert.That(found, Is.True);
    }
}
