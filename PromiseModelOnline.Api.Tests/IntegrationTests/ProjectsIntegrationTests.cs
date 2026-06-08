using System.Net;
using PromiseModelOnline.Api.DTOs;

namespace PromiseModelOnline.Api.Tests.IntegrationTests;

public class ProjectsIntegrationTests : ApiIntegrationTestBase
{
    [Test]
    public async Task CreateProject_AsOwner_ReturnsCreated()
    {
        SetAuthHeader(OwnerToken);
        var response = await PostAsync("/api/projects/create", new { name = "New Project", slug = "new-project" });
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Created));
        var project = await ReadJsonAsync<ProjectDTO>(response);
        Assert.That(project, Is.Not.Null);
        Assert.That(project!.Name, Is.EqualTo("New Project"));
        Assert.That(project.OwnerSlug, Is.EqualTo("pmo_test"));
    }

    [Test]
    public async Task GetProjects_AsOwner_ReturnsOk()
    {
        SetAuthHeader(OwnerToken);
        var response = await GetAsync("/api/projects");
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var projects = await ReadJsonAsync<List<ProjectDTO>>(response);
        Assert.That(projects, Is.Not.Null);
        Assert.That(projects!.Count, Is.GreaterThanOrEqualTo(1));
    }

    [Test]
    public async Task CreateProject_Unauthenticated_Returns401()
    {
        var response = await PostAsync("/api/projects/create", new { name = "Evil", slug = "evil" });
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task CreateProject_ReadOnlyScope_Returns403()
    {
        SetAuthHeader(ReadOnlyToken);
        var response = await PostAsync("/api/projects/create", new { name = "NoWrite", slug = "no-write" });
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Forbidden));
    }

    [Test]
    public async Task GetProjects_MalformedToken_Returns401()
    {
        SetAuthHeader("not-a-valid-token");
        var response = await GetAsync("/api/projects");
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task UpdateProjectDetails_AsOwner_ReturnsOk()
    {
        SetAuthHeader(OwnerToken);
        var response = await PatchAsync("/api/projects/pmo_test/seeded-project/details", new { name = "Updated" });
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var project = await ReadJsonAsync<ProjectDTO>(response);
        Assert.That(project!.Name, Is.EqualTo("Updated"));
    }

    [Test]
    public async Task GetProject_NonExistent_Returns404()
    {
        SetAuthHeader(OwnerToken);
        var response = await GetAsync("/api/projects/pmo_test/nonexistent");
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
    }
}
