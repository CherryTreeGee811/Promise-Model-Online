using NUnit.Framework;
using PromiseModelOnline.Client.Tests.Helpers;
using OpenQA.Selenium;

namespace PromiseModelOnline.Client.Tests.Tests
{
    public class AddProjectTests : SeleniumTestBase
    {
        [Test]
        public void AddProject_ShowsForm()
        {
            NavigateAsUser("/projects/add");

            WaitForElement(By.Id("add-project-form"), 5);

            Assert.That(Driver.FindElement(By.Id("project-name-input")).Displayed, Is.True);
            Assert.That(Driver.FindElement(By.Id("project-description-input")).Displayed, Is.True);
            Assert.That(Driver.FindElement(By.Id("first-promise-input")).Displayed, Is.True);
            Assert.That(Driver.FindElement(By.Id("create-project-btn")).Displayed, Is.True);
            Assert.That(Driver.FindElement(By.Id("cancel-add-project-link")).Displayed, Is.True);
        }

        [Test]
        public void AddProject_EmptyName_ShowsValidationError()
        {
            NavigateAsUser("/projects/add");

            WaitForElement(By.Id("first-promise-input"), 10);

            ((IJavaScriptExecutor)Driver).ExecuteScript(
                "document.getElementById('add-project-form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));");

            WaitUntil(d =>
            {
                try
                {
                    var el = d.FindElement(By.Id("error-text"));
                    var text = el.Text ?? "";
                    return text.Contains("required") || text.Contains("name");
                }
                catch { return false; }
            }, 5);
        }

        [Test]
        public void AddProject_EmptyPromise_ShowsValidationError()
        {
            NavigateAsUser("/projects/add");

            WaitForElement(By.Id("project-name-input"), 10).SendKeys("My Project");
            ((IJavaScriptExecutor)Driver).ExecuteScript(
                "document.getElementById('add-project-form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));");

            WaitUntil(d =>
            {
                try
                {
                    var el = d.FindElement(By.Id("error-text"));
                    var text = el.Text ?? "";
                    return text.Contains("Product Promise") || text.Contains("required");
                }
                catch { return false; }
            }, 5);
        }

        [Test]
        public void AddProject_CreatesSuccessfully()
        {
            NavigateAsUser("/projects/add");

            WaitForElement(By.Id("project-name-input"), 5).SendKeys("My New Project");
            Driver.FindElement(By.Id("project-description-input")).SendKeys("A test project");
            Driver.FindElement(By.Id("first-promise-input")).SendKeys("As a user, manage projects efficiently");
            ScrollToAndClick(By.Id("create-project-btn"), 5);

            WaitForUrlContains("/projects/", 10);
            Assert.That(Driver.Url, Does.Contain("/projects/"));
        }

        [Test]
        public void AddProject_Cancel_ReturnsToProjectList()
        {
            NavigateAsUser("/projects/add");

            WaitForElement(By.Id("cancel-add-project-link"), 5);
            ScrollToAndClick(By.Id("cancel-add-project-link"), 5);

            WaitForUrlContains("/projects", 10);
            Assert.That(Driver.Url, Does.Not.Contain("/add"));
        }

        [Test]
        public void AddProject_HasImportSection()
        {
            NavigateAsUser("/projects/add");

            WaitForElement(By.Id("import-project-btn"), 5);

            Assert.That(Driver.FindElement(By.Id("import-project-btn")).Text, Does.Contain("Import"));
            Assert.That(Driver.FindElement(By.Id("import-project-input")).Displayed, Is.True);
        }
    }
}
