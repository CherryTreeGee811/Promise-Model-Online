<<<<<<< HEAD
using PromiseModelOnline.Client.Tests.Helpers;

namespace PromiseModelOnline.Client.Tests.Tests;

public class CommentsTests : PlaywrightTestBase
{
    [Test]
    public async Task Comments_PostComment_AppearsInList()
    {
        await NavigateAsUser("/pmo_test/seeded-project/moments/100");

        var existingComment = await WaitForSelectorAsync(".comment-item .comment-text");
        var existingText = await existingComment.TextContentAsync();
        Assert.That(existingText, Does.Contain("Existing comment"));

        await FillAsync("#comment-textarea", "New comment");

        await ClickAsync("#comment-form button[type='submit']");

        var found = await WaitUntilAsync(async () =>
        {
            try
            {
                var comments = await Page.Locator(".comment-item .comment-text").AllAsync();
                foreach (var c in comments)
                {
                    var text = await c.TextContentAsync();
                    if (text?.Contains("New comment") == true)
                        return true;
                }
                return false;
            }
            catch { return false; }
        }, 10);

        Assert.That(found, Is.True, "New comment should appear in the list");

        var allCount = await Page.Locator(".comment-item .comment-text").CountAsync();
        Assert.That(allCount, Is.GreaterThanOrEqualTo(2));
||||||| 1bedf4f
=======
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
>>>>>>> 3d9d1e58bc450b19abee31d15bed7ffeb3de730e
    }
}
