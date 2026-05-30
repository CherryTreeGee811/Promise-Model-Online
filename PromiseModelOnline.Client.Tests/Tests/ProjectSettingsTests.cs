using NUnit.Framework;
using PromiseModelOnline.Client.Tests.Helpers;
using OpenQA.Selenium;
using System.Linq;

namespace PromiseModelOnline.Client.Tests.Tests
{
	public class ProjectSettingsTests : SeleniumTestBase
	{
		[Test]
		public void ProjectSettings_DeleteButton_ReturnsToProjectList()
		{
			EnsureLoggedIn();
			NavigateSpa("/projects/1/settings");

			var titleInput = WaitForElement(By.Id("project-title-input"));
			Assert.That(titleInput.GetAttribute("value"), Is.EqualTo("Test Project"));

			var auditTable = WaitForElement(By.CssSelector("#project-audit-panel table"));
			Assert.That(auditTable.Text, Does.Contain("Created"));

			var confirmationInput = WaitForElement(By.Id("project-delete-confirmation-input"));
			confirmationInput.SendKeys("delete Test Project");

			var deleteButton = WaitForClickable(By.Id("delete-project-btn"));
			deleteButton.Click();

			WaitUntil(driver => driver.Url.EndsWith("/projects"), 15);
			WaitForElement(By.CssSelector("#project-list-table-body tr"));
			Assert.That(Driver.Url, Does.EndWith("/projects"));
		}

		[Test]
		public void ProjectSettings_ViewFullAuditLog_OpensHistoryPage()
		{
			EnsureLoggedIn();
			NavigateSpa("/projects/1/settings");

			var historyLink = WaitForClickable(By.Id("project-audit-history-link"));
			historyLink.Click();

			WaitUntil(driver => driver.Url.EndsWith("/projects/1/history"), 15);
			WaitForElement(By.Id("audit-history-list"));
			Assert.That(Driver.Url, Does.EndWith("/projects/1/history"));
		}
	}
}
