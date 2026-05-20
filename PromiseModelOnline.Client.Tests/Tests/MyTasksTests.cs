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
            Driver.Navigate().GoToUrl(BaseUrl + "/moments/my-tasks");

            var row = WaitForElement(By.CssSelector("#my-tasks-content tbody tr"));
            Assert.That(row.Text, Does.Contain("My Task"));
        }
    }
}