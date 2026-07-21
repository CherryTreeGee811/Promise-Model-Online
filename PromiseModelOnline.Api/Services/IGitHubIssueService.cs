namespace PromiseModelOnline.Api.Services;

/// <summary>Service for reporting bugs to GitHub Issues.</summary>
public interface IGitHubIssueService
{
    /// <summary>Create a GitHub issue from a bug report.</summary>
    /// <param name="title">Issue title.</param>
    /// <param name="description">User's description of the bug.</param>
    /// <param name="consoleLogs">Captured browser console logs.</param>
    /// <param name="reporterEmail">Email of the reporting user.</param>
    /// <param name="userAgent">Browser user agent string.</param>
    /// <param name="pageUrl">URL where the bug was observed.</param>
    /// <returns>The HTML URL of the created issue, or null if GitHub is not configured.</returns>
    Task<string?> CreateBugReportAsync(string title, string description, string consoleLogs, string reporterEmail, string userAgent, string pageUrl);
}
