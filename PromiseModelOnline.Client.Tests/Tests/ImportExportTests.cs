using PromiseModelOnline.Client.Tests.Helpers;

namespace PromiseModelOnline.Client.Tests.Tests;

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
        var fileInput = await WaitForSelectorAsync("#import-project-input", 5);
        await fileInput.SetInputFilesAsync(filePath);
    }

    [Test]
    public async Task ImportPage_HasImportSection()
    {
        await NavigateAsUser("/projects/add");

        var importBtn = await WaitForSelectorAsync("#import-project-btn", 5);
        Assert.That(await importBtn.IsVisibleAsync(), Is.True);
        Assert.That(await importBtn.TextContentAsync(), Does.Contain("Import"));

        Assert.That(await IsVisibleAsync("#import-project-input"), Is.True);
    }

    [Test]
    public async Task Import_UberJson_ShowsPreview()
    {
        await NavigateAsUser("/projects/add");
        await UploadImportFileAsync("uber.json");

        var summaryPanel = await WaitForSelectorAsync("#project-import-summary-panel", 5);
        var summaryText = await summaryPanel.TextContentAsync();

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
    public async Task Import_NetflixJson_ShowsPreview()
    {
        await NavigateAsUser("/projects/add");
        await UploadImportFileAsync("netflix.json");

        var summaryPanel = await WaitForSelectorAsync("#project-import-summary-panel", 5);
        var summaryText = await summaryPanel.TextContentAsync();

        Assert.That(summaryText, Does.Contain("Netflix"));
        Assert.That(summaryText, Does.Contain("Promises"));
        Assert.That(summaryText, Does.Contain("Epics"));
        Assert.That(summaryText, Does.Contain("Journeys"));
        Assert.That(summaryText, Does.Contain("Iterations"));
    }

    [Test]
    public async Task Import_UberJson_SubmitSuccessfully()
    {
        await NavigateAsUser("/projects/add");
        await UploadImportFileAsync("uber.json");

        await WaitForSelectorAsync("#project-import-summary-panel table", 5);
        await ClickAsync("#create-project-btn", 5);

        var contains = await WaitForUrlContainsAsync("/graph", 10);
        Assert.That(contains, Is.True);
        Assert.That(Page.Url, Does.Contain("/pmo_test/seeded-project/graph"));
    }

    [Test]
    public async Task Import_NetflixJson_SubmitSuccessfully()
    {
        await NavigateAsUser("/projects/add");
        await UploadImportFileAsync("netflix.json");

        await WaitForSelectorAsync("#project-import-summary-panel table", 5);
        await ClickAsync("#create-project-btn", 5);

        var contains = await WaitForUrlContainsAsync("/graph", 10);
        Assert.That(contains, Is.True);
        Assert.That(Page.Url, Does.Contain("/pmo_test/seeded-project/graph"));
    }

    [Test]
    public async Task Import_CancelImport_ResetsForm()
    {
        await NavigateAsUser("/projects/add");
        await UploadImportFileAsync("uber.json");

        await WaitForSelectorAsync("#project-import-summary-panel table", 5);

        var clearBtn = await WaitForSelectorAsync("#clear-import-btn", 5);
        Assert.That(await clearBtn.IsVisibleAsync(), Is.True);

        await ClickAsync("#clear-import-btn", 5);

        var summaryText = await Page.Locator("#project-import-summary-panel").TextContentAsync();
        Assert.That(summaryText, Is.Empty);

        var nameValue = await Page.Locator("#project-name-input").InputValueAsync();
        Assert.That(nameValue, Is.Empty);
    }

    [Test]
    public async Task Export_ButtonShowsOnSettingsPage()
    {
        await NavigateAsUser("/pmo_test/seeded-project/settings");

        var exportBtn = await WaitForSelectorAsync("#export-project-btn", 5);
        Assert.That(await exportBtn.IsVisibleAsync(), Is.True);
        Assert.That(await exportBtn.TextContentAsync(), Does.Contain("Export"));
    }

    [Test]
    public async Task Export_Download_TriggersSuccessPopover()
    {
        await NavigateAsUser("/pmo_test/seeded-project/settings");

        await WaitForSelectorAsync("#export-project-btn", 5);
        await ClickAsync("#export-project-btn", 5);

        var popover = await WaitForSelectorAsync(".popover, [data-bs-content]", 5);
        Assert.That(popover, Is.Not.Null);
    }

    [Test]
    public async Task Import_FileInput_AcceptsJsonExtension()
    {
        await NavigateAsUser("/projects/add");

        var acceptAttr = await Page.Locator("#import-project-input").GetAttributeAsync("accept");
        Assert.That(acceptAttr, Does.Contain(".json"));
        Assert.That(acceptAttr, Does.Contain("application/json"));
    }

    [Test]
    public async Task Import_UberJson_NameAndDescriptionPopulated()
    {
        await NavigateAsUser("/projects/add");
        await UploadImportFileAsync("uber.json");

        var nameInput = await WaitForSelectorAsync("#project-name-input", 5);
        Assert.That(await nameInput.InputValueAsync(), Is.EqualTo("Uber"));

        var descriptionValue = await Page.Locator("#project-description-input").InputValueAsync();
        Assert.That(descriptionValue, Does.Contain("Promise-Driven Development refactor of Uber"));
    }

    [Test]
    public async Task Import_Mode_SubmitButtonLabelChanges()
    {
        await NavigateAsUser("/projects/add");

        var label = Page.Locator("#create-project-btn-label");
        Assert.That(await label.TextContentAsync(), Is.EqualTo("Create Project"));

        await UploadImportFileAsync("uber.json");
        await WaitForSelectorAsync("#project-import-summary-panel table", 5);

        Assert.That(await label.TextContentAsync(), Is.EqualTo("Import Project"));
    }

    [Test]
    public async Task Import_FirstPromiseHidden_InImportMode()
    {
        await NavigateAsUser("/projects/add");

        var firstPromisePanel = Page.Locator("#first-promise-panel");
        Assert.That(await firstPromisePanel.IsVisibleAsync(), Is.True);

        await UploadImportFileAsync("uber.json");
        await WaitForSelectorAsync("#project-import-summary-panel table", 5);

        Assert.That(await firstPromisePanel.IsVisibleAsync(), Is.False);
    }
}
