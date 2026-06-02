using NUnit.Framework;
using PromiseModelOnline.Client.Tests.Helpers;
using OpenQA.Selenium;
using System.Linq;

namespace PromiseModelOnline.Client.Tests.Tests
{
    public class ProjectSettingsTests : SeleniumTestBase
    {
        [Test]
        public void ProjectSettings_DeleteProject_RequiresConfirmationAndRedirects()
        {
            EnsureLoggedIn();
            NavigateSpa("/projects/1/settings");

            var confirmationTextEl = WaitForElement(By.Id("project-delete-confirmation-text"), 20);
            var confirmationPhrase = confirmationTextEl.Text ?? string.Empty;

            var input = WaitForElement(By.Id("project-delete-confirmation-input"));
            input.Clear();
            input.SendKeys(confirmationPhrase);

            ScrollToAndClick(By.Id("delete-project-btn"));

            WaitUntil(driver => driver.Url.EndsWith("/projects"), 15);
            Assert.That(Driver.Url, Does.EndWith("/projects"));
        }

        [Test]
        public void ProjectSettings_ViewFullAuditLog_OpensHistoryPage()
        {
            EnsureLoggedIn();
            NavigateSpa("/projects/1/settings");

            ScrollToAndClick(By.Id("project-audit-history-link"));

            WaitUntil(driver => driver.Url.EndsWith("/projects/1/history"), 15);
            WaitForElement(By.Id("audit-history-list"));
            Assert.That(Driver.Url, Does.EndWith("/projects/1/history"));
        }
    }
}
