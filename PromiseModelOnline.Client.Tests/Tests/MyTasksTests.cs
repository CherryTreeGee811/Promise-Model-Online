<<<<<<< HEAD
using PromiseModelOnline.Client.Tests.Helpers;

namespace PromiseModelOnline.Client.Tests.Tests;

public class MyTasksTests : PlaywrightTestBase
{
    [Test]
    public async Task MyTasks_DisplaysAssignedTasks()
    {
        await NavigateAsUser("/moments/my-tasks");

        var row = await WaitForSelectorAsync("#my-tasks-content tbody tr");
        var text = await row.TextContentAsync();
        Assert.That(text, Does.Contain("My Task"));
    }

    [Test]
    public async Task MyTasks_Empty_ShowsNoTasksMessage()
    {
        await NavigateAsUser("/moments/my-tasks", "nonowner-session");

        var emptyMsg = await WaitForSelectorAsync(".no-items", 10);
        var text = await emptyMsg.TextContentAsync();

        Assert.That(text, Does.Contain("no assigned tasks"));
    }

    [Test]
    public async Task MyTasks_MomentTypeDropdown_Renders()
    {
        await NavigateAsUser("/moments/my-tasks");

        var row = await WaitForSelectorAsync("#my-tasks-content tbody tr");
        var mid = await row.GetAttributeAsync("data-moment-id");

        var typeSelect = row.Locator(".moment-type-select");
        Assert.That(typeSelect, Is.Not.Null);
        Assert.That(await typeSelect.IsEnabledAsync(), Is.True);

        var typeValue = await typeSelect.InputValueAsync();
        Assert.That(typeValue, Is.EqualTo("Story"), "My task moment should be type Story");
    }
}
||||||| 1bedf4f
=======
using NUnit.Framework;
using PromiseModelOnline.Client.Tests.Helpers;
using OpenQA.Selenium;

namespace PromiseModelOnline.Client.Tests.Tests
{
    public class MyTasksTests : SeleniumTestBase
    {
        [Test]
        public void MyTasks_DisplaysAssignedTasks()
        {
            EnsureLoggedIn();
            NavigateSpa("/moments/my-tasks");

            var row = WaitForElement(By.CssSelector("#my-tasks-content tbody tr"));

            Assert.That(row.Text, Does.Contain("My Task"));
        }
    }
}
>>>>>>> 3d9d1e58bc450b19abee31d15bed7ffeb3de730e
