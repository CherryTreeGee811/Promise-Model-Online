using System;
using System.IO;
using Microsoft.AspNetCore.Builder;
using NUnit.Framework;
using PromiseModelOnline.Auth.Extensions;

namespace PromiseModelOnline.Auth.Tests;

[TestFixture]
public class KestrelExtensionsUnitTests
{
    private string _originalDir = null!;
    private string _tempDir = null!;

    [SetUp]
    public void SetUp()
    {
        _tempDir = Path.Combine(Path.GetTempPath(), Path.GetRandomFileName());
        Directory.CreateDirectory(_tempDir);
        _originalDir = Directory.GetCurrentDirectory();
        Directory.SetCurrentDirectory(_tempDir);
    }

    [TearDown]
    public void TearDown()
    {
        Directory.SetCurrentDirectory(_originalDir);
        if (Directory.Exists(_tempDir))
            Directory.Delete(_tempDir, true);
        Environment.SetEnvironmentVariable("ASPNETCORE_URLS", null);
    }

    [Test]
    public void ConfigureHttps_NoCertFiles_NoEnvVar_NoConfig_FallsBackToDefaultUrl()
    {
        var builder = WebApplication.CreateBuilder([]);
        builder.ConfigureHttps();
        Assert.That(builder.Configuration["Urls"], Is.EqualTo("http://+:8060"));
    }

    [Test]
    public void ConfigureHttps_NoCertFiles_ASPNETCORE_URLS_Set_UsesEnvUrl()
    {
        Environment.SetEnvironmentVariable("ASPNETCORE_URLS", "https://+:8060");
        var builder = WebApplication.CreateBuilder([]);
        builder.ConfigureHttps();
        Assert.That(builder.Configuration["Urls"], Is.EqualTo("http://+:8060"));
    }

    [Test]
    public void ConfigureHttps_NoCertFiles_ConfigUrl_UsesConfigUrl()
    {
        var builder = WebApplication.CreateBuilder([]);
        builder.Configuration["Kestrel:Endpoints:Http:Url"] = "http://+:9000";
        builder.ConfigureHttps();
        Assert.That(builder.Configuration["Urls"], Is.EqualTo("http://+:9000"));
    }

    [Test]
    public void ConfigureHttps_NoCertFiles_ASPNETCORE_URLS_TakesPrecedenceOverConfig()
    {
        Environment.SetEnvironmentVariable("ASPNETCORE_URLS", "https://+:8060");
        var builder = WebApplication.CreateBuilder([]);
        builder.Configuration["Kestrel:Endpoints:Http:Url"] = "http://+:9000";
        builder.ConfigureHttps();
        Assert.That(builder.Configuration["Urls"], Is.EqualTo("http://+:8060"));
    }
}
