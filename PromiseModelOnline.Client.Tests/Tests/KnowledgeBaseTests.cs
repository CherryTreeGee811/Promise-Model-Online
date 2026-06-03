using NUnit.Framework;
using PromiseModelOnline.Client.Tests.Helpers;
using OpenQA.Selenium;

namespace PromiseModelOnline.Client.Tests.Tests
{
    public class KnowledgeBaseTests : SeleniumTestBase
    {
        [Test]
        public void KnowledgeBase_ShowsSidebar()
        {
            NavigateAsUser("/knowledge-base");

            var sidebar = WaitForElement(By.Id("navbar-kb"), 10);

            Assert.That(sidebar.Displayed, Is.True);
            Assert.That(sidebar.Text, Does.Contain("Promise Stack KB"));
            Assert.That(sidebar.FindElements(By.CssSelector(".nav-link")).Count, Is.GreaterThanOrEqualTo(5));
        }

        [Test]
        public void KnowledgeBase_ShowsContent()
        {
            NavigateAsUser("/knowledge-base");

            var kbContent = WaitForElement(By.Id("kb-content"), 10);

            Assert.That(kbContent.Displayed, Is.True);
            Assert.That(kbContent.Text, Does.Contain("Promise Stack Overview"));
        }

        [Test]
        public void KnowledgeBase_Navigation_ScrollsToSection()
        {
            NavigateAsUser("/knowledge-base");

            var sectionLink = WaitForElement(By.CssSelector("#navbar-kb a[href='#section6']"), 10);
            sectionLink.Click();

            var section = WaitForElement(By.Id("section6"), 10);
            Assert.That(section.Displayed, Is.True);
            Assert.That(section.Text, Does.Contain("Moments"));
        }
    }
}
