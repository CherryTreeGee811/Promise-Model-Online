using Microsoft.Playwright;

namespace PromiseModelOnline.E2E.Tests;

/// <summary>Browser-based E2E tests for entity hierarchy pages — epics, journeys, flows, moments.</summary>
// Requirements: REQ_FUN_004 REQ_SEC_LOG_001
public class EntityHierarchyE2ETests : E2ETestBase
{
    private const string Owner = "pmo_test";
    private const string Project = "promise-model-online";

    [Test]
    [Description("REQ_FUN_004 happy path: Authenticated user views promise detail page")]
    public async Task ViewPromiseDetail_Authenticated_ShowsPromise()
    {
        // Arrange
        await LoginAsync();
        // Act
        await Page.GotoAsync($"/{Owner}/{Project}/promises/1");
        // Assert
        await Page.WaitForSelectorAsync(".promise-detail-card", new() { Timeout = 30000 });
    }

    [Test]
    [Description("REQ_FUN_004 happy path: Authenticated user views epic detail page")]
    public async Task ViewEpicDetail_Authenticated_ShowsEpic()
    {
        // Arrange
        await LoginAsync();
        // Act
        await Page.GotoAsync($"/{Owner}/{Project}/epics/1");
        // Assert
        await Page.WaitForSelectorAsync(".epic-detail-card", new() { Timeout = 30000 });
    }

    [Test]
    [Description("REQ_FUN_004 happy path: Authenticated user views journey detail page")]
    public async Task ViewJourneyDetail_Authenticated_ShowsJourney()
    {
        // Arrange
        await LoginAsync();
        // Act
        await Page.GotoAsync($"/{Owner}/{Project}/journeys/1");
        // Assert
        await Page.WaitForSelectorAsync(".journey-detail-card", new() { Timeout = 30000 });
    }

    [Test]
    [Description("REQ_FUN_004 happy path: Authenticated user views flow detail page")]
    public async Task ViewFlowDetail_Authenticated_ShowsFlow()
    {
        // Arrange
        await LoginAsync();
        // Act
        await Page.GotoAsync($"/{Owner}/{Project}/flows/1");
        // Assert
        await Page.WaitForSelectorAsync(".flow-detail-card", new() { Timeout = 30000 });
    }

    [Test]
    [Description("REQ_FUN_004 happy path: Authenticated user views moment detail page")]
    public async Task ViewMomentDetail_Authenticated_ShowsMoment()
    {
        // Arrange
        await LoginAsync();
        // Act
        await Page.GotoAsync($"/{Owner}/{Project}/moments/1");
        // Assert
        await Page.WaitForSelectorAsync(".moment-detail-card", new() { Timeout = 30000 });
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated user redirected to login from entity detail")]
    // Assert
    public Task ViewEntityDetail_Unauthenticated_RedirectsToLogin() => GotoAndWaitForLoginRedirectAsync($"/{Owner}/{Project}/epics/1");
}
