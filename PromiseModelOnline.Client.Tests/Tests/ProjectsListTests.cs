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
            Driver.Navigate().GoToUrl(BaseUrl + "/projects");

            // Wait for the table to populate
            var row = WaitForElement(By.CssSelector("#project-list-table-body tr"));
            Assert.That(row.Text, Does.Contain("Test Project"));
        }

        [Test]
        public void ProjectList_DeleteButton_RemovesRow()
        {
            Driver.Navigate().GoToUrl(BaseUrl + "/projects");

            var deleteBtn = WaitForElement(By.CssSelector(".delete-btn[project-id='1']"));
            deleteBtn.Click();

            // After deletion, the row should be removed from the DOM
            WaitUntil(driver =>
            {
                try
                {
                    return driver.FindElements(By.CssSelector("#project-list-table-body tr")).Count == 0;
                }
                catch
                {
                    return false;
                }
            }, 5);

            var rows = Driver.FindElements(By.CssSelector("#project-list-table-body tr"));
            Assert.That(rows.Count, Is.EqualTo(0), "Project row was not removed after deletion");
        }
    }
}