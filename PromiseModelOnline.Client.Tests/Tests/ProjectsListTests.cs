using NUnit.Framework;
using PromiseModelOnline.Client.Tests.Helpers;
using OpenQA.Selenium;

namespace PromiseModelOnline.Client.Tests.Tests
{
    public class ProjectsListTests : SeleniumTestBase
    {
        [Test]
        public void ProjectList_LoadsAndDisplaysProject()
        {
            // Navigate to projects page (already authenticated via default cookie)
            EnsureLoggedIn();
            NavigateSpa("/projects");

            // Wait for the table to populate
            var row = WaitForElement(By.CssSelector("#project-list-table-body tr"));
            Assert.That(row.Text, Does.Contain("Test Project"));
        }
    }
}