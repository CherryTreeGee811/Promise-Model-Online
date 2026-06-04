using NUnit.Framework;
using PromiseModelOnline.Client.Tests.Helpers;
using OpenQA.Selenium;

namespace PromiseModelOnline.Client.Tests.Tests
{
    public class HomePageTests : SeleniumTestBase
    {
        [Test]
        public void HomePage_ShowsTitle()
        {
            Driver.Navigate().GoToUrl(BaseUrl + "/");

            var title = WaitForElement(By.CssSelector(".home-page h1"), 5);
            Assert.That(title.Text, Does.Contain("Align Your Teams"));
        }

        [Test]
        public void HomePage_AnonymousUser_ShowsLoginAndRegisterLinks()
        {
            Driver.Navigate().GoToUrl(BaseUrl + "/");

            var ctaArea = WaitForElement(By.Id("home-cta-area"), 5);
            var loginLink = ctaArea.FindElement(By.CssSelector("a[href='/login']"));
            var registerLink = ctaArea.FindElement(By.CssSelector("a[href='/account/register']"));

            Assert.That(loginLink.Displayed, Is.True);
            Assert.That(loginLink.Text, Does.Contain("Login"));
            Assert.That(registerLink.Displayed, Is.True);
            Assert.That(registerLink.Text, Does.Contain("Register"));
        }

        [Test]
        public void HomePage_AuthenticatedUser_ShowsProjectAndTaskLinks()
        {
            NavigateAsUser("/");

            WaitForElement(By.Id("home-cta-area"), 5);

            Assert.That(Driver.FindElement(By.CssSelector("#home-cta-area a[href='/projects']")).Displayed, Is.True);
            Assert.That(Driver.FindElement(By.CssSelector("#home-cta-area a[href='/moments/my-tasks']")).Displayed, Is.True);
            Assert.That(Driver.FindElement(By.CssSelector("#home-cta-area a[href='/knowledge-base']")).Displayed, Is.True);
        }

        [Test]
        public void HomePage_ShowsStackCards()
        {
            Driver.Navigate().GoToUrl(BaseUrl + "/");

            WaitForElement(By.CssSelector(".home-stack-card--promise"), 5);
            WaitForElement(By.CssSelector(".home-stack-card--epic"), 5);
            WaitForElement(By.CssSelector(".home-stack-card--journey"), 5);
            WaitForElement(By.CssSelector(".home-stack-card--flow"), 5);
            WaitForElement(By.CssSelector(".home-stack-card--moment"), 5);

            Assert.That(Driver.FindElement(By.CssSelector(".home-stack-card--promise h3")).Text, Is.EqualTo("Promise"));
            Assert.That(Driver.FindElement(By.CssSelector(".home-stack-card--moment h3")).Text, Is.EqualTo("Moment"));
        }
    }
}
