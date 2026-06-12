<<<<<<< HEAD
using PromiseModelOnline.Client.Tests.Helpers;

namespace PromiseModelOnline.Client.Tests.Tests;

public class IterationHistoryTests : PlaywrightTestBase
{
    [Test]
    public async Task IterationHistory_ShowsIterationAndStrides()
    {
        await EnsureLoggedIn();
        await NavigateSpaAsync("/pmo_test/seeded-project/iterations");

        var iterationRow = await WaitForSelectorAsync("#iterations-list tbody tr");
        Assert.That(await iterationRow.TextContentAsync(), Does.Contain("Sprint 1"));

        var viewBtn = await WaitForSelectorAsync(".view-iteration-btn");
        await viewBtn.ClickAsync();

        var strideRow = await WaitForSelectorAsync("#stride-details tbody tr");
        Assert.That(await strideRow.TextContentAsync(), Does.Contain("Stride One"));
    }
}
||||||| 1bedf4f
=======
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
>>>>>>> 3d9d1e58bc450b19abee31d15bed7ffeb3de730e
