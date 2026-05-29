using NUnit.Framework;
using PromiseModelOnline.Client.Tests.Helpers;
using OpenQA.Selenium;
using System;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace PromiseModelOnline.Client.Tests.Tests
{
	public class ProjectSettingsTests : SeleniumTestBase
	{
		[Test]
		public void ProjectSettings_DeleteButton_RemovesProject()
		{
			EnsureLoggedIn();

			var projectName = $"Selenium Delete Project {Guid.NewGuid():N}";
			var projectId = CreateProject(projectName);

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

		private int CreateProject(string projectName)
		{
			var token = Driver.ExecuteScript("return sessionStorage.getItem('pmo.accessToken');")?.ToString();
			Assert.That(token, Is.Not.Null.And.Not.Empty, "Access token was not available for API setup.");

			using var handler = new HttpClientHandler
			{
				ServerCertificateCustomValidationCallback = (_, _, _, _) => true
			};

			using var client = new HttpClient(handler)
			{
				BaseAddress = new Uri(BaseUrl)
			};

			client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

			var payload = JsonSerializer.Serialize(new
			{
				name = projectName,
				description = (string?)null,
			});

			using var response = client.PostAsync(
				"/api/projects/create",
				new StringContent(payload, Encoding.UTF8, "application/json")).GetAwaiter().GetResult();

			var responseBody = response.Content.ReadAsStringAsync().GetAwaiter().GetResult();
			Assert.That(response.IsSuccessStatusCode, Is.True, $"Project creation failed: {response.StatusCode} {responseBody}");

			using var document = JsonDocument.Parse(responseBody);
			var root = document.RootElement;

			if (root.TryGetProperty("id", out var idElement))
			{
				return idElement.GetInt32();
			}

			if (root.TryGetProperty("Id", out var legacyIdElement))
			{
				return legacyIdElement.GetInt32();
			}

			throw new AssertionException("Project creation response did not include an id.");
		}
	}
}
