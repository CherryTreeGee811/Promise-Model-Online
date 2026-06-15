using PromiseModelOnline.Client.Tests.Helpers;

namespace PromiseModelOnline.Client.Tests.Tests;

/// <summary>Playwright tests for the comment system.</summary>
// Requirements: REQ_FUN_017
public class CommentsTests : PlaywrightTestBase
{
    [Test]
    public async Task REQ_FUN_017_Comments_PostComment_AppearsInList()
    {
        // Arrange
        await NavigateAsUser("/pmo_test/seeded-project/moments/100");
        var existingComment = await WaitForSelectorAsync(".comment-item .comment-text");
        var existingText = await existingComment.TextContentAsync();
        Assert.That(existingText, Does.Contain("Existing comment"));
        await FillAsync("#comment-textarea", "New comment");
        // Act
        await ClickAsync("#comment-form button[type='submit']");
        // Assert
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
    }
}
