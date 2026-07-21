using Microsoft.Extensions.Logging;
using Octokit;

namespace PromiseModelOnline.Api.Services;

/// <summary>Creates GitHub issues from user-submitted bug reports.</summary>
public class GitHubIssueService : IGitHubIssueService
{
    private readonly string _owner;
    private readonly string _repo;
    private readonly string _token;
    private readonly ILogger<GitHubIssueService> _logger;

    /// <summary>Initializes the service with GitHub configuration from app settings or Docker secrets.</summary>
    /// <param name="configuration">Application configuration.</param>
    /// <param name="logger">Logger instance.</param>
    public GitHubIssueService(IConfiguration configuration, ILogger<GitHubIssueService> logger)
    {
        _logger = logger;
        _owner = configuration["GitHub:Owner"] ?? string.Empty;
        _repo = configuration["GitHub:Repo"] ?? string.Empty;

        var token = configuration["GitHub:Token"];
        if (string.IsNullOrEmpty(token))
        {
            var filePath = configuration["GitHub:Token_FILE"];
            if (!string.IsNullOrEmpty(filePath) && File.Exists(filePath))
                token = File.ReadAllText(filePath).Trim();
        }

        _token = token ?? string.Empty;
    }

    /// <summary>Create a GitHub issue from a bug report and return the issue URL.</summary>
    /// <param name="title">Issue title.</param>
    /// <param name="description">User's description of the bug.</param>
    /// <param name="consoleLogs">Captured browser console logs.</param>
    /// <param name="reporterEmail">Email of the reporting user.</param>
    /// <param name="userAgent">Browser user agent string.</param>
    /// <param name="pageUrl">URL where the bug was observed.</param>
    /// <returns>The HTML URL of the created issue, or null if GitHub is not configured.</returns>
    public async Task<string?> CreateBugReportAsync(string title, string description, string consoleLogs, string reporterEmail, string userAgent, string pageUrl)
    {
        if (string.IsNullOrEmpty(_owner) || string.IsNullOrEmpty(_repo) || string.IsNullOrEmpty(_token))
        {
            _logger.LogWarning("GitHub token not configured — bug report not filed");
            return null;
        }

        var body = $"""
            ## Metadata
            Page URL: {pageUrl}
            User Agent: {userAgent}

            ## Description
            {description}

            ## Logs
            ```
            {consoleLogs}
            ```
            """;

        var client = new GitHubClient(new ProductHeaderValue("promise-model-online"))
        {
            Credentials = new Credentials(_token)
        };

        _logger.LogInformation("Creating GitHub issue: {Title}", title);

        var issue = await client.Issue.Create(_owner, _repo, new NewIssue(title) { Body = body });

        _logger.LogInformation("GitHub issue created: {IssueUrl}", issue.HtmlUrl);
        return issue.HtmlUrl;
    }
}
