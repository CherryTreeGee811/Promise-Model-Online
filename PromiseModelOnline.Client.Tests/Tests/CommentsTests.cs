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

            // Ensure the Post button is visible and enabled (like a real user would see)
            WaitForClickable(By.CssSelector("#comment-form .view-btn"));

            // Trigger form submission via requestSubmit – the exact same DOM API
            // that a user‑initiated click invokes, but headless‑safe.
            ((IJavaScriptExecutor)Driver).ExecuteScript(
                "document.getElementById('comment-form').requestSubmit();");

            // Wait for the new comment to appear
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
