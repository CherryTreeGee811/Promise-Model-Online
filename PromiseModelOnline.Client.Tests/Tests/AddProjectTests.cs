using PromiseModelOnline.Client.Tests.Helpers;

namespace PromiseModelOnline.Client.Tests.Tests;

/// <summary>Playwright tests for creating a new project.</summary>
// Requirements: REQ_FUN_003
public class AddProjectTests : PlaywrightTestBase
{
    [Test]
    public async Task REQ_FUN_003_AddProject_ShowsForm()
    {
        // Arrange
        await NavigateAsUser("/projects/add");
        // Act
        await WaitForSelectorAsync("#add-project-form", 5);
        // Assert
        Assert.That(await IsVisibleAsync("#project-name-input"), Is.True);
        Assert.That(await IsVisibleAsync("#project-description-input"), Is.True);
        Assert.That(await IsVisibleAsync("#first-promise-input"), Is.True);
        Assert.That(await IsVisibleAsync("#create-project-btn"), Is.True);
        Assert.That(await IsVisibleAsync("#cancel-add-project-link"), Is.True);
    }

    [Test]
    public async Task REQ_FUN_003_AddProject_EmptyName_ShowsValidationError()
    {
        // Arrange
        await NavigateAsUser("/projects/add");
        await WaitForSelectorAsync("#first-promise-input", 10);
        // Act
        await Page.EvaluateAsync(
            "document.getElementById('add-project-form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));");
        // Assert
        var found = await WaitUntilAsync(async () =>
        {
            try
            {
                var text = await Page.Locator("#error-text").TextContentAsync() ?? "";
                return text.Contains("required") || text.Contains("name");
            }
            catch { return false; }
        }, 5);
        Assert.That(found, Is.True);
    }

    [Test]
    public async Task REQ_FUN_003_AddProject_EmptyPromise_ShowsValidationError()
    {
        // Arrange
        await NavigateAsUser("/projects/add");
        await FillAsync("#project-name-input", "My Project", 10);
        // Act
        await Page.EvaluateAsync(
            "document.getElementById('add-project-form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));");
        // Assert
        var found = await WaitUntilAsync(async () =>
        {
            try
            {
                var text = await Page.Locator("#error-text").TextContentAsync() ?? "";
                return text.Contains("Product Promise") || text.Contains("required");
            }
            catch { return false; }
        }, 5);
        Assert.That(found, Is.True);
    }

    [Test]
    public async Task REQ_FUN_003_AddProject_CreatesSuccessfully()
    {
        // Arrange
        await NavigateAsUser("/projects/add");
        await FillAsync("#project-name-input", "My New Project", 5);
        await FillAsync("#project-description-input", "A test project");
        await FillAsync("#first-promise-input", "As a user, manage projects efficiently");
        // Act
        await ClickAsync("#create-project-btn", 5);
        // Assert
        var contains = await WaitForUrlContainsAsync("/projects/", 10);
        Assert.That(contains, Is.True);
        Assert.That(Page.Url, Does.Contain("/projects/"));
    }

    [Test]
    public async Task REQ_FUN_003_AddProject_Cancel_ReturnsToProjectList()
    {
        // Arrange
        await NavigateAsUser("/projects/add");
        await WaitForSelectorAsync("#cancel-add-project-link", 5);
        // Act
        await ClickAsync("#cancel-add-project-link", 5);
        // Assert
        var contains = await WaitForUrlContainsAsync("/projects", 10);
        Assert.That(contains, Is.True);
        Assert.That(Page.Url, Does.Not.Contain("/add"));
    }

    [Test]
    public async Task REQ_FUN_003_AddProject_HasImportSection()
    {
        // Arrange
        await NavigateAsUser("/projects/add");
        // Act
        var importBtn = await WaitForSelectorAsync("#import-project-btn", 5);
        var text = await importBtn.TextContentAsync();
        // Assert
        Assert.That(text, Does.Contain("Import"));
        Assert.That(await IsVisibleAsync("#import-project-input"), Is.True);
    }
}
