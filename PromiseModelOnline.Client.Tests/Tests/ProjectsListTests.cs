using PromiseModelOnline.Client.Tests.Helpers;

namespace PromiseModelOnline.Client.Tests.Tests;

public class ProjectsListTests : PlaywrightTestBase
{
    [Test]
    public async Task ProjectList_LoadsAndDisplaysProject()
    {
        await EnsureLoggedIn();
        await NavigateSpaAsync("/projects");

        var row = await WaitForSelectorAsync("#project-list-table-body tr");
        Assert.That(await row.TextContentAsync(), Does.Contain("Test Project"));
    }
}
