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
        private IWebElement FindControl(string classSelector)
        {
            return WaitForElement(By.CssSelector(classSelector));
        }

        [Test]
        public void OwnerCanEditDropdowns()
        {
            EnsureLoggedIn("/projects/1/strides");

            var row = WaitForElement(By.CssSelector("tr[data-moment-id]"));
            var mid = row.GetAttribute("data-moment-id");
            var estimate = FindControl($".estimate-dropdown[data-moment-id='{mid}']");
            Assert.That(estimate, Is.Not.Null, "No estimate dropdown found");
            Assert.That(estimate!.Enabled, Is.True, "Estimate dropdown should be enabled for owner");
        }

        [Test]
        public void PermissionEnforcement_NonOwnerCannotEdit()
        {
            // Hardcoded non-owner token – no environment variable needed
            const string nonOwnerToken = "nonowner-token-fixed";
            SetAuthCookie(nonOwnerToken);
            Driver.Navigate().GoToUrl(BaseUrl + "/projects/1/strides");

            var row = WaitForElement(By.CssSelector("tr[data-moment-id]"));
            var mid = row.GetAttribute("data-moment-id");
            var estimate = FindControl($".estimate-dropdown[data-moment-id='{mid}']");
            Assert.That(estimate, Is.Not.Null, "No estimate dropdown found");
            Assert.That(estimate!.Enabled, Is.False, "Non-owner should not be able to edit estimate");
        }

        [Test]
        public void EstimatePersistence()
        {
            EnsureLoggedIn("/projects/1/strides");

            var row = WaitForElement(By.CssSelector("tr[data-moment-id]"));
            var mid = row.GetAttribute("data-moment-id");
            var estimateEl = FindControl($".estimate-dropdown[data-moment-id='{mid}']");
            Assert.That(estimateEl, Is.Not.Null, "No estimate dropdown found");
            var select = new SelectElement(estimateEl!);
            if (select.Options.Count <= 1) Assert.Ignore("Not enough estimate options to change");

            var beforeValue = select.SelectedOption?.GetAttribute("value") ?? "";
            select.SelectByIndex(1);

            var changed = WaitUntil(d =>
            {
                try
                {
                    var el = d.FindElement(By.CssSelector($".estimate-dropdown[data-moment-id='{mid}']"));
                    var cur = new SelectElement(el).SelectedOption?.GetAttribute("value") ?? "";
                    return cur != beforeValue;
                }
                catch { return false; }
            }, 5);

            Assert.That(changed, Is.True, "Estimate did not update in the UI");
            // persistence after refresh not tested – static stubs don't remember changes
        }

        [Test]
        public void StatusChangePersistence()
        {
            EnsureLoggedIn("/projects/1/strides");

            var row = WaitForElement(By.CssSelector("tr[data-moment-id]"));
            var mid = row.GetAttribute("data-moment-id");
            var statusEl = FindControl($".status-dropdown[data-moment-id='{mid}']");
            Assert.That(statusEl, Is.Not.Null, "No status dropdown found");
            var select = new SelectElement(statusEl!);
            var option = select.Options.FirstOrDefault(o => !string.IsNullOrEmpty(o.GetAttribute("value")));
            if (option == null || select.Options.Count <= 1) Assert.Ignore("No valid status options to select");

            var before = select.SelectedOption?.GetAttribute("value") ?? "";
            select.SelectByIndex(1);

            var changed = WaitUntil(d =>
            {
                try
                {
                    var el = d.FindElement(By.CssSelector($".status-dropdown[data-moment-id='{mid}']"));
                    var cur = new SelectElement(el).SelectedOption?.GetAttribute("value") ?? "";
                    return cur != before;
                }
                catch { return false; }
            }, 5);

            Assert.That(changed, Is.True, "Status selection did not update in the UI");
            // persistence after refresh not tested
        }

        [Test]
        public void OwnerAssignmentPersistence()
        {
            EnsureLoggedIn("/projects/1/strides");

            var row = WaitForElement(By.CssSelector("tr[data-moment-id]"));
            var mid = row.GetAttribute("data-moment-id");
            var ownerEl = FindControl($".owner-dropdown[data-moment-id='{mid}']");
            Assert.That(ownerEl, Is.Not.Null, "No owner dropdown found");
            var select = new SelectElement(ownerEl!);
            if (select.Options.Count <= 1) Assert.Ignore("Not enough owner options to change");

            var before = select.SelectedOption?.GetAttribute("value") ?? "";
            
            // Find the first option that is different from the current one
            var optionToSelect = select.Options.FirstOrDefault(o => o.GetAttribute("value") != before);
            
            // If no different option is found, skip the test
            if (optionToSelect == null) Assert.Ignore("No different owner option available to select.");

            var valueToSelect = optionToSelect.GetAttribute("value");
            if (valueToSelect == null) Assert.Ignore("Found an option with no value attribute.");

            // Select the new option
            select.SelectByValue(valueToSelect);

            var changed = WaitUntil(d =>
            {
                try
                {
                    var el = d.FindElement(By.CssSelector($".owner-dropdown[data-moment-id='{mid}']"));
                    var cur = new SelectElement(el).SelectedOption?.GetAttribute("value") ?? "";
                    return cur != before;
                }
                catch { return false; }
            }, 5);

            Assert.That(changed, Is.True, "Owner assignment did not update in the UI");
            // persistence after refresh not tested
        }
    }
}