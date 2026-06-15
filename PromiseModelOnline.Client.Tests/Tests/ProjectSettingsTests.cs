using PromiseModelOnline.Client.Tests.Helpers;

namespace PromiseModelOnline.Client.Tests.Tests;

/// <summary>Playwright tests for the project settings page.</summary>
// Requirements: REQ_FUN_003
public class ProjectSettingsTests : PlaywrightTestBase
{
    [Test]
    public async Task REQ_FUN_003_ProjectSettings_DeleteProject_RequiresConfirmationAndRedirects()
    {
        // Arrange
        await EnsureLoggedIn();
        await NavigateSpaAsync("/pmo_test/seeded-project/settings");

        // Act
        var confirmationTextEl = await WaitForSelectorAsync("#project-delete-confirmation-text", 20);
        var confirmationPhrase = await confirmationTextEl.TextContentAsync() ?? string.Empty;

        var input = await WaitForSelectorAsync("#project-delete-confirmation-input");
        await input.FillAsync(confirmationPhrase);

        await ClickAsync("#delete-project-btn");

        var ends = await WaitForUrlContainsAsync("/projects", 15);

        // Assert
        Assert.That(ends, Is.True);
        Assert.That(Page.Url, Does.EndWith("/projects"));
    }

}
