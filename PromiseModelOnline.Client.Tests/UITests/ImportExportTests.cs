using PromiseModelOnline.Client.Tests.Helpers;

namespace PromiseModelOnline.Client.Tests.Tests;

/// <summary>Playwright tests for project import and export.</summary>
// Requirements: REQ_FUN_039 REQ_FUN_040
public class ImportExportTests : PlaywrightTestBase
{
    private static string GetResourcePath(string fileName)
    {
        var baseDir = TestContext.CurrentContext.TestDirectory;
        var dir = new DirectoryInfo(baseDir);
        while (dir != null && !dir.GetDirectories("Resources").Any())
        {
            dir = dir.Parent;
        }
        var projectDir = dir?.FullName ?? Path.GetFullPath(Path.Combine(baseDir, "..", "..", ".."));
        return Path.Combine(projectDir, "Resources", "ProjectFiles", fileName);
    }

    private async Task UploadImportFileAsync(string fileName)
    {
        var filePath = GetResourcePath(fileName);
        var fileInput = await WaitForSelectorAsync("#import-project-input");
        await fileInput.SetInputFilesAsync(filePath);
    }

    [Test]
    public async Task REQ_FUN_039_ImportPage_HasImportSection()
    {
        // Arrange
        await NavigateAsUser("/projects/add");
        // Act
        var importBtn = await WaitForSelectorAsync("#import-project-btn");
        // Assert
        Assert.That(await importBtn.IsVisibleAsync(), Is.True);
        Assert.That(await importBtn.TextContentAsync(), Does.Contain("Import"));
        Assert.That(await IsVisibleAsync("#import-project-input"), Is.True);
    }

    [Test]
    public async Task REQ_FUN_039_Import_UberJson_ShowsPreview()
    {
        // Arrange
        await NavigateAsUser("/projects/add");
        await UploadImportFileAsync("uber.json");
        // Act
        var summaryPanel = await WaitForSelectorAsync("#project-import-summary-panel");
        var summaryText = await summaryPanel.TextContentAsync();
        // Assert
        Assert.That(summaryText, Does.Contain("Uber"));
        Assert.That(summaryText, Does.Contain("Schema Version"));
        Assert.That(summaryText, Does.Contain("Promises"));
        Assert.That(summaryText, Does.Contain("Epics"));
        Assert.That(summaryText, Does.Contain("Journeys"));
        Assert.That(summaryText, Does.Contain("Flows"));
        Assert.That(summaryText, Does.Contain("Moments"));
        Assert.That(summaryText, Does.Contain("Iterations"));
        Assert.That(summaryText, Does.Contain("Strides"));
        Assert.That(summaryText, Does.Contain("Promise Stack Total"));
    }

    [Test]
    public async Task REQ_FUN_039_Import_NetflixJson_ShowsPreview()
    {
        // Arrange
        await NavigateAsUser("/projects/add");
        await UploadImportFileAsync("netflix.json");
        // Act
        var summaryPanel = await WaitForSelectorAsync("#project-import-summary-panel");
        var summaryText = await summaryPanel.TextContentAsync();
        // Assert
        Assert.That(summaryText, Does.Contain("Netflix"));
        Assert.That(summaryText, Does.Contain("Promises"));
        Assert.That(summaryText, Does.Contain("Epics"));
        Assert.That(summaryText, Does.Contain("Journeys"));
        Assert.That(summaryText, Does.Contain("Iterations"));
    }

    [Test]
    public async Task REQ_FUN_039_Import_UberJson_SubmitSuccessfully()
    {
        // Arrange
        await NavigateAsUser("/projects/add");
        await UploadImportFileAsync("uber.json");
        await WaitForSelectorAsync("#project-import-summary-panel table");
        // Act
        await ClickAsync("#create-project-btn");
        // Assert
        var contains = await WaitForUrlContainsAsync("/graph", 2);
        Assert.That(contains, Is.True);
        Assert.That(Page.Url, Does.Contain("/pmo_test/seeded-project/graph"));
    }

