<<<<<<< HEAD
using PromiseModelOnline.Client.Tests.Helpers;

namespace PromiseModelOnline.Client.Tests.Tests;

public class ProjectsListTests : PlaywrightTestBase
{
    [Test]
    public async Task ProjectList_LoadsAndDisplaysProject()
    {
        await EnsureLoggedIn();
        await NavigateSpaAsync("/projects");

        var row = await WaitForSelectorAsync("#project-list-table-body tr");
        Assert.That(await row.TextContentAsync(), Does.Contain("Test Project"));
    }

    [Test]
    public async Task ProjectList_AuditLogButton_OpensHistoryPage()
    {
        await EnsureLoggedIn();
        await NavigateSpaAsync("/projects");

        await WaitForSelectorAsync("#project-list-table-body tr");
        await ClickAsync(".audit-log-btn");

        var ends = await WaitForUrlContainsAsync("/pmo_test/seeded-project/history", 15);
        var historyList = await WaitForSelectorAsync("#audit-history-list");

        Assert.That(ends, Is.True);
        Assert.That(Page.Url, Does.EndWith("/pmo_test/seeded-project/history"));
    }
}
||||||| 1bedf4f
=======
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

        // TODO: This test will need to be rewritten/moved to a Project Settings UI Tests suite at a later date
        // [Test]
        // public void ProjectList_DeleteButton_RemovesRow()
        // {
        //     EnsureLoggedIn();
        //     NavigateSpa("/projects");

        //     var deleteBtn = WaitForElement(By.CssSelector(".delete-btn[project-id='1']"));
        //     deleteBtn.Click();

        //     // After deletion, the row should be removed from the DOM
        //     WaitUntil(driver =>
        //     {
        //         try
        //         {
        //             return driver.FindElements(By.CssSelector("#project-list-table-body tr")).Count == 0;
        //         }
        //         catch
        //         {
        //             return false;
        //         }
        //     }, 5);

        //     var rows = Driver.FindElements(By.CssSelector("#project-list-table-body tr"));
        //     Assert.That(rows.Count, Is.EqualTo(0), "Project row was not removed after deletion");
        // }
    }
}
>>>>>>> 3d9d1e58bc450b19abee31d15bed7ffeb3de730e
