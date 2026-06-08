using NUnit.Framework;
using PromiseModelOnline.Client.Tests.Helpers;
using OpenQA.Selenium;

namespace PromiseModelOnline.Client.Tests.Tests
{
    public class ProjectShareTests : SeleniumTestBase
    {
        [Test]
        public void SharePage_LoadsPermissionsTable()
        {
            NavigateAsUser("/pmo_test/seeded-project/share");

            WaitForElement(By.CssSelector("table.promisemodel-table tbody tr"), 10);

            var rows = Driver.FindElements(By.CssSelector("table.promisemodel-table tbody tr"));
            Assert.That(rows.Count, Is.GreaterThanOrEqualTo(1));
            Assert.That(rows[0].Text, Does.Contain("testuser"));
        }

        [Test]
        public void SharePage_ShowsInviteForm()
        {
            NavigateAsUser("/pmo_test/seeded-project/share");

            WaitForElement(By.Id("invite-form"), 10);

            Assert.That(Driver.FindElement(By.Id("invite-email")).Displayed, Is.True);
            Assert.That(Driver.FindElement(By.Id("invite-level")).Displayed, Is.True);
            Assert.That(Driver.FindElement(By.CssSelector("#invite-form button[type='submit']")).Displayed, Is.True);
        }

        [Test]
        public void SharePage_ShowsRevokeButtonForPermissions()
        {
            NavigateAsUser("/pmo_test/seeded-project/share");

            WaitForElement(By.CssSelector("table.promisemodel-table tbody tr"), 10);

            var revokeButtons = Driver.FindElements(By.CssSelector(".revoke-btn"));
            Assert.That(revokeButtons.Count, Is.GreaterThanOrEqualTo(1));
        }

        [Test]
        public void SharePage_SendInvite_ShowsNewRow()
        {
            NavigateAsUser("/pmo_test/seeded-project/share");

            WaitForElement(By.Id("invite-email"), 10).SendKeys("newuser@example.com");
            var levelSelect = Driver.FindElement(By.Id("invite-level"));
            levelSelect.Click();
            levelSelect.FindElement(By.CssSelector("option[value='Edit']")).Click();
            Driver.FindElement(By.CssSelector("#invite-form button[type='submit']")).Click();

            WaitUntil(d =>
            {
                var rows = d.FindElements(By.CssSelector("table.promisemodel-table tbody tr"));
                return rows.Count >= 3;
            }, 10);
        }
    }
}
