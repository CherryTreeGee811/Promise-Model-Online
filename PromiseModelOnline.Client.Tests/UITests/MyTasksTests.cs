using PromiseModelOnline.Client.Tests.Helpers;

namespace PromiseModelOnline.Client.Tests.Tests;

/// <summary>Playwright tests for the my-tasks page.</summary>
// Requirements: REQ_FUN_031
public class MyTasksTests : PlaywrightTestBase
{
    [Test]
    public async Task REQ_FUN_031_MyTasks_DisplaysAssignedTasks()
    {
        // Arrange
        await NavigateAsUser("/moments/my-tasks");

        // Act
        var row = await WaitForSelectorAsync("#my-tasks-content tbody tr");
        var text = await row.TextContentAsync();

        // Assert
        Assert.That(text, Does.Contain("My Task"));
    }

    [Test]
    public async Task REQ_FUN_031_MyTasks_Empty_ShowsNoTasksMessage()
    {
        // Arrange
        await NavigateAsUser("/moments/my-tasks", "nonowner-session");

        // Act
        var emptyMsg = await WaitForSelectorAsync(".no-items", 2);
        var text = await emptyMsg.TextContentAsync();

        // Assert
        Assert.That(text, Does.Contain("no assigned tasks"));
    }

    [Test]
    public async Task REQ_FUN_031_MyTasks_MomentTypeDropdown_Renders()
    {
        // Arrange
        await NavigateAsUser("/moments/my-tasks");

        // Act
        var row = await WaitForSelectorAsync("#my-tasks-content tbody tr");
        var mid = await row.GetAttributeAsync("data-moment-id");

        var typeSelect = row.Locator(".moment-type-select");

        // Assert
        Assert.That(typeSelect, Is.Not.Null);
        Assert.That(await typeSelect.IsEnabledAsync(), Is.True);

        // Act
        var typeValue = await typeSelect.InputValueAsync();

        // Assert
        Assert.That(typeValue, Is.EqualTo("Story"), "My task moment should be type Story");
    }
}
