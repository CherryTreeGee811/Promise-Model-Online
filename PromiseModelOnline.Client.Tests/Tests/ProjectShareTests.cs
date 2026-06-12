using PromiseModelOnline.Client.Tests.Helpers;

namespace PromiseModelOnline.Client.Tests.Tests;

public class ProjectShareTests : PlaywrightTestBase
{
    [Test]
    public async Task SharePage_LoadsPermissionsTable()
    {
        await NavigateAsUser("/pmo_test/seeded-project/share");

        await Page.Locator("table.promisemodel-table tbody tr").First.WaitForAsync(new() { Timeout = 10000 });

        var rows = await Page.Locator("table.promisemodel-table tbody tr").AllAsync();
        Assert.That(rows.Count, Is.GreaterThanOrEqualTo(1));
        Assert.That(await rows[0].TextContentAsync(), Does.Contain("Test Owner"));
    }

    [Test]
    public async Task SharePage_ShowsInviteForm()
    {
        await NavigateAsUser("/pmo_test/seeded-project/share");

        await WaitForSelectorAsync("#invite-btn-top", 10);
        await Page.Locator("#invite-btn-top").ClickAsync();

        await WaitForSelectorAsync("#invite-modal", 10);
        Assert.That(await IsVisibleAsync("#invite-email"), Is.True);
        Assert.That(await IsVisibleAsync("#invite-level"), Is.True);
        Assert.That(await IsVisibleAsync("#invite-modal-form button[type='submit']"), Is.True);
    }

    [Test]
    public async Task SharePage_ShowsRevokeButtonForPermissions()
    {
        await NavigateAsUser("/pmo_test/seeded-project/share");

        await Page.Locator("table.promisemodel-table tbody tr").First.WaitForAsync(new() { Timeout = 10000 });

        var revokeCount = await Page.Locator(".revoke-btn").CountAsync();
        Assert.That(revokeCount, Is.GreaterThanOrEqualTo(1));
    }

    [Test]
    public async Task SharePage_SendInvite_ShowsNewRow()
    {
        await NavigateAsUser("/pmo_test/seeded-project/share");

        await Page.Locator("#invite-btn-top").ClickAsync();
        await WaitForSelectorAsync("#invite-modal", 10);

        var emailInput = await WaitForSelectorAsync("#invite-email", 10);
        await emailInput.FillAsync("newuser@example.com");

        var levelSelect = await WaitForSelectorAsync("#invite-level", 10);
        await levelSelect.SelectOptionAsync(new SelectOptionValue { Value = "Edit" });

        await Page.Locator("#invite-modal-form button[type='submit']").ClickAsync();

        var found = await WaitUntilAsync(async () =>
        {
            var count = await Page.Locator("table.promisemodel-table tbody tr").CountAsync();
            return count >= 3;
        }, 10);

        Assert.That(found, Is.True);
    }
}
