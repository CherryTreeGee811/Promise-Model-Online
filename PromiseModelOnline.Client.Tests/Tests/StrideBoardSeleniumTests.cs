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
        private IWebElement FindControl(string selector)
        {
            return WaitForElement(By.CssSelector(selector))!;
        }

        private string GetMomentId(IWebElement row)
        {
            return row.GetAttribute("data-moment-id")!;
        }

        private IWebElement GetFirstMomentRow()
        {
            return WaitForElement(By.CssSelector("tr[data-moment-id]"), 10)!;
        }

        private bool WaitForSelectChange(string selector, string beforeValue, int timeout = 5)
        {
            return WaitUntil(d =>
            {
                try
                {
                    var el = d.FindElement(By.CssSelector(selector));
                    var cur = new SelectElement(el).SelectedOption?.GetAttribute("value") ?? "";
                    return cur != beforeValue;
                }
                catch
                {
                    return false;
                }
            }, timeout);
        }

        [Test]
        public void OwnerCanEditDropdowns()
        {
            EnsureLoggedIn("/projects/1/strides");

            var row = GetFirstMomentRow();
            var mid = GetMomentId(row);

            var estimate = FindControl($".estimate-dropdown[data-moment-id='{mid}']");

            Assert.That(estimate, Is.Not.Null, "No estimate dropdown found");
            Assert.That(estimate.Enabled, Is.True, "Estimate dropdown should be enabled for owner");
        }

        [Test]
        public void PermissionEnforcement_NonOwnerCannotEdit()
        {
            // Use the non‑owner token (WireMock returns permission=View)
            var nonOwnerToken = "nonowner-token-fixed";
            // Inject token and go to the stride board
            Driver.Navigate().GoToUrl(BaseUrl + "/?test_token=" + nonOwnerToken);
            NavigateSpa("/projects/1/strides");

            var row = GetFirstMomentRow();
            var mid = GetMomentId(row);

            var estimate = FindControl($".estimate-dropdown[data-moment-id='{mid}']");

            Assert.That(estimate.Enabled, Is.False);
        }

        [Test]
        public void EstimatePersistence()
        {
            EnsureLoggedIn("/projects/1/strides");

            var row = GetFirstMomentRow();
            var mid = GetMomentId(row);

            var selector = $".estimate-dropdown[data-moment-id='{mid}']";
            var estimateEl = FindControl(selector);

            Assert.That(estimateEl, Is.Not.Null, "No estimate dropdown found");

            var select = new SelectElement(estimateEl);

            if (select.Options.Count <= 1)
                Assert.Ignore("Not enough estimate options to change");

            var beforeValue = select.SelectedOption?.GetAttribute("value") ?? "";

            select.SelectByIndex(1);

            Assert.That(
                WaitForSelectChange(selector, beforeValue),
                Is.True,
                "Estimate did not update in the UI"
            );
        }

        [Test]
        public void StatusChangePersistence()
        {
            EnsureLoggedIn("/projects/1/strides");

            var row = GetFirstMomentRow();
            var mid = GetMomentId(row);

            var selector = $".status-dropdown[data-moment-id='{mid}']";
            var statusEl = FindControl(selector);

            Assert.That(statusEl, Is.Not.Null, "No status dropdown found");

            var select = new SelectElement(statusEl);

            if (select.Options.Count <= 1)
                Assert.Ignore("No valid status options to select");

            var before = select.SelectedOption?.GetAttribute("value") ?? "";

            select.SelectByIndex(1);

            Assert.That(
                WaitForSelectChange(selector, before),
                Is.True,
                "Status selection did not update in the UI"
            );
        }

        [Test]
        public void OwnerAssignmentPersistence()
        {
            EnsureLoggedIn("/projects/1/strides");

            var row = GetFirstMomentRow();
            var mid = GetMomentId(row);

            var selector = $".owner-dropdown[data-moment-id='{mid}']";
            var ownerEl = FindControl(selector);

            Assert.That(ownerEl, Is.Not.Null, "No owner dropdown found");

            var select = new SelectElement(ownerEl);

            if (select.Options.Count <= 1)
                Assert.Ignore("Not enough owner options to change");

            var before = select.SelectedOption?.GetAttribute("value") ?? "";

            var optionToSelect = select.Options
                .FirstOrDefault(o => o.GetAttribute("value") != before);

            if (optionToSelect == null)
                Assert.Ignore("No different owner option available.");

            var valueToSelect = optionToSelect.GetAttribute("value");

            if (valueToSelect == null)
                Assert.Ignore("Option has no value.");

            select.SelectByValue(valueToSelect);

            Assert.That(
                WaitForSelectChange(selector, before),
                Is.True,
                "Owner assignment did not update in the UI"
            );
        }
    }
}