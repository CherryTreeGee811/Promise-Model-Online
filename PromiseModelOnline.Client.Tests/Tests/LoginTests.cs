<<<<<<< HEAD
using PromiseModelOnline.Client.Tests.Helpers;

namespace PromiseModelOnline.Client.Tests.Tests;

public class LoginTests : PlaywrightTestBase
{
    [Test]
    public async Task LoginLink_NavigatesToGatewayLogin()
    {
        await Page.GotoAsync(BaseUrl + "/");

        var loginLink = await WaitForSelectorAsync("#login-link", 5);
        var href = await loginLink.GetAttributeAsync("href");

        Assert.That(href, Does.Contain("/login"));
    }

    [Test]
    public async Task Login_HasNoFormInSpa()
    {
        await Page.GotoAsync(BaseUrl + "/login");

        var urlContains = await WaitForUrlContainsAsync("/login", 5);
        Assert.That(urlContains, Is.True);
    }

    [Test]
    public async Task Login_SetsSession_AllowsFutureRequests()
    {
        await NavigateAsUser("/projects");

        await WaitForSelectorAsync("#project-list-table-body tr");

        Assert.That(Page.Url, Does.Not.Contain("/login"));
    }
}
||||||| 1bedf4f
=======
using NUnit.Framework;
using PromiseModelOnline.Client.Tests.Helpers;
using OpenQA.Selenium;

namespace PromiseModelOnline.Client.Tests.Tests
{
    public class LoginTests : SeleniumTestBase
    {
        protected override bool ShouldSetDefaultAuthCookie => false;

        [SetUp]
        public void LoginTestSetup()
        {
            // Do NOT set the default auth cookie for login tests
        }

        [Test]
        public void Login_Successful_RedirectsToHome()
        {
            LoginViaUi("testuser", "P@ssw0rd!");

            Wait.Until(d => !d.Url.Contains("/login"));

            Assert.That(Driver.Url, Does.StartWith(BaseUrl));
        }

        [Test]
        public void Login_InvalidCredentials_ShowsError()
        {
            Driver.Navigate().GoToUrl(BaseUrl + "/login");

            var userEl = WaitForElement(By.Id("username-input"), 5);
            var passEl = WaitForElement(By.Id("password-input"), 5);
            var btn = WaitForElement(By.Id("login-btn"), 5);

            userEl.SendKeys("testuser");
            passEl.SendKeys("wrong");
            btn.Click();

            // ✅ wait for error instead of sleep
            var error = WaitForElement(By.Id("error-text"), 5);

            Assert.That(Driver.Url, Does.Contain("/login"));
            Assert.That(error.Text, Does.Contain("Invalid"));
        }

        [Test]
        public void Login_SetsSession_AllowsFutureRequests()
        {
            LoginViaUi("testuser", "P@ssw0rd!");

            // Simulate user clicking a link to a protected page (SPA navigation)
            NavigateSpa("/projects");

            // Wait until the protected page actually renders its content
            WaitForElement(By.CssSelector("#project-list-table-body tr"));

            // Verify we are not on the login page
            Assert.That(Driver.Url, Does.Not.Contain("/login"));
        }
    }
}
>>>>>>> 3d9d1e58bc450b19abee31d15bed7ffeb3de730e
