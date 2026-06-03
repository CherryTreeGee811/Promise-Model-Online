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

        [Test]
        public void MyTasks_Empty_ShowsNoTasksMessage()
        {
            LoginViaUi("nonowner", "P@ssw0rd!");
            NavigateSpa("/moments/my-tasks");

            var emptyMsg = WaitForElement(By.CssSelector(".no-items"), 10);
            Assert.That(emptyMsg.Text, Does.Contain("no assigned tasks"));
        }
    }
}