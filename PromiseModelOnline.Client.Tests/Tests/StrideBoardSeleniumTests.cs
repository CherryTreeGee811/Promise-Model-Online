using NUnit.Framework;
using PromiseModelOnline.Client.Tests.Helpers;
using OpenQA.Selenium;
using OpenQA.Selenium.Support.UI;
using System;
using System.Linq;

namespace PromiseModelOnline.Client.Tests.Tests
{
    public class StrideBoardSeleniumTests : SeleniumTestBase
    {
        private IWebElement FindControl(string id, string classSelector)
        {
            try { return WaitForElement(By.Id(id), 5); }
            catch { return WaitForElement(By.CssSelector(classSelector)); }
        }

        [Test]
        public void OwnerCanEditDropdowns()
        {
            EnsureLoggedIn("/projects/1/strides");

            var row = WaitForElement(By.CssSelector("tr[data-moment-id]"));
            var mid = row.GetAttribute("data-moment-id");
            var estimate = FindControl($"estimate-{mid}", ".estimate-dropdown");
            Assert.That(estimate, Is.Not.Null, "No estimate dropdown found");
            Assert.That(estimate!.Enabled, Is.True, "Estimate dropdown should be enabled for owner");
        }

        [Test]
        public void PermissionEnforcement_NonOwnerCannotEdit()
        {
            var nonOwnerToken = Environment.GetEnvironmentVariable("TEST_NONOWNER_COOKIE");
            if (string.IsNullOrEmpty(nonOwnerToken))
            {
                Assert.Ignore("No non-owner cookie provided via TEST_NONOWNER_COOKIE");
                return;
            }

            SetAuthCookie(nonOwnerToken);
            EnsureLoggedIn("/projects/1/strides");

            var row = WaitForElement(By.CssSelector("tr[data-moment-id]"));
            var mid = row.GetAttribute("data-moment-id");
            var estimate = FindControl($"estimate-{mid}", ".estimate-dropdown");
            Assert.That(estimate, Is.Not.Null, "No estimate dropdown found");
            Assert.That(estimate!.Enabled, Is.False, "Non-owner should not be able to edit estimate");
        }

        [Test]
        public void EstimatePersistence()
        {
            EnsureLoggedIn("/projects/1/strides");

            var row = WaitForElement(By.CssSelector("tr[data-moment-id]"));
            var mid = row.GetAttribute("data-moment-id");
            var estimateEl = FindControl($"estimate-{mid}", ".estimate-dropdown");
            Assert.That(estimateEl, Is.Not.Null, "No estimate dropdown found");
            var select = new SelectElement(estimateEl!);
            if (select.Options.Count <= 1) Assert.Ignore("Not enough estimate options to change");

            var beforeValue = select.SelectedOption?.GetAttribute("value") ?? "";
            select.SelectByIndex(1);

            var changed = WaitUntil(d =>
            {
                try
                {
                    IWebElement el;
                    try { el = d.FindElement(By.Id($"estimate-{mid}")); }
                    catch { el = d.FindElement(By.CssSelector(".estimate-dropdown")); }
                    var cur = new SelectElement(el).SelectedOption?.GetAttribute("value") ?? "";
                    return cur != beforeValue;
                }
                catch { return false; }
            }, 5);

            Assert.That(changed, Is.True, "Estimate did not update in the UI");

            Driver.Navigate().Refresh();

            var after = new SelectElement(FindControl($"estimate-{mid}", ".estimate-dropdown")).SelectedOption?.GetAttribute("value") ?? "";
            Assert.That(after, Is.Not.EqualTo(beforeValue), "Estimate selection did not persist after refresh");
        }

        [Test]
        public void MovePersistence()
        {
            EnsureLoggedIn("/projects/1/strides");

            var row = WaitForElement(By.CssSelector("tr[data-moment-id]"));
            var mid = row.GetAttribute("data-moment-id");
            var moveEl = FindControl($"move-{mid}", ".move-dropdown");
            Assert.That(moveEl, Is.Not.Null, "No move dropdown found");
            var select = new SelectElement(moveEl!);
            var option = select.Options.FirstOrDefault(o => !string.IsNullOrEmpty(o.GetAttribute("value")));
            if (option == null || select.Options.Count <= 1) Assert.Ignore("No valid move options to select");

            var before = select.SelectedOption?.GetAttribute("value") ?? "";
            select.SelectByIndex(1);

            var changed = WaitUntil(d =>
            {
                try
                {
                    IWebElement el;
                    try { el = d.FindElement(By.Id($"move-{mid}")); }
                    catch { el = d.FindElement(By.CssSelector(".move-dropdown")); }
                    var cur = new SelectElement(el).SelectedOption?.GetAttribute("value") ?? "";
                    return cur != before;
                }
                catch { return false; }
            }, 5);

            Assert.That(changed, Is.True, "Move selection did not update in the UI");

            Driver.Navigate().Refresh();

            var after = new SelectElement(FindControl($"move-{mid}", ".move-dropdown")).SelectedOption?.GetAttribute("value") ?? "";
            Assert.That(after, Is.Not.EqualTo(before), "Move selection did not persist after refresh");
        }

        [Test]
        public void OwnerAssignmentPersistence()
        {
            EnsureLoggedIn("/projects/1/strides");

            var row = WaitForElement(By.CssSelector("tr[data-moment-id]"));
            var mid = row.GetAttribute("data-moment-id");
            var ownerEl = FindControl($"owner-{mid}", ".owner-dropdown");
            Assert.That(ownerEl, Is.Not.Null, "No owner dropdown found");
            var select = new SelectElement(ownerEl!);
            if (select.Options.Count <= 1) Assert.Ignore("Not enough owner options to change");

            var before = select.SelectedOption?.GetAttribute("value") ?? "";
            select.SelectByIndex(1);

            var changed = WaitUntil(d =>
            {
                try
                {
                    IWebElement el;
                    try { el = d.FindElement(By.Id($"owner-{mid}")); }
                    catch { el = d.FindElement(By.CssSelector(".owner-dropdown")); }
                    var cur = new SelectElement(el).SelectedOption?.GetAttribute("value") ?? "";
                    return cur != before;
                }
                catch { return false; }
            }, 5);

            Assert.That(changed, Is.True, "Owner assignment did not update in the UI");

            Driver.Navigate().Refresh();

            var after = new SelectElement(FindControl($"owner-{mid}", ".owner-dropdown")).SelectedOption?.GetAttribute("value") ?? "";
            Assert.That(after, Is.Not.EqualTo(before), "Owner assignment did not persist after refresh");
        }
    }
}