    [Test]
    public async Task REQ_FUN_039_Import_NetflixJson_SubmitSuccessfully()
    {
        // Arrange
        await NavigateAsUser("/projects/add");
        await UploadImportFileAsync("netflix.json");
        await WaitForSelectorAsync("#project-import-summary-panel table");
        // Act
        await ClickAsync("#create-project-btn");
        // Assert
        var contains = await WaitForUrlContainsAsync("/graph", 2);
        Assert.That(contains, Is.True);
        Assert.That(Page.Url, Does.Contain("/pmo_test/seeded-project/graph"));
    }

    [Test]
    public async Task REQ_FUN_039_Import_CancelImport_ResetsForm()
    {
        // Arrange
        await NavigateAsUser("/projects/add");
        await UploadImportFileAsync("uber.json");
        await WaitForSelectorAsync("#project-import-summary-panel table");
        var clearBtn = await WaitForSelectorAsync("#clear-import-btn");
        Assert.That(await clearBtn.IsVisibleAsync(), Is.True);
        // Act
        await ClickAsync("#clear-import-btn");
        // Assert
        var summaryText = await Page.Locator("#project-import-summary-panel").TextContentAsync();
        Assert.That(summaryText, Is.Empty);
        var nameValue = await Page.Locator("#project-name-input").InputValueAsync();
        Assert.That(nameValue, Is.Empty);
    }

    [Test]
    public async Task REQ_FUN_039_Export_ButtonShowsOnSettingsPage()
    {
        // Arrange
        await NavigateAsUser("/pmo_test/seeded-project/settings");
        // Act
        var exportBtn = await WaitForSelectorAsync("#export-project-btn");
        // Assert
        Assert.That(await exportBtn.IsVisibleAsync(), Is.True);
        Assert.That(await exportBtn.TextContentAsync(), Does.Contain("Export"));
    }

    [Test]
    public async Task REQ_FUN_039_Export_Download_TriggersSuccessPopover()
    {
        // Arrange
        await NavigateAsUser("/pmo_test/seeded-project/settings");
        await WaitForSelectorAsync("#export-project-btn");
        // Act
        await ClickAsync("#export-project-btn");
        // Assert
        var popover = await WaitForSelectorAsync(".popover, [data-bs-content]");
        Assert.That(popover, Is.Not.Null);
    }

    [Test]
    public async Task REQ_FUN_039_Import_FileInput_AcceptsJsonExtension()
    {
        // Arrange
        await NavigateAsUser("/projects/add");
        // Act
        var acceptAttr = await Page.Locator("#import-project-input").GetAttributeAsync("accept");
        // Assert
        Assert.That(acceptAttr, Does.Contain(".json"));
        Assert.That(acceptAttr, Does.Contain("application/json"));
    }

    [Test]
    public async Task REQ_FUN_039_Import_UberJson_NameAndDescriptionPopulated()
    {
        // Arrange
        await NavigateAsUser("/projects/add");
        await UploadImportFileAsync("uber.json");
        // Act
        var nameInput = await WaitForSelectorAsync("#project-name-input");
        // Assert
        Assert.That(await nameInput.InputValueAsync(), Is.EqualTo("Uber"));

        var descriptionValue = await Page.Locator("#project-description-input").InputValueAsync();
        Assert.That(descriptionValue, Does.Contain("Promise-Driven Development refactor of Uber"));
    }

    [Test]
    public async Task REQ_FUN_039_Import_Mode_SubmitButtonLabelChanges()
    {
        // Arrange
        await NavigateAsUser("/projects/add");
        var label = Page.Locator("#create-project-btn-label");
        Assert.That(await label.TextContentAsync(), Is.EqualTo("Create Project"));
        // Act
        await UploadImportFileAsync("uber.json");
        await WaitForSelectorAsync("#project-import-summary-panel table");
        // Assert
        Assert.That(await label.TextContentAsync(), Is.EqualTo("Import Project"));
    }

    [Test]
    public async Task REQ_FUN_039_Import_FirstPromiseHidden_InImportMode()
    {
        // Arrange
        await NavigateAsUser("/projects/add");
        await WaitForSelectorAsync("#first-promise-panel");
        Assert.That(await IsVisibleAsync("#first-promise-panel"), Is.True);
        // Act
        await UploadImportFileAsync("uber.json");
        await WaitForSelectorAsync("#project-import-summary-panel table");
        // Assert
        Assert.That(await IsVisibleAsync("#first-promise-panel"), Is.False);
    }
}
