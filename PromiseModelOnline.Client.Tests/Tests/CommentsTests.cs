using NUnit.Framework;
using PromiseModelOnline.Client.Tests.Helpers;
using OpenQA.Selenium;
using System.Linq;

namespace PromiseModelOnline.Client.Tests.Tests
{
    public class CommentsTests : SeleniumTestBase
    {
        [Test]
        public void Comments_PostComment_AppearsInList()
        {
            EnsureLoggedIn();
            NavigateSpa("/moments/100");

            var existingComment = WaitForElement(By.CssSelector(".comment-item .comment-text"));
            Assert.That(existingComment.Text, Does.Contain("Existing comment"));

            var textarea = WaitForElement(By.Id("comment-textarea"));
            textarea.SendKeys("New comment");

            // Wait for button to be present and interactive
            var postButton = WaitForClickable(By.CssSelector("#comment-form .view-btn"));

            // Click via JavaScript – works reliably in headless mode
            ((IJavaScriptExecutor)Driver).ExecuteScript("arguments[0].click();", postButton);

            // Wait for new comment to appear
            WaitUntil(driver =>
            {
                try
                {
                    return driver.FindElements(By.CssSelector(".comment-item .comment-text"))
                                    .Any(e => e.Text.Contains("New comment"));
                }
                catch { return false; }
            }, 10);

            var allComments = Driver.FindElements(By.CssSelector(".comment-item .comment-text"));
            Assert.That(allComments.Count, Is.GreaterThanOrEqualTo(2));
        }
    }
}
