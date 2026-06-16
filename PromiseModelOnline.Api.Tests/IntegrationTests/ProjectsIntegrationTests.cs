using System.Net;
using PromiseModelOnline.Api.DTOs;

namespace PromiseModelOnline.Api.Tests.IntegrationTests;

/// <summary>Integration tests for full project lifecycle workflows.</summary>
// Requirements: REQ_FUN_003 REQ_FUN_039 REQ_FUN_040
    public class ProjectsIntegrationTests : ApiIntegrationTestBase
{
    [Test]
    public async Task CreateProject_AsOwner_ReturnsCreated()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await PostAsync("/api/projects", new { name = "New Project", slug = "new-project" });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Created));
        var project = await ReadJsonAsync<ProjectDTO>(response);
        Assert.That(project, Is.Not.Null);
        Assert.That(project!.Name, Is.EqualTo("New Project"));
        Assert.That(project.OwnerSlug, Is.EqualTo("pmo_test"));
    }

    [Test]
    public async Task GetProjects_AsOwner_ReturnsOk()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await GetAsync("/api/projects");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var projects = await ReadJsonAsync<List<ProjectDTO>>(response);
        Assert.That(projects, Is.Not.Null);
        Assert.That(projects!.Count, Is.GreaterThanOrEqualTo(1));
    }

    [Test]
    public async Task CreateProject_Unauthenticated_Returns401()
    {
        // Act
        var response = await PostAsync("/api/projects", new { name = "Evil", slug = "evil" });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task CreateProject_ReadOnlyScope_Returns403()
    {
        // Arrange
        SetAuthHeader(ReadOnlyToken);
        // Act
        var response = await PostAsync("/api/projects", new { name = "NoWrite", slug = "no-write" });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Forbidden));
    }

    [Test]
    public async Task GetProjects_MalformedToken_Returns401()
    {
        // Arrange
        SetAuthHeader("not-a-valid-token");
        // Act
        var response = await GetAsync("/api/projects");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task UpdateProjectDetails_AsOwner_ReturnsOk()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await PatchAsync("/api/projects/pmo_test/seeded-project/details", new { name = "Updated" });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var project = await ReadJsonAsync<ProjectDTO>(response);
        Assert.That(project!.Name, Is.EqualTo("Updated"));
    }

    [Test]
    public async Task GetProject_NonExistent_Returns404()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await GetAsync("/api/projects/pmo_test/nonexistent");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
    }
}
