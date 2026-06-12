using PromiseModelOnline.Client.Tests.Helpers;

namespace PromiseModelOnline.Client.Tests.Tests;

public class InvitationsTests : PlaywrightTestBase
{
    [Test]
    public async Task Invitations_AcceptInvitation_RemovesRow()
    {
        await NavigateAsUser("/invitations");

        var acceptBtn = await WaitForSelectorAsync(".accept-btn");
        await acceptBtn.ClickAsync();

        var removed = await WaitUntilAsync(async () =>
        {
            try
            {
                var count = await Page.Locator("tbody tr").CountAsync();
                return count == 0;
            }
            catch { return false; }
        }, 5);

        Assert.That(removed, Is.True, "Invitation row was not removed after accept");
    }
}
