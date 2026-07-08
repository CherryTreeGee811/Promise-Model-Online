using System.Net;
using Microsoft.Extensions.DependencyInjection;
using PromiseModelOnline.Api.DAL;
using PromiseModelOnline.Api.DTOs;
using PromiseModelOnline.Api.Models;
using PromiseModelOnline.Api.Enums;

namespace PromiseModelOnline.Api.Tests.IntegrationTests;

// Requirements: REQ_FUN_013
public class ProjectPermissionsIntegrationTests : ApiIntegrationTestBase
{
    private const string Owner = "pmo_test";
    private const string Project = "seeded-project";

    private async Task SeedPermissionAsync(string email = "owner@example.com", PermissionLevel level = PermissionLevel.Edit)
    {
        using var scope = Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PromiseModelOnlineContext>();
        var permissions = db.Set<Permission>();
        if (!permissions.Any())
        {
            var user = db.Users.First(u => u.Email == email);
            permissions.Add(new Permission
            {
                UserId = user.Id,
                ProjectId = 1,
                Level = level,
                Status = PermissionStatus.Active,
            });
            await db.SaveChangesAsync();
        }
    }

    [Test]
    [Description("REQ_FUN_013 happy path: List permissions returns 200 OK with seeded permissions")]
    public async Task GetAll_AsOwner_ReturnsList()
    {
        // Arrange
        await SeedPermissionAsync();
        SetAuthHeader(OwnerToken);
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/permissions");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var permissions = await ReadJsonAsync<List<PermissionDto>>(response);
        Assert.That(permissions, Is.Not.Null);
        Assert.That(permissions!.Count, Is.GreaterThanOrEqualTo(1));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated GET returns 401")]
    public async Task GetAll_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/permissions");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_FUN_013 happy path: Read-only scope can list permissions, returns 200 OK")]
    public async Task GetAll_ReadOnlyScope_ReturnsOk()
    {
        // Arrange
        await SeedPermissionAsync();
        SetAuthHeader(ReadOnlyToken);
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/permissions");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
    }

    [Test]
    [Description("REQ_FUN_013 happy path: Create permission returns 201 Created with Location header")]
    public async Task Create_AsOwner_ReturnsCreated()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        // Act
        var response = await PostAsync($"/api/projects/{Owner}/{Project}/permissions",
            new { email = "owner@example.com", projectId = 1, level = "Edit" });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Created));
        Assert.That(response.Headers.Location, Is.Not.Null);
        var permission = await ReadJsonAsync<PermissionDto>(response);
        Assert.That(permission, Is.Not.Null);
        Assert.That(permission!.Level, Is.EqualTo("Edit"));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated POST returns 401")]
    public async Task Create_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await PostAsync($"/api/projects/{Owner}/{Project}/permissions",
            new { email = "owner@example.com", projectId = 1, level = "Edit" });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_SYS_030 sad path: Null request body returns 400")]
    public async Task Create_NullBody_Returns400()
    {
        // Arrange
        SetAuthHeader(OwnerToken);
        var json = new StringContent("null", System.Text.Encoding.UTF8, "application/json");
        // Act
        var response = await Client.PostAsync($"/api/projects/{Owner}/{Project}/permissions", json);
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Read-only scope cannot create permission, returns 403")]
    public async Task Create_ReadOnlyScope_Returns403()
    {
        // Arrange
        SetAuthHeader(ReadOnlyToken);
        // Act
        var response = await PostAsync($"/api/projects/{Owner}/{Project}/permissions",
            new { email = "owner@example.com", projectId = 1, level = "Edit" });
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Forbidden));
    }

    [Test]
    [Description("REQ_FUN_013 happy path: Owner deletes a permission, returns 204 NoContent")]
    public async Task Delete_AsOwner_ReturnsNoContent()
    {
        // Arrange
        await SeedPermissionAsync();
        SetAuthHeader(OwnerToken);
        // Act
        var response = await Client.DeleteAsync($"/api/projects/{Owner}/{Project}/permissions/1");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NoContent));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated DELETE returns 401")]
    public async Task Delete_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await Client.DeleteAsync($"/api/projects/{Owner}/{Project}/permissions/1");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_FUN_013 happy path: Get my permission returns permission level string")]
    public async Task GetMyPermission_AsOwner_ReturnsPermission()
    {
        // Arrange
        await SeedPermissionAsync();
        SetAuthHeader(OwnerToken);
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/permissions/1/my-permission");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var body = await response.Content.ReadAsStringAsync();
        Assert.That(body, Is.EqualTo("Edit"));
    }

    [Test]
    [Description("REQ_SEC_LOG_001 misuse: Unauthenticated GET my-permission returns 401")]
    public async Task GetMyPermission_Unauthenticated_Returns401()
    {
        // Arrange
        // (no auth header set)
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/permissions/1/my-permission");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    [Description("REQ_FUN_013 edge case: Non-owner with no permission gets 204")]
    public async Task GetMyPermission_NoPermission_ReturnsNoContent()
    {
        // Arrange
        SetAuthHeader(NonOwnerToken);
        // Act
        var response = await GetAsync($"/api/projects/{Owner}/{Project}/permissions/1/my-permission");
        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NoContent));
    }
}
