using NUnit.Framework;
using PromiseModelOnline.Client.Tests.Helpers;
using OpenQA.Selenium;
using System;
using System.Linq;
using System.Text.RegularExpressions;

namespace PromiseModelOnline.Client.Tests.Tests
{
	public class ProjectSettingsTests : SeleniumTestBase
	{
		[Test]
		public void ProjectSettings_DeleteButton_RemovesProject()
		{
			EnsureLoggedIn();

			var projectName = $"Selenium Delete Project {Guid.NewGuid():N}";
			var projectId = CreateProjectViaUi(projectName);

			NavigateSpa($"/projects/{projectId}/settings");

			var titleInput = WaitForElement(By.Id("project-title-input"));
			Assert.That(titleInput.GetAttribute("value"), Is.EqualTo(projectName));

			var confirmationInput = WaitForElement(By.Id("project-delete-confirmation-input"));
			confirmationInput.SendKeys($"delete {projectName}");

			var deleteButton = WaitForClickable(By.Id("delete-project-btn"));
			deleteButton.Click();

			WaitUntil(driver => driver.Url.EndsWith("/projects"), 15);
			WaitForElement(By.CssSelector("#project-list-table-body tr"));

			Assert.That(
				Driver.FindElements(By.CssSelector("#project-list-table-body tr")).Any(row => row.Text.Contains(projectName)),
				Is.False,
				"Project row was not removed after deletion");
		}

		private int CreateProjectViaUi(string projectName)
		{
			NavigateSpa("/projects/add");

			WaitForElement(By.Id("project-name-input")).SendKeys(projectName);
			WaitForElement(By.Id("first-promise-input")).SendKeys("As a tester, validate project deletion.");
			WaitForClickable(By.Id("create-project-btn")).Click();

			WaitUntil(driver => Regex.IsMatch(driver.Url, @"/projects/\d+/graph$"), 20);
			var match = Regex.Match(Driver.Url, @"/projects/(\d+)/graph$");
			Assert.That(match.Success, Is.True, $"Unexpected project redirect URL: {Driver.Url}");

			return int.Parse(match.Groups[1].Value);
		}
	}
}
