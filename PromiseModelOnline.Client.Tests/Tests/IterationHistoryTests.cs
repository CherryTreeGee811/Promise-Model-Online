using NUnit.Framework;
using PromiseModelOnline.Client.Tests.Helpers;
using OpenQA.Selenium;

namespace PromiseModelOnline.Client.Tests.Tests
{
    public class IterationHistoryTests : SeleniumTestBase
    {
       [Test]
        public void IterationHistory_ShowsIterationAndStrides()
        {
            EnsureLoggedIn();

            NavigateSpa("/projects/1/iterations");

            var iterationRow = WaitForElement(By.CssSelector("#iterations-list tbody tr"));
            Assert.That(iterationRow.Text, Does.Contain("Sprint 1"));

            var viewBtn = WaitForElement(By.CssSelector(".view-iteration-btn"));
            viewBtn.Click();

            var strideRow = WaitForElement(By.CssSelector("#stride-details tbody tr"));
            Assert.That(strideRow.Text, Does.Contain("Stride One"));
        }
    }
}