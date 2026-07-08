using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using NUnit.Framework;
using PromiseModelOnline.Api.Auth;

namespace PromiseModelOnline.Api.Tests;

[TestFixture]
public class ScopeClaimsTransformerUnitTests
{
    private ScopeClaimsTransformer _transformer = null!;

    [SetUp]
    public void SetUp() => _transformer = new ScopeClaimsTransformer();

    [Test]
    public async Task REQ_FUN_XXX_MultiValuedScope_SplitsIntoIndividualClaims()
    {
        var identity = new ClaimsIdentity(new[]
        {
            new Claim("scope", "projects.read projects.write profile"),
        }, "test");
        var principal = new ClaimsPrincipal(identity);

        var result = await _transformer.TransformAsync(principal);

        var scopes = result.FindAll("scope").Select(c => c.Value).ToList();
        Assert.That(scopes.Count, Is.EqualTo(4));
        Assert.That(scopes, Contains.Item("projects.read"));
        Assert.That(scopes, Contains.Item("projects.write"));
        Assert.That(scopes, Contains.Item("profile"));
        Assert.That(scopes, Contains.Item("projects.read projects.write profile"));
    }

    [Test]
    public async Task REQ_FUN_XXX_SingleValuedScope_PassesThrough()
    {
        var identity = new ClaimsIdentity(new[]
        {
            new Claim("scope", "profile"),
        }, "test");
        var principal = new ClaimsPrincipal(identity);

        var result = await _transformer.TransformAsync(principal);

        var scopes = result.FindAll("scope").Select(c => c.Value).ToList();
        Assert.That(scopes.Count, Is.EqualTo(1));
        Assert.That(scopes[0], Is.EqualTo("profile"));
    }

    [Test]
    public async Task REQ_FUN_XXX_NoScopeClaim_ReturnsOriginalPrincipal()
    {
        var identity = new ClaimsIdentity(new[]
        {
            new Claim("name", "test"),
        }, "test");
        var principal = new ClaimsPrincipal(identity);

        var result = await _transformer.TransformAsync(principal);

        Assert.That(result, Is.SameAs(principal));
    }

    [Test]
    public async Task REQ_FUN_XXX_EmptyMultiValuedScope_DoesNotCreateEmptyClaims()
    {
        var identity = new ClaimsIdentity(new[]
        {
            new Claim("scope", ""),
        }, "test");
        var principal = new ClaimsPrincipal(identity);

        var result = await _transformer.TransformAsync(principal);

        var scopes = result.FindAll("scope").Select(c => c.Value).ToList();
        Assert.That(scopes.Count, Is.EqualTo(1));
    }
}
