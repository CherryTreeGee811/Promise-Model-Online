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
