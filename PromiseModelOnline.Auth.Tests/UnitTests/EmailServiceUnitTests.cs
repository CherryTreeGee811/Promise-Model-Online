using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using PromiseModelOnline.Auth.Services;
using SendGrid;
using SendGrid.Helpers.Mail;
using System.Net;
using System.Threading.Tasks;

namespace PromiseModelOnline.Auth.Tests;

[TestFixture]
public class EmailServiceUnitTests
{
    private Mock<ILogger<EmailService>> _loggerMock = null!;

    [SetUp]
    public void SetUp() => _loggerMock = new Mock<ILogger<EmailService>>();

    [Test]
    public void Constructor_ReadsApiKeyFromConfig()
    {
        // Arrange
        var config = new ConfigurationBuilder().AddInMemoryCollection(new[]
        {
            new KeyValuePair<string, string?>("SendGrid:ApiKey", "SG.fakekey")
        }).Build();

        // Act
        var service = new TestableEmailService(config, _loggerMock.Object, new Mock<ISendGridClient>().Object);

        // Assert
        Assert.That(service, Is.Not.Null);
    }

    [Test]
    public void Constructor_ReadsApiKeyFromFile()
    {
        // Arrange
        var filePath = Path.GetTempFileName();
        File.WriteAllText(filePath, "SG.filekey");
        try
        {
            var config = new ConfigurationBuilder().AddInMemoryCollection(new[]
            {
                new KeyValuePair<string, string?>("SendGrid:ApiKey", ""),
                new KeyValuePair<string, string?>("SendGrid:ApiKey_FILE", filePath)
            }).Build();

            // Act
            var service = new TestableEmailService(config, _loggerMock.Object, new Mock<ISendGridClient>().Object);

            // Assert
            Assert.That(service, Is.Not.Null);
        }
        finally
        {
            File.Delete(filePath);
        }
    }

    [Test]
    public void Constructor_MissingApiKey_Throws()
    {
        // Arrange
        var config = new ConfigurationBuilder().AddInMemoryCollection(new[]
        {
            new KeyValuePair<string, string?>("SendGrid:ApiKey", "")
        }).Build();

        // Act & Assert
        Assert.That(() => new EmailService(config, _loggerMock.Object), Throws.InvalidOperationException);
    }

    [Test]
    public void Constructor_InvalidKeyFormat_LogsWarning()
    {
        // Arrange
        var config = new ConfigurationBuilder().AddInMemoryCollection(new[]
        {
            new KeyValuePair<string, string?>("SendGrid:ApiKey", "invalid-format-key")
        }).Build();

        // Act
        _ = new TestableEmailService(config, _loggerMock.Object, new Mock<ISendGridClient>().Object);

        // Assert
        _loggerMock.VerifyLog(LogLevel.Warning, "does not start with 'SG.'");
    }

    [Test]
    public async Task SendVerificationEmailAsync_Success_DoesNotLogWarning()
    {
        // Arrange
        var mockClient = new Mock<ISendGridClient>();
        mockClient.Setup(c => c.SendEmailAsync(It.IsAny<SendGridMessage>(), default))
            .ReturnsAsync(new Response(HttpStatusCode.OK, new StringContent(""), null));

        var service = new TestableEmailService(MakeConfig("SG.valid"), _loggerMock.Object, mockClient.Object);

        // Act
        await service.SendVerificationEmailAsync("test@example.com", "TestUser", "123456");

        // Assert
        mockClient.Verify(c => c.SendEmailAsync(It.IsAny<SendGridMessage>(), default), Times.Once);
    }

    [Test]
    public async Task SendVerificationEmailAsync_NonSuccess_LogsWarning()
    {
        // Arrange
        var mockClient = new Mock<ISendGridClient>();
        mockClient.Setup(c => c.SendEmailAsync(It.IsAny<SendGridMessage>(), default))
            .ReturnsAsync(new Response(HttpStatusCode.BadRequest, new StringContent("error body"), null));

        var service = new TestableEmailService(MakeConfig("SG.valid"), _loggerMock.Object, mockClient.Object);

        // Act
        await service.SendVerificationEmailAsync("test@example.com", "TestUser", "123456");

        // Assert
        _loggerMock.VerifyLog(LogLevel.Warning, "SendGrid returned 400");
    }

    [Test]
    public async Task SendVerificationEmailAsync_Exception_LogsWarning()
    {
        // Arrange
        var mockClient = new Mock<ISendGridClient>();
        mockClient.Setup(c => c.SendEmailAsync(It.IsAny<SendGridMessage>(), default))
            .ThrowsAsync(new HttpRequestException("network error"));

        var service = new TestableEmailService(MakeConfig("SG.valid"), _loggerMock.Object, mockClient.Object);

        // Act
        await service.SendVerificationEmailAsync("test@example.com", "TestUser", "123456");

        // Assert
        _loggerMock.VerifyLog(LogLevel.Warning, "SendGrid unavailable");
    }

    [Test]
    public async Task SendResetPasswordEmailAsync_Success_SendsEmail()
    {
        // Arrange
        var mockClient = new Mock<ISendGridClient>();
        mockClient.Setup(c => c.SendEmailAsync(It.IsAny<SendGridMessage>(), default))
            .ReturnsAsync(new Response(HttpStatusCode.OK, new StringContent(""), null));

        var service = new TestableEmailService(MakeConfig("SG.valid"), _loggerMock.Object, mockClient.Object);

        // Act
        await service.SendResetPasswordEmailAsync("test@example.com", "TestUser", "https://reset/link");

        // Assert
        mockClient.Verify(c => c.SendEmailAsync(It.IsAny<SendGridMessage>(), default), Times.Once);
    }

    [Test]
    public async Task SendResetPasswordEmailAsync_NonSuccess_LogsWarning()
    {
        // Arrange
        var mockClient = new Mock<ISendGridClient>();
        mockClient.Setup(c => c.SendEmailAsync(It.IsAny<SendGridMessage>(), default))
            .ReturnsAsync(new Response(HttpStatusCode.InternalServerError, new StringContent("fail"), null));

        var service = new TestableEmailService(MakeConfig("SG.valid"), _loggerMock.Object, mockClient.Object);

        // Act
        await service.SendResetPasswordEmailAsync("test@example.com", "TestUser", "https://reset/link");

        // Assert
        _loggerMock.VerifyLog(LogLevel.Warning, "SendGrid returned 500");
    }

    private static IConfiguration MakeConfig(string apiKey) =>
        new ConfigurationBuilder().AddInMemoryCollection(new[]
        {
            new KeyValuePair<string, string?>("SendGrid:ApiKey", apiKey)
        }).Build();

    private class TestableEmailService(IConfiguration configuration, ILogger<EmailService> logger, ISendGridClient mockClient)
        : EmailService(configuration, logger)
    {
        protected override ISendGridClient CreateSendGridClient() => mockClient;
    }
}
