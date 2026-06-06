using NUnit.Framework;
using PromiseModelOnline.Client.Tests.Helpers;
using OpenQA.Selenium;
using System.IO;
using System;

namespace PromiseModelOnline.Client.Tests.Tests;

public class ImportExportTests : SeleniumTestBase
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

    private void UploadImportFile(string fileName)
    {
        var filePath = GetResourcePath(fileName);
        var fileInput = WaitForElement(By.Id("import-project-input"), 5);
        fileInput.SendKeys(filePath);
    }

    [Test]
    public void ImportPage_HasImportSection()
    {
        NavigateAsUser("/projects/add");

        var importBtn = WaitForElement(By.Id("import-project-btn"), 5);
        Assert.That(importBtn.Displayed, Is.True);
        Assert.That(importBtn.Text, Does.Contain("Import"));

        var fileInput = Driver.FindElement(By.Id("import-project-input"));
        Assert.That(fileInput.Displayed, Is.True);
    }

    [Test]
    public void Import_UberJson_ShowsPreview()
    {
        NavigateAsUser("/projects/add");
        UploadImportFile("uber.json");

        var summaryPanel = WaitForElement(By.Id("project-import-summary-panel"), 5);
        var summaryText = summaryPanel.Text;

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
    public void Import_NetflixJson_ShowsPreview()
    {
        NavigateAsUser("/projects/add");
        UploadImportFile("netflix.json");

        var summaryPanel = WaitForElement(By.Id("project-import-summary-panel"), 5);
        var summaryText = summaryPanel.Text;

        Assert.That(summaryText, Does.Contain("Netflix"));
        Assert.That(summaryText, Does.Contain("Promises"));
        Assert.That(summaryText, Does.Contain("Epics"));
        Assert.That(summaryText, Does.Contain("Journeys"));
        Assert.That(summaryText, Does.Contain("Iterations"));
    }

    [Test]
    public void Import_UberJson_SubmitSuccessfully()
    {
        NavigateAsUser("/projects/add");
        UploadImportFile("uber.json");

        WaitForElement(By.CssSelector("#project-import-summary-panel table"), 5);

        ScrollToAndClick(By.Id("create-project-btn"), 5);

        WaitForUrlContains("/graph", 10);
        Assert.That(Driver.Url, Does.Contain("/projects/123/graph"));
    }

    [Test]
    public void Import_NetflixJson_SubmitSuccessfully()
    {
        NavigateAsUser("/projects/add");
        UploadImportFile("netflix.json");

        WaitForElement(By.CssSelector("#project-import-summary-panel table"), 5);

        ScrollToAndClick(By.Id("create-project-btn"), 5);

        WaitForUrlContains("/graph", 10);
        Assert.That(Driver.Url, Does.Contain("/projects/123/graph"));
    }

    [Test]
    public void Import_CancelImport_ResetsForm()
    {
        NavigateAsUser("/projects/add");
        UploadImportFile("uber.json");

        WaitForElement(By.CssSelector("#project-import-summary-panel table"), 5);

        var clearBtn = WaitForElement(By.Id("clear-import-btn"), 5);
        Assert.That(clearBtn.Displayed, Is.True);

        ScrollToAndClick(By.Id("clear-import-btn"), 5);

        var summaryPanel = Driver.FindElement(By.Id("project-import-summary-panel"));
        Assert.That(summaryPanel.Text, Is.Empty);

        var nameInput = Driver.FindElement(By.Id("project-name-input"));
        Assert.That(nameInput.GetAttribute("value"), Is.Empty);
    }

    [Test]
    public void Export_ButtonShowsOnSettingsPage()
    {
        NavigateAsUser("/projects/1/settings");

        var exportBtn = WaitForElement(By.Id("export-project-btn"), 5);
        Assert.That(exportBtn.Displayed, Is.True);
        Assert.That(exportBtn.Text, Does.Contain("Export"));
    }

    [Test]
    public void Export_Download_TriggersSuccessPopover()
    {
        NavigateAsUser("/projects/1/settings");

        var exportBtn = WaitForElement(By.Id("export-project-btn"), 5);
        ScrollToAndClick(By.Id("export-project-btn"), 5);

        var popover = WaitForElement(By.CssSelector(".popover, [data-bs-content]"), 5);
        Assert.That(popover, Is.Not.Null);
    }

    [Test]
    public void Import_FileInput_AcceptsJsonExtension()
    {
        NavigateAsUser("/projects/add");

        var fileInput = Driver.FindElement(By.Id("import-project-input"));
        var acceptAttr = fileInput.GetAttribute("accept");
        Assert.That(acceptAttr, Does.Contain(".json"));
        Assert.That(acceptAttr, Does.Contain("application/json"));
    }

    [Test]
    public void Import_UberJson_NameAndDescriptionPopulated()
    {
        NavigateAsUser("/projects/add");
        UploadImportFile("uber.json");

        var nameInput = WaitForElement(By.Id("project-name-input"), 5);
        Assert.That(nameInput.GetAttribute("value"), Is.EqualTo("Uber"));

        var descriptionInput = Driver.FindElement(By.Id("project-description-input"));
        Assert.That(descriptionInput.GetAttribute("value"), Does.Contain("Promise-Driven Development refactor of Uber"));
    }

    [Test]
    public void Import_Mode_SubmitButtonLabelChanges()
    {
        NavigateAsUser("/projects/add");

        var submitBtn = WaitForElement(By.Id("create-project-btn"), 5);
        var label = Driver.FindElement(By.Id("create-project-btn-label"));
        Assert.That(label.Text, Is.EqualTo("Create Project"));

        UploadImportFile("uber.json");
        WaitForElement(By.CssSelector("#project-import-summary-panel table"), 5);

        Assert.That(label.Text, Is.EqualTo("Import Project"));
    }

    [Test]
    public void Import_FirstPromiseHidden_InImportMode()
    {
        NavigateAsUser("/projects/add");

        var firstPromisePanel = Driver.FindElement(By.Id("first-promise-panel"));
        Assert.That(firstPromisePanel.Displayed, Is.True);

        UploadImportFile("uber.json");
        WaitForElement(By.CssSelector("#project-import-summary-panel table"), 5);

        Assert.That(firstPromisePanel.Displayed, Is.False);
    }
}
