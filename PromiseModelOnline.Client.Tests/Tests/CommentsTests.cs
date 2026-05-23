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

            // Verify existing comment is loaded
            var existingComment = WaitForElement(By.CssSelector(".comment-item .comment-text"));
            Assert.That(existingComment.Text, Does.Contain("Existing comment"));

            // Type new comment
            var textarea = WaitForElement(By.Id("comment-textarea"));
            textarea.SendKeys("New comment");

            // Wait until the Post button is truly clickable (visible + enabled)
            var postButton = WaitForClickable(By.CssSelector("#comment-form .view-btn"));
            postButton.Click();

            // Wait for the new comment to appear in the list
            WaitUntil(driver =>
            {
                try
                {
                    return driver.FindElements(By.CssSelector(".comment-item .comment-text"))
                                    .Any(e => e.Text.Contains("New comment"));
                }
                catch { return false; }
            }, 10);

            // Confirm at least 2 comments now exist (original + new)
            var allComments = Driver.FindElements(By.CssSelector(".comment-item .comment-text"));
            Assert.That(allComments.Count, Is.GreaterThanOrEqualTo(2));
        }
    }
}