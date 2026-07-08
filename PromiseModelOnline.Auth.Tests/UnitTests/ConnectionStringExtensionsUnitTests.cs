using System;
using System.IO;
using NUnit.Framework;
using PromiseModelOnline.Auth.Extensions;

namespace PromiseModelOnline.Auth.Tests;

[TestFixture]
public class ConnectionStringExtensionsUnitTests
{
    [Test]
    public void ResolveSecrets_NoPassword_FILE_ReturnsStringUnchanged()
    {
        var input = "Server=localhost;Database=test;User Id=sa;Password=secret;";
        var result = input.ResolveSecrets();
        Assert.That(result, Is.EqualTo(input));
    }

    [Test]
    public void ResolveSecrets_Password_FILE_ExistingFile_ReplacesWithPassword()
    {
        var tempFile = Path.GetTempFileName();
        try
        {
            File.WriteAllText(tempFile, "my_secret_pw");
            var input = $@"Server=localhost;Password_FILE={tempFile};";
            var result = input.ResolveSecrets();
            Assert.That(result, Is.EqualTo("Server=localhost;Password=my_secret_pw"));
        }
        finally
        {
            File.Delete(tempFile);
        }
    }

    [Test]
    public void ResolveSecrets_Password_FILE_FileNotFound_Throws()
    {
        var input = @"Server=localhost;Password_FILE=/nonexistent/secret.txt;";
        Assert.That(() => input.ResolveSecrets(), Throws.InvalidOperationException);
    }

    [Test]
    public void ResolveSecrets_Password_FILE_EmptyFile_Throws()
    {
        var tempFile = Path.GetTempFileName();
        try
        {
            File.WriteAllText(tempFile, "   ");
            var input = $@"Server=localhost;Password_FILE={tempFile};";
            Assert.That(() => input.ResolveSecrets(), Throws.InvalidOperationException);
        }
        finally
        {
            File.Delete(tempFile);
        }
    }

    [Test]
    public void ResolveSecrets_Password_FILE_WithTrailingWhitespace_Trims()
    {
        var tempFile = Path.GetTempFileName();
        try
        {
            File.WriteAllText(tempFile, "  my_secret  ");
            var input = $@"Server=localhost;Password_FILE={tempFile};";
            var result = input.ResolveSecrets();
            Assert.That(result, Is.EqualTo("Server=localhost;Password=my_secret"));
        }
        finally
        {
            File.Delete(tempFile);
        }
    }
}
