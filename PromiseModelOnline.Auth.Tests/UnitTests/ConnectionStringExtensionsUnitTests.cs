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
        // Arrange
        var input = "Server=localhost;Database=test;User Id=sa;Password=secret;";

        // Act
        var result = input.ResolveSecrets();

        // Assert
        Assert.That(result, Is.EqualTo(input));
    }

    [Test]
    public void ResolveSecrets_Password_FILE_ExistingFile_ReplacesWithPassword()
    {
        // Arrange
        var tempFile = Path.GetTempFileName();
        try
        {
            File.WriteAllText(tempFile, "my_secret_pw");
            var input = $@"Server=localhost;Password_FILE={tempFile};";

            // Act
            var result = input.ResolveSecrets();

            // Assert
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
        // Arrange
        var input = @"Server=localhost;Password_FILE=/nonexistent/secret.txt;";

        // Act & Assert
        Assert.That(() => input.ResolveSecrets(), Throws.InvalidOperationException);
    }

    [Test]
    public void ResolveSecrets_Password_FILE_EmptyFile_Throws()
    {
        // Arrange
        var tempFile = Path.GetTempFileName();
        try
        {
            File.WriteAllText(tempFile, "   ");
            var input = $@"Server=localhost;Password_FILE={tempFile};";

            // Act & Assert
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
        // Arrange
        var tempFile = Path.GetTempFileName();
        try
        {
            File.WriteAllText(tempFile, "  my_secret  ");
            var input = $@"Server=localhost;Password_FILE={tempFile};";

            // Act
            var result = input.ResolveSecrets();

            // Assert
            Assert.That(result, Is.EqualTo("Server=localhost;Password=my_secret"));
        }
        finally
        {
            File.Delete(tempFile);
        }
    }
}
