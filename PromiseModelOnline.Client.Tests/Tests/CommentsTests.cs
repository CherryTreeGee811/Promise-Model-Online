using NUnit.Framework;
using PromiseModelOnline.Client.Tests.Helpers;
using OpenQA.Selenium;

namespace PromiseModelOnline.Client.Tests.Tests
{
    public class CommentsTests : SeleniumTestBase
    {
        [Test]
        public void Comments_PostComment_AppearsInList()
        {
            Driver.Navigate().GoToUrl(BaseUrl + "/moments/100");

            var existingComment = WaitForElement(By.CssSelector(".comment-item .comment-text"));
            Assert.That(existingComment.Text, Does.Contain("Existing comment"));

            var textarea = WaitForElement(By.Id("comment-textarea"));
            textarea.SendKeys("New comment");

            // Scroll the Post button into view, then click
            ScrollElementIntoViewAndClick(By.CssSelector("#comment-form .view-btn"));

            WaitUntil(driver =>
            {
                try
                {
                    return driver.FindElements(By.CssSelector(".comment-item .comment-text")).Count >= 2;
                }
                catch { return false; }
            }, 5);

            var allComments = Driver.FindElements(By.CssSelector(".comment-item .comment-text"));
            Assert.That(allComments.Count, Is.GreaterThanOrEqualTo(2));
        }
    }
}