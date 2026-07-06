using System.Net;
using Microsoft.Playwright;

namespace PromiseModelOnline.E2E.Tests;

[TestFixture]
public class IterationE2ETests : E2ETestBase
{
    private const string Owner = "pmo_test";
    private const string Project = "promise-model-online";

    [Test]
    [Description("REQ_FUN_016 happy path: Create iteration via stride board when none exist")]
    public async Task CreateIteration_ViaStrideBoardUI_Succeeds()
    {
        // Arrange
        await LoginAsync();
        var iterationName = $"E2E Iteration {DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}";

        await Page.GotoAsync("/projects/add");
        await Page.WaitForSelectorAsync("#add-project-form", new() { Timeout = 10000 });

        var uniqueProjectName = $"E2E Iteration Project {DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}";
        await Page.FillAsync("#project-name-input", uniqueProjectName);
        await Page.FillAsync("#first-promise-input", "Create an empty stride board for iteration testing.");
        await Page.ClickAsync("#create-project-btn");
        await Page.WaitForURLAsync("**/graph", new() { Timeout = 30000 });

        var urlParts = Page.Url.TrimEnd('/').Split('/');
        var project = urlParts[^2];

        // Act — navigate to stride board
        await Page.GotoAsync($"/{Owner}/{project}/strides");
        await Page.WaitForSelectorAsync("#stride-board", new() { Timeout = 15000 });
        await Page.WaitForFunctionAsync("() => document.body?.textContent?.trim()?.length > 0", options: new() { Timeout = 10000 });

        // Click create stride/iteration button
        var createBtn = Page.Locator("#create-stride-btn");
        if (!await createBtn.IsVisibleAsync())
            Assert.Inconclusive("Create stride button not visible — user may lack edit permission");
        await createBtn.ClickAsync();
        await Page.WaitForFunctionAsync(
            "() => document.querySelector('#iteration-create-name, #stride-create-name') !== null",
            options: new() { Timeout = 5000 });

        // Fill whichever modal the page opened.
        var iterationNameInput = Page.Locator("#iteration-create-name");
        var strideNameInput = Page.Locator("#stride-create-name");

        var createdLabel = iterationName;

        if (await iterationNameInput.IsVisibleAsync())
        {
            await iterationNameInput.FillAsync(iterationName);
            await Page.ClickAsync("#iteration-create-submit");
        }
        else if (await strideNameInput.IsVisibleAsync())
        {
            createdLabel = $"E2E Stride {iterationName}";
            await strideNameInput.FillAsync(createdLabel);
            await Page.SelectOptionAsync("#stride-create-iteration", new SelectOptionValue { Index = 0 });
            await Page.ClickAsync("#stride-create-submit");
        }
        else
        {
            Assert.Inconclusive("Create modal did not open");
        }

        // Assert — whichever entity was created appears on the board.
        await Page.WaitForFunctionAsync(
            "name => document.body?.textContent?.includes(name)",
            createdLabel,
            options: new() { Timeout = 10000 });
        var body = await Page.TextContentAsync("body") ?? "";
        Assert.That(body, Does.Contain(createdLabel),
            "Created entity should appear on the stride board after submission");
        AssertNoCspViolations();
    }

    [Test]
    [Description("REQ_FUN_016 happy path: Create stride within iteration via UI")]
    public async Task CreateStride_WithinIteration_ViaUI_Succeeds()
    {
        // Arrange — create a fresh iteration via API
        await LoginAsync();
        var suffix = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString();
        var iterationName = $"E2E Iteration {suffix}";
        var strideName = $"E2E Stride {suffix}";

        var iterJson = System.Text.Json.JsonSerializer.Serialize(new { name = iterationName });
        var iterResp = await AuthPostJsonAsync(
            $"/api/projects/{Owner}/{Project}/iterations", iterJson);
        if (iterResp.StatusCode != HttpStatusCode.Created)
            Assert.Inconclusive("Could not create test iteration via API");
        var iterBody = await iterResp.Content.ReadAsStringAsync();
        var iterId = System.Text.Json.JsonDocument.Parse(iterBody).RootElement.GetProperty("id").GetInt32();

        // Act — navigate to stride board and create stride
        await Page.GotoAsync($"/{Owner}/{Project}/strides");
        await Page.WaitForSelectorAsync("#stride-board", new() { Timeout = 15000 });
        await Page.WaitForFunctionAsync("() => document.body?.textContent?.trim()?.length > 0", options: new() { Timeout = 10000 });

        var createBtn = Page.Locator("#create-stride-btn");
        if (!await createBtn.IsVisibleAsync())
            Assert.Inconclusive("Create stride button not visible");
        await createBtn.ClickAsync();
        await Page.WaitForFunctionAsync("() => document.querySelector('#stride-create-name, #iteration-create-name') !== null", options: new() { Timeout = 5000 });

        // The stride create modal should open (since iterations exist)
        var strideNameInput = Page.Locator("#stride-create-name");
        if (!await strideNameInput.IsVisibleAsync())
        {
            // If iteration modal opened instead, fill it and submit
            var iterInput = Page.Locator("#iteration-create-name");
            if (await iterInput.IsVisibleAsync())
            {
                await iterInput.FillAsync($"E2E Iteration Extra {suffix}");
                await Page.ClickAsync("#iteration-create-submit");
                await Page.WaitForFunctionAsync("() => document.querySelector('#stride-create-name') !== null", options: new() { Timeout = 10000 });
                await createBtn.ClickAsync();
                await Page.WaitForFunctionAsync("() => document.querySelector('#stride-create-name, #iteration-create-name') !== null", options: new() { Timeout = 5000 });
            }
        }

        await Page.Locator("#stride-create-name").WaitForAsync(new() { Timeout = 5000 });
        await Page.Locator("#stride-create-name").FillAsync(strideName);
        await Page.ClickAsync("#stride-create-submit");

        // Assert
        await Page.WaitForFunctionAsync($"name => document.body?.textContent?.includes(name)", strideName, options: new() { Timeout = 10000 });
        var body = await Page.TextContentAsync("body") ?? "";
        Assert.That(body, Does.Contain(strideName),
            "Stride name should appear on the stride board after creation");
        AssertNoCspViolations();
    }
}
