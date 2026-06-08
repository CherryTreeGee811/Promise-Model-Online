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
            SetSessionCookie("nonowner-session");
            NavigateSpa("/moments/my-tasks");

            var emptyMsg = WaitForElement(By.CssSelector(".no-items"), 10);
            Assert.That(emptyMsg.Text, Does.Contain("no assigned tasks"));
        }
        [Test]
        public void MyTasks_MomentTypeDropdown_Renders()
        {
            EnsureLoggedIn();
            NavigateSpa("/moments/my-tasks");

            var row = WaitForElement(By.CssSelector("#my-tasks-content tbody tr"));
            var mid = row.GetAttribute("data-moment-id");

            var typeSelect = row.FindElement(By.CssSelector(".moment-type-select"));
            Assert.That(typeSelect, Is.Not.Null, "No moment type select found");
            Assert.That(typeSelect.Enabled, Is.True);

            var typeValue = typeSelect.GetAttribute("value");
            Assert.That(typeValue, Is.EqualTo("Story"), "My task moment should be type Story");
        }
    }
}