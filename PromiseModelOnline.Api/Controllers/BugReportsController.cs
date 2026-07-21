using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PromiseModelOnline.Api.Services;

namespace PromiseModelOnline.Api.Controllers;

/// <summary>Request DTO for submitting a bug report.</summary>
public class BugReportRequest
{
    /// <summary>Brief summary of the issue.</summary>
    [Required, MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    /// <summary>Detailed description of the bug.</summary>
    [Required, MaxLength(10000)]
    public string Description { get; set; } = string.Empty;

    /// <summary>Captured browser console logs.</summary>
    public string? ConsoleLogs { get; set; }
}

/// <summary>REST controller for bug report submission.</summary>
/// <remarks>Accepts bug reports from authenticated users and files them as GitHub issues via Octokit.</remarks>
/// <param name="gitHubIssueService">Service for creating GitHub issues.</param>
/// <param name="logger">Logger instance.</param>
[Route("api/bug-reports")]
[ApiController]
public class BugReportsController(IGitHubIssueService gitHubIssueService, ILogger<BugReportsController> logger) : ControllerBase
{
    /// <summary>Submit a bug report.</summary>
    /// <param name="request">The bug report details.</param>
    /// <response code="200">Bug report submitted successfully. Returns <c>issueUrl</c> if GitHub is configured.</response>
    /// <response code="502">GitHub API call failed.</response>
    [Authorize(Policy = "projects.read")]
    [HttpPost]
    public async Task<IActionResult> SubmitBugReport([FromBody] BugReportRequest request)
    {
        var email = User.FindFirstValue(ClaimTypes.Email) ?? User.FindFirstValue("email") ?? "unknown";
        var userAgent = Request.Headers.UserAgent.ToString();
        var pageUrl = Request.Headers.Referer.ToString();

        logger.LogInformation("Bug report received from {Email}: {Title}", email, request.Title);

        try
        {
            var issueUrl = await gitHubIssueService.CreateBugReportAsync(
                request.Title,
                request.Description,
                request.ConsoleLogs ?? string.Empty,
                email,
                userAgent,
                pageUrl);

            if (issueUrl is null)
            {
                return Ok(new { issueUrl = (string?)null, message = "Bug report noted but GitHub integration is not configured." });
            }

            return Ok(new { issueUrl });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to create bug report for {Email}: {Title}", email, request.Title);
            return StatusCode(502, new { error = "Failed to file bug report. Please try again later." });
        }
    }
}
