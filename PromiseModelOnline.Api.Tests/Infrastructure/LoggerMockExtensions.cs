using Microsoft.Extensions.Logging;
using Moq;

namespace PromiseModelOnline.Api.Tests;

internal static class LoggerMockExtensions
{
    public static void VerifyLog<T>(this Mock<ILogger<T>> mock, LogLevel level, string contains)
    {
        mock.Verify(
            x => x.Log(
                level,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains(contains)),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.AtLeastOnce());
    }
}
