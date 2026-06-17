using PromiseModelOnline.Client.Tests.Helpers;

namespace PromiseModelOnline.Client.Tests.Tests;

/// <summary>Playwright tests for invitation acceptance workflow.</summary>
// Requirements: REQ_FUN_014
public class InvitationsTests : PlaywrightTestBase
{
    [Test]
    public async Task REQ_FUN_014_Invitations_AcceptInvitation_RemovesRow()
    {
        // Arrange
        await NavigateAsUser("/invitations");
        var acceptBtn = await WaitForSelectorAsync(".accept-btn");
        // Act
        await acceptBtn.ClickAsync();
        // Assert
        var removed = await WaitUntilAsync(async () =>
        {
            try
            {
                var count = await Page.Locator("tbody tr").CountAsync();
                return count == 0;
            }
            catch { return false; }
        });
        Assert.That(removed, Is.True, "Invitation row was not removed after accept");
    }
}
