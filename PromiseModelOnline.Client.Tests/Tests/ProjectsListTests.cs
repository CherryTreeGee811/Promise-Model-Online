using PromiseModelOnline.Client.Tests.Helpers;

namespace PromiseModelOnline.Client.Tests.Tests;

/// <summary>Playwright tests for the project listing page.</summary>
// Requirements: REQ_FUN_003
public class ProjectsListTests : PlaywrightTestBase
{
    [Test]
    public async Task REQ_FUN_003_ProjectList_LoadsAndDisplaysProject()
    {
        // Arrange
        await EnsureLoggedIn();
        await NavigateSpaAsync("/projects");

        // Act
        var row = await WaitForSelectorAsync("#project-list-table-body tr");

        // Assert
        Assert.That(await row.TextContentAsync(), Does.Contain("Test Project"));
    }

    [Test]
    public async Task REQ_FUN_003_ProjectList_AuditLogButton_OpensHistoryPage()
    {
        // Arrange
        await EnsureLoggedIn();
        await NavigateSpaAsync("/projects");

        // Act
        await WaitForSelectorAsync("#project-list-table-body tr");
        await ClickAsync(".audit-log-btn");

        var ends = await WaitForUrlContainsAsync("/pmo_test/seeded-project/history", 15);
        var historyList = await WaitForSelectorAsync("#audit-history-list");

        // Assert
        Assert.That(ends, Is.True);
        Assert.That(Page.Url, Does.EndWith("/pmo_test/seeded-project/history"));
    }
}
